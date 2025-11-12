// ==========================================================
// NUEVO ARCHIVO: components/home/CategoryTabs.tsx (v11.0)
// Objetivo: Módulo autocontenido de Pestañas y Scroll Horizontal
// para las categorías de la página de inicio.
// ==========================================================
"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/context/FirebaseProvider";
import { Sorteo } from "@/types/definitions";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { FaTicketAlt, FaArrowRight } from "react-icons/fa";

// --- Definición de Pestañas ---
type CategoriaSlug = "cuentaRegresiva" | "vehiculo" | "hogar" | "tecnologia" | "otros";
const TABS: { nombre: string; slug: CategoriaSlug }[] = [
  { nombre: "En Cierre (72h)", slug: "cuentaRegresiva" },
  { nombre: "Vehículos", slug: "vehiculo" },
  { nombre: "Hogar", slug: "hogar" },
  { nombre: "Tecnología", slug: "tecnologia" },
  { nombre: "Otros", slug: "otros" },
];

// --- Sub-componente: Tarjeta de Sorteo (para el scroll) ---
const CategoriaSorteoCard = ({ sorteo }: { sorteo: Sorteo }) => (
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

// --- Componente Principal: CategoryTabs ---
export default function CategoryTabs() {
  const { db } = useFirebase();
  const [activeTab, setActiveTab] = useState<CategoriaSlug>("cuentaRegresiva");
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const fetchSorteos = async () => {
      setLoading(true);
      setSorteos([]); // Limpiar resultados anteriores
      
      try {
        let q;
        if (activeTab === "cuentaRegresiva") {
          // Consulta para "En Cierre"
          q = query(
            collection(db, "sorteos"),
            where("estado", "==", "cuentaRegresiva"),
            orderBy("horaDeSorteo", "asc"),
            limit(10)
          );
        } else {
          // Consulta para categorías normales
          q = query(
            collection(db, "sorteos"),
            where("categoria", "==", activeTab),
            where("estado", "==", "financiando"),
            orderBy("fechaCreacion", "desc"),
            limit(10)
          );
        }

        const snapshot = await getDocs(q);
        const sorteosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sorteo));
        setSorteos(sorteosData);

      } catch (error: any) {
        console.error(`Error cargando categoría ${activeTab}:`, error.message);
        // ¡LECCIÓN APRENDIDA! No fallar silenciosamente.
        // Si es un error de índice, esto lo mostrará en la consola del navegador del cliente.
      }
      setLoading(false);
    };

    fetchSorteos();
  }, [db, activeTab]); // Se re-ejecuta cada vez que 'db' o 'activeTab' cambian

  return (
    <div className="py-16">
      {/* 1. Las Pestañas (Tabs) */}
      <div className="flex flex-nowrap gap-3 md:gap-4 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {TABS.map(tab => (
          <button
            key={tab.slug}
            onClick={() => setActiveTab(tab.slug)}
            className={`
              flex-shrink-0 px-5 py-3 rounded-full font-bold text-sm md:text-base
              transition-colors duration-300 border
              ${activeTab === tab.slug 
                ? 'bg-zenit-primary text-white border-zenit-primary' 
                : 'bg-zenit-light border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
              }
            `}
          >
            {tab.nombre}
          </button>
        ))}
      </div>

      {/* 2. El Contenido (Scroll Horizontal) */}
      {loading ? (
        <div className="text-center text-gray-500 py-10">Cargando categoría...</div>
      ) : sorteos.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-zenit-dark rounded-2xl border border-gray-800">
          <p className="font-bold text-white text-lg">No hay sorteos en esta categoría</p>
          <p className="text-sm">Revisa más tarde o explora otra categoría.</p>
        </div>
      ) : (
        <div className="flex flex-nowrap gap-6 overflow-x-auto py-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {sorteos.map(sorteo => (
            <CategoriaSorteoCard key={sorteo.id} sorteo={sorteo} />
          ))}
        </div>
      )}
    </div>
  );
}