// ==========================================================
// ARCHIVO 31: app/admin/sorteos/page.tsx (v2 - Enlaces Activos)
// ==========================================================
"use client";

import Link from "next/link";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { Sorteo } from "@/types/definitions";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

export default function AdminSorteosPage() {
  const { data: sorteos, loading } = useFirestoreCollection<Sorteo>("sorteos");

  if (loading) {
    return <div className="text-white">Cargando lista de sorteos...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestión de Sorteos</h1>
        <Link 
          href="/admin/sorteos/crear"
          className="bg-zenit-primary hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Nuevo Sorteo
        </Link>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Progreso</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sorteos.map((sorteo) => (
              <tr key={sorteo.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{sorteo.nombre}</div>
                  <div className="text-sm text-gray-400">${sorteo.valorPremio.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${sorteo.estado === 'financiando' ? 'bg-yellow-100 text-yellow-800' : 
                      sorteo.estado === 'finalizado' ? 'bg-gray-100 text-gray-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {sorteo.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {sorteo.recaudacionActual} / {sorteo.metaRecaudacion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* --- ENLACE DE EDICIÓN ACTIVADO --- */}
                  <Link 
                    href={`/admin/sorteos/editar/${sorteo.id}`}
                    className="text-indigo-400 hover:text-indigo-300 mx-2 inline-block" 
                    title="Editar"
                  >
                    <FaEdit />
                  </Link>
                  {/* ---------------------------------- */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}