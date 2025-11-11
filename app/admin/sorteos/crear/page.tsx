// ==========================================================
// ARCHIVO 33: app/admin/sorteos/crear/page.tsx
// (Formulario para crear nuevos sorteos)
// ==========================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/context/FirebaseProvider";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaCalendarAlt, FaCloudUploadAlt, FaImage } from "react-icons/fa";

// (Funciones auxiliares de fecha - mismas que en Edición)
const timestampToString = (ts: Timestamp | null | undefined): string => {
  if (!ts) return "";
  return new Date(ts.toMillis()).toISOString().slice(0, 16);
};
const stringToTimestamp = (str: string): Timestamp | null => {
  if (!str) return null;
  return Timestamp.fromDate(new Date(str));
};

export default function CrearSorteoPage() {
  const { db, storage } = useFirebase();
  const router = useRouter();
  
  // Estado inicial con valores por defecto
  const [formData, setFormData] = useState<any>({
    estado: "financiando",
    categoria: "Otros",
    esEventoPrincipal: false,
    recaudacionActual: 0 // Empieza en 0
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: stringToTimestamp(e.target.value) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;
    if (!file.type.startsWith("image/")) { toast.error("El archivo debe ser una imagen."); return; }
    setUploading(true);
    const toastId = toast.loading("Subiendo imagen...");
    try {
      // Usamos 'temp' en el nombre porque aún no tenemos ID del sorteo
      const storageRef = ref(storage, `sorteo_imagenes/temp_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData((prev: any) => ({ ...prev, imagenURL: downloadURL }));
      toast.success("¡Imagen subida correctamente!", { id: toastId });
    } catch (error: any) {
      toast.error("Error al subir: " + error.message, { id: toastId });
    }
    setUploading(false);
  };

  const crearSorteo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    try {
      // Preparamos los datos finales
      const nuevoSorteo = {
        ...formData,
        valorPremio: Number(formData.valorPremio) || 0,
        metaRecaudacion: Number(formData.metaRecaudacion) || 0,
        precioBoleta: Number(formData.precioBoleta) || 0,
        precioBoletaElegida: Number(formData.precioBoletaElegida) || 0,
        recaudacionActual: 0, // Siempre empieza en 0
        fechaCreacion: serverTimestamp(), // ¡CRÍTICO! Marca de tiempo del servidor
      };

      // Usamos addDoc para crear un documento con ID automático
      await addDoc(collection(db, "sorteos"), nuevoSorteo);
      
      toast.success("¡Sorteo creado con éxito!");
      router.push("/admin/sorteos");
    } catch (error: any) {
      console.error("Error al crear:", error);
      toast.error("Error: " + error.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/admin/sorteos" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
          <FaArrowLeft /> Volver a la lista
        </Link>
        <h1 className="text-3xl font-bold text-white">Crear Nuevo Sorteo</h1>
      </div>

      <form onSubmit={crearSorteo} className="space-y-8">
        
        {/* GRUPO 1: IMAGEN */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><FaImage /> Imagen del Sorteo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="relative h-48 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
              {formData.imagenURL ? (<img src={formData.imagenURL} alt="Previsualización" className="object-cover w-full h-full" />) : (<p className="text-gray-500">Sin imagen</p>)}
              {uploading && (<div className="absolute inset-0 bg-black/70 flex items-center justify-center"><p className="text-white font-bold animate-pulse">Subiendo...</p></div>)}
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Subir imagen</label><label className={`flex items-center justify-center w-full px-4 py-3 bg-zenit-dark border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-zenit-primary transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}><FaCloudUploadAlt className="w-6 h-6 text-gray-400 mr-2" /><span className="text-gray-300">Seleccionar archivo...</span><input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading} /></label></div>
              <div><label className="label-admin">O pegar URL</label><input type="url" name="imagenURL" value={formData.imagenURL || ""} onChange={handleChange} className="input-admin" placeholder="https://..." disabled={uploading} /></div>
            </div>
          </div>
        </div>

        {/* GRUPO 2: INFO BÁSICA */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Información Básica</h2>
          <div className="grid grid-cols-1 gap-6">
             <div><label className="label-admin">Nombre</label><input type="text" name="nombre" value={formData.nombre || ""} onChange={handleChange} className="input-admin" required placeholder="Ej: iPhone 15 Pro Max" /></div>
             <div><label className="label-admin">Categoría</label><select name="categoria" value={formData.categoria || "Otros"} onChange={handleChange} className="input-admin"><option value="Tecnologia">Tecnología</option><option value="Vehiculo">Vehículo</option><option value="Hogar">Hogar</option><option value="Otros">Otros</option></select></div>
             <div><label className="label-admin">Detalles</label><textarea name="detalles" value={formData.detalles || ""} onChange={handleChange} rows={3} className="input-admin" required placeholder="Describe el premio..." /></div>
           </div>
        </div>

        {/* GRUPO 3: FINANZAS */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Finanzas Iniciales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><label className="label-admin">Valor Premio ($)</label><input type="number" name="valorPremio" value={formData.valorPremio || ""} onChange={handleChange} className="input-admin" placeholder="0" /></div>
            <div><label className="label-admin">Meta Boletas</label><input type="number" name="metaRecaudacion" value={formData.metaRecaudacion || ""} onChange={handleChange} className="input-admin" placeholder="Ej: 1000" /></div>
            <div><label className="label-admin">Precio Boleta</label><input type="number" name="precioBoleta" value={formData.precioBoleta || ""} onChange={handleChange} className="input-admin" placeholder="Ej: 10" /></div>
            <div><label className="label-admin">Precio Elegida</label><input type="number" name="precioBoletaElegida" value={formData.precioBoletaElegida || ""} onChange={handleChange} className="input-admin" placeholder="Ej: 15" /></div>
          </div>
        </div>

        {/* GRUPO 4: ESTADO Y FECHAS */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-zenit-accent">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><FaCalendarAlt /> Control de Tiempo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div><label className="label-admin">Estado Inicial</label><select name="estado" value={formData.estado || "financiando"} onChange={handleChange} className="input-admin font-bold"><option value="financiando">🟡 Buscando Fondos</option><option value="cuentaRegresiva">🟢 Cuenta Regresiva (Programado)</option></select></div>
             <div><label className="label-admin">Fecha/Hora del Sorteo</label><input type="datetime-local" name="horaDeSorteo" value={timestampToString(formData.horaDeSorteo)} onChange={handleDateChange} className="input-admin" /></div>
             <div><label className="label-admin">Fecha Límite de Venta</label><input type="datetime-local" name="fechaLimite" value={timestampToString(formData.fechaLimite)} onChange={handleDateChange} className="input-admin" /></div>
          </div>
          <div className="mt-4 flex gap-6">
             <div className="flex items-center"><input type="checkbox" id="esEventoPrincipal" name="esEventoPrincipal" checked={formData.esEventoPrincipal || false} onChange={handleCheckboxChange} className="w-5 h-5 text-zenit-primary rounded" /><label htmlFor="esEventoPrincipal" className="ml-2 text-white">¿Es Evento Principal?</label></div>
          </div>
        </div>

        <button type="submit" disabled={saving || uploading} className="w-full bg-zenit-primary hover:bg-violet-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-xl sticky bottom-4 shadow-2xl">
          <FaPlus /> {saving ? "Creando..." : "CREAR SORTEO"}
        </button>

      </form>
      <style jsx>{`.label-admin { display: block; font-size: 0.875rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.5rem; } .input-admin { width: 100%; background-color: #111827; color: white; border-radius: 0.5rem; padding: 0.75rem; border: 1px solid #374151; } .input-admin:focus { border-color: #8A2BE2; outline: none; }`}</style>
    </div>
  );
}