// ==========================================================
// ARCHIVO 25: app/sorteos/[sorteoId]/page.tsx (v3 - Con Animación de Ganador)
// ==========================================================
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFirebase } from "@/context/FirebaseProvider";
import { Sorteo } from "@/types/definitions";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { useUserBoletas } from "@/hooks/useUserBoletas";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import { FaTicketAlt, FaCheckCircle, FaTrophy, FaUserSecret, FaCalendarAlt } from "react-icons/fa";
// ¡NUEVO IMPORT!
import WinnerReveal from "@/components/sorteos/WinnerReveal";

// --- (Componente ProgressBar - Sin cambios) ---
const ProgressBar = ({ actual, meta }: { actual: number, meta: number }) => {
  const porcentaje = meta > 0 ? (actual / meta) * 100 : 0;
  return (
    <div>
      <div className="w-full bg-zenit-dark rounded-full h-2.5 mb-1"><div className="bg-zenit-accent h-2.5 rounded-full" style={{ width: `${porcentaje}%` }}></div></div>
      <p className="text-sm text-gray-400 text-center">{actual} / {meta} boletas</p>
    </div>
  );
};

export default function SorteoDetallePage({ params }: { params: { sorteoId: string } }) {
  const { sorteoId } = params;
  const { functions, user } = useFirebase();
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  // Estado para controlar si mostramos la animación
  const [showReveal, setShowReveal] = useState(false);

  const { document: sorteo, loading: loadingSorteo } = useFirestoreDoc<Sorteo>("sorteos", sorteoId);
  const { boletas: misBoletas, loading: loadingBoletas } = useUserBoletas(user?.uid);

  const boletaComprada = useMemo(() => misBoletas.find(b => b.sorteoId === sorteoId), [misBoletas, sorteoId]);

  // --- EFECTO: Verificar si debe mostrar la animación ---
  useEffect(() => {
    if (sorteo?.estado === 'finalizado' && sorteo.ganadorNumeroBoleta) {
      // Revisar localStorage: ¿Ya vio este usuario esta animación?
      const hasSeen = localStorage.getItem(`zenit_seen_winner_${sorteoId}`);
      if (!hasSeen) {
        setShowReveal(true);
      }
    }
  }, [sorteo, sorteoId]);

  // Callback cuando termina la animación
  const handleRevealComplete = () => {
    localStorage.setItem(`zenit_seen_winner_${sorteoId}`, 'true');
    setShowReveal(false);
  };


  const handleComprarBoleta = async () => {
     /* ... (Lógica de compra idéntica a v2.1) ... */
     // Por brevedad, la omito aquí, pero ASEGÚRESE de mantenerla en su archivo final.
     // Si necesita que la copie de nuevo, dígamelo.
      if (!user || !functions) { toast.error("Debes iniciar sesión."); return; }
      if (!sorteo || sorteo.estado !== 'financiando') { toast.error("Sorteo no disponible."); return; }
      setLoadingPurchase(true);
      try {
        const res = await httpsCallable(functions, "comprarBoleta")({ sorteoId, tipoBoleta: "azar" });
        const data = res.data as any;
        if (data.success) toast.success(`¡Boleta #${data.numeroComprado} comprada!`);
      } catch (e: any) { console.error(e); toast.error(e.message || "Error en compra."); }
      setLoadingPurchase(false);
  };

  if (loadingSorteo || loadingBoletas) return <div className="flex h-[60vh] items-center justify-center text-white">Cargando...</div>;
  if (!sorteo) return <div className="text-center py-12 text-white">Sorteo no encontrado</div>;

  return (
    <>
      {/* --- ANIMACIÓN DE REVELACIÓN (Si aplica) --- */}
      {showReveal && sorteo.ganadorNumeroBoleta && (
        <WinnerReveal 
          winningNumber={sorteo.ganadorNumeroBoleta} 
          onComplete={handleRevealComplete} 
        />
      )}

      <div className="container mx-auto max-w-5xl py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Columna Izquierda: Imagen */}
          <div className="relative w-full h-80 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <Image src={sorteo.imagenURL || "/placeholder-sorteo.png"} alt={sorteo.nombre} layout="fill" objectFit="cover" className={sorteo.estado === 'finalizado' ? 'grayscale' : ''} />
            {/* Overlay si finalizó */}
            {sorteo.estado === 'finalizado' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <FaTrophy className="text-zenit-accent w-24 h-24 opacity-50" />
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalles */}
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">{sorteo.nombre}</h2>
            <p className="text-2xl text-zenit-primary font-bold mb-6">Premio: ${sorteo.valorPremio.toLocaleString('es-CO')}</p>
            
            {/* --- SECCIÓN DE GANADOR (Si finalizó) --- */}
            {sorteo.estado === 'finalizado' && sorteo.ganadorNumeroBoleta ? (
              <div className="bg-zenit-accent/10 border-2 border-zenit-accent p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-bottom-5">
                <h3 className="text-zenit-accent font-bold text-xl mb-4 flex items-center gap-2">
                  <FaTrophy /> SORTEO FINALIZADO
                </h3>
                <div className="flex items-center justify-between bg-zenit-dark p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Boleta Ganadora</p>
                    <p className="text-4xl font-mono font-extrabold text-white tracking-wider">
                      #{sorteo.ganadorNumeroBoleta.toString().padStart(5, '0')}
                    </p>
                  </div>
                  <div className="text-right">
                    <FaUserSecret className="text-gray-500 w-8 h-8 mb-1 inline-block" />
                    {/* Aquí podríamos mostrar el email ofuscado si lo guardamos en el backend */}
                    <p className="text-sm text-gray-400">Ganador Verificado</p>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1">
                  <FaCalendarAlt /> Finalizado el: {sorteo.fechaFinalizacion ? new Date(sorteo.fechaFinalizacion.toMillis()).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ) : (
              /* --- Si NO ha finalizado, mostramos detalles y compra --- */
              <>
                <p className="text-lg text-gray-300 mb-6">{sorteo.detalles}</p>
                {sorteo.estado === 'financiando' && (
                  <div className="mb-8 bg-gray-800/50 p-4 rounded-xl">
                    <p className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                      Fase: Entradas Disponibles
                    </p>
                    <ProgressBar actual={sorteo.recaudacionActual} meta={sorteo.metaRecaudacion} />
                  </div>
                )}
                 {/* (Botones de Compra - Lógica idéntica a v2.1) */}
                 <div className="mt-4">
                  {sorteo.estado === 'financiando' ? (
                    boletaComprada ? (
                      <div className="bg-zenit-dark p-6 rounded-xl text-center border border-zenit-success/30">
                        <FaCheckCircle className="w-12 h-12 text-zenit-success mx-auto mb-3" />
                        <p className="text-xl font-bold text-white">¡Ya estás participando!</p>
                        <p className="text-lg text-gray-400">Tu boleta: <span className="text-zenit-primary font-mono font-bold text-2xl ml-2">#{boletaComprada.numero.toString().padStart(5, '0')}</span></p>
                      </div>
                    ) : (
                      <button onClick={handleComprarBoleta} disabled={loadingPurchase || !user} className="w-full bg-zenit-primary hover:bg-violet-500 text-white font-bold py-4 px-10 rounded-xl text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-zenit-primary/20">
                        {loadingPurchase ? "Procesando..." : `Comprar Boleta (${sorteo.precioBoleta} Fichas)`}
                      </button>
                    )
                  ) : sorteo.estado === 'cuentaRegresiva' ? (
                     <div className="bg-blue-900/30 p-6 rounded-xl text-center border border-blue-500/30">
                        <h3 className="text-2xl font-bold text-blue-400 mb-2">⏳ Cuenta Regresiva</h3>
                        <p className="text-gray-300">Las ventas han cerrado. El sorteo se realizará pronto.</p>
                        {/* TODO: Aquí podría ir un contador real de 72h si tenemos horaDeSorteo */}
                     </div>
                  ) : null}
                  {!user && <p className="text-center text-zenit-accent mt-4"><Link href="/login" className="underline hover:text-white">Inicia sesión</Link> para comprar.</p>}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}