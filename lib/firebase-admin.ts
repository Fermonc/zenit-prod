// ==========================================================
// ARCHIVO 37 (REPARACIÓN SSR v2): lib/firebase-admin.ts
// (Usa la inicialización por defecto de Google Cloud)
// ==========================================================
import admin from "firebase-admin";

// Cuando se ejecuta en Google Cloud (App Hosting/Cloud Run),
// initializeApp() automáticamente encuentra las credenciales de servicio
// del entorno. No necesitamos credenciales manuales.
if (!admin.apps.length) {
  admin.initializeApp({
    // Solo necesitamos el storageBucket para que Storage Admin funcione
    storageBucket: "zenit-prod.firebasestorage.app"
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };