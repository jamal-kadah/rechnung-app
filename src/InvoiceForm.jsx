import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// Firebase config - bitte mit deinen Werten füllen
const firebaseConfig = {
  apiKey: "AIzaSyAJxQv_3wlc3HZbc-oq2fneNrYOL5oX98k",
  authDomain: "rechnungsgenerator-66078.firebaseapp.com",
  projectId: "rechnungsgenerator-66078",
  storageBucket: "rechnungsgenerator-66078.firebasestorage.app",
  messagingSenderId: "290281232472",
  appId: "1:290281232472:web:f7b80421d8075d9a1b522d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns = getFunctions(app);

export default function InvoiceForm() {
  const [user, setUser] = useState(null);
  const [pro, setPro] = useState(false);
  const [form, setForm] = useState({
    firma: "Beispiel GmbH",
    adresse: "Musterstraße 1, 12345 Musterstadt",
    kunde: "Max Mustermann",
    kundenadresse: "Kundenstraße 2, 12345 Kundencity",
    datum: new Date().toISOString().split("T")[0],
    rechnungsnummer: "RG-1001",
  });
  const [positions, setPositions] = useState([
    { beschreibung: "", menge: 1, preis: 0 },
  ]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const check = httpsCallable(fns, "checkProAccess");
        check().then((res) => setPro(res.data.valid));
      }
    });
  }, []);

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());

  const buy = async () => {
    if (!user) return signIn();
    const fn = httpsCallable(fns, "createCheckoutSession");
    const { data } = await fn({ uid: user.uid });
    localStorage.setItem("orderId", data.orderId);
    localStorage.setItem("sessionId", data.sessionId);
    window.location.href = data.url;
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sid = p.get("session_id");
    const oid = localStorage.getItem("orderId");
    if (sid && oid && user) {
      const fnCap = httpsCallable(fns, "captureOrder");
      fnCap({ sessionId: sid, orderId: oid }).then((res) => {
        if (res.data.success) setPro(true);
        localStorage.removeItem("orderId");
      });
    }
  }, [user]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(form.firma, 20, 20);
    doc.text(form.adresse, 20, 26);
    doc.text(form.kunde, 20, 40);
    doc.text(form.kundenadresse, 20, 46);
    doc.setFontSize(14);
    doc.text("Rechnung", 20, 70);
    doc.setFontSize(12);
    doc.text(`Rechnungsnummer: ${form.rechnungsnummer}`, 20, 80);
    doc.text(`Datum: ${form.datum}`, 20, 86);
    let y = 100;
    doc.text("Pos", 20, y);
    doc.text("Beschreibung", 35, y);
    doc.text("Menge", 110, y);
    doc.text("Einzelpreis", 140, y);
    doc.text("Gesamt", 170, y);
    y += 10;
    positions.forEach((p, i) => {
      const gesamt = p.menge * p.preis;
      doc.text(String(i + 1), 20, y);
      doc.text(p.beschreibung, 35, y);
      doc.text(String(p.menge), 110, y);
      doc.text(`${p.preis.toFixed(2)} €`, 140, y);
      doc.text(`${gesamt.toFixed(2)} €`, 170, y);
      y += 10;
    });
    const netto = positions.reduce((s, p) => s + p.menge * p.preis, 0);
    const mwst = netto * 0.19;
    doc.text(`Zwischensumme: ${netto.toFixed(2)} €`, 140, y + 5);
    doc.text(`MwSt (19%): ${mwst.toFixed(2)} €`, 140, y + 11);
    doc.text(`Gesamtsumme: ${(netto + mwst).toFixed(2)} €`, 140, y + 17);
    if (!pro) {
      doc.setTextColor(200, 0, 0);
      doc.setFontSize(10);
      doc.text("Kostenlose Version – bitte Pro-Version kaufen.", 20, y + 30);
    }
    doc.save(`Rechnung_${form.rechnungsnummer}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Rechnung erstellen
      </h1>
      {!user && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={signIn}
        >
          Mit Google anmelden
        </button>
      )}
      {user && !pro && (
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={buy}
        >
          Pro-Version kaufen – 4,99 €
        </button>
      )}
      {user && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <input
              name="firma"
              value={form.firma}
              onChange={(e) => setForm({ ...form, firma: e.target.value })}
              className="input"
              placeholder="Firma"
            />
            <input
              name="adresse"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="input"
              placeholder="Adresse"
            />
            <input
              name="kunde"
              value={form.kunde}
              onChange={(e) => setForm({ ...form, kunde: e.target.value })}
              className="input"
              placeholder="Kunde"
            />
            <input
              name="kundenadresse"
              value={form.kundenadresse}
              onChange={(e) =>
                setForm({ ...form, kundenadresse: e.target.value })
              }
              className="input"
              placeholder="Kundenadresse"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="date"
              name="datum"
              value={form.datum}
              onChange={(e) => setForm({ ...form, datum: e.target.value })}
              className="input"
            />
            <input
              name="rechnungsnummer"
              value={form.rechnungsnummer}
              onChange={(e) =>
                setForm({ ...form, rechnungsnummer: e.target.value })
              }
              className="input"
              placeholder="Rechnungsnummer"
            />
          </div>
        </>
      )}
    </div>
  );
}
