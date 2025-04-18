const functions = require("firebase-functions");
const cors = require("cors")({ origin: true }); // <-- wichtig

exports.checkProAccess = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // hier dein Logikcode
    return res.json({ valid: true });
  });
});
