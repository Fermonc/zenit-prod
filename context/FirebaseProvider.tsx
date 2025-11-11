// ==========================================================
// ARCHIVO 11: context/FirebaseProvider.tsx (REPARACIÓN DE EMERGENCIA)
// (Con credenciales explícitas para eliminar errores de configuración)
// ==========================================================
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage";

// --- CONFIGURACIÓN EXPLÍCITA (Recuperada de sus logs) ---
const firebaseConfig = {
  apiKey: "AIzaSyDVl92UNWj1gOruDlIgoTKJWIULGIvYHw8",
  authDomain: "zenit-prod.firebaseapp.com",
  projectId: "zenit-prod",
  storageBucket: "zenit-prod.firebasestorage.app",
  messagingSenderId: "310441521839",
  appId: "1:310441521839:web:9661eb2201f83d1d055a5a"
};
// -------------------------------------------------------

interface FirebaseContextValue {
  auth: Auth;
  db: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [functions, setFunctions] = useState<Functions | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let app: FirebaseApp;
    try {
      app = getApp("default");
    } catch (e) {
      app = initializeApp(firebaseConfig, "default");
    }

    const authInstance = getAuth(app);
    setAuth(authInstance);
    setDb(getFirestore(app));
    // Usamos la región correcta para Functions
    setFunctions(getFunctions(app, 'us-central1'));
    setStorage(getStorage(app));

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificación de seguridad: No renderizar hasta que TODO esté listo
  if (loading || !auth || !db || !functions || !storage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1A1A2E] text-white">
        <p className="animate-pulse">Cargando núcleo de Zenit...</p>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ auth, db, functions, storage, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase debe ser usado dentro de un FirebaseProvider");
  return context;
};