// ==========================================================
// ARCHIVO 35 (NUEVO): components/marketing/WelcomePopup.tsx
// (El "Hook" Popup profesional)
// ==========================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFirebase } from "@/context/FirebaseProvider";
import { FaGift, FaTimes, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // Para animación

export default function WelcomePopup() {
  const { user, loading } = useFirebase();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (loading) return; // Esperar a que Firebase sepa si hay usuario

    // Clave de la lógica:
    // 1. ¿El usuario NO está logueado?
    // 2. ¿NO ha visto ya el popup en esta sesión?
    const hasSeenPopup = sessionStorage.getItem("zenitWelcomePopupSeen");
    
    if (!user && !hasSeenPopup) {
      // Esperar 2 segundos antes de "golpear" al usuario
      const timer = setTimeout(() => {
        setShowPopup(true);
        sessionStorage.setItem("zenitWelcomePopupSeen", "true"); // Marcar como visto
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const handleClose = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          // Fondo oscuro semi-transparente
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* Contenedor del Popup (Evita que el clic se propague) */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            // Aquí es donde usaría la imagen de fondo que le describí
            className="relative w-full max-w-lg bg-zenit-light rounded-2xl shadow-2xl border-2 border-zenit-primary/50 overflow-hidden"
            style={{
              // Este es un ejemplo de fondo (textura + gradiente)
              background: "linear-gradient(to bottom, rgba(42, 42, 78, 0.9), rgba(26, 26, 46, 0.9)), url('/fondo-textura.png')" 
            }}
          >
            {/* Botón de Cerrar (Profesional) */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
            >
              <FaTimes size={20} />
            </button>

            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-zenit-accent/20 border-4 border-zenit-accent p-4 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-zenit-accent/30">
                <FaGift className="w-10 h-10 text-zenit-accent animate-bounce" />
              </div>

              <h2 className="text-4xl font-extrabold text-white mb-4">
                ¡Tu Regalo de Bienvenida!
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Regístrate ahora y recibe <span className="font-bold text-zenit-accent bg-zenit-dark px-2 py-1 rounded">5 Fichas GRATIS</span> para participar en tu primer sorteo.
              </p>

              <Link 
                href="/login" 
                onClick={handleClose}
                className="w-full bg-zenit-primary hover:bg-violet-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Crear Cuenta y Reclamar <FaArrowRight />
              </Link>
              
              <button 
                onClick={handleClose} 
                className="mt-4 text-gray-500 hover:text-white text-sm transition"
              >
                Quizás más tarde
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}