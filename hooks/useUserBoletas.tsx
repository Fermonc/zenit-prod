// ==========================================================
// ARCHIVO 28 (Corregido): hooks/useUserBoletas.tsx
// (Añadida la importación de 'toast')
// ==========================================================
"use client";

import { useState, useEffect } from "react";
import { 
  collectionGroup, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { useFirebase } from "@/context/FirebaseProvider";
import { Boleta } from "@/types/definitions"; 
import toast from "react-hot-toast"; // <-- ¡CORRECCIÓN AÑADIDA!

export const useUserBoletas = (uid: string | undefined) => {
  const { db } = useFirebase();
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      setBoletas([]);
      return;
    }

    setLoading(true);

    const boletasRef = collectionGroup(db, "boletas");
    
    const q = query(
      boletasRef, 
      where("userId", "==", uid),
      orderBy("fechaCompra", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      const boletasDelUsuario = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Boleta[];
      
      setBoletas(boletasDelUsuario);
      setLoading(false);

    }, (error) => {
      console.error("Error al ejecutar collectionGroup 'boletas':", error);
      // Esta línea ahora funciona
      toast.error("Error al cargar tu historial de boletas."); 
      setLoading(false);
    });

    return () => unsubscribe();

  }, [uid, db]);

  return { boletas, loading };
};