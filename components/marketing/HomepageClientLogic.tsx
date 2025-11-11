// ==========================================================
// ARCHIVO 36 (NUEVO): components/marketing/HomepageClientLogic.tsx
// (Contiene el Popup y el Banner de Upsell)
// ==========================================================
"use client";

import Link from "next/link";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserProfile } from "@/types/definitions";
import WelcomePopup from "@/components/marketing/WelcomePopup";
import { FaCoins, FaGift, FaArrowRight } from "react-icons/fa";

// --- (Banner de Upsell Inteligente - Copiado de Archivo 23 v9) ---
const TokenPromoBanner = ({ user, profile }: { user: any, profile: UserProfile | null }) => {
  if (!user) {
    // Caso 1: No logueado (No mostramos nada, el Popup se encarga)
    return null;
  }
  // Caso 2: Logueado pero con pocas fichas (< 20)
  if (profile && profile.fichasZenit < 20) {
    return (
      <div className="bg-gradient-to-r from-zenit-accent/10 to-orange-900/30 border border-zenit-accent/30 rounded-2xl p-4 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FaCoins className="text-zenit-accent w-6 h-6 flex-shrink-0" />
          <p className="text-gray-200">
            <span className="font-bold text-white">Saldo bajo:</span> Solo te quedan {profile.fichasZenit} fichas. ¡Recarga ahora!
          </p>
        </div>
        <Link href="/tienda" className="bg-zenit-accent hover:bg-yellow-500 text-zenit-dark font-bold py-2 px-6 rounded-lg transition whitespace-nowrap flex-shrink-0">
          Recargar Fichas
        </Link>
      </div>
    );
  }
  return null;
};

// --- Componente Envoltorio ---
export default function HomepageClientLogic() {
  const { user } = useFirebase();
  const { profile } = useUserProfile(user?.uid) as { profile: UserProfile | null };

  return (
    <>
      {/* 1. El Popup de Bienvenida (ya funciona) */}
      <WelcomePopup />
      
      {/* 2. El Banner de Upsell (ahora vive aquí) */}
      <div className="container mx-auto max-w-7xl px-4 relative z-20">
        <TokenPromoBanner user={user} profile={profile} />
      </div>
    </>
  );
}