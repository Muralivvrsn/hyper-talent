const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Email configuration
const EMAIL_USER =
  "muralivvrsn75683@gmail.com"; // Replace with your actual email
const EMAIL_APP_PASSWORD =
  "rrbu hiry plgy verv"; // Replace with your app password
const LOGO_URL =
  "https://linkagent-assests.s3.us-east-1.amazonaws.com/Group+131+(1).png";
const DOCUMENTATION_URL = "https://yourdomain.com/docs";
const LOOM_VIDEO_URL = "https://loom.com/your-video";
const YOUTUBE_TUTORIAL_URL =
  "https://youtu.be/9uTW6CTyXck?si=T1NYCODJNVfvgqXF";
const SUPPORT_EMAIL = "muralivvrsn75683@gmail.com";
const PRIVACY_URL = "https://linkagent.vercel.app/privacy-policy";
const TERMS_URL = "https://linkagent.vercel.app/terms-of-service";

// Configure email transporter with your email credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
});

// HTML email template
const getEmailTemplate = (displayName) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; 
    margin: 0 auto; padding: 20px; color: #333333; line-height: 1.6;">
    <div style="text-align: center; margin-bottom: 25px;">
        <img src="${LOGO_URL}" alt="LinkAgent Logo" 
          style="max-width: 150px; height: auto;">
    </div>
    
    <div style="background-color: #f7f7f7; border-radius: 6px; 
      padding: 30px; margin-bottom: 25px;">
        <h1 style="color: #2c3e50; font-size: 24px; margin-top: 0; 
          margin-bottom: 20px; text-align: center;">
          High Five! You're In! 🙌
        </h1>
        
        <p style="margin-bottom: 15px;">Hey ${displayName},</p>
        
        <p style="margin-bottom: 15px;">
          Your LinkedIn just got superpowers! Thanks for installing LinkAgent 
          – your profiles will never look the same again (in a good way, 
          we promise).
        </p>
        
        <p style="margin-bottom: 15px;">Here's your new networking toolkit:</p>
        
        <ul style="padding-left: 20px; margin-bottom: 20px;">
            <li style="margin-bottom: 15px;">
              <strong style="color: #3498db;">Profile Labels</strong> 
              – Like sticky notes for LinkedIn! Never forget who's who again.
            </li>
            <li style="margin-bottom: 15px;">
              <strong style="color: #3498db;">Smart Filtering</strong> 
              – Finding contacts now easier than finding matching socks.
            </li>
            <li style="margin-bottom: 15px;">
              <strong style="color: #3498db;">Keyboard Wizardry</strong> 
              – Type less, network more. Your fingers will thank you.
            </li>
        </ul>
        
        <p style="margin-bottom: 15px;">
          Need the how-to scoop? We've got you covered:
        </p>
        
        <div style="background-color: #f0f7fb; border-left: 5px solid #3498db; 
          padding: 15px; margin-bottom: 20px;">
            <ul style="padding-left: 15px; margin-bottom: 0;">
                <li style="margin-bottom: 10px;">
                  <a href="${DOCUMENTATION_URL}" 
                    style="color: #3498db; text-decoration: underline; 
                    font-weight: bold;">
                    Complete Documentation
                  </a> 
                  – All the details
                </li>
                <li style="margin-bottom: 10px;">
                  <a href="${LOOM_VIDEO_URL}" 
                    style="color: #3498db; text-decoration: underline; 
                    font-weight: bold;">
                    Quick Tutorial
                  </a> 
                  – 3-minute video walkthrough
                </li>
                <li style="margin-bottom: 10px;">
                  <a href="${YOUTUBE_TUTORIAL_URL}" 
                    style="color: #3498db; text-decoration: underline; 
                    font-weight: bold;">
                    Advanced Guide
                  </a> 
                  – Master all features
                </li>
            </ul>
        </div>
        
        <p style="font-style: italic; text-align: center; margin-bottom: 0;">
          P.S. We'd love to hear how LinkAgent is working for you! 
          Just hit reply and let us know.
        </p>
    </div>
    
    <div style="text-align: center; font-size: 14px; color: #7f8c8d; 
      padding-top: 20px; border-top: 1px solid #eeeeee;">
        <p style="margin-bottom: 10px;">Cheers,</p>
        <p style="margin-bottom: 15px;">The LinkAgent Team</p>
        <p style="margin-bottom: 15px; font-style: italic; color: #34495e;">
          "Transforming how professionals connect, one profile at a time."
        </p>
        <p style="margin-bottom: 5px;">
          © ${new Date().getFullYear()} LinkAgent. All rights reserved.
        </p>
        <p style="font-size: 12px;">
            <a href="mailto:${SUPPORT_EMAIL}" 
              style="color: #3498db; text-decoration: underline; 
              margin: 0 5px;">
              Contact Support
            </a> | 
            <a href="${PRIVACY_URL}" 
              style="color: #7f8c8d; text-decoration: underline; 
              margin: 0 5px;">
              Privacy Policy
            </a> | 
            <a href="${TERMS_URL}" 
              style="color: #7f8c8d; text-decoration: underline; 
              margin: 0 5px;">
              Terms of Service
            </a>
        </p>
    </div>
</div>
  `;
};

// Cloud function triggered when a new user is created
exports.onusersignup = functions.auth.user().onCreate(async (user) => {
  try {
    // Get user display name or use email as fallback
    const displayName = user.displayName || user.email.split("@")[0];
    const userEmail = user.email;

    // Email content
    const mailOptions = {
      from: `"LinkAgent Team" <${EMAIL_USER}>`,
      to: userEmail,
      subject: "Welcome to LinkAgent! Your LinkedIn Superpower",
      html: getEmailTemplate(displayName),
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to: ${userEmail}`);

    // Store user data in Firestore
    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email,
      displayName: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailSent: true,
    });

    console.log(`Successfully processed signup for user: ${user.uid}`);
    return null;
  } catch (error) {
    console.error("Error processing new user signup:", error);
    return null;
  }
});
/**
 * Process and update profile data in Firestore
 * @param {Object} request The request object containing profile data
 * @return {Object} Response object with operation status
 */
exports.processdata = functions.https.onCall(async (request) => {
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
