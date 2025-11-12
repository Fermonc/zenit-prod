// ==========================================================
// NUEVO ARCHIVO: components/perfil/WalletHeader.tsx
// Objetivo: La "Wallet Card" profesional para el perfil.
// ==========================================================
"use client";

import { UserProfile } from "@/types/definitions";
import { FaUser, FaCoins, FaSignOutAlt } from "react-icons/fa";

type Props = {
  profile: UserProfile;
  onLogout: () => void;
};

export default function WalletHeader({ profile, onLogout }: Props) {
  return (
    <div className="relative bg-gradient-to-br from-zenit-dark via-gray-900 to-zenit-dark border border-gray-700/50 rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden mb-8">
      
      {/* Efecto de Brillo Sutil (Atmosférico) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 opacity-10 bg-gradient-radial from-zenit-primary/80 via-transparent to-transparent animate-spin-slow"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 opacity-10 bg-gradient-radial from-zenit-accent/80 via-transparent to-transparent animate-spin-slow" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* 1. Información del Usuario */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-zenit-light rounded-full flex items-center justify-center shadow-lg border-2 border-zenit-primary/50 flex-shrink-0">
            <FaUser className="w-10 h-10 text-zenit-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white truncate" title={profile.email}>{profile.email}</h1>
            <p className="text-sm text-gray-400">Miembro de Zenit</p>
          </div>
        </div>

        {/* 2. El "Balance" (La Wallet) y Logout */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-right bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 w-full md:w-auto">
            <p className="text-xs text-zenit-accent uppercase font-bold tracking-wider">
              Balance Total
            </p>
            <p className="text-4xl font-extrabold text-white flex items-center justify-end gap-2 mt-1">
              {profile.fichasZenit.toLocaleString('es-ES')} 
              <FaCoins className="text-zenit-accent text-3xl" />
            </p>
          </div>
          <button 
            onClick={onLogout} 
            className="self-stretch bg-gray-800/50 hover:bg-zenit-error border border-gray-700 p-4 rounded-2xl text-white transition-colors" 
            title="Cerrar Sesión"
          >
            <FaSignOutAlt className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}