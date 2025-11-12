// ==========================================================
// NUEVO ARCHIVO: components/home/AppHero.tsx
// Objetivo: El "Hero" principal (BYD Seagull) con estética de "App".
// Reemplaza el banner "full-bleed" de la página web.
// ==========================================================
"use client";

import { Sorteo } from "@/types/definitions";
import Image from "next/image";
import Link from "next/link";
import { FaTicketAlt, FaCoins, FaInfoCircle } from "react-icons/fa";

type Props = {
  sorteo: Sorteo; // Recibe el sorteo "granZenit"
};

// Componente "Stat" para los "items inferiores"
const HeroStat = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="text-zenit-primary" />
      <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

export default function AppHero({ sorteo }: Props) {
  return (
    <div className="relative bg-gradient-to-b from-zenit-light to-zenit-dark rounded-3xl border border-gray-800 shadow-2xl p-6 md:p-8 lg:p-12 overflow-hidden my-12">
      
      {/* Efecto de Brillo (Estilo App) */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial from-zenit-primary/10 via-transparent to-transparent animate-spin-slow"></div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* --- LADO DE LA IMAGEN (El "Auto") --- */}
        <div className="w-full h-64 md:h-96 relative rounded-2xl overflow-hidden shadow-lg border border-gray-800">
          <Image
            src={sorteo.imagenURL || "/placeholder-sorteo.png"}
            alt={sorteo.nombre}
            layout="fill"
            objectFit="cover"
            priority
            className="transform transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <span className="absolute top-4 left-4 bg-zenit-primary px-3 py-1 rounded-full text-white font-bold text-sm shadow-lg">
            Sorteo Principal
          </span>
        </div>

        {/* --- LADO DEL TEXTO (Los "Detalles") --- */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {sorteo.nombre}
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            {sorteo.detalles || `No te pierdas la oportunidad de ganar este increíble premio.`}
          </p>

          {/* Los "Items Inferiores" (Estilo App) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <HeroStat 
              icon={FaInfoCircle} 
              label="Valor" 
              value={`$${sorteo.valorPremio.toLocaleString('es-CO')}`} 
            />
            <HeroStat 
              icon={FaCoins} 
              label="Precio Boleta" 
              value={`${sorteo.precioBoleta} Fichas`} 
            />
            <HeroStat 
              icon={FaTicketAlt} 
              label="Meta" 
              value={`${sorteo.metaRecaudacion} Boletas`} 
            />
          </div>

          {/* Botones de Acción (Estilo App) */}
          <div className="flex items-center gap-4">
            <Link 
              href={`/sorteos/${sorteo.id}`} 
              className="flex-1 bg-zenit-primary hover:bg-violet-600 text-white font-extrabold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-zenit-primary/30 text-center"
            >
              Participar Ahora
            </Link>
            <Link 
              href={`/sorteos/${sorteo.id}`} 
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 px-8 rounded-xl text-lg transition-colors border border-gray-700 text-center"
            >
              Ver Detalles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}