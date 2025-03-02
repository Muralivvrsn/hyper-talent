const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Process and update profile data in Firestore
 * @param {Object} request The request object containing profile data
 * @return {Object} Response object with operation status
 */
exports.processData = functions.https.onCall(async (request) => {
  const {profileId, username, name, imageUrl, url} = request.data;
  const db = admin.firestore();

  if (!profileId && !username) {
    return {
      success: false,
      message: "No profileId or username provided",
    };
  }

  const profileData = {
    un: username,
    n: name,
    img: imageUrl,
    c: profileId,
    u: url,
  };

  const [profileById, profileByUsername] = await Promise.all([
    profileId ? db.collection("profiles").doc(profileId).get() : null,
    username ? db.collection("profiles").doc(username).get() : null,
  ]);

  if (profileById?.exists) {
    await db.collection("profiles").doc(profileId).update(profileData);
    if (profileByUsername?.exists && username !== profileId) {
      await updateProfileReferences(db, username, profileId);
      await db.collection("profiles").doc(username).delete();
    }
    return {
      success: true,
      message: "Profile updated by ID",
      profileId,
    };
  }

  if (profileByUsername?.exists) {
    if (profileId) {
      try {
        await db.runTransaction(async (transaction) => {
          transaction.set(
              db.collection("profiles").doc(profileId),
              profileData,
          );
          transaction.delete(
              db.collection("profiles").doc(username),
          );
        });

        await updateProfileReferences(db, username, profileId);

        return {
          success: true,
          message: "Profile updated by username and migrated to profileId",
          profileId,
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to migrate profile",
          error: error.message,
        };
      }
    }

    await db.collection("profiles").doc(username).update(profileData);
    return {
      success: true,
      message: "Profile updated by username",
      profileId: username,
    };
  }

  const docId = profileId || username;
  await db.collection("profiles").doc(docId).set(profileData);

  return {
    success: true,
    message: "New profile created",
    profileId: docId,
  };
});

/**
 * Updates profile references in the profile_labels_v2 collection
 * @param {Object} db Firestore database instance
 * @param {string} username The old username to be replaced
 * @param {string} newId The new profile ID to replace with
 * @return {Promise<void>}
 */
async function updateProfileReferences(db, username, newId) {
  const labelsSnapshot = await db.collection("profile_labels_v2").get();
  const labelsBatch = db.batch();
  let labelsCount = 0;
  for (const doc of labelsSnapshot.docs) {
    const profiles = doc.data().p;
    if (!Array.isArray(profiles)) {
      continue;
    }
    const updatedProfiles = [...new Set(profiles.map((p) =>
      p === username ? newId : p,
    ))];

    if (profiles.length === updatedProfiles.length &&
        !profiles.includes(username)) {
      continue;
    }
    labelsBatch.update(doc.ref, {p: updatedProfiles});
    labelsCount++;

    if (labelsCount >= 500) {
      await labelsBatch.commit();
      labelsCount = 0;
    }
  }
  if (labelsCount > 0) {
    await labelsBatch.commit();
  }
  const notesSnapshot = await db.collection("profile_notes_v2").get();
  const notesBatch = db.batch();
  let notesCount = 0;
  for (const doc of notesSnapshot.docs) {
    const profileId = doc.data().p;
    if (typeof profileId !== "string" || profileId !== username) {
      continue;
    }

    notesBatch.update(doc.ref, {p: newId});
    notesCount++;

    if (notesCount >= 500) {
      await notesBatch.commit();
      notesCount = 0;
    }
  }

  if (notesCount > 0) {
    await notesBatch.commit();
  }
}
