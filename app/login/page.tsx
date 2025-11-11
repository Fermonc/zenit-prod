// ARQUITECTURA: Componente de Cliente.
// Maneja el formulario de inicio de sesión y registro.
"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/context/FirebaseProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const { auth, user, loading } = useFirebase();
  const router = useRouter();
  
  // Estado para los campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para controlar la carga del formulario
  const [formLoading, setFormLoading] = useState(false);

  // Redirección si el usuario YA está logueado
  useEffect(() => {
    if (!loading && user) {
      // Si no estamos cargando y SÍ hay un usuario,
      // redirigir al perfil.
      router.push("/perfil");
    }
  }, [user, loading, router]);

  // --- MANEJADORES DE FORMULARIO ---

  const handleSignUp = async () => {
    if (!email || !password) {
      return toast.error("Por favor, completa ambos campos.");
    }
    setFormLoading(true);
    try {
      // 1. Crear el usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Mostrar éxito (La Cloud Function 'onUsuarioCreado'
      //    se encargará de crear el perfil en Firestore)
      toast.success("¡Cuenta creada con éxito! Redirigiendo...");
      
      // 3. El 'useEffect' de arriba detectará el nuevo 'user'
      //    y redirigirá a /perfil.
      
    } catch (error: any) {
      console.error("Error al registrar:", error);
      // Traducir errores comunes de Firebase
      if (error.code === "auth/email-already-in-use") {
        toast.error("Este correo electrónico ya está en uso.");
      } else if (error.code === "auth/weak-password") {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
      } else {
        toast.error("Error al crear la cuenta.");
      }
    }
    setFormLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return toast.error("Por favor, completa ambos campos.");
    }
    setFormLoading(true);
    try {
      // 1. Iniciar sesión
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Mostrar éxito
      toast.success("¡Bienvenido de nuevo! Redirigiendo...");
      
      // 3. El 'useEffect' de arriba detectará el nuevo 'user'
      //    y redirigirá a /perfil.

    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      if (error.code === "auth/invalid-credential") {
        toast.error("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else {
        toast.error("Error al iniciar sesión.");
      }
    }
    setFormLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setFormLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("¡Bienvenido! Redirigiendo...");
      // El 'useEffect' se encargará de la redirección
    } catch (error) {
      console.error("Error con Google Sign-In:", error);
      toast.error("No se pudo iniciar sesión con Google.");
    }
    setFormLoading(false);
  };
  
  // No renderizar el formulario si estamos cargando 
  // o si el usuario ya está logueado (y esperando la redirección)
  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        Cargando...
      </div>
    );
  }

  // Renderizar el formulario
  return (
    <div className="flex justify-center items-center py-12">
      <div className="bg-zenit-light p-8 md:p-12 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-4xl font-bold text-center text-white mb-8">
          Accede a tu Cuenta
        </h2>
        
        <div className="space-y-6">
          {/* Formulario Email/Pass */}
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={formLoading}
            className="w-full p-4 bg-zenit-dark rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zenit-primary"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={formLoading}
            className="w-full p-4 bg-zenit-dark rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-zenit-primary"
          />
          
          {/* Botones de Acción Email/Pass */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleLogin}
              disabled={formLoading}
              className="flex-1 bg-zenit-primary hover:bg-violet-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              {formLoading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
            <button
              onClick={handleSignUp}
              disabled={formLoading}
              className="flex-1 bg-zenit-accent hover:bg-yellow-400 text-zenit-dark font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
            >
              {formLoading ? "Registrando..." : "Registrarse"}
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center">
            <hr className="flex-grow border-gray-600"/>
            <span className="px-4 text-gray-400">O</span>
            <hr className="flex-grow border-gray-600"/>
          </div>

          {/* Botón de Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={formLoading}
            className="w-full flex justify-center items-center gap-3 bg-white hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
          >
            <FaGoogle />
            {formLoading ? "Cargando..." : "Continuar con Google"}
          </button>
        </div>
      </div>
    </div>
  );
}