// ARQUITECTURA: Componente de Cliente.
// Reacciona al estado de Auth y muestra el perfil o el login.
"use client";

import Link from "next/link";
import { useFirebase } from "@/context/FirebaseProvider";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

// Próximo Archivo 14: Un hook para obtener datos de Firestore
import { useUserProfile } from "@/hooks/useUserProfile"; 

// Iconos (dependencia de package.json)
import { FaCoins, FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function Header() {
  // 1. Obtener el estado de Auth (¿quién está logueado?)
  const { auth, user, loading } = useFirebase();
  
  // 2. Obtener el perfil de Firestore (¿cuántas fichas tiene?)
  // (Esto se conectará a nuestro próximo Archivo 14)
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("¡Has cerrado sesión!");
      // No es necesario redirigir, el provider actualizará el estado
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("No se pudo cerrar sesión.");
    }
  };

  return (
    <header className="bg-zenit-light shadow-md">
      <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Lado Izquierdo: Logo (Estático) */}
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-extrabold text-zenit-primary">
              Zenit
            </Link>
          </div>

          {/* Centro: Navegación Principal (Estático) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/sorteos" className="text-gray-300 hover:text-zenit-primary transition-colors duration-300 font-semibold">Sorteos</Link>
            <Link href="/recompensas" className="text-gray-300 hover:text-zenit-primary transition-colors duration-300 font-semibold">Recompensas</Link>
            <Link href="/tienda" className="text-gray-300 hover:text-zenit-primary transition-colors duration-300 font-semibold">Tienda</Link>
          </div>

          {/* Lado Derecho: Dinámico (Auth) */}
          <div className="hidden md:flex items-center space-x-4">
            {loading || profileLoading ? (
              <span className="text-gray-400">Cargando...</span>
            ) : user && profile ? (
              // --- ESTADO: LOGUEADO ---
              <>
                {/* Display de Fichas */}
                <div className="flex items-center bg-zenit-dark p-2 rounded-lg">
                  <FaCoins className="text-zenit-accent mr-2" />
                  <span className="font-bold text-white">{profile.fichasZenit}</span>
                </div>
                
                {/* Botón de Perfil */}
                <Link href="/perfil" className="flex items-center text-gray-300 hover:text-white" title="Mi Perfil">
                  <FaUserCircle className="w-8 h-8" />
                </Link>

                {/* Botón de Logout */}
                <button 
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="p-2 text-gray-400 hover:text-zenit-error transition-colors"
                >
                  <FaSignOutAlt className="w-6 h-6" />
                </button>
              </>
            ) : (
              // --- ESTADO: NO LOGUEADO ---
              <Link href="/login" className="bg-zenit-primary hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                Login
              </Link>
            )}
          </div>

          {/* Menú Móvil (TODO: Implementar lógica de 'disclosure') */}
          <div className="md:hidden flex items-center">
            <button className="text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>

        </div>
      </nav>
    </header>
  );
}