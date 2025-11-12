// ==========================================================
// NUEVO ARCHIVO: components/home/PopularSorteos.tsx
// Objetivo: La fila de "Sorteos Populares" (Auriculares)
// con scroll horizontal (Estética "App").
// ==========================================================
"use client";

import { Sorteo } from "@/types/definitions";
import Image from "next/image";
import Link from "next/link";
import { FaTicketAlt, FaArrowRight } from "react-icons/fa";

// --- Sub-componente: La "Tarjeta" individual ---
// (Diseñada para ser vertical y angosta, ideal para scroll horizontal)
const PopularSorteoCard = ({ sorteo }: { sorteo: Sorteo }) => (
  <Link
    href={`/sorteos/${sorteo.id}`}
    className="
      block w-64 md:w-72 flex-shrink-0 snap-start
      group rounded-2xl bg-zenit-light border border-gray-800 
      shadow-lg hover:shadow-zenit-primary/30 transition-all duration-300 
      hover:-translate-y-1 overflow-hidden
    "
  >
    <div className="relative h-48 w-full">
      <Image
        src={sorteo.imagenURL || "/placeholder-sorteo.png"}
        alt={sorteo.nombre}
        layout="fill"
        objectFit="cover"
        className="group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
    </div>
    <div className="p-5">
      <h3 className="text-lg font-bold text-white leading-tight truncate">
        {sorteo.nombre}
      </h3>
      <p className="text-sm text-gray-400 mt-1">
        Valor: ${sorteo.valorPremio.toLocaleString('es-CO')}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center justify-end gap-1 text-zenit-accent font-bold text-lg">
          <FaTicketAlt className="text-sm" /> {sorteo.precioBoleta}
          <span className="text-xs text-gray-500 ml-1">Fichas</span>
        </div>
        <span className="text-xs text-gray-500 group-hover:text-zenit-primary transition-colors flex items-center gap-1">
          Ver <FaArrowRight className="transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);


// --- Componente Principal: El "Contenedor" de Scroll ---
type Props = {
  sorteos: Sorteo[]; // Recibe los "sorteosRecientes"
};

export default function PopularSorteos({ sorteos }: Props) {
  return (
    <div className="py-16">
      
      {/* Cabecera de la Sección */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          Sorteos Populares
        </h2>
        <Link 
          href="/sorteos"
          className="text-sm font-bold text-zenit-primary hover:text-zenit-accent transition-colors flex items-center gap-2"
        >
          Ver Todos
          <FaArrowRight />
        </Link>
      </div>

      {/* Fila de Scroll Horizontal (Estilo "App") */}
      <div className="
        flex flex-nowrap gap-6 
        overflow-x-auto py-4 
        scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent
        -mx-4 px-4 
        snap-x snap-mandatory
      ">
        {sorteos.map(sorteo => (
          <PopularSorteoCard key={sorteo.id} sorteo={sorteo} />
        ))}

        {/* "Tarjeta" final para ver más */}
        <Link 
          href="/sorteos"
          className="
            block w-64 md:w-72 flex-shrink-0 snap-start
            group rounded-2xl bg-zenit-dark border-2 border-dashed border-gray-700 
            hover:border-zenit-primary transition-all duration-300 
            flex flex-col items-center justify-center text-gray-500 hover:text-white
          "
        >
          <FaArrowRight className="w-10 h-10 mb-4 transform transition-transform group-hover:scale-125" />
          <span className="font-bold text-lg">Ver Todos los Sorteos</span>
          <p className="text-sm">¡Y mucho más!</p>
        </Link>
      </div>
    </div>
  );
}