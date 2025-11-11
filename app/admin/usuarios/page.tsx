// ==========================================================
// ARCHIVO 34: app/admin/usuarios/page.tsx
// (Directorio de Usuarios)
// ==========================================================
"use client";

import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { UserProfile } from "@/types/definitions";
import { FaUserShield, FaUser } from "react-icons/fa";

export default function AdminUsuariosPage() {
  // Cargamos TODOS los usuarios (gracias a la nueva regla)
  const { data: usuarios, loading } = useFirestoreCollection<UserProfile>("usuarios");

  if (loading) {
    return <div className="text-white">Cargando directorio de usuarios...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Directorio de Usuarios</h1>
        <p className="text-gray-400">Total registrados: {usuarios.length}</p>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balances</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">UID (Técnico)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {usuarios.map((usuario) => (
                <tr key={usuario.uid} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                        {usuario.rol === 'admin' ? <FaUserShield className="text-zenit-accent" /> : <FaUser className="text-gray-400" />}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{usuario.email}</div>
                        <div className="text-xs text-gray-500">
                          Registrado: {usuario.fechaRegistro ? new Date(usuario.fechaRegistro.toMillis()).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      <span className="font-bold text-zenit-primary">{usuario.fichasZenit}</span> Fichas
                    </div>
                    <div className="text-xs text-gray-500">
                      {usuario.paseTemporadaXP} XP
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                    {usuario.uid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}