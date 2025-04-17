import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sessionId = uuidv4();
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  // PayPal Token holen
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // Order anlegen
  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
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
        return_url: `${process.env.SITE_URL}/?session_id=${sessionId}`,
        cancel_url: process.env.SITE_URL,
      },
    }),
  });
  const order = await orderRes.json();
  const approve = order.links.find((l) => l.rel === "approve")?.href;
  return res.json({ url: approve, sessionId, orderId: order.id });
}
