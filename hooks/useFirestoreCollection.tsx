// ARQUITECTURA: Componente de Cliente (Hook).
// Escucha en tiempo real una COLECCIÓN completa de Firestore.
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, DocumentData, QuerySnapshot } from "firebase/firestore";
import { useFirebase } from "@/context/FirebaseProvider";

// Esta es una interfaz genérica.
// 'T' es un marcador de posición para el "tipo" de datos que esperamos.
// (Ej. para la tienda, 'T' será 'PaqueteZenit')
interface FirestoreCollectionState<T> {
  data: T[];
  loading: boolean;
}

export const useFirestoreCollection = <T extends DocumentData>(collectionName: string): FirestoreCollectionState<T> => {
  const { db } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no estamos listos (ej. 'db' no se ha inicializado), no hacemos nada.
    if (!db) {
      setLoading(true);
      return;
    }

    setLoading(true);

    // 1. Crear la referencia a la colección
    const collectionRef = collection(db, collectionName);

    // 2. Establecer el "oyente" de tiempo real (onSnapshot)
    const unsubscribe = onSnapshot(collectionRef, (snapshot: QuerySnapshot) => {
      
      // 3. Mapear los resultados
      // Transforma la respuesta de Firestore (docs) en un array
      // limpio de nuestros datos, añadiendo el 'id' del documento.
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      // ==========================================================
      // INICIO DE LA CORRECIÓN PROACTIVA (Archivo 21)
      // ==========================================================
      })) as unknown as T[]; // <--- Corrección de tipo para TypeScript
      // ==========================================================
      // FIN DE LA CORRECIÓN
      // ==========================================================
      
      setData(docs);
      setLoading(false);

    }, (error) => {
      // 4. Manejo de errores
      console.error(`Error al escuchar la colección ${collectionName}:`, error);
      setLoading(false);
    });

    // 5. Función de limpieza (previene fugas de memoria)
    return () => unsubscribe();

  }, [collectionName, db]); // Dependencias: Se re-ejecuta si 'collectionName' o 'db' cambian

  return { data, loading };
};