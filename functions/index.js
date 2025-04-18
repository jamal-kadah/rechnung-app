const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

exports.checkProAccess = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const user = req.body.uid;
    // Check-Zeug machen (hier dummy)
    const valid = user ? true : false;
    res.json({ valid });
  });
});
