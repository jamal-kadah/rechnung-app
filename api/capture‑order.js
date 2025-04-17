import fetch from "node-fetch";

// In‑Memory‑Speicher
const paidSessions = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { orderId, sessionId } = req.body;

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  // Token holen
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // Capture
  const capRes = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  const data = await capRes.json();
  if (!capRes.ok) return res.status(400).json({ success: false, error: data });

  paidSessions.add(sessionId);
  res.json({ success: true });
}

// Export für check‑access
export { paidSessions };
