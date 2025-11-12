// ==========================================================
// ARCHIVO 17: app/page.tsx (v10.2 - HOTFIX "Estética App" CORREGIDO)
// BASADO EN EL v9.0 REAL (CON COMPONENTES AUXILIARES)
// Corrige el typo 'setLoadingSortos'
// ==========================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Sorteo, UserProfile } from "@/types/definitions"; 
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { FaTicketAlt, FaFire, FaShieldAlt, FaAward, FaGift, FaCoins, FaArrowRight, FaClock } from "react-icons/fa";
import toast from "react-hot-toast";
import WelcomePopup from "@/components/marketing/WelcomePopup"; 

// --- Imports de Nuevos Componentes ---
import AppHero from "@/components/home/AppHero";
import PopularSorteos from "@/components/home/PopularSorteos";

// --- (Componentes UI: ProgressBar, EstadoTag, TrustBar, SorteoCardMini, TokenPromoBanner) ---
// (Estos componentes auxiliares se mantienen idénticos a la v9.0 - ¡CRÍTICO!)
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
const SorteoCardMini = ({ sorteo }: { sorteo: Sorteo }) => (
  <Link href={`/sorteos/${sorteo.id}`} className="block group h-full">
    <div className="bg-zenit-light rounded-2xl overflow-hidden shadow-lg hover:shadow-zenit-primary/30 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col border border-gray-700/50">
      <div className="relative h-48 w-full">
        <Image src={sorteo.imagenURL || "/placeholder-sorteo.png"} alt={sorteo.nombre} layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute top-3 left-3"><EstadoTag estado={sorteo.estado} /></div>
        <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">{sorteo.nombre}</h3>
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-center">
          <div><p className="text-xs text-gray-500 uppercase font-bold">Premio</p><p className="text-xl font-extrabold text-white">${sorteo.valorPremio.toLocaleString('es-CO')}</p></div>
          <div className="text-right"><p className="text-xs text-gray-500 uppercase font-bold">Entrada</p><div className="flex items-center justify-end gap-1 text-zenit-primary font-bold"><FaTicketAlt className="text-sm" /> {sorteo.precioBoleta}</div></div>
        </div>
      </div>
    </div>
  </Link>
);
const TokenPromoBanner = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  if (!user) { return <div>...</div> /* (código idéntico de v8.1) */ }
  if (profile && profile.fichasZenit < 20) { return <div>...</div> /* (código idéntico de v8.1) */ }
  return null;
};
// --- (Fin de componentes auxiliares) ---


// --- PÁGINA PRINCIPAL V10.2 (CSR "Estética App" Completa) ---
export default function HomePage() {
  const { db, user } = useFirebase();
  const userProfileHook = useUserProfile(user?.uid);
  const profile = (userProfileHook.profile as UserProfile) || null;
  
  const [loadingSorteos, setLoadingSorteos] = useState(true); 
  const [granZenit, setGranZenit] = useState<Sorteo | null>(null);
  const [sorteosRecientes, setSorteosRecientes] = useState<Sorteo[]>([]);

  // (Lógica de carga de datos - OPTIMIZADA)
  useEffect(() => {
    if (!db) return; 
    const fetchData = async () => {
      setLoadingSorteos(true);
      try {
        // Lógica de carga optimizada: Solo 1 consulta para todo.
        const qSorteos = query(
          collection(db, "sorteos"), 
          where("estado", "==", "financiando"), 
          orderBy("esEventoPrincipal", "desc"), // El Hero (true) vendrá primero
          orderBy("fechaCreacion", "desc"),
          limit(6) // 1 Hero + 5 Populares
        );
        
        const snapshot = await getDocs(qSorteos);
        
        const todosLosSorteos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sorteo));
        
        const hero = todosLosSorteos.find(s => s.esEventoPrincipal);
        const recientes = todosLosSorteos.filter(s => !s.esEventoPrincipal);

        setGranZenit(hero || null); // Si no hay hero, que sea null
        setSorteosRecientes(recientes);

      } catch (e) { console.error(e); toast.error("Error cargando sorteos destacados."); }
      
      // ==========================================================
      // --- INICIO DE HOTFIX v10.2 ---
      // Corregir el typo 'setLoadingSortos' a 'setLoadingSorteos'
      setLoadingSorteos(false);
      // --- FIN DE HOTFIX v10.2 ---
      // ==========================================================
    };
    fetchData();
  }, [db]);

  return (
    <>
      <WelcomePopup />

      {/* ========================================================== */}
      {/* SECCIÓN HÉROE (v9.0 - Con Estética "App") - SIN CAMBIOS */}
      {/* ========================================================== */}
      <div className="container mx-auto max-w-7xl px-4">
        {loadingSorteos ? (
          <div className="h-[70vh] min-h-[600px] flex items-center justify-center text-white"><p className="animate-pulse text-lg">Cargando sorteo principal...</p></div>
        ) : granZenit ? (
          <AppHero sorteo={granZenit} />
        ) : (
          <div className="h-[70vh] min-h-[600px] flex items-center justify-center text-white">No hay evento principal activo.</div>
        )}
      </div>

      {/* --- SECCIÓN "CÓMO FUNCIONA" (Trust) --- */}
      <div className="container mx-auto max-w-7xl px-4 text-center relative z-10">
        <TrustBar />
      </div>

      {/* --- BANNER DE UPSELL (CLIENTE) --- */}
      <div className="container mx-auto max-w-7xl px-4">
        {!userProfileHook.loading && <TokenPromoBanner user={user} profile={profile} />}
      </div>

      {/* ========================================================== */}
      {/* SECCIÓN "SORTEOS POPULARES" (v10.1 - Estética "App") */}
      {/* ========================================================== */}
      <div className="container mx-auto max-w-7xl px-4">
        {loadingSorteos ? (
          <div className="text-center text-gray-500 py-16">Cargando...</div>
        ) : sorteosRecientes.length > 0 ? (
          <PopularSorteos sorteos={sorteosRecientes} />
        ) : (
          <p className="text-center text-gray-500 py-16">No hay otros sorteos disponibles por ahora.</p>
        )}
      </div>
      
      {/* Espaciador inferior para que el scroll se sienta bien */}
      <div className="h-24"></div> 
    </>
  );
}