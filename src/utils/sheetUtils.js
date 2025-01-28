import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = {
  "Profile Data": ['Profile Code', 'Profile ID', 'Profile Name', 'First Name', 'Last Name', 'Profile URL', 'Labels', 'Note'],
  Messages: ['ID', 'Title', 'Content', 'Last Updated']
};

export const fetchCollectionData = async (userId) => {
  const db = getFirestore();
  const collections = {
    labels: doc(db, 'labels', userId),
    notes: doc(db, 'notes', userId),
    shortcuts: doc(db, 'shortcuts', userId)
  };

  const data = {};
  await Promise.all(
    Object.entries(collections).map(async ([key, docRef]) => {
      const snap = await getDoc(docRef);
      if (snap.exists()) data[key] = snap.data();
    })
  );
  return data;
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
    console.log(`Checking headers for ${sheetName}`);
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
      console.log(`Processing formatted data row ${rowIndex}:`, row);
      
      const id = row[idColumnName];

      if (!id) {
        console.log("Skipping row due to no ID");
        return;
      }

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

    await hideProfileCodeColumn(sheet.spreadsheetId, token);
    return sheet;
  } catch (error) {
    console.error('Error creating sheet:', error);
    throw error;
  }
};

export const hideProfileCodeColumn = async (spreadsheetId, token) => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    const sheet = data.sheets.find(s => s.properties.title === 'Profile Data');

    if (!sheet) {
      console.error('Profile Data sheet not found');
      return;
    }

    const profileCodeColumnIndex = HEADERS["Profile Data"].indexOf('Profile Code');

    if (profileCodeColumnIndex === -1) {
      console.error('Profile Code column not found in headers');
      return;
    }

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            updateDimensionProperties: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'COLUMNS',
                startIndex: profileCodeColumnIndex,
                endIndex: profileCodeColumnIndex + 1
              },
              properties: {
                hiddenByUser: true
              },
              fields: 'hiddenByUser,pixelSize'
            }
          }]
        })
      }
    );

    console.log('Successfully hid Profile Code column');
    return true;
  } catch (error) {
    console.error('Error hiding Profile Code column:', error);
    throw error;
  }
};

export const formatData = {
  profileData: (data) => {
    const profileMap = new Map();

    // Helper function to split full name into first and last name
    const splitName = (fullName) => {
      if (!fullName) return ['', ''];
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      return [firstName, lastName];
    };

    // Process Labels
    Object.entries(data?.labels?.labels || {}).forEach(([labelName, info]) => {
      Object.entries(info.codes || {}).forEach(([profileId, profile]) => {
        if (!profileMap.has(profileId)) {
          const [firstName, lastName] = splitName(profile.name);
          profileMap.set(profileId, {
            profileId,
            name: profile.name,
            firstName,
            lastName,
            code: profile.code,
            url: profile.url,
            labels: [],
            note: ''
          });
        }

        const profileData = profileMap.get(profileId);
        if (!profileData.labels.includes(labelName)) {
          profileData.labels.push(labelName);
        }
      });
    });

    // Process Notes
    Object.entries(data?.notes || {}).forEach(([profileId, note]) => {
      if (!profileMap.has(profileId)) {
        const [firstName, lastName] = splitName(note.name);
        profileMap.set(profileId, {
          profileId,
          name: note.name,
          firstName,
          lastName,
          code: note.code,
          url: note.url,
          labels: [],
          note: note.note
        });
      } else {
        const profileData = profileMap.get(profileId);
        profileData.note = note.note;
      }
    });

    // Convert to rows matching HEADERS order
    return Array.from(profileMap.values()).map(profile => ({
      'Profile Code': profile.code,
      'Profile ID': profile.profileId,
      'Profile Name': profile.name,
      'First Name': profile.firstName,
      'Last Name': profile.lastName,
      'Profile URL': profile.url,
      'Labels': profile.labels.join(', '),
      'Note': profile.note
    }));
  },

  messages: (data) => {
    const rows = [];
    Object.entries(data?.shortcuts || {}).forEach(([id, message]) => {
      rows.push({
        'ID': id,
        'Title': message.title,
        'Content': message.content,
        'Last Updated': message.lastUpdate
      });
    });
    return rows;
  }
};

export const syncSheet = async (spreadsheetId, token, data) => {
  try {
    await Promise.all([
      ensureHeaders(spreadsheetId, token, 'Profile Data'),
      ensureHeaders(spreadsheetId, token, 'Messages')
    ]);

    await Promise.all([
      updateSheetData(spreadsheetId, token, formatData.profileData(data), 'Profile Data'),
      updateSheetData(spreadsheetId, token, formatData.messages(data.shortcuts), 'Messages')
    ]);



  } catch (error) {
    console.error('Error syncing sheet:', error);
    throw error;
  }
};

export const syncDatabase = async (spreadsheetId, token, data, userId) => {
  try {

    ensureHeaders(spreadsheetId, token, 'Profile Data')

    const sheetData = await getSheetData(spreadsheetId, token, 'Profile Data');
    const headers = sheetData[0] || HEADERS['Profile Data'];
    const headerIndices = getHeaderIndices(headers, HEADERS['Profile Data']);

    if (userId) {
      for (const row of sheetData.slice(1)) {
        await syncSheetChangesToDB(row, headerIndices, data, userId);
      }
    }

  } catch (error) {
    console.error('Error syncing DB:', error);
    throw error;
  }
};

async function syncSheetChangesToDB(sheetRow, headerIndices, existingDBData, userId) {
  const db = getFirestore();
  const profileId = sheetRow[headerIndices['Profile ID']];
  const profileCode = sheetRow[headerIndices['Profile Code']];

  if (!profileId) {
    console.log('No Profile ID found in row, skipping...', sheetRow);
    return;
  }

  const labelsStr = sheetRow[headerIndices['Labels']];
  if (labelsStr) {
    console.log(`Processing labels for profile ${profileId}: ${labelsStr}`);
    const labelsRef = doc(db, 'labels', userId);
    const newLabels = labelsStr.split(',').map(l => l.trim()).filter(l => l);

    const currentLabels = existingDBData?.labels?.labels || {};
    const updatedLabels = { ...currentLabels };

    let existingCode = null;
    Object.values(currentLabels).forEach(label => {
      if (label.codes && label.codes[profileId] && label.codes[profileId].code) {
        existingCode = label.codes[profileId].code;
      }
    });

    const codeToUse = profileCode || existingCode;

    for (const labelName of newLabels) {
      console.log(`Processing label: ${labelName}`);

      const existingLabelName = Object.keys(updatedLabels).find(
        key => key.toLowerCase() === labelName.toLowerCase()
      );

      if (!existingLabelName) {
        console.log(`Creating new label: ${labelName}`);
        updatedLabels[labelName] = {
          codes: {},
          color: generateRandomColor(),
          createdAt: new Date().toISOString()
        };
      }

      const finalLabelName = existingLabelName || labelName;

      const existingProfileData = updatedLabels[finalLabelName].codes[profileId];

      const profileData = {
        addedAt: existingProfileData?.addedAt || new Date().toISOString(),
        code: codeToUse,
        name: sheetRow[headerIndices['Profile Name']],
        url: sheetRow[headerIndices['Profile URL']]
      };

      console.log(`Adding profile to label ${finalLabelName} with code:`, codeToUse);
      updatedLabels[finalLabelName].codes[profileId] = profileData;
    }

    try {
      await updateDoc(labelsRef, { labels: updatedLabels });
      console.log('Successfully updated labels in DB');
    } catch (error) {
      console.error('Error updating labels:', error);
    }
  }

  const noteStr = sheetRow[headerIndices['Note']];
  if (noteStr) {
    console.log(`Processing note for profile ${profileId}: ${noteStr}`);
    const notesRef = doc(db, 'notes', userId);

    const existingNote = existingDBData?.notes?.[profileId];

    const noteData = {
      code: profileCode || existingNote?.code || null,
      name: sheetRow[headerIndices['Profile Name']],
      note: noteStr,
      updatedAt: new Date().toISOString(),
      url: sheetRow[headerIndices['Profile URL']]
    };

    try {
      await updateDoc(notesRef, {
        [profileId]: noteData
      });
      console.log('Successfully updated note in DB');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }
}

export const generateRandomColor = () => {
  const colors = [
    // Blues
    '#0A66C2', '#0084BD', '#2557A7', '#366DA0', '#4A90E2', '#85C1E9',

    // Greens
    '#057642', '#4C8C40', '#4CAF50', '#6FAF79', '#2E8B57', '#A9DFBF',

    // Reds
    '#B24020', '#DD5143', '#C74634', '#A13F3F', '#E74C3C', '#F1948A',

    // Purples
    '#7A3E98', '#6E4B9E', '#A569BD', '#8E44AD', '#D2B4DE', '#BB8FCE',

    // Browns & Earthy
    '#8C6A4E', '#9E6B52', '#7D6544', '#A85C32', '#8E562E', '#D7BDE2',

    // Yellows & Oranges
    '#E7A33E', '#E59866', '#F4D03F', '#F7DC6F', '#D68910', '#EDBB99',

    // Teals
    '#0E8A7D', '#458B74', '#17A589', '#1ABC9C', '#76D7C4', '#AED6F1',

    // Grays & Neutrals
    '#5E6D77', '#6B8068', '#839192', '#99A3A4', '#ABB2B9', '#BDC3C7',

    // Vintage-inspired
    '#A0522D', '#B8860B', '#CD853F', '#DAA520', '#C39BD3', '#B0C4DE',

    // Soft pastels
    '#FAD7A0', '#F9E79F', '#D5F5E3', '#A9CCE3', '#E8DAEF', '#FDEDEC'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const processUploadLabels = async (sheetData, headerIndices, userId, spreadsheetId, token) => {
  const db = getFirestore();
  const labelsRef = doc(db, 'labels', userId);
  let labelsDoc = await getDoc(labelsRef);
  let currentLabels = labelsDoc.exists() ? labelsDoc.data()?.labels || {} : {};
  let updatedLabels = { ...currentLabels };
  let rowUpdates = [];

  // Process each row
  for (let i = 1; i < sheetData.length; i++) {
    const row = [...sheetData[i]]; // Create a copy of the row
    const profileUrl = row[headerIndices['Profile URL']];
    let profileId = row[headerIndices['Profile ID']];

    if (!profileUrl) continue;

    // Generate UUID if needed
    if (!profileId) {
      profileId = uuidv4();
      const newRow = [...row];
      newRow[headerIndices['Profile ID']] = profileId; // Put UUID in correct column

      // Prepare row update for sheet
      rowUpdates.push({
        range: `Profile Data!A${i + 1}:${String.fromCharCode(65 + row.length)}${i + 1}`,
        values: [newRow]
      });
    }

    // Get profile name
    let profileName = row[headerIndices['Profile Name']];
    if (!profileName && (row[headerIndices['First Name']] || row[headerIndices['Last Name']])) {
      profileName = `${row[headerIndices['First Name']] || ''} ${row[headerIndices['Last Name']] || ''}`.trim();
    }

    // Process labels
    const labelsStr = row[headerIndices['Labels']];
    if (labelsStr) {
      const newLabels = labelsStr.split(',').map(l => l.trim()).filter(l => l);

      for (const labelName of newLabels) {
        const existingLabelName = Object.keys(updatedLabels).find(
          key => key.toLowerCase() === labelName.toLowerCase()
        );

        if (!existingLabelName) {
          updatedLabels[labelName] = {
            codes: {},
            color: generateRandomColor(),
            createdAt: new Date().toISOString()
          };
        }

        const finalLabelName = existingLabelName || labelName;
        const existingProfileData = updatedLabels[finalLabelName].codes[profileId];

        const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^/]+)/);
        const username = urlMatch ? urlMatch[1] : null;

        if (!existingProfileData) {
          updatedLabels[finalLabelName].codes[profileId] = {
            addedAt: new Date().toISOString(),
            code: null,
            name: profileName,
            url: profileUrl,
            username
          };
        }
      }
    }
  }

  // Update Firestore
  if (Object.keys(updatedLabels).length > 0) {
    await updateDoc(labelsRef, { labels: updatedLabels });
  }

  // Update sheet if there are any changes
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