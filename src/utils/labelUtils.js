import { doc, runTransaction } from 'firebase/firestore';

export const getRandomColor = () => {
  const colors = [
    '#191970', '#800020', '#36454F', '#228B22', '#301934',
    '#002147', '#654321', '#2F4F4F', '#4B0082', '#8B0000',
    '#556B2F', '#004D4D', '#555D50', '#702963', '#8B008B',
    '#008B8B', '#242124', '#1F2D1B', '#003153', '#3C1414'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const createLabel = async (labelName, userId, db) => {
  if (!userId || !labelName.trim()) return null;

  const normalizedLabelName = labelName.trim().toUpperCase();

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users_v2', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const userLabels = Array.isArray(userData.d?.l) ? userData.d.l : [];

      // Check if label with same name already exists
      if (userLabels.length > 0) {
        // Extract just the IDs from the labels array
        const labelIds = userLabels.map(label => label.id);

        const labelPromises = labelIds.map(labelId =>
          transaction.get(doc(db, 'profile_labels_v2', labelId))
        );
        const labelDocs = await Promise.all(labelPromises);

        const labelExists = labelDocs.some(labelDoc => {
          if (labelDoc.exists()) {
            const labelData = labelDoc.data();
            return labelData.n.toUpperCase() === normalizedLabelName;
          }
          return false;
        });

        if (labelExists) {
          return null;
        }
      }

      const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const color = getRandomColor();

      const labelRef = doc(db, 'profile_labels_v2', labelId);
      transaction.set(labelRef, {
        c: color,
        lc: userId,
        lu: Date.now(),
        n: normalizedLabelName,
        p: [],
        w: [],
        r: []
      });

      // Create the new label object to add to the array
      const newLabelObject = {
        id: labelId,
        t: 'owned',
        ca: Date.now()
      };

      transaction.update(userRef, {
        'd.l': [...userLabels, newLabelObject]
      });

      return labelId;
    });

  } catch (error) {
    console.error('Error creating label:', error);
    return null;
  }
};

export const addLabelToProfile = async (labelId, profileId, userId, db) => {
  if (!labelId || !profileId || !userId) return false;

  try {
    await runTransaction(db, async (transaction) => {
      const labelRef = doc(db, 'profile_labels_v2', labelId);
      const labelDoc = await transaction.get(labelRef);

      if (!labelDoc.exists()) {
        throw new Error('Label not found');
      }

      const labelData = labelDoc.data();
      const profiles = labelData.p || [];

      if (!profiles.includes(profileId)) {
        transaction.update(labelRef, {
          p: [...profiles, profileId],
          lu: Date.now()
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Error adding label to profile:', error);
    return false;
  }
};

export const deleteLabel = async (labelId, userId, isShared, db) => {
  if (!labelId || !userId) return false;

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users_v2', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const userLabels = Array.isArray(userData.d?.l) ? userData.d.l : [];

      if (!isShared) {
        const labelRef = doc(db, 'profile_labels_v2', labelId);
        const labelDoc = await transaction.get(labelRef);

        if (!labelDoc.exists()) {
          throw new Error('Label not found');
        }

        const labelData = labelDoc.data();

        if (labelData.lc !== userId) {
          throw new Error('Unauthorized to delete label');
        }

        // Filter out the label to be deleted
        const updatedLabels = userLabels.filter(label => label.id !== labelId);

        transaction.update(userRef, {
          'd.l': updatedLabels
        });

        transaction.delete(labelRef);
      } else {
        const updatedLabels = userLabels.filter(label => label.id !== labelId);
        transaction.update(userRef, {
          'd.l': updatedLabels
        });
      }

      return true;
    });
  } catch (error) {
    console.error('Error deleting label:', error);
    return false;
  }
};

export const removeLabelFromProfile = async (labelId, profileId, userId, db) => {
  if (!labelId || !profileId || !userId) return false;

  try {
    await runTransaction(db, async (transaction) => {
      const labelRef = doc(db, 'profile_labels_v2', labelId);
      const labelDoc = await transaction.get(labelRef);

      if (!labelDoc.exists()) {
        throw new Error('Label not found');
      }

      const labelData = labelDoc.data();

      if (labelData.lc !== userId) {
        throw new Error('Unauthorized to modify label');
      }

      const profiles = labelData.p || [];

      if (profiles.includes(profileId)) {
        transaction.update(labelRef, {
          p: profiles.filter(id => id !== profileId),
          lu: Date.now()
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Error removing label from profile:', error);
    return false;
  }
};

export const createNote = async (profileId, content, userId, db) => {
  if (!profileId || !content.trim() || !userId) return null;

  try {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users_v2', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const userNotes = Array.isArray(userData.d?.n) ? userData.d.n : [];

      const noteRef = doc(db, 'profile_notes_v2', noteId);
      transaction.set(noteRef, {
        n: content.trim(),
        p: profileId,
        lu: Date.now()
      });

      // Create the new note object to add to the array
      const newNoteObject = {
        id: noteId,
        t: 'owned',
        ca: Date.now()
      };

      transaction.update(userRef, {
        'd.n': [...userNotes, newNoteObject]
      });
    });

    return noteId;
  } catch (error) {
    console.error('Error creating/updating note:', error);
    return null;
  }
};

export const updateNote = async (noteId, content, userId, db) => {
  if (!noteId || !content.trim() || !userId) return false;

  try {
    await runTransaction(db, async (transaction) => {
      const noteRef = doc(db, 'profile_notes_v2', noteId);
      const noteDoc = await transaction.get(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      transaction.update(noteRef, {
        n: content.trim(),
        lu: Date.now()
      });
    });

    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    return false;
  }
};