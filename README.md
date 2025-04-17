# Rechnungsgenerator App

Diese App ermöglicht Nutzern, Rechnungen zu erstellen und für die Pro-Version (4,99 €) per PayPal zu bezahlen.  
Die App nutzt Firebase Authentication, Firestore und Cloud Functions.

## Schritte zum Starten

1. Firebase CLI installieren und einloggen:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Firebase initialisieren (Hosting & Functions & Firestore):
   ```bash
   firebase init
   ```
3. PayPal-Credentials in Firebase Functions konfigurieren:
   ```bash
   firebase functions:config:set paypal.client_id="ATqRRHAPa8ca1Cd-tfa1q4a..." paypal.client_secret="ELbbAZJaTc97p8..."
   ```
4. Firebase Funktionen deployen:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```
5. Frontend installieren und deployen:
   ```bash
   cd ..
   npm install
   npm run build
   firebase deploy --only hosting
   ```
