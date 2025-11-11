// ==========================================================
// ARCHIVO 26: types/definitions.ts (Manifiesto Completo v2)
// ==========================================================
import { Timestamp } from "firebase/firestore";

// (UserProfile, PaqueteZenit, NivelPase, Boleta - SIN CAMBIOS)
export interface UserProfile { uid: string; email: string; rol: "usuario" | "admin"; fichasZenit: number; paseTemporadaXP: number; ultimoReclamoDiario: Timestamp | null; nivelesReclamados: string[]; fechaRegistro: Timestamp; }
export interface PaqueteZenit { id: string; nombre: string; fichasZenit: number; precioMonedaReal: number; }
export interface NivelPase { id: string; nombreNivel: string; XP_requerido: number; recompensa_fichas: number; nivel: number; }
export interface Boleta { id: string; userId: string; numero: number; fechaCompra: Timestamp; sorteoId: string; }

// ==========================================================
// ACTUALIZACIÓN CRÍTICA: INTERFAZ SORTEO COMPLETA
// ==========================================================
export interface Sorteo {
  id: string;
  nombre: string;
  detalles: string;
  imagenURL?: string;
  categoria: string;        // Ej: "Vehiculo"
  valorTier: string;        // Ej: "grande"
  esEventoPrincipal: boolean;
  
  // Estado y Finanzas
  estado: "financiando" | "cuentaRegresiva" | "sorteando" | "finalizado";
  valorPremio: number;
  precioBoleta: number;
  precioBoletaElegida: number;
  metaRecaudacion: number;
  recaudacionActual: number;

  // Fechas Críticas (Timestamps de Firestore)
  fechaCreacion: Timestamp;
  horaDeSorteo?: Timestamp | null;   // Cuándo ocurre el sorteo real
  fechaLimite?: Timestamp | null;    // Hasta cuándo se pueden comprar boletas
  fechaFinalizacion?: Timestamp | null; // Cuándo terminó todo

  // Datos del Ganador (Opcionales hasta que finalice)
  ganadorUserId?: string | null;
  ganadorNumeroBoleta?: number | null;
  ganadorPremioAdicional?: string | null;
}