// ==========================================================
// ARCHIVO 29 (NUEVO): hooks/useFirestoreDoc.tsx
// (Hook profesional para cargar un único documento en tiempo real)
// ==========================================================
"use client";

import { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  DocumentData 
} from "firebase/firestore";
import { useFirebase } from "@/context/FirebaseProvider";

// Hook genérico para cargar cualquier documento
export const useFirestoreDoc = <T extends DocumentData>(
  collectionName: string, 
  docId: string | undefined
) => {
  const { db } = useFirebase();
  const [document, setDocument] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay ID de documento (o la BD no está lista), no hacemos nada.
    if (!db || !docId) {
      setLoading(false);
      setDocument(null);
      return;
    }

    setLoading(true);

    // 1. Crear la referencia al documento específico
    const docRef = doc(db, collectionName, docId);

    // 2. Establecer el "oyente" de tiempo real (onSnapshot)
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      
      if (docSnap.exists()) {
        // El documento existe, lo guardamos en el estado
        setDocument({
          id: docSnap.id,
          ...docSnap.data()
        } as unknown as T); // Usamos la corrección de tipo
      } else {
        console.error(`Error: No se encontró el documento: ${collectionName}/${docId}`);
        setDocument(null);
      }
      setLoading(false);

    }, (error) => {
      // 3. Manejo de errores
      console.error(`Error al escuchar el documento ${docId}:`, error);
      setLoading(false);
    });

    // 4. Función de limpieza
    return () => unsubscribe();

  }, [docId, collectionName, db]); // Dependencias

  return { document, loading };
};