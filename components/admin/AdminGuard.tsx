// ==========================================================
// ARCHIVO 30 (NUEVO): components/admin/AdminGuard.tsx
// (Componente de Seguridad: Solo permite acceso a rol: 'admin')
// ==========================================================
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/context/FirebaseProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserProfile } from "@/types/definitions";
import toast from "react-hot-toast";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useFirebase();
  // Casting explícito para evitar problemas de tipo con el hook genérico
  const { profile, loading: profileLoading } = useUserProfile(user?.uid) as { profile: UserProfile | null, loading: boolean };
  const router = useRouter();

  useEffect(() => {
    // 1. Esperar a que termine la carga de Auth y Perfil
    if (authLoading || profileLoading) return;

    // 2. Verificaciones de Seguridad
    if (!user) {
      // Caso A: No está logueado
      toast.error("Acceso denegado. Debes iniciar sesión.");
      router.push("/login");
      return;
    }

    if (profile && profile.rol !== "admin") {
      // Caso B: Está logueado, pero NO es admin
      toast.error("Acceso restringido. Se requieren permisos de administrador.");
      router.push("/"); // Expulsar al home
      return;
    }
  }, [user, profile, authLoading, profileLoading, router]);

  // 3. Mientras verificamos, mostrar un "Loading" de pantalla completa
  if (authLoading || profileLoading || !profile || profile.rol !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zenit-dark">
        <p className="text-zenit-primary text-xl font-bold animate-pulse">
          Verificando credenciales de acceso...
        </p>
      </div>
    );
  }

  // 4. Si pasa todas las verificaciones, mostrar el contenido protegido
  return <>{children}</>;
}