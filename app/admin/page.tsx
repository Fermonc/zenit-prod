// ==========================================================
// ARCHIVO: app/admin/page.tsx (Dashboard V3 - Feed en Vivo)
// ==========================================================
"use client";

import { useEffect, useState } from "react";
import { useFirebase } from "@/context/FirebaseProvider";
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { FaSync, FaRocket, FaShoppingCart } from "react-icons/fa";

export default function AdminDashboardPage() {
  const { db } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sorteosActivos: 0,
    usuariosTotales: 0,
    ingresos: 0 
  });
  // Nuevo estado para las ventas recientes
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const fetchStats = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // 1. Contadores (Usuarios y Sorteos)
      const collUsuarios = collection(db, "usuarios");
      const totalUsuarios = (await getCountFromServer(collUsuarios)).data().count;

      const collSorteos = collection(db, "sorteos");
      const qSorteosActivos = query(collSorteos, where("estado", "!=", "finalizado"));
      const totalSorteosActivos = (await getCountFromServer(qSorteosActivos)).data().count;

      // 2. Ingresos Totales y Feed Reciente
      const collVentas = collection(db, "ventas");
      
      // A. Calcular total (Idealmente esto sería una Cloud Function, pero funciona por ahora)
      const allVentasSnap = await getDocs(collVentas);
      let totalIngresos = 0;
      allVentasSnap.forEach(doc => { totalIngresos += (doc.data().montoUSD || 0); });

      // B. Obtener las 5 últimas ventas
      const qRecent = query(collVentas, orderBy("fechaCompra", "desc"), limit(5));
      const recentSnap = await getDocs(qRecent);
      const sales = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentSales(sales);

      setStats({
        usuariosTotales: totalUsuarios,
        sorteosActivos: totalSorteosActivos,
        ingresos: totalIngresos
      });

    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [db]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Panel de Control</h1>
        <button 
          onClick={fetchStats} 
          className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
          title="Actualizar datos"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      
      {/* --- TARJETAS DE MÉTRICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zenit-light p-6 rounded-xl shadow-lg border border-gray-800">
          <h3 className="text-gray-400 font-medium uppercase text-sm">Sorteos Activos</h3>
          <p className="text-5xl font-extrabold text-white mt-4">{loading ? "..." : stats.sorteosActivos}</p>
        </div>
        <div className="bg-zenit-light p-6 rounded-xl shadow-lg border border-gray-800">
          <h3 className="text-gray-400 font-medium uppercase text-sm">Usuarios Registrados</h3>
          <p className="text-5xl font-extrabold text-white mt-4">{loading ? "..." : stats.usuariosTotales}</p>
        </div>
        <div className="bg-zenit-light p-6 rounded-xl shadow-lg border border-zenit-success/30">
          <h3 className="text-zenit-success font-medium uppercase text-sm">Ingresos Totales (USD)</h3>
          <p className="text-5xl font-extrabold text-white mt-4">
            {loading ? "..." : `$${stats.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* --- FEED DE ACTIVIDAD RECIENTE (REEMPLAZA EL TEXTO ESTÁTICO) --- */}
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <FaRocket className="text-zenit-accent" /> Actividad Reciente
        </h2>
        
        {loading ? (
          <p className="text-gray-500">Cargando actividad...</p>
        ) : recentSales.length === 0 ? (
          <p className="text-gray-500">No hay actividad reciente para mostrar.</p>
        ) : (
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg border-l-4 border-zenit-success animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="bg-zenit-success/20 p-3 rounded-full">
                    <FaShoppingCart className="text-zenit-success" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Nueva compra de <span className="text-zenit-primary">{sale.fichasCompradas} Fichas</span>
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      UID: {sale.userId.substring(0, 8)}...
                      <span className="mx-2">•</span>
                      {sale.fechaCompra ? new Date((sale.fechaCompra as Timestamp).toMillis()).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-zenit-success">
                  +${sale.montoUSD?.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}