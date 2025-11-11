// ==========================================================
// ARCHIVO 20: app/tienda/page.tsx (Refactorizado)
// ==========================================================
"use client";

import { useState } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection"; 
import { CheckoutForm } from "@/components/tienda/CheckoutForm"; 
import { FaCoins } from "react-icons/fa";
import { PaqueteZenit } from "@/types/definitions"; // <-- CAMBIO CLAVE

export default function TiendaPage() {
  const { data: paquetes, loading } = useFirestoreCollection<PaqueteZenit>("paquetesZenit");
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<PaqueteZenit | null>(null);

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[60vh] text-white">Cargando paquetes...</div>);
  }

  if (paqueteSeleccionado) {
    return (
      <CheckoutForm 
        paquete={paqueteSeleccionado}
        onCancel={() => setPaqueteSeleccionado(null)}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-12">
      <h2 className="text-4xl font-bold text-center text-white mb-4">Tienda de Fichas</h2>
      <p className="text-xl text-center text-gray-400 mb-12">Recarga tu saldo para participar en más sorteos.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {paquetes.map((paquete) => (
          <div key={paquete.id} className="bg-zenit-light rounded-lg shadow-xl p-8 flex flex-col items-center transform transition-transform duration-300 hover:scale-105">
            <FaCoins className="text-zenit-accent w-16 h-16 mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">{paquete.nombre}</h3>
            <p className="text-5xl font-extrabold text-zenit-primary my-4">{paquete.fichasZenit}</p>
            <p className="text-lg text-gray-400 mb-6">Fichas Zenit</p>
            <button
              onClick={() => setPaqueteSeleccionado(paquete)}
              className="mt-auto w-full bg-zenit-primary hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Comprar por ${paquete.precioMonedaReal.toFixed(2)}
            </button> 
          </div>
        ))}
      </div>
    </div>
  );
}