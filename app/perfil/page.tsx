// ==========================================================
// ARCHIVO 19: app/perfil/page.tsx (v7 - Con BoletaCard Profesional)
// ==========================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";
import { UserProfile, NivelPase } from "@/types/definitions"; 
import { Timestamp } from "firebase/firestore";
import { FaCoins, FaGift, FaSignOutAlt, FaTrophy, FaUser, FaTicketAlt, FaHistory, FaChartPie } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection"; 
import { useUserBoletas } from "@/hooks/useUserBoletas";
// ¡NUEVO IMPORT!
import BoletaCard from "@/components/perfil/BoletaCard";

// --- (Componente CountdownTimer v4.4 - SIN CAMBIOS, mantener igual) ---
const CountdownTimer = ({ ultimoReclamo, onReclamar, loading }: { ultimoReclamo: Timestamp | null; onReclamar: () => void; loading: boolean; }) => {
  const [tiempoRestante, setTiempoRestante] = useState("Calculando...");
  const [listoParaReclamar, setListoParaReclamar] = useState(false);
  useEffect(() => {
    if (!ultimoReclamo) { setListoParaReclamar(true); setTiempoRestante("¡Recompensa Lista!"); return; }
    const TIEMPO_ESPERA_MS = 24 * 60 * 60 * 1000;
    const proximoReclamoMs = ultimoReclamo.toMillis() + TIEMPO_ESPERA_MS;
    const interval = setInterval(() => {
      const msRestantes = proximoReclamoMs - new Date().getTime();
      if (msRestantes <= 0) { setListoParaReclamar(true); setTiempoRestante("¡Recompensa Lista!"); clearInterval(interval); }
      else { setListoParaReclamar(false);
        const h = Math.floor(msRestantes / 3600000); const m = Math.floor((msRestantes % 3600000) / 60000); const s = Math.floor((msRestantes % 60000) / 1000);
        setTiempoRestante(`${h}h ${m}m ${s}s`); }
    }, 1000);
    return () => clearInterval(interval);
  }, [ultimoReclamo]);
  return (
    <>
      <p className={`text-3xl font-extrabold mt-2 ${listoParaReclamar ? 'text-zenit-success' : 'text-white'}`}>{tiempoRestante}</p>
      {listoParaReclamar && (
        <button onClick={onReclamar} disabled={loading} className={`mt-4 w-full font-bold py-2 px-4 rounded-lg transition-colors duration-300 bg-zenit-success hover:bg-green-600 text-white ${loading ? 'opacity-50' : ''}`}>
          {loading ? "Reclamando..." : "¡Reclamar Ahora!"}
        </button>
      )}
    </>
  );
};

// --- Componente Principal ---
export default function PerfilPage() {
  const { auth, functions, user, loading: authLoading } = useFirebase(); 
  const { profile, loading: profileLoading } = useUserProfile(user?.uid) as { profile: UserProfile | null, loading: boolean };
  const router = useRouter();
  const [loadingDiaria, setLoadingDiaria] = useState(false);
  const [loadingNivelId, setLoadingNivelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "boletas">("dashboard");

  const { data: nivelesPase, loading: nivelesLoading } = useFirestoreCollection<NivelPase>("paseDeTemporada");
  const { boletas, loading: boletasLoading } = useUserBoletas(user?.uid);

  const { proximoNivel, nivelesParaReclamar } = useMemo(() => {
    if (!profile || !nivelesPase || nivelesPase.length === 0) return { proximoNivel: null, nivelesParaReclamar: [] };
    const sorted = [...nivelesPase].sort((a, b) => a.XP_requerido - b.XP_requerido);
    return {
      proximoNivel: sorted.find(n => n.XP_requerido > profile.paseTemporadaXP),
      nivelesParaReclamar: sorted.filter(n => profile.paseTemporadaXP >= n.XP_requerido && !profile.nivelesReclamados.includes(n.id))
    };
  }, [profile, nivelesPase]);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  const handleLogout = async () => { await signOut(auth); router.push("/"); };
  const handleReclamoDiario = async () => {
    if (!functions) return; setLoadingDiaria(true);
    try { const res = await httpsCallable(functions, "reclamarRecompensaDiaria")();
      if ((res.data as any).success) toast.success((res.data as any).mensaje);
    } catch (e: any) { toast.error(e.message || "Error al reclamar."); }
    setLoadingDiaria(false);
  };
  const handleReclamoNivel = async (nid: string) => {
    if (!functions) return; setLoadingNivelId(nid);
    try { const res = await httpsCallable(functions, "reclamarRecompensaNivel")({ nivelId: nid });
      if ((res.data as any).success) toast.success((res.data as any).mensaje);
    } catch (e: any) { toast.error(e.message); }
    setLoadingNivelId(null);
  };

  if (authLoading || profileLoading || !profile) return <div className="flex h-[60vh] items-center justify-center text-white">Cargando perfil...</div>;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      {/* HEADER (Sin cambios) */}
      <div className="bg-zenit-light p-6 rounded-2xl shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-zenit-primary rounded-full flex items-center justify-center shadow-lg"><FaUser className="w-10 h-10 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">{profile.email}</h1><p className="text-zenit-primary flex items-center gap-2"><FaTrophy /> Nivel {profile.nivelesReclamados?.length || 0}</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right bg-zenit-dark p-3 rounded-xl"><p className="text-xs text-gray-400 uppercase font-bold">Mis Fichas</p><p className="text-3xl font-extrabold text-zenit-accent flex items-center justify-end gap-2">{profile.fichasZenit} <FaCoins className="text-xl" /></p></div>
          <button onClick={handleLogout} className="bg-gray-700 hover:bg-zenit-error p-3 rounded-xl text-white transition-colors" title="Cerrar Sesión"><FaSignOutAlt /></button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex mb-8 border-b border-gray-800">
        <button onClick={() => setActiveTab("dashboard")} className={`px-6 py-4 font-bold flex items-center gap-2 border-b-4 transition-all ${activeTab === "dashboard" ? "border-zenit-primary text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}><FaChartPie /> Mi Progreso</button>
        <button onClick={() => setActiveTab("boletas")} className={`px-6 py-4 font-bold flex items-center gap-2 border-b-4 transition-all ${activeTab === "boletas" ? "border-zenit-primary text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}><FaHistory /> Mis Boletas</button>
      </div>

      {/* CONTENIDO */}
      {activeTab === "dashboard" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* (Contenido del Dashboard - SIN CAMBIOS) */}
          <div className="bg-zenit-light p-6 rounded-xl shadow-lg border-t-4 border-zenit-accent"><div className="flex items-center gap-3 mb-4"><FaGift className="text-zenit-accent w-6 h-6" /><h3 className="font-bold text-white">Recompensa Diaria</h3></div><CountdownTimer ultimoReclamo={profile.ultimoReclamoDiario} onReclamar={handleReclamoDiario} loading={loadingDiaria} /></div>
          <div className="md:col-span-2 bg-zenit-light p-6 rounded-xl shadow-lg border-t-4 border-zenit-primary">
            <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><FaTrophy className="text-zenit-primary w-6 h-6" /><h3 className="font-bold text-white">Pase de Temporada</h3></div><p className="text-2xl font-extrabold text-white">{profile.paseTemporadaXP} <span className="text-sm text-zenit-primary">XP</span></p></div>
            {proximoNivel ? (<div className="mb-6"><div className="flex justify-between text-sm text-gray-400 mb-1"><span>Nivel Actual</span><span>Siguiente: {proximoNivel.nombreNivel}</span></div><div className="w-full bg-zenit-dark rounded-full h-4"><div className="bg-zenit-primary h-4 rounded-full transition-all duration-500 relative" style={{ width: `${(profile.paseTemporadaXP / proximoNivel.XP_requerido) * 100}%` }}></div></div><p className="text-center text-xs font-bold text-gray-500 mt-2">{profile.paseTemporadaXP} / {proximoNivel.XP_requerido} XP</p></div>) : (<div className="bg-zenit-success/20 p-4 rounded-lg text-center mb-6"><p className="text-zenit-success font-bold">¡Máximo Nivel Alcanzado!</p></div>)}
            {nivelesParaReclamar.length > 0 && (<div className="mt-6 bg-zenit-dark p-4 rounded-lg animate-pulse-slow"><p className="text-white font-bold mb-3 flex items-center gap-2"><FaGift className="text-zenit-accent" /> ¡Recompensas disponibles!</p><ul className="space-y-2">{nivelesParaReclamar.map(nivel => (<li key={nivel.id} className="flex justify-between items-center bg-zenit-light p-3 rounded"><span className="text-gray-300">{nivel.nombreNivel}</span><button onClick={() => handleReclamoNivel(nivel.id)} disabled={loadingNivelId === nivel.id} className="bg-zenit-success px-3 py-1 rounded text-sm font-bold text-white hover:bg-green-500 transition">{loadingNivelId === nivel.id ? "..." : `Reclamar ${nivel.recompensa_fichas} Fichas`}</button></li>))}</ul></div>)}
          </div>
        </div>
      ) : (
        // --- TAB 2: MIS BOLETAS (¡PROFESIONALIZADO!) ---
        <div className="bg-zenit-light rounded-2xl shadow-xl overflow-hidden pb-4">
          {boletasLoading ? (
            <div className="p-12 text-center text-gray-500">Cargando historial...</div>
          ) : boletas.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <FaTicketAlt className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Aún no tienes boletas</h3>
              <p className="text-gray-500 mb-6">Participa en nuestros sorteos para verlos aquí.</p>
              <button onClick={() => router.push("/sorteos")} className="bg-zenit-primary px-6 py-3 rounded-lg text-white font-bold hover:bg-violet-600 transition">Ver Sorteos Activos</button>
            </div>
          ) : (
            <div className="py-4">
              <h3 className="text-xl font-bold text-white px-8 mb-4">Historial de Participación</h3>
              <div className="space-y-1">
                {/* Renderizamos las nuevas BoletaCard */}
                {boletas.map((boleta) => (
                  <BoletaCard key={boleta.id} boleta={boleta} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}