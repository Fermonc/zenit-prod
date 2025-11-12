// ==========================================================
// ARCHIVO 17: app/page.tsx (v12.0 - ESTRUCTURA FINAL Y ESTABLE)
// FUSIÓN DE LÓGICA DE CATEGORÍAS (De sorteos/page.tsx)
// ==========================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Sorteo, UserProfile } from "@/types/definitions"; 
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { FaTicketAlt, FaFilter, FaFire, FaShieldAlt, FaAward, FaClock, FaCoins, FaArrowRight, FaGift } from "react-icons/fa";
import toast from "react-hot-toast";
import WelcomePopup from "@/components/marketing/WelcomePopup"; 

// --- Imports de Componentes UI ---
import AppHero from "@/components/home/AppHero";
// Reutilizaremos SorteoCardPro de /sorteos/page.tsx
// NOTA: Debes asegurarte de que SorteoCardPro esté disponible en components/sorteos/SorteoCardPro.tsx 
// (ya que no la teníamos en page.tsx antes). Por seguridad, la redefino aquí.


// --- (Componentes UI: ProgressBar, EstadoTag, TrustBar, SorteoCardPro, TokenPromoBanner) ---
// NOTA: Todos estos auxiliares deben estar DEFINIDOS en este archivo.
const ProgressBar = ({ actual, meta }: { actual: number, meta: number }) => {
  const porcentaje = meta > 0 ? Math.min((actual / meta) * 100, 100) : 0;
  const colorBarra = porcentaje > 80 ? "from-orange-500 to-red-500" : "from-zenit-primary to-zenit-accent";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1 font-medium">
        <span>Vendidas</span><span className={porcentaje > 80 ? "text-red-400 font-bold" : ""}>{porcentaje > 95 ? "¡Últimas boletas!" : `${Math.round(porcentaje)}%`}</span>
      </div>
      <div className="w-full bg-gray-900/50 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${colorBarra} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${porcentaje}%` }}></div>
      </div>
    </div>
  );
};
const EstadoTag = ({ estado, meta, actual }: { estado: Sorteo['estado'], meta?: number, actual?: number }) => {
  const porcentaje = meta && meta > 0 && actual !== undefined ? (actual / meta) * 100 : 0;
  if (estado === "financiando" && porcentaje >= 90) return <span className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md bg-red-500/20 text-red-200 border-red-500/50 animate-pulse">🔥 Casi Agotado</span>;
  let color = "bg-gray-700 text-gray-300"; let texto = "Finalizado";
  if (estado === "financiando") { color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"; texto = "🎟️ Entradas Disponibles"; }
  if (estado === "cuentaRegresiva") { color = "bg-blue-500/20 text-blue-300 border-blue-500/50"; texto = "⏳ Cierre Confirmado"; }
  return (<span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${color}`}>{texto}</span>);
};
const TrustBar = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 my-12 border-y border-white/10">
    <div className="flex items-center justify-center gap-3"><FaShieldAlt className="text-zenit-success text-3xl" /><div><h4 className="text-white font-bold text-lg">Pagos Seguros</h4><p className="text-gray-400 text-sm">Procesados 100% por Stripe</p></div></div>
    <div className="flex items-center justify-center gap-3 md:border-x border-white/10 px-6"><FaAward className="text-zenit-accent text-3xl" /><div><h4 className="text-white font-bold text-lg">Ganadores Reales</h4><p className="text-gray-400 text-sm">Sorteos públicos y verificados</p></div></div>
    <div className="flex items-center justify-center gap-3"><FaGift className="text-zenit-primary text-3xl" /><div><h4 className="text-white font-bold text-lg">Premios Garantizados</h4><p className="text-gray-400 text-sm">Entrega asegurada al ganador</p></div></div>
  </div>
);
const SorteoCardPro = ({ sorteo }: { sorteo: Sorteo }) => (
  <Link href={`/sorteos/${sorteo.id}`} className="block group h-full">
    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col border border-gray-700/50 hover:border-zenit-primary/50">
      <div className="relative h-56 w-full flex-shrink-0">
        <Image src={sorteo.imagenURL || "/placeholder-sorteo.png"} alt={sorteo.nombre} layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
        <div className="absolute top-3 left-3"><EstadoTag estado={sorteo.estado} meta={sorteo.metaRecaudacion} actual={sorteo.recaudacionActual} /></div>
        <div className="absolute bottom-4 left-4 right-4"><h3 className="text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md">{sorteo.nombre}</h3></div>
      </div>
      <div className="p-5 flex flex-col flex-grow bg-gray-800/50">
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-3">
            <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Valor del Premio</p><p className="text-2xl font-extrabold text-white tracking-tight">${sorteo.valorPremio.toLocaleString('es-CO')}</p></div>
            <div className="text-right bg-zenit-dark/50 p-2 rounded-lg border border-white/5"><p className="text-[10px] text-gray-400 uppercase font-bold">Entrada</p><div className="flex items-center justify-end gap-1 text-zenit-primary font-bold"><FaTicketAlt className="text-sm" /> {sorteo.precioBoleta}</div></div>
          </div>
          {sorteo.estado === 'financiando' && (<ProgressBar actual={sorteo.recaudacionActual} meta={sorteo.metaRecaudacion} />)}
        </div>
      </div>
    </div>
  </Link>
);
const TokenPromoBanner = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  if (!user) { return <div>...</div> }
  if (profile && profile.fichasZenit < 20) { return <div>...</div> }
  return null;
};
// --- (Fin de componentes auxiliares) ---


// --- PÁGINA PRINCIPAL V12.0 (CSR "Estética App" Final) ---
export default function HomePage() {
  const { db, user } = useFirebase();
  const userProfileHook = useUserProfile(user?.uid);
  const profile = (userProfileHook.profile as UserProfile) || null;
  
  const [loading, setLoading] = useState(true); 
  const [granZenit, setGranZenit] = useState<Sorteo | null>(null);

  // --- LÓGICA DE CATEGORÍAS ESTABLE (COPIADA DE /sorteos/page.tsx) ---
  const [todosLosSorteos, setTodosLosSorteos] = useState<Sorteo[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("En Sorteo"); // Valor inicial

  useEffect(() => {
    if (!db) return; 
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carga el Hero (sin cambios)
        const qHero = query(collection(db, "sorteos"), where("esEventoPrincipal", "==", true), limit(1));
        const heroSnap = await getDocs(qHero);
        if (!heroSnap.empty) setGranZenit({ id: heroSnap.docs[0].id, ...heroSnap.docs[0].data() } as Sorteo);
        
        // Carga TODOS los sorteos no principales (v9.0) - SÓLO POR FECHA, EL FILTRADO ES EN EL CLIENTE.
        // Esto es lo que evita el error de índice.
        const qAll = query(collection(db, "sorteos"), where("esEventoPrincipal", "==", false), orderBy("fechaCreacion", "desc"));
        const allSnap = await getDocs(qAll);
        setTodosLosSorteos(allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sorteo)));
      
      } catch (e) { console.error(e); toast.error("Error cargando sorteos destacados."); }
      setLoading(false);
    };
    fetchData();
  }, [db]);

  // CATEGORÍAS Y FILTRADO (COPIADO DE /sorteos/page.tsx)
  const categorias = useMemo(() => {
    // Las categorías estáticas para la página principal
    return ["En Sorteo", "Vehículos", "Hogar", "Tecnología", "Otros"];
  }, []);

  const sorteosFiltrados = useMemo(() => {
    // Si la categoría es "En Sorteo", filtramos por el estado 'cuentaRegresiva'
    if (categoriaSeleccionada === "En Sorteo") {
        return todosLosSorteos.filter(s => s.estado === 'cuentaRegresiva').slice(0, 5); // Limitar a 5 para el scroll
    } 
    // Si es otra categoría, filtramos por el campo 'categoria'
    return todosLosSorteos.filter(s => (s.categoria || "Otros") === categoriaSeleccionada && s.estado === 'financiando').slice(0, 5); // Limitar a 5 para el scroll
  }, [todosLosSorteos, categoriaSeleccionada]);

  // --- FIN DE LÓGICA ESTABLE ---

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-white">Cargando experiencia...</div>;

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4">
      <WelcomePopup />

      {/* SECCIÓN 1: HÉROE (v9.0 - AppHero) */}
      <div className="container mx-auto max-w-7xl px-4">
        {granZenit && <AppHero sorteo={granZenit} />}
      </div>

      {/* SECCIÓN 2: TRUST BAR (MOVIMIENTO ESTRATÉGICO) */}
      <div className="container mx-auto max-w-7xl px-4 text-center relative z-10">
        <TrustBar />
      </div>

      {/* ========================================================== */}
      {/* SECCIÓN 3: CATEGORÍAS Y SCROLL HORIZONTAL (v12.0) */}
      {/* Implementado en lugar del componente CategoryTabs que fallaba. */}
      {/* ========================================================== */}
      <div className="py-16">
        {/* Pestañas */}
        <div className="flex flex-nowrap gap-3 md:gap-4 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <FaFilter className="text-zenit-primary flex-shrink-0 mt-3 hidden md:block" />
          {categorias.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategoriaSeleccionada(cat)} 
              className={`
                flex-shrink-0 px-5 py-3 rounded-full font-bold text-sm md:text-base
                transition-colors duration-300 border
                ${categoriaSeleccionada === cat 
                  ? 'bg-zenit-primary text-white border-zenit-primary' 
                  : 'bg-zenit-light border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scroll Horizontal de Sorteos */}
        {sorteosFiltrados.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-zenit-dark rounded-2xl border border-gray-800 mx-4">
            <p className="font-bold text-white text-lg">No hay sorteos disponibles en esta categoría</p>
            <p className="text-sm">Explora otra categoría o visita la página de sorteos.</p>
          </div>
        ) : (
          <div className="
            flex flex-nowrap gap-6 
            overflow-x-auto py-4 
            scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent
            snap-x snap-mandatory -mx-4 px-4
          ">
            {sorteosFiltrados.map(sorteo => (
              // Usaremos el SorteoCardPro que ya está definido arriba
              <div key={sorteo.id} className="w-64 md:w-72 flex-shrink-0 snap-start">
                <SorteoCardPro sorteo={sorteo} /> 
              </div>
            ))}
            
            {/* Tarjeta final para ver más */}
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
        )}
      </div>

      {/* BANNER DE UPSELL (CLIENTE) */}
      <div className="container mx-auto max-w-7xl px-4">
        {!userProfileHook.loading && <TokenPromoBanner user={user} profile={profile} />}
      </div>
      
      {/* Espaciador inferior */}
      <div className="h-24"></div> 
    </div>
  );
}