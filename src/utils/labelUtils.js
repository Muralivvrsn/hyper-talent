import { doc, runTransaction } from 'firebase/firestore';

export const hexToHSL = (hex) => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export const parseHSL = (hslString) => {
  const matches = hslString.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
  if (!matches) return null;
  return {
    h: parseInt(matches[1]),
    s: parseInt(matches[2]),
    l: parseInt(matches[3])
  };
}

// Generate a random color that's different from existing colors
const generateRandomColor = async (existingColors = []) => {
  const minDistance = 30; // Minimum hue distance between colors

  // Convert all existing colors to HSL for comparison
  const existingHSL = existingColors.map(color => {
    if (color.startsWith('#')) {
      return hexToHSL(color);
    } else {
      return parseHSL(color);
    }
  });

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * (80 - 60) + 60); // Random saturation between 60-80%
    const lightness = Math.floor(Math.random() * (85 - 25) + 25);  // Random lightness between 25-85%

    // Check if this color is far enough from existing colors
    const isFarEnough = existingHSL.every(existing => {
      if (!existing) return true;
      const hueDiff = Math.min(
        Math.abs(hue - existing.h),
        360 - Math.abs(hue - existing.h)
      );
      return hueDiff > minDistance;
    });

    if (isFarEnough || attempts === maxAttempts - 1) {
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    attempts++;
  }

  // Fallback if we couldn't find a distinct color
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * (80 - 60) + 60);
  const lightness = Math.floor(Math.random() * (85 - 25) + 25);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export const createLabel = async (labelName, userId, db) => {
  if (!userId || !labelName.trim()) return null;

  const normalizedLabelName = labelName.trim();

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users_v2', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const userLabels = Array.isArray(userData.d?.l) ? userData.d.l : [];
      // const getExistingColors = (labels) => {
      //   // console.log(labels)
      //   return labels.map(label => label.label_color);
      // };

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
            return labelData.n === normalizedLabelName;
          }
          return false;
        });

        if (labelExists) {
          return null;
        }
      }

      const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const color = await generateRandomColor();

      const labelRef = doc(db, 'profile_labels_v2', labelId);
      transaction.set(labelRef, {
        c: color,
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

        const matchingLabel = userLabels.find(label => label.id === labelId);
        if (!matchingLabel || matchingLabel.t !== 'owned') {
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

      const userRef = doc(db, 'users_v2', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const userLabels = Array.isArray(userData.d?.l) ? userData.d.l : [];
      const matchingLabel = userLabels.find(label => label.id === labelId);

      if (!matchingLabel || matchingLabel.t !== 'owned') {
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