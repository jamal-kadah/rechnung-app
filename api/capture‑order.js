import fetch from "node-fetch";
import admin from "firebase-admin";

const svc = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}
const db = admin.firestore();

const PAYPAL_API = "https://api-m.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SECRET;

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await res.json();
  return access_token;
}

export default async function handler(req, res) {
  // CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { sessionId, orderId } = req.body;
  if (req.method !== "POST" || !sessionId || !orderId) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const token = await getAccessToken();
  const capRes = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${sessionId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const capData = await capRes.json();

  if (capData.status === "COMPLETED") {
    // Firestore markieren
    await db.collection("sessions").doc(orderId).update({ paid: true });
    return res.json({ success: true });
  }

  res.json({ success: false });
}
