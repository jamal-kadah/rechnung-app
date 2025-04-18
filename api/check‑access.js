// /api/checkProAccess.js
import Cors from "cors";
import initMiddleware from "next-connect"; // oder ein kleines CORS‑Wrapper‑Snippet
import { https } from "firebase-functions";
import admin from "firebase-admin";

// 1) CORS einrichten
const cors = Cors({
  origin: process.env.VERCEL_URL,
  methods: ["POST", "OPTIONS"],
});

// 2) Firebase‑Admin initialisieren
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Ersetzt maskierte '\n' wieder in echte Zeilenumbrüche:
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// 3) Die Cloud‑Function
export default async function handler(req, res) {
  // Handle preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", process.env.VERCEL_URL);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    return res.status(204).end();
  }

  // CORS anwenden
  await new Promise((resolve, reject) =>
    cors(req, res, (err) => (err ? reject(err) : resolve()))
  );

  // Deine Logik hier – z.B. prüfen, ob der aktuell eingeloggte Nutzer Pro hat:
  const uid = req.body.uid; // oder aus Firebase‑Auth‑Token extrahieren
  const userDoc = await admin.firestore().doc(`users/${uid}`).get();
  const isPro = userDoc.exists && userDoc.data().isPro === true;

  res.status(200).json({ valid: isPro });
}
