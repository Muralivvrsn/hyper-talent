import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const HEADERS = {
  "Profile Data": ['Profile ID', 'Profile Name', 'Profile Code', 'Profile URL', 'Last Label Updated', 'Labels', 'Last Note Updated', 'Note'],
  Messages: ['ID', 'Title', 'Content', 'Last Updated'],
  "Upload Labels": ['Profile Name', 'Profile URL', 'Label Name', 'Status']
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
    // console.error('Error getting last row:', error);
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
    // console.error('Error getting existing IDs:', error);
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
    // console.error('Error getting sheet ID:', error);
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
    // console.error('Error checking sheet structure:', error);
    return [];
  }
};

export const ensureHeaders = async (spreadsheetId, token, sheetName) => {
  try {
    // console.log(`Checking headers for ${sheetName}`);
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
    // console.error('Error ensuring headers:', error);
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
    // console.error('Error fetching sheet data:', error);
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
      // console.error(`Cannot find ${idColumnName} column in sheet`);
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
      const newRowHeaderIndices = getHeaderIndices(HEADERS[sheetName], HEADERS[sheetName]);
      const newRowIdIndex = newRowHeaderIndices[idColumnName];
      return row[newRowIdIndex];
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
        // console.error('Error deleting rows:', error);
        throw error;
      }
    }

    const updates = [];
    const newData = [];

    formattedData.forEach(row => {
      const newRowHeaderIndices = getHeaderIndices(HEADERS[sheetName], HEADERS[sheetName]);
      const newRowIdIndex = newRowHeaderIndices[idColumnName];
      const id = row[newRowIdIndex];

      if (!id) return;

      const existing = existingDataMap.get(id);

      if (existing) {
        let needsUpdate = false;
        const updatedRow = Array(headers.length).fill('');

        Object.entries(headerIndices).forEach(([header, sheetIndex]) => {
          if (sheetIndex !== null) {
            const newValueIndex = newRowHeaderIndices[header];
            const newValue = row[newValueIndex];
            const existingValue = existing.data[sheetIndex];

            if (newValue !== undefined && newValue !== existingValue) {
              needsUpdate = true;
              updatedRow[sheetIndex] = newValue;
            } else {
              updatedRow[sheetIndex] = existingValue || '';
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
          if (sheetIndex !== null) {
            const newValueIndex = newRowHeaderIndices[header];
            newRow[sheetIndex] = row[newValueIndex] || '';
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
    // console.error('Error updating sheet:', error);
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
          { properties: { title: 'Messages' } },
          { properties: { title: 'Upload Labels' } },
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
    // console.error('Error creating sheet:', error);
    throw error;
  }
};

export const formatData = {
  profileData: (data) => {
    const profileMap = new Map();

    Object.entries(data?.labels?.labels || {}).forEach(([labelName, info]) => {
      Object.entries(info.codes || {}).forEach(([profileId, profile]) => {
        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, {
            profileId,
            name: profile.name,
            code: profile.code,
            url: profile.url,
            lastLabelUpdated: profile.addedAt,
            labels: [],
            lastNoteUpdated: '',
            note: ''
          });
        }

        const profileData = profileMap.get(profileId);
        profileData.labels.push(labelName);
        if (!profileData.lastLabelUpdated || profile.addedAt > profileData.lastLabelUpdated) {
          profileData.lastLabelUpdated = profile.addedAt;
        }
      });
    });

    Object.entries(data?.notes || {}).forEach(([profileId, note]) => {
      if (!profileMap.has(profileId)) {
        profileMap.set(profileId, {
          profileId,
          name: note.name,
          code: note.code,
          url: note.url,
          lastLabelUpdated: '',
          labels: [],
          lastNoteUpdated: note.updatedAt,
          note: note.note
        });
      } else {
        const profileData = profileMap.get(profileId);
        profileData.note = note.note;
        profileData.lastNoteUpdated = note.updatedAt;
      }
    });

    return Array.from(profileMap.values()).map(profile => [
      profile.profileId,
      profile.name,
      profile.code,
      profile.url,
      profile.lastLabelUpdated,
      profile.labels.join(', '),
      profile.lastNoteUpdated,
      profile.note
    ]);
  },

  messages: (data) => {
    const rows = [];
    Object.entries(data?.shortcuts || {}).forEach(([id, message]) => {
      rows.push([
        id,
        message.title,
        message.content,
        message.lastUpdate
      ]);
    });
    return rows;
  }
};

export const syncSheet = async (spreadsheetId, token, data) => {
  try {
    await Promise.all([
      ensureHeaders(spreadsheetId, token, 'Profile Data'),
      ensureHeaders(spreadsheetId, token, 'Messages'),
      ensureHeaders(spreadsheetId, token, 'Upload Labels'),
    ]);

    await Promise.all([
      updateSheetData(spreadsheetId, token, formatData.profileData(data), 'Profile Data'),
      updateSheetData(spreadsheetId, token, formatData.messages(data.shortcuts), 'Messages')
    ]);



  } catch (error) {
    // console.error('Error syncing sheet:', error);
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
    // console.error('Error syncing DB:', error);
    throw error;
  }
};

async function syncSheetChangesToDB(sheetRow, headerIndices, existingDBData, userId) {
  const db = getFirestore();
  const profileId = sheetRow[headerIndices['Profile ID']];
  const profileCode = sheetRow[headerIndices['Profile Code']];

  if (!profileId) {
    // console.log('No Profile ID found in row, skipping...', sheetRow);
    return;
  }

  const labelsStr = sheetRow[headerIndices['Labels']];
  if (labelsStr) {
    // console.log(`Processing labels for profile ${profileId}: ${labelsStr}`);
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
      // console.log(`Processing label: ${labelName}`);

      const existingLabelName = Object.keys(updatedLabels).find(
        key => key.toLowerCase() === labelName.toLowerCase()
      );

      if (!existingLabelName) {
        // console.log(`Creating new label: ${labelName}`);
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

      // console.log(`Adding profile to label ${finalLabelName} with code:`, codeToUse);
      updatedLabels[finalLabelName].codes[profileId] = profileData;
    }

    try {
      await updateDoc(labelsRef, { labels: updatedLabels });
      // console.log('Successfully updated labels in DB');
    } catch (error) {
      // console.error('Error updating labels:', error);
    }
  }

  const noteStr = sheetRow[headerIndices['Note']];
  if (noteStr) {
    // console.log(`Processing note for profile ${profileId}: ${noteStr}`);
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
      // console.log('Successfully updated note in DB');
    } catch (error) {
      // console.error('Error updating note:', error);
    }
  }
}

const generateRandomColor = () => {
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

export const processUploadLabels = async (spreadsheetId, token, userId) => {
  // console.log('Starting processUpdateLabels with spreadsheetId:', spreadsheetId);
  try {
    // console.log('Fetching sheet data...');
    const sheetData = await getSheetData(spreadsheetId, token, 'Upload Labels');
    // console.log('Fetched rows:', sheetData?.length);

    if (!sheetData.length) {
      // console.log('No data found in sheet');
      return;
    }

    const headers = sheetData[0];
    // console.log('Headers found:', headers);

    const headerIndices = {
      profileName: headers.indexOf('Profile Name'),
      profileUrl: headers.indexOf('Profile URL'),
      labelName: headers.indexOf('Label Name'),
      status: headers.indexOf('Status')
    };
    // console.log('Header indices:', headerIndices);

    if (headerIndices.profileName === -1 || headerIndices.profileUrl === -1 ||
      headerIndices.labelName === -1 || headerIndices.status === -1) {
      // console.error('Required headers not found:', headerIndices);
      return;
    }

    const rowsToProcess = sheetData.slice(1).filter(row =>
      row[headerIndices.profileUrl] && !row[headerIndices.status]
    );
    // console.log('Rows to process:', rowsToProcess.length);

    if (!rowsToProcess.length) {
      // console.log('No new rows to process');
      return;
    }

    // console.log('Initializing Firebase for user:', userId);
    const db = getFirestore();
    const userLabelsRef = doc(db, 'labels', userId);
    const userLabelsDoc = await getDoc(userLabelsRef);
    // console.log('Firebase doc exists:', userLabelsDoc.exists());

    let labels = userLabelsDoc.exists() ? userLabelsDoc.data().labels || {} : {};
    // console.log('Current label count:', Object.keys(labels).length);

    // console.log('Starting row processing...');
    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const rowIndex = sheetData.indexOf(row);
      const labelName = row[headerIndices.labelName];
      const profileUrl = row[headerIndices.profileUrl];
      const profileName = row[headerIndices.profileName];

      // console.log(`Processing row ${i + 1}/${rowsToProcess.length}:`, {
      //   rowIndex,
      //   labelName,
      //   profileName,
      //   profileUrl: profileUrl?.substring(0, 30) + '...'
      // });

      try {
        const labelExists = !!labels[labelName];
        // console.log(`Label "${labelName}" exists:`, labelExists);

        if (!labelExists) {
          // console.log(`Creating new label: ${labelName}`);
          labels[labelName] = {
            color: generateRandomColor(),
            createdAt: new Date().toISOString(),
            codes: {}
          };
        }

        const profileId = btoa(profileUrl).replace(/[^a-zA-Z0-9]/g, '');
        // console.log('Generated profileId:', profileId);

        // console.log('Adding profile to label...');
        labels[labelName].codes[profileId] = {
          name: profileName,
          url: profileUrl,
          code: "",
          addedAt: new Date().toISOString()
        };

        // console.log(`Updating status for row ${rowIndex + 1}`);
        const updateResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Upload Labels!${String.fromCharCode(65 + headerIndices.status)}${rowIndex + 1}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `Upload Labels!${String.fromCharCode(65 + headerIndices.status)}${rowIndex + 1}`,
              values: [['Processed']]
            })
          }
        );
        // console.log('Status update response:', updateResponse.status);

      } catch (error) {
        // console.error(`Error processing row ${rowIndex + 1}:`, error);
        // console.log('Marking row as error...');

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Upload Labels!${String.fromCharCode(65 + headerIndices.status)}${rowIndex + 1}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `Upload Labels!${String.fromCharCode(65 + headerIndices.status)}${rowIndex + 1}`,
              values: [['Error']]
            })
          }
        );
      }
    }

    // console.log('Updating Firebase with all changes...');
    // console.log('Final label count:', Object.keys(labels).length);
    await setDoc(userLabelsRef, { labels }, { merge: true });
    // console.log('Successfully processed all rows');

  } catch (error) {
    // console.error('Error in processUpdateLabels:', error);
    throw error;
  }
};