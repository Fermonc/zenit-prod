// ==========================================================
// ARCHIVO 38 (NUEVO): components/sorteos/WinnerReveal.tsx
// (Animación de "Tragamonedas" para revelar el ganador)
// ==========================================================
"use client";

import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";
import confetti from 'canvas-confetti'; // Efecto profesional

export default function WinnerReveal({ 
  winningNumber, 
  onComplete 
}: { 
  winningNumber: number; 
  onComplete: () => void; 
}) {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // 1. Fase de "Giro rápido" (2.5 segundos)
    const duration = 2500;
    const intervalTime = 50;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime < duration) {
        // Mostrar número aleatorio entre 0 and 99999
        setCurrentNumber(Math.floor(Math.random() * 100000));
      } else {
        // 2. Terminar: Mostrar número real y lanzar confeti
        clearInterval(interval);
        setCurrentNumber(winningNumber);
        setIsFinished(true);
        
        // Lanzar confeti profesional
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8A2BE2', '#F8B400', '#ffffff'] // Colores Zenit
        });

        // 3. Esperar un momento para que el usuario celebre, luego notificar al padre
        setTimeout(() => {
          onComplete();
        }, 4000); // Deja ver el resultado final por 4 segundos
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [winningNumber, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="text-center scale-150 md:scale-100">
        <FaTrophy className={`w-24 h-24 mx-auto mb-8 transition-all duration-500 ${isFinished ? 'text-zenit-accent animate-bounce' : 'text-gray-600 animate-pulse'}`} />
        
        <h2 className="text-2xl text-white mb-4 uppercase tracking-widest font-bold">
          {isFinished ? "El número ganador es..." : "Sorteando Ganador..."}
        </h2>
        
        {/* El Número (Estilo Tragamonedas) */}
        <div className="bg-zenit-dark border-4 border-zenit-primary rounded-2xl p-8 shadow-[0_0_50px_rgba(138,43,226,0.5)] inline-block min-w-[300px]">
          <p className={`text-6xl md:text-8xl font-mono font-extrabold transition-colors duration-300 ${isFinished ? 'text-zenit-success scale-110' : 'text-white'}`}>
            {currentNumber.toString().padStart(5, '0')}
          </p>
        </div>
      </div>
    </div>
  );
}