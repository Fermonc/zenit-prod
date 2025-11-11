// ==========================================================
// ARCHIVO 35 (NUEVO): components/perfil/BoletaCard.tsx
// (Tarjeta inteligente que busca los datos de su sorteo)
// ==========================================================
"use client";

import Link from "next/link";
import Image from "next/image";
import { Boleta, Sorteo } from "@/types/definitions";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { FaTicketAlt, FaClock, FaCheckCircle, FaArrowRight } from "react-icons/fa";

export default function BoletaCard({ boleta }: { boleta: Boleta }) {
  // Cada tarjeta carga sus propios datos del sorteo en tiempo real
  const { document: sorteo, loading } = useFirestoreDoc<Sorteo>("sorteos", boleta.sorteoId);

  if (loading) {
    // Skeleton loader mientras carga
    return <div className="h-24 bg-gray-800 rounded-xl animate-pulse mx-4 my-2"></div>;
  }

  if (!sorteo) {
    // Caso raro: Sorteo eliminado
    return (
      <div className="p-4 bg-red-900/20 text-red-400 rounded-xl mx-4 my-2 border border-red-900/50 flex items-center gap-3">
        <FaTicketAlt /> <span>Boleta #{boleta.numero} (Sorteo no encontrado)</span>
      </div>
    );
  }

  const isActivo = sorteo.estado === "financiando" || sorteo.estado === "cuentaRegresiva";
  const isGanador = sorteo.ganadorNumeroBoleta === boleta.numero;

  return (
    <div className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group
      ${isGanador ? "bg-zenit-accent/20 border-2 border-zenit-accent" : "bg-gray-800 hover:bg-gray-750"}
      mx-4 my-3
    `}>
      
      <div className="flex">
        {/* --- IMAGEN DEL SORTEO (Izquierda) --- */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={sorteo.imagenURL || "/placeholder-sorteo.png"}
            alt={sorteo.nombre}
            layout="fill"
            objectFit="cover"
            className="opacity-80 group-hover:opacity-100 transition-opacity"
          />
           {/* Tag de Estado sobre la imagen */}
           <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-center py-1 text-white backdrop-blur-sm">
            {sorteo.estado.toUpperCase()}
           </div>
        </div>

        {/* --- DETALLES DE LA BOLETA (Centro) --- */}
        <div className="flex-grow p-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-lg line-clamp-1">{sorteo.nombre}</h4>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <FaClock className="text-xs" />
              Comprada el {new Date(boleta.fechaCompra.toMillis()).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            {isActivo ? (
              <span className="text-xs flex items-center gap-1 text-zenit-success bg-zenit-success/10 px-2 py-1 rounded-full">
                <FaCheckCircle /> En Juego
              </span>
            ) : isGanador ? (
              <span className="text-sm font-bold flex items-center gap-1 text-zenit-dark bg-zenit-accent px-3 py-1 rounded-full animate-pulse">
                🏆 ¡BOLETA GANADORA!
              </span>
            ) : (
              <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-full">
                Sorteo Finalizado
              </span>
            )}
          </div>
        </div>

        {/* --- NÚMERO DE BOLETA (Derecha) --- */}
        <div className="w-24 bg-zenit-dark flex flex-col items-center justify-center border-l border-gray-700 p-2">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Tu Número</p>
          <p className="text-3xl font-extrabold text-zenit-primary">{boleta.numero}</p>
        </div>
      </div>

      {/* Enlace invisible que cubre toda la tarjeta para ir al sorteo */}
      <Link href={`/sorteos/${sorteo.id}`} className="absolute inset-0 z-10" aria-label={`Ver sorteo ${sorteo.nombre}`} />
    </div>
  );
}