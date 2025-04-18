import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAJxQv_3wlc3HZbc-oq2fneNrYOL5oX98k",
  authDomain: "rechnungsgenerator-66078.firebaseapp.com",
  projectId: "rechnungsgenerator-66078",
  storageBucket: "rechnungsgenerator-66078.firebasestorage.app",
  messagingSenderId: "290281232472",
  appId: "1:290281232472:web:f7b80421d8075d9a1b522d",
};

initializeApp(firebaseConfig);
const auth = getAuth();

export default function InvoiceForm() {
  const [user, setUser] = useState(null);
  const [pro, setPro] = useState(false);
  const [form, setForm] = useState({
    /* … deine Felder … */
  });
  const [positions, setPositions] = useState([
    { beschreibung: "", menge: 1, preis: 0 },
  ]);

  // 1) Auth‑Listener & Pro‑Zugriff prüfen
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetch("/api/check-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: u.uid }),
        })
          .then((res) => res.json())
          .then((data) => setPro(data.valid));
      }
    });
  }, []);

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());

  // 2) Pro‑Kauf starten
  const buy = async () => {
    if (!user) return signIn();
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    });
    const { url, orderId } = await res.json();
    localStorage.setItem("orderId", orderId);
    window.location.href = url;
  };

  // 3) Nach Rückkehr: Bestellung einziehen
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sessionId = p.get("session_id");
    const orderId = localStorage.getItem("orderId");
    if (sessionId && orderId && user) {
      fetch("/api/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, orderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPro(true);
          localStorage.removeItem("orderId");
        });
    }
  }, [user]);

  // 4) PDF-Generierung (unverändert)
  const generatePDF = () => {
    /* … dein jsPDF‑Code … */
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Rechnung erstellen
      </h1>

      {!user && (
        <button className="btn-blue" onClick={signIn}>
          Mit Google anmelden
        </button>
      )}

      {user && !pro && (
        <button className="btn-yellow" onClick={buy}>
          Pro-Version kaufen – 4,99 €
        </button>
      )}

      {user && (
        <>
          {/* Dein Formular */}
          <button className="btn-green mt-4" onClick={generatePDF}>
            PDF erstellen
          </button>
        </>
      )}
    </div>
  );
}
