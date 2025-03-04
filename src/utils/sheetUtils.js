import { getFirestore, doc, getDoc, updateDoc, arrayRemove, arrayUnion, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { createLabel } from '../utils/labelUtils';

const HEADERS = {
  "Profile Data": ['Profile ID', 'Profile Name', 'First Name', 'Last Name', 'Profile URL', 'Labels', 'Notes'],
  "Messages": ['ID', 'Title', 'Content']
};

export const getSheetId = async (spreadsheetId, token, sheetName) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    const sheet = data.sheets.find(s => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : null;
  } catch (error) {
    console.error('Error getting sheet ID:', error);
    return null;
  }
};

export const checkSheetStructure = async (spreadsheetId, token, sheetName) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z1`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json(); return data.values?.[0] || [];
  }
  catch (error) {
    console.error('Error checking sheet structure:', error);
    return [];
  }
};

export const ensureHeaders = async (spreadsheetId, token, sheetName) => {
  try {
    const currentHeaders = await checkSheetStructure(spreadsheetId, token, sheetName);
    const expectedHeaders = HEADERS[sheetName];

    if (currentHeaders.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:${String.fromCharCode(65 + expectedHeaders.length - 1)}1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `${sheetName}!A1:${String.fromCharCode(65 + expectedHeaders.length - 1)}1`,
            values: [expectedHeaders]
          })
        }
      );
      return;
    }

    const missingHeaders = expectedHeaders.filter(header =>
      !currentHeaders.find(h => h.toLowerCase() === header.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      const lastCol = String.fromCharCode(65 + currentHeaders.length);
      const range = `${sheetName}!${lastCol}1:${String.fromCharCode(65 + currentHeaders.length + missingHeaders.length - 1)}1`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            values: [missingHeaders]
          })
        }
      );
    }
  } catch (error) {
    console.error('Error ensuring headers:', error);
    throw error;
  }
};

export const getHeaderIndices = (headers, expectedHeaders) => {
  const indices = {};
  expectedHeaders.forEach(header => {
    const index = headers.indexOf(header);
    indices[header] = index !== -1 ? index : null;
  });
  return indices;
};

export const getSheetData = async (spreadsheetId, token, sheetName) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
};

export const updateSheetData = async (spreadsheetId, token, formattedData, sheetName, startRow = null) => {
  try {
    let sheetData = await getSheetData(spreadsheetId, token, sheetName);
    const headers = sheetData[0] || HEADERS[sheetName];
    const headerIndices = getHeaderIndices(headers, HEADERS[sheetName]);

    const idColumnName = sheetName === 'Profile Data' ? 'Profile ID' : 'ID';
    const idColumnIndex = headerIndices[idColumnName];

    if (idColumnIndex === null) {
      console.error(`Cannot find ${idColumnName} column in sheet`);
      return;
    }

    let existingRows = sheetData.slice(1);
    let existingDataMap = new Map();
    existingRows.forEach((row, index) => {
      const id = row[idColumnIndex];
      if (id) {
        existingDataMap.set(id, {
          data: row,
          rowIndex: index + 2
        });
      }
    });

    const validIds = new Set(formattedData.map(row => {
      return row[idColumnName];
    }));

    const rowsToDelete = [];
    existingRows.forEach((row, index) => {
      const id = row[idColumnIndex];
      if (id && !validIds.has(id)) {
        rowsToDelete.push(index + 2);
      }
    });

    if (rowsToDelete.length > 0) {
      try {
        const sheetId = await getSheetId(spreadsheetId, token, sheetName);
        if (!sheetId) {
          throw new Error(`Sheet ${sheetName} not found`);
        }

        rowsToDelete.sort((a, b) => b - a);

        for (const rowIndex of rowsToDelete) {
          const deleteRequest = {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: rowIndex - 1,
                    endIndex: rowIndex
                  }
                }
              }
            ]
          };

          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(deleteRequest)
            }
          );

          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Refetch the sheet data after deletions to get updated structure
        sheetData = await getSheetData(spreadsheetId, token, sheetName);
        existingRows = sheetData.slice(1);
        
        // Rebuild the mapping with updated row indices
        existingDataMap = new Map();
        existingRows.forEach((row, index) => {
          const id = row[idColumnIndex];
          if (id) {
            existingDataMap.set(id, {
              data: row,
              rowIndex: index + 2
            });
          }
        });
      } catch (error) {
        console.error('Error deleting rows:', error);
        throw error;
      }
    }

    const updates = [];
    const newData = [];

    formattedData.forEach((row) => {
      const id = row[idColumnName];
      if (!id) return;

      const existing = existingDataMap.get(id);
      if (existing) {
        let needsUpdate = false;
        const updatedRow = Array(headers.length).fill('');

        Object.entries(headerIndices).forEach(([header, sheetIndex]) => {
          if (sheetIndex !== null) {
            if (row[header] !== undefined && row[header] !== existing.data[sheetIndex]) {
              needsUpdate = true;
              updatedRow[sheetIndex] = row[header];
            } else {
              updatedRow[sheetIndex] = existing.data[sheetIndex] || '';
            }
          }
        });

        if (needsUpdate) {
          updates.push({
            range: `${sheetName}!A${existing.rowIndex}`,
            values: [updatedRow]
          });
        }
      } else {
        const newRow = Array(headers.length).fill('');
        Object.entries(headerIndices).forEach(([header, sheetIndex]) => {
          if (sheetIndex !== null && row[header] !== undefined) {
            newRow[sheetIndex] = row[header] || '';
          }
        });
        newData.push(newRow);
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates.map(update =>
        fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${update.range}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: update.range,
              values: update.values
            })
          }
        )
      ));
    }

    if (newData.length > 0) {
      const lastRow = startRow || sheetData.length + 1;
      const range = `${sheetName}!A${lastRow}`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            values: newData
          })
        }
      );
    }

  } catch (error) {
    console.error('Error updating sheet:', error);
  }
};

export const syncSheet = async (spreadsheetId, token, data) => {
  try {
    await Promise.all([
      ensureHeaders(spreadsheetId, token, 'Profile Data'),
      ensureHeaders(spreadsheetId, token, 'Messages')
    ]);

    await Promise.all([
      updateSheetData(
        spreadsheetId,
        token,
        formatData.profileData(
          {
            labels: data.labels,
            sharedLabels: data.sharedLabels,
            notes: data.notes
          },
          data.getLabelProfiles,
          data.getNoteWithProfile
        ),
        'Profile Data'
      ),
      updateSheetData(
        spreadsheetId,
        token,
        formatData.messages(data.shortcuts),
        'Messages'
      )
    ]);
  } catch (error) {
    console.error('Error syncing sheet:', error);
    throw error;
  }
};

export const formatData = {
  profileData: (data, getLabelProfiles, getNoteWithProfile) => {
    const profileMap = new Map();

    // Helper function to create or update profile
    const processProfile = (profileId, info, labels = [], isShared = false, notes = '') => {
      const nameParts = (info?.name || '').split(' ');

      if (!profileMap.has(profileId)) {
        profileMap.set(profileId, {
          profileId,
          name: info?.name || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          url: info?.url || '',
          labels,
          isShared,
          notes,
        });
      } else {
        const profile = profileMap.get(profileId);
        if (labels.length > 0) {
          labels.forEach(label => {
            if (!profile.labels.includes(label)) {
              profile.labels.push(label);
            }
          });
        }
        profile.isShared = profile.isShared || isShared;
        if (notes) profile.notes = notes;
      }
    };

    // Process owned labels
    Object.entries(data?.labels?.labels || {}).forEach(([labelId, labelInfo]) => {
      const profiles = getLabelProfiles(labelId, false);
      labelInfo.profileIds.forEach((profileId) => {
        const profileInfo = profiles.find(p => p.id === profileId) || {};
        processProfile(profileId, profileInfo, [labelInfo.name], false, '');
      });
    });

    // Process Notes
    Object.entries(data?.notes || {}).forEach(([noteId, note]) => {
      const noteWithProfile = getNoteWithProfile(noteId);
      processProfile(note.profileId, noteWithProfile?.profile, [], false, note.content);
    });

    // Convert to rows matching new HEADERS order
    return Array.from(profileMap.values()).map(profile => ({
      'Profile ID': profile.profileId,
      'Profile Name': profile.name,
      'First Name': profile.firstName,
      'Last Name': profile.lastName,
      'Profile URL': profile.url,
      'Labels': profile.labels.join(', '),
      'Notes': profile.notes,
    }));
  },

  messages: (data) => {
    return Object.entries(data || {}).map(([id, message]) => ({
      'ID': message.id,
      'Title': message.title,
      'Content': message.content,
    }));
  }
};

export const createSheet = async (token, title) => {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: 'Profile Data' } },
          { properties: { title: 'Messages' } }
        ]
      })
    });

    if (!response.ok) throw new Error('Sheet creation failed');
    const sheet = await response.json();

    await Promise.all(
      Object.keys(HEADERS).map(sheetName =>
        ensureHeaders(sheet.spreadsheetId, token, sheetName)
      )
    );

    return sheet;
  } catch (error) {
    console.error('Error creating sheet:', error);
    throw error;
  }
};

export const processUploadLabels = async (sheetData, headerIndices, userId, spreadsheetId, token) => {
  const db = getFirestore();
  let rowUpdates = [];

  for (let i = 1; i < sheetData.length; i++) {
    const row = [...sheetData[i]];
    const profileUrl = row[headerIndices['Profile URL']]?.trim();
    let profileId = row[headerIndices['Profile ID']]?.trim();

    if (!profileUrl) {
      // console.log(`Row ${i}: Skipping - No profile URL`);
      continue;
    }

    let profileName = row[headerIndices['Profile Name']]?.trim();
    if (!profileName) {
      const firstName = row[headerIndices['First Name']]?.trim() || '';
      const lastName = row[headerIndices['Last Name']]?.trim() || '';
      profileName = `${firstName} ${lastName}`.trim();
    }

    const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^/]+)/i);
    const username = urlMatch ? urlMatch[1] : null;

    if (!profileId) {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('un', '==', username));
      const profileSnapshot = await getDocs(q);

      if (!profileSnapshot.empty) {
        profileId = profileSnapshot.docs[0].id;
        // console.log(`Found existing profile with ID: ${profileId}`);
      } else {
        profileId = username || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const profileRef = doc(db, 'profiles', profileId);
        // console.log(`Creating new profile with ID: ${profileId}`);

        await setDoc(profileRef, {
          n: profileName,
          img: "",
          lu: new Date().toISOString(),
          u: profileUrl,
          un: username,
          c: ""
        });
      }

      const newRow = [...row];
      newRow[headerIndices['Profile ID']] = profileId;
      rowUpdates.push({
        range: `Profile Data!A${i + 1}:${String.fromCharCode(65 + row.length)}${i + 1}`,
        values: [newRow]
      });
    }

    const labelsStr = row[headerIndices['Labels']]?.trim();
    if (labelsStr) {
      const labelNames = labelsStr.split(',')
        .map(l => l.trim())
        .filter(Boolean)

      for (const labelName of labelNames) {        
        const userRef = doc(db, 'users_v2', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          console.error('User document not found');
          continue;
        }

        const userData = userDoc.data();
        const userLabels = userData?.d?.l || [];

        let existingLabel = null;
        for (const labelObj of userLabels) {
          try {
            const labelRef = doc(db, 'profile_labels_v2', labelObj.id);
            const labelDoc = await getDoc(labelRef);
            
            if (labelDoc.exists()) {
              const labelData = labelDoc.data();
              if (labelData.n === labelName) {
                existingLabel = {
                  id: labelObj.id,
                  data: labelData
                };
                break;
              }
            }
          } catch (error) {
            console.error(`Error checking label ${labelObj.id}:`, error);
          }
        }

        let labelId;
        if (existingLabel) {
          labelId = existingLabel.id;
          try {
            const currentProfiles = existingLabel.data.p || [];
            const updatedProfiles = Array.from(new Set([...currentProfiles, profileId]));
            
            const labelRef = doc(db, 'profile_labels_v2', labelId);
            await updateDoc(labelRef, {
              p: updatedProfiles,
              lu: Date.now()
            });
          } catch (error) {
            console.error(`Error updating existing label ${labelId}:`, error);
          }
        } else {
          try {
            labelId = await createLabel(labelName, userId, db);
            if (labelId) {
              // console.log(`Created new label with ID: ${labelId}`);
              const labelRef = doc(db, 'profile_labels_v2', labelId);
              await updateDoc(labelRef, {
                p: [profileId],
                lu: Date.now()
              });
            } else {
              // console.error('Failed to create new label');
            }
          } catch (error) {
            console.error('Error creating/updating new label:', error);
          }
        }
      }
    } else {
      // console.log(`Row ${i}: No labels found`);
    }
  }

  if (rowUpdates.length > 0 && spreadsheetId && token) {
    try {
      await Promise.all(rowUpdates.map(update =>
        fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${update.range}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: update.range,
              values: update.values
            })
          }
        )
      ));
    } catch (error) {
      // console.error('Error updating spreadsheet:', error);
    }
  }
  return rowUpdates.length;
};