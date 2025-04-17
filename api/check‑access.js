import { paidSessions } from "./capture-order";

export default function handler(req, res) {
  const { sessionId } = req.query;
  res.json({ valid: paidSessions.has(sessionId) });
}
