// ==========================================================
// ARCHIVO 24: app/recompensas/page.tsx (Versión "Battle Pass" v3)
// ==========================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserProfile, NivelPase } from "@/types/definitions";
import { Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { FaGift, FaTrophy, FaCalendarCheck, FaCoins, FaLock, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

// --- (Componente CountdownTimer v4.4 - SIN CAMBIOS) ---
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
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4 bg-zenit-dark p-4 rounded-lg">
        <span className="text-gray-400">Próximo reclamo en:</span>
        <span className={`font-mono text-xl font-bold ${listoParaReclamar ? 'text-zenit-success' : 'text-white'}`}>{tiempoRestante}</span>
      </div>
      {listoParaReclamar ? (
        <button onClick={onReclamar} disabled={loading} className="w-full bg-zenit-success hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-300 text-lg flex items-center justify-center gap-2">
          <FaGift className="animate-bounce" /> {loading ? "Reclamando..." : "¡Reclamar Recompensa Diaria!"}
        </button>
      ) : (
        <button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-4 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"><FaCalendarCheck /> Recompensa ya reclamada hoy</button>
      )}
    </div>
  );
};

export default function RecompensasPage() {
  const { functions, user, loading: authLoading } = useFirebase();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid) as { profile: UserProfile | null, loading: boolean };
  const router = useRouter();
  const [loadingDiaria, setLoadingDiaria] = useState(false);
  const [loadingNivelId, setLoadingNivelId] = useState<string | null>(null);
  const { data: nivelesPase, loading: nivelesLoading } = useFirestoreCollection<NivelPase>("paseDeTemporada");

  const nivelesOrdenados = useMemo(() => {
    if (!nivelesPase) return [];
    return [...nivelesPase].sort((a, b) => a.XP_requerido - b.XP_requerido);
  }, [nivelesPase]);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

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

  if (authLoading || profileLoading || !profile) return <div className="flex h-[60vh] items-center justify-center text-white">Cargando recompensas...</div>;

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Centro de Recompensas</h1>
        <p className="text-xl text-gray-400">Tu lealtad tiene premio. Sube de nivel y desbloquea beneficios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-1 space-y-8">
          {/* Recompensa Diaria */}
          <div className="bg-zenit-light p-8 rounded-2xl shadow-2xl border-t-4 border-zenit-accent sticky top-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-zenit-accent/20 p-4 rounded-full"><FaCalendarCheck className="text-zenit-accent w-8 h-8" /></div>
              <div><h2 className="text-2xl font-bold text-white">Login Diario</h2><p className="text-zenit-accent font-bold">+2 Fichas | +10 XP</p></div>
            </div>
            <CountdownTimer ultimoReclamo={profile.ultimoReclamoDiario} onReclamar={handleReclamoDiario} loading={loadingDiaria} />
          </div>

          {/* Info Card: Cómo ganar XP (NUEVO) */}
          <div className="bg-zenit-dark p-6 rounded-2xl border border-gray-700 sticky top-[400px]">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4"><FaInfoCircle className="text-zenit-primary" /> ¿Cómo ganar XP?</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex justify-between"><span>• Login Diario:</span> <span className="font-bold text-white">+10 XP / día</span></li>
              <li className="flex justify-between"><span>• Comprar Boleta:</span> <span className="font-bold text-white">XP variable</span></li>
              {/* (Nota: En realidad aún no damos XP por comprar boleta en la Cloud Function #5, deberíamos añadirlo luego) */}
            </ul>
          </div>
        </div>

        {/* COLUMNA DERECHA: PASE DE TEMPORADA COMPLETO (NUEVO) */}
        <div className="lg:col-span-2">
          <div className="bg-zenit-light p-8 rounded-2xl shadow-xl border-t-4 border-zenit-primary">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-zenit-primary/20 p-4 rounded-full"><FaTrophy className="text-zenit-primary w-8 h-8" /></div>
                <h2 className="text-3xl font-bold text-white">Mapa de Ruta</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 uppercase font-bold">Tu Nivel de XP</p>
                <p className="text-4xl font-extrabold text-white">{profile.paseTemporadaXP} <span className="text-zenit-primary text-xl">XP</span></p>
              </div>
            </div>

            {/* LISTA COMPLETA DE NIVELES ("BATTLE PASS" UI) */}
            <div className="space-y-4">
              {nivelesOrdenados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cargando niveles del pase...</p>
              ) : (
                nivelesOrdenados.map((nivel) => {
                  const isClaimed = profile.nivelesReclamados?.includes(nivel.id);
                  const isClaimable = !isClaimed && profile.paseTemporadaXP >= nivel.XP_requerido;
                  const isLocked = !isClaimed && !isClaimable;

                  return (
                    <div 
                      key={nivel.id} 
                      className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all
                        ${isClaimed ? 'bg-zenit-dark border-zenit-success/30 opacity-75' : 
                          isClaimable ? 'bg-zenit-light border-zenit-success shadow-zenit-glow transform scale-[1.02]' : 
                          'bg-zenit-dark border-gray-700 opacity-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                          ${isClaimed ? 'bg-zenit-success text-zenit-dark' : 
                            isClaimable ? 'bg-zenit-primary text-white animate-pulse' : 
                            'bg-gray-800 text-gray-500'}`}>
                          {isClaimed ? <FaCheckCircle /> : isLocked ? <FaLock /> : nivel.nivel}
                        </div>
                        <div>
                          <h4 className={`font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-white'}`}>{nivel.nombreNivel}</h4>
                          <p className={`text-sm ${isClaimable ? 'text-zenit-accent' : 'text-gray-400'}`}>
                            Requiere: {nivel.XP_requerido} XP
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold mb-2 ${isLocked ? 'text-gray-600' : 'text-white'}`}>
                          +{nivel.recompensa_fichas} Fichas
                        </p>
                        {isClaimable && (
                          <button
                            onClick={() => handleReclamoNivel(nivel.id)}
                            disabled={loadingNivelId === nivel.id}
                            className="bg-zenit-success hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors"
                          >
                            {loadingNivelId === nivel.id ? "..." : "RECLAMAR"}
                          </button>
                        )}
                        {isClaimed && <span className="text-zenit-success text-xs font-bold px-3 py-1 bg-zenit-success/10 rounded-full">RECLAMADO</span>}
                        {isLocked && <span className="text-gray-600 text-xs font-bold px-3 py-1 bg-gray-800 rounded-full flex items-center gap-1 ml-auto w-fit"><FaLock className="text-[10px]" /> BLOQUEADO</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}