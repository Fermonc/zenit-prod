// ==========================================================
// ARCHIVO 23: app/sorteos/page.tsx (v9.1 - Tipado Corregido)
// ==========================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Sorteo, UserProfile } from "@/types/definitions"; 
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { FaTicketAlt, FaFilter, FaFire, FaShieldAlt, FaAward, FaClock, FaCoins, FaGift, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";

// --- UI HELPERS (ProgressBar, EstadoTag, TrustBar, SorteoCardPro, HeroBannerPro) ---
// (Mismos que v9, asegúrese de incluirlos todos aquí. Por brevedad en el chat los resumo, 
// PERO EN SU ARCHIVO DEBEN ESTAR COMPLETOS como en el código que me envió)
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
  if (estado === "sorteando") { color = "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"; texto = "🔴 Sorteando Ahora"; }
  return (<span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${color}`}>{texto}</span>);
};
const TrustBar = () => (
  <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-y border-white/10">
    <div className="flex flex-col items-center text-center md:flex-row md:text-left justify-center gap-3"><FaShieldAlt className="text-zenit-success text-2xl md:text-3xl" /><div><h4 className="text-white font-bold">Pagos Seguros</h4><p className="text-gray-400 text-xs hidden md:block">Procesados por Stripe</p></div></div>
    <div className="flex flex-col items-center text-center md:flex-row md:text-left justify-center gap-3 border-x border-white/10"><FaAward className="text-zenit-accent text-2xl md:text-3xl" /><div><h4 className="text-white font-bold">Ganadores Reales</h4><p className="text-gray-400 text-xs hidden md:block">Verificados por Blockchain</p></div></div>
    <div className="flex flex-col items-center text-center md:flex-row md:text-left justify-center gap-3"><FaClock className="text-zenit-primary text-2xl md:text-3xl" /><div><h4 className="text-white font-bold">Sorteos Diarios</h4><p className="text-gray-400 text-xs hidden md:block">Siempre hay una oportunidad</p></div></div>
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
const HeroBannerPro = ({ sorteo }: { sorteo: Sorteo }) => (
  <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 h-[450px] md:h-[500px] group">
    <Image src={sorteo.imagenURL || "/placeholder-sorteo.png"} alt={sorteo.nombre} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-1000" />
    <div className="absolute inset-0 bg-gradient-to-r from-zenit-dark via-zenit-dark/90 to-transparent"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-zenit-dark via-transparent to-transparent"></div>
    <div className="relative z-10 h-full p-8 md:p-16 flex flex-col justify-center md:w-2/3 items-start">
      <div className="mb-6 flex flex-wrap items-center gap-3"><span className="bg-zenit-primary px-4 py-1.5 rounded-full text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-zenit-primary/20"><FaFire /> EVENTO PRINCIPAL</span><EstadoTag estado={sorteo.estado} meta={sorteo.metaRecaudacion} actual={sorteo.recaudacionActual} /></div>
      <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 leading-none drop-shadow-2xl">{sorteo.nombre}</h1>
      <div className="flex flex-col md:flex-row md:items-center gap-6 mt-4">
        <Link href={`/sorteos/${sorteo.id}`} className="bg-white text-zenit-dark hover:bg-zenit-accent font-extrabold py-4 px-12 rounded-xl text-xl transition-all transform hover:scale-105 flex items-center gap-3 shadow-xl active:scale-95"><FaTicketAlt /> PARTICIPAR</Link>
        <div><p className="text-sm text-gray-400 uppercase font-bold mb-1">Premio Mayor</p><p className="text-5xl font-extrabold text-white tracking-tighter">${sorteo.valorPremio.toLocaleString('es-CO')}</p></div>
      </div>
    </div>
  </div>
);

const TokenPromoBanner = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  if (!user) {
    return (
      <div className="bg-gradient-to-r from-zenit-primary to-violet-900 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-zenit-primary/20">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="bg-white/20 p-3 rounded-full"><FaGift className="text-white w-8 h-8" /></div>
          <div><h3 className="text-2xl font-bold text-white">¿Nuevo en Zenit?</h3><p className="text-violet-100">Regístrate ahora y recibe <span className="font-extrabold text-white bg-white/20 px-2 rounded">5 Fichas GRATIS</span> para tu primer sorteo.</p></div>
        </div>
        <Link href="/login" className="bg-white text-zenit-primary font-bold py-3 px-8 rounded-xl hover:bg-violet-50 transition flex items-center gap-2 whitespace-nowrap">Reclamar Regalo <FaArrowRight /></Link>
      </div>
    );
  }
  if (profile && profile.fichasZenit < 20) {
    return (
      <div className="bg-gradient-to-r from-zenit-accent/10 to-orange-900/30 border border-zenit-accent/30 rounded-2xl p-4 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3"><FaCoins className="text-zenit-accent w-6 h-6 flex-shrink-0" /><p className="text-gray-200"><span className="font-bold text-white">Saldo bajo:</span> Solo te quedan {profile.fichasZenit} fichas. ¡Recarga para no perderte estos sorteos!</p></div>
        <Link href="/tienda" className="bg-zenit-accent hover:bg-yellow-500 text-zenit-dark font-bold py-2 px-6 rounded-lg transition whitespace-nowrap flex-shrink-0">Recargar Fichas</Link>
      </div>
    );
  }
  return null;
};

// --- PÁGINA PRINCIPAL V9.1 (CORREGIDA) ---
export default function SorteosPage() {
  const { db, user } = useFirebase();
  
  // ==========================================================
  // INICIO DE LA CORRECCIÓN (Líneas 150-152 aprox)
  // ==========================================================
  const userProfileHook = useUserProfile(user?.uid);
  // Hacemos un casting seguro. Si está cargando o no hay usuario, será null.
  const profile = (userProfileHook.profile as UserProfile) || null;
  // ==========================================================
  // FIN DE LA CORRECCIÓN
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [granZenit, setGranZenit] = useState<Sorteo | null>(null);
  const [todosLosSorteos, setTodosLosSorteos] = useState<Sorteo[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const qHero = query(collection(db, "sorteos"), where("esEventoPrincipal", "==", true), limit(1));
        const heroSnap = await getDocs(qHero);
        if (!heroSnap.empty) setGranZenit({ id: heroSnap.docs[0].id, ...heroSnap.docs[0].data() } as Sorteo);
        const qAll = query(collection(db, "sorteos"), where("esEventoPrincipal", "==", false), orderBy("fechaCreacion", "desc"));
        const allSnap = await getDocs(qAll);
        setTodosLosSorteos(allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sorteo)));
      } catch (e) { console.error(e); toast.error("Error cargando sorteos."); }
      setLoading(false);
    };
    fetchData();
  }, [db]);

  const categorias = useMemo(() => {
    const cats = new Set(todosLosSorteos.map(s => s.categoria || "Otros"));
    return ["Todos", ...Array.from(cats)];
  }, [todosLosSorteos]);

  const sorteosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === "Todos") return todosLosSorteos;
    return todosLosSorteos.filter(s => (s.categoria || "Otros") === categoriaSeleccionada);
  }, [todosLosSorteos, categoriaSeleccionada]);

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-white">Cargando experiencia...</div>;

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4">
      {granZenit && <HeroBannerPro sorteo={granZenit} />}
      
      <TrustBar />

      {!loading && <TokenPromoBanner user={user} profile={profile} />}

      <div className="sticky top-0 bg-zenit-dark/90 backdrop-blur-lg z-20 py-4 mb-8 -mx-4 px-4 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-white/5">
        <FaFilter className="text-zenit-primary flex-shrink-0" />
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoriaSeleccionada(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${categoriaSeleccionada === cat ? "bg-zenit-primary text-white shadow-lg shadow-zenit-primary/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-transparent hover:border-gray-600"}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sorteosFiltrados.map(sorteo => (<SorteoCardPro key={sorteo.id} sorteo={sorteo} />))}
      </div>

      {sorteosFiltrados.length === 0 && !loading && (
        <div className="text-center py-20 bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-700">
          <p className="text-gray-400 text-lg font-medium">No hay sorteos en esta categoría por ahora.</p>
          <button onClick={() => setCategoriaSeleccionada("Todos")} className="mt-4 text-zenit-primary hover:underline">Ver todos los sorteos</button>
        </div>
      )}
    </div>
  );
}