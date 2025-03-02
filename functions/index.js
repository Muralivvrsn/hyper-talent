const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.processData = functions.https.onCall((request) => {
  console.log("Received data:");
  console.log(request.data);
  if (request.auth) {
    console.log("User ID:", request.auth.uid);
  } else {
    console.log("No authentication provided");
  }
  return {
    success: true,
    message: "Data received and logged successfully",
    timestamp: new Date().toISOString(),
  };
});

