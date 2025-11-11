// ARQUITECTURA: Componente de Cliente (Hook).
// Escucha en tiempo real el documento de un usuario en Firestore.
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { useFirebase } from "@/context/FirebaseProvider";

// Definimos la "forma" de nuestro perfil de usuario en Firestore
// (Debe coincidir con lo que crea la Cloud Function 'onUsuarioCreado')
export interface UserProfile {
  uid: string;
  email: string;
  rol: "usuario" | "admin";
  fichasZenit: number;
  paseTemporadaXP: number;
  ultimoReclamoDiario: DocumentData | null; // O un tipo Timestamp
  nivelesReclamados: string[];
}

export const useUserProfile = (uid: string | undefined) => {
  const { db } = useFirebase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay uid (usuario no logueado), no hacemos nada.
    if (!uid) {
      setLoading(false);
      setProfile(null);
      return;
    }

    setLoading(true);

    // Creamos la referencia al documento del usuario
    const userDocRef = doc(db, "usuarios", uid);

    // onSnapshot es el "oyente" de tiempo real.
    // Se dispara una vez al inicio y luego cada vez
    // que el documento 'usuarios/{uid}' cambia en el backend.
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        // El documento existe, lo guardamos en el estado
        setProfile(docSnap.data() as UserProfile);
      } else {
        // El documento no existe (ej. error en Cloud Function onUsuarioCreado)
        console.error(`Error: No se encontró perfil para el UID: ${uid}`);
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      // Manejo de errores (ej. permisos denegados por Reglas)
      console.error(`Error al escuchar perfil de usuario: ${uid}`, error);
      setProfile(null);
      setLoading(false);
    });

    // Esta función de limpieza es llamada por React cuando
    // el componente (o el 'uid') cambia. 
    // Esto previene fugas de memoria.
    return () => unsubscribe();

  }, [uid, db]); // Dependencias: El hook se re-ejecuta si 'uid' o 'db' cambian

  return { profile, loading };
};