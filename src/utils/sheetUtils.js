import { getFirestore, doc, getDoc, updateDoc, arrayRemove, arrayUnion, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { createLabel } from '../utils/labelUtils';

const HEADERS = {
  "Profile Data": ['Profile ID', 'Profile Name', 'First Name', 'Last Name', 'Profile URL', 'Labels', 'Notes', 'Last Updated'],
  "Messages": ['ID', 'Title', 'Content', 'Last Updated']
};

export const getLastRow = async (spreadsheetId, token, sheetName) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return (data.values || []).length;
  } catch (error) {
    console.error('Error getting last row:', error);
    return 0;
  }
};

export const getExistingIds = async (spreadsheetId, token, sheetName) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    return new Set((data.values || []).slice(1).map(row => row[0]));
  } catch (error) {
    console.error('Error getting existing IDs:', error);
    return new Set();
  }
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
    const sheetData = await getSheetData(spreadsheetId, token, sheetName);
    const headers = sheetData[0] || HEADERS[sheetName];
    const headerIndices = getHeaderIndices(headers, HEADERS[sheetName]);

    const idColumnName = sheetName === 'Profile Data' ? 'Profile ID' : 'ID';
    const idColumnIndex = headerIndices[idColumnName];

    if (idColumnIndex === null) {
      console.error(`Cannot find ${idColumnName} column in sheet`);
      return;
    }

    const existingRows = sheetData.slice(1);
    const existingDataMap = new Map();
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
      } catch (error) {
        console.error('Error deleting rows:', error);
        throw error;
      }
    }

    const updates = [];
    const newData = [];

    formattedData.forEach((row, rowIndex) => {
      const id = row[idColumnName];
      if (!id) return

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

export const formatData = {
  profileData: (data, getLabelProfiles, getNoteWithProfile) => {
    const profileMap = new Map();

    // Helper function to create or update profile
    const processProfile = (profileId, info, labels = [], isShared = false, notes = '', lastUpdated = '') => {
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
          lastUpdated
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
        if (new Date(lastUpdated) > new Date(profile.lastUpdated)) {
          profile.lastUpdated = lastUpdated;
        }
      }
    };

    // Process owned labels
    Object.entries(data?.labels?.labels || {}).forEach(([labelId, labelInfo]) => {
      const profiles = getLabelProfiles(labelId, false);
      labelInfo.profileIds.forEach((profileId) => {
        const profileInfo = profiles.find(p => p.id === profileId) || {};
        processProfile(profileId, profileInfo, [labelInfo.name], false, '', labelInfo.lastUpdated);
      });
    });

    // Process shared labels
    // Object.entries(data?.sharedLabels || {}).forEach(([labelId, labelInfo]) => {
    //   const profiles = getLabelProfiles(labelId, true);
    //   labelInfo.profileIds.forEach((profileId) => {
    //     const profileInfo = profiles.find(p => p.id === profileId) || {};
    //     processProfile(profileId, profileInfo, [labelInfo.name], true, '', labelInfo.lastUpdated);
    //   });
    // });

    // Process Notes
    Object.entries(data?.notes || {}).forEach(([noteId, note]) => {
      const noteWithProfile = getNoteWithProfile(noteId);
      processProfile(note.profileId, noteWithProfile?.profile, [], false, note.content, note.lastUpdated);
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
      'Last Updated': profile.lastUpdated
    }));
  },

  messages: (data) => {
    return Object.entries(data || {}).map(([id, message]) => ({
      'ID': id,
      'Title': message.title,
      'Content': message.content,
      'Last Updated': message.lastUpdated
    }));
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

export const syncDatabase = async (spreadsheetId, token, userId, data) => {
  try {
    // Process both sheets
    const [profileData, messagesData] = await Promise.all([
      getSheetData(spreadsheetId, token, 'Profile Data'),
      getSheetData(spreadsheetId, token, 'Messages')
    ]);

    const profileIndices = getHeaderIndices(profileData[0] || HEADERS['Profile Data'], HEADERS['Profile Data']);
    const messageIndices = getHeaderIndices(messagesData[0] || HEADERS['Messages'], HEADERS['Messages']);

    if (userId) {
      await Promise.all([
        ...profileData.slice(1).map(row => syncProfileData(row, profileIndices, userId, data.labels, data.notes)),
        ...messagesData.slice(1).map((row, index) => syncMessagesToDB({ ...row, rowIndex: index + 2 }, token, messageIndices, userId, data.shortcuts, spreadsheetId))
      ]);
    }
  } catch (error) {
    console.error('Error syncing DB:', error);
    throw error;
  }
};

async function syncProfileData(row, headerIndices, userId, labels, notes) {
  const db = getFirestore();
  const profileId = row[headerIndices['Profile ID']]?.trim();
  const notesData = row[headerIndices['Notes']]?.trim();
  const labelsStr = row[headerIndices['Labels']]?.trim();

  if (!profileId) return;

  try {
    // Handle notes
    if (notesData) {
      const existingNote = Object.entries(notes).find(([_, note]) => note.profileId === profileId)?.[0];

      if (existingNote) {
        if (notes[existingNote].content !== notesData) {
          await updateDoc(doc(db, 'profile_notes_v2', existingNote), {
            n: notesData,
            lu: new Date().toISOString()
          });
        }
      } else {
        const newNoteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await Promise.all([
          setDoc(doc(db, 'profile_notes_v2', newNoteId), {
            n: notesData,
            p: profileId,
            lu: new Date().toISOString()
          }),
          updateDoc(doc(db, 'users_v2', userId), {
            'd.n': arrayUnion(newNoteId)
          })
        ]);
      }
    }
    // Handle labels
    if (labelsStr) {
      const sheetLabelNames = labelsStr.split(',')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => l.toUpperCase());

      // Process labels in batches for efficiency
      const batchSize = 10;
      const labelEntries = Object.entries(labels.labels || {});

      for (let i = 0; i < labelEntries.length; i += batchSize) {
        const batch = labelEntries.slice(i, i + batchSize);
        await Promise.all(batch.map(async ([labelId, label]) => {
          const isInSheet = sheetLabelNames.includes(label.name.toUpperCase());
          const hasProfile = label.profileIds?.includes(profileId);

          if (hasProfile && !isInSheet) {
            // Remove profile from label if not in sheet
            await updateDoc(doc(db, 'profile_labels_v2', labelId), {
              p: arrayRemove(profileId),
              lu: new Date().toISOString()
            });
          } else if (!hasProfile && isInSheet) {
            // Add profile to label if in sheet but not in label
            await updateDoc(doc(db, 'profile_labels_v2', labelId), {
              p: arrayUnion(profileId),
              lu: new Date().toISOString()
            });
          }
        }));
      }

      // Create new labels if needed
      const newLabelNames = sheetLabelNames.filter(name =>
        !Object.values(labels.labels || {}).some(l => l.name.toUpperCase() === name)
      );

      if (newLabelNames.length > 0) {
        await Promise.all(newLabelNames.map(async name => {
          const newLabelId = await createLabel(name, userId, db);
          if (newLabelId) {
            await updateDoc(doc(db, 'profile_labels_v2', newLabelId), {
              p: arrayUnion(profileId),
              lu: new Date().toISOString()
            });
          }
        }));
      }
    }
  } catch (error) {
    console.error(`Error syncing profile data: ${profileId}`, error);
  }
}

async function syncMessagesToDB(row, token, headerIndices, userId, messages, spreadsheetId) {
  const db = getFirestore();
  const messageId = row[headerIndices['ID']]?.trim();
  const title = row[headerIndices['Title']]?.trim();
  const content = row[headerIndices['Content']]?.trim();
  const rowIndex = row.rowIndex;

  if (!title || !content) return null;

  try {
    const timestamp = new Date().toISOString();
    let rowUpdate = null;

    if (messageId && messages[messageId]) {
      if (messages[messageId].title !== title || messages[messageId].content !== content) {
        await updateDoc(doc(db, 'message_templates_v2', messageId), {
          t: title,
          n: content,
          lu: timestamp
        });

        rowUpdate = {
          range: `Messages!${String.fromCharCode(65 + headerIndices['Last Updated'])}${rowIndex}`,
          values: [[timestamp]]
        };
      }
    } else {
      const newId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await Promise.all([
        setDoc(doc(db, 'message_templates_v2', newId), {
          t: title,
          n: content,
          lu: timestamp
        }),
        updateDoc(doc(db, 'users_v2', userId), {
          'd.s': arrayUnion(newId)
        })
      ]);

      rowUpdate = {
        range: `Messages!${String.fromCharCode(65 + headerIndices['ID'])}${rowIndex}:${String.fromCharCode(65 + headerIndices['Last Updated'])}${rowIndex}`,
        values: [[newId, title, content, timestamp]]
      };
    }

    if (rowUpdate) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rowUpdate.range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: rowUpdate.range,
            values: rowUpdate.values
          })
        }
      );
    }

    return rowUpdate;

  } catch (error) {
    console.error(`Error syncing message template: ${messageId || 'new template'}`, error);
    return null;
  }
}

export const processUploadLabels = async (sheetData, headerIndices, userId, spreadsheetId, token) => {
  const db = getFirestore();
  let rowUpdates = [];

  for (let i = 1; i < sheetData.length; i++) {
    const row = [...sheetData[i]];
    const profileUrl = row[headerIndices['Profile URL']]?.trim();
    let profileId = row[headerIndices['Profile ID']]?.trim();

    if (!profileUrl) continue;

    let profileName = row[headerIndices['Profile Name']]?.trim();
    if (!profileName) {
      const firstName = row[headerIndices['First Name']]?.trim() || '';
      const lastName = row[headerIndices['Last Name']]?.trim() || '';
      profileName = `${firstName} ${lastName}`.trim();
    }

    const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^/]+)/i);
    const username = urlMatch ? urlMatch[1] : null;

    if (!profileId) {
      // Check if profile exists with this URL
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('u', '==', profileUrl));
      const profileSnapshot = await getDocs(q);

      if (!profileSnapshot.empty) {
        // Use existing profile
        profileId = profileSnapshot.docs[0].id;
      } else {
        // Create new profile
        profileId = username || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const profileRef = doc(db, 'profiles', profileId);

        await setDoc(profileRef, {
          n: profileName,
          img: "",
          lu: new Date().toISOString(),
          u: profileUrl,
          un: username,
          c: ""
        });
      }

      // Update row with new profile ID
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
        .map(l => l.toUpperCase());

      for (const labelName of labelNames) {
        const userRef = doc(db, 'users_v2', userId);
        const userData = (await getDoc(userRef)).data();
        const userLabelIds = userData?.d?.l || [];

        let labelId;
        let labelExists = false;

        if (userLabelIds.length > 0) {
          const labelDocs = await Promise.all(
            userLabelIds.map(id => getDoc(doc(db, 'profile_labels_v2', id)))
          );

          const existingLabel = labelDocs.find(doc =>
            doc.exists() && doc.data().n.toUpperCase() === labelName
          );

          if (existingLabel) {
            labelId = existingLabel.id;
            labelExists = true;
          }
        }

        if (!labelExists) {
          labelId = await createLabel(labelName, userId, db);
        }

        if (labelId) {
          const labelRef = doc(db, 'profile_labels_v2', labelId);
          await updateDoc(labelRef, {
            p: arrayUnion(profileId),
            lu: new Date().toISOString()
          });
        }
      }
    }
  }

  if (rowUpdates.length > 0 && spreadsheetId && token) {
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
  }

  return rowUpdates.length;
};