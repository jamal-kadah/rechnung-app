import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";

// Firebase Admin wie oben initialisieren
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
  const json = await res.json();
  return json.access_token;
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

  const { uid } = req.body;
  if (req.method !== "POST" || !uid) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const sessionId = uuidv4();
  // PayPal Order anlegen
  const token = await getAccessToken();
  const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "EUR", value: "4.99" },
          invoice_id: sessionId,
        },
      ],
      application_context: {
        return_url: `${process.env.VERCEL_URL}/?session_id=${sessionId}`,
        cancel_url: `${process.env.VERCEL_URL}`,
      },
    }),
  });
  const order = await orderRes.json();
  const approve = order.links.find((l) => l.rel === "approve").href;

  // Session in Firestore anlegen
  await db.collection("sessions").doc(sessionId).set({ paid: false, uid });

  res.json({ url: approve, orderId: sessionId });
}
