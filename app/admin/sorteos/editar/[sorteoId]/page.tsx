// ==========================================================
// ARCHIVO 32: app/admin/sorteos/editar/[sorteoId]/page.tsx (V6 - INPUTS FLUIDOS)
// ==========================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { Sorteo } from "@/types/definitions";
import { useFirebase } from "@/context/FirebaseProvider";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaCalendarAlt, FaCloudUploadAlt, FaImage } from "react-icons/fa";

const timestampToString = (ts: Timestamp | null | undefined): string => {
  if (!ts) return "";
  return new Date(ts.toMillis()).toISOString().slice(0, 16);
};

const stringToTimestamp = (str: string): Timestamp | null => {
  if (!str) return null;
  return Timestamp.fromDate(new Date(str));
};

export default function EditarSorteoPage({ params }: { params: { sorteoId: string } }) {
  const { sorteoId } = params;
  const { db, storage } = useFirebase();
  const router = useRouter();
  const { document: sorteo, loading } = useFirestoreDoc<Sorteo>("sorteos", sorteoId);
  
  // Usamos 'any' para permitir que los campos numéricos sean strings temporalmente durante la edición
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (sorteo) setFormData(sorteo);
  }, [sorteo]);

  // --- CAMBIO CLAVE: handleChange FLUIDO ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // NO convertimos a Number() aquí. Dejamos que sea string mientras el usuario escribe.
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
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
      const storageRef = ref(storage, `sorteo_imagenes/${sorteoId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData((prev: any) => ({ ...prev, imagenURL: downloadURL }));
      toast.success("¡Imagen subida correctamente!", { id: toastId });
    } catch (error: any) {
      toast.error("Error al subir: " + error.message, { id: toastId });
    }
    setUploading(false);
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !sorteoId) return;
    setSaving(true);
    try {
      // --- CAMBIO CLAVE: CONVERSIÓN AL GUARDAR ---
      // Aquí es donde convertimos los strings de vuelta a números para Firestore
      const datosLimpios = {
        ...formData,
        valorPremio: Number(formData.valorPremio) || 0,
        metaRecaudacion: Number(formData.metaRecaudacion) || 0,
        precioBoleta: Number(formData.precioBoleta) || 0,
        precioBoletaElegida: Number(formData.precioBoletaElegida) || 0,
        recaudacionActual: Number(formData.recaudacionActual) || 0, 
      };

      await updateDoc(doc(db, "sorteos", sorteoId), datosLimpios);
      toast.success("¡Sorteo actualizado con éxito!");
      router.push("/admin/sorteos");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
    setSaving(false);
  };

  if (loading || !sorteo) return <div className="text-white p-8">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/admin/sorteos" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"><FaArrowLeft /> Volver a la lista</Link>
        <h1 className="text-3xl font-bold text-white">Editar: <span className="text-zenit-primary">{sorteo.nombre}</span></h1>
      </div>

      <form onSubmit={guardarCambios} className="space-y-8">
        
        {/* GRUPO 1: IMAGEN (Sin cambios) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><FaImage /> Imagen del Sorteo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="relative h-48 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 flex items-center justify-center">
              {formData.imagenURL ? (<img src={formData.imagenURL} alt="Previsualización" className="object-cover w-full h-full" />) : (<p className="text-gray-500">Sin imagen</p>)}
              {uploading && (<div className="absolute inset-0 bg-black/70 flex items-center justify-center"><p className="text-white font-bold animate-pulse">Subiendo...</p></div>)}
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Subir nueva imagen</label><label className={`flex items-center justify-center w-full px-4 py-3 bg-zenit-dark border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-zenit-primary transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}><FaCloudUploadAlt className="w-6 h-6 text-gray-400 mr-2" /><span className="text-gray-300">Seleccionar archivo...</span><input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading} /></label></div>
              <div><label className="label-admin">O pegar URL manualmente</label><input type="url" name="imagenURL" value={formData.imagenURL || ""} onChange={handleChange} className="input-admin" placeholder="https://..." disabled={uploading} /></div>
            </div>
          </div>
        </div>

        {/* GRUPO 2: INFO BÁSICA (Sin cambios) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Información Básica</h2>
          <div className="grid grid-cols-1 gap-6">
             <div><label className="label-admin">Nombre</label><input type="text" name="nombre" value={formData.nombre || ""} onChange={handleChange} className="input-admin" required /></div>
             <div><label className="label-admin">Categoría</label><select name="categoria" value={formData.categoria || "Otros"} onChange={handleChange} className="input-admin"><option value="Tecnologia">Tecnología</option><option value="Vehiculo">Vehículo</option><option value="Hogar">Hogar</option><option value="Otros">Otros</option></select></div>
             <div><label className="label-admin">Detalles</label><textarea name="detalles" value={formData.detalles || ""} onChange={handleChange} rows={3} className="input-admin" required /></div>
           </div>
        </div>

        {/* --- GRUPO 3: FINANZAS (INPUTS FLUIDOS) --- */}
        {/* Mantenemos type="number" para el teclado numérico en móviles, pero el estado maneja strings */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Finanzas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><label className="label-admin">Valor Premio ($)</label><input type="number" name="valorPremio" value={formData.valorPremio} onChange={handleChange} className="input-admin" /></div>
            <div><label className="label-admin">Meta Boletas</label><input type="number" name="metaRecaudacion" value={formData.metaRecaudacion} onChange={handleChange} className="input-admin" /></div>
            <div><label className="label-admin">Precio Boleta</label><input type="number" name="precioBoleta" value={formData.precioBoleta} onChange={handleChange} className="input-admin" /></div>
            <div><label className="label-admin">Precio Elegida</label><input type="number" name="precioBoletaElegida" value={formData.precioBoletaElegida} onChange={handleChange} className="input-admin" /></div>
          </div>
        </div>

        {/* GRUPO 4: ESTADO Y FECHAS (Sin cambios) */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-zenit-accent">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><FaCalendarAlt /> Control de Tiempo y Estado</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div><label className="label-admin">Estado Actual</label><select name="estado" value={formData.estado || "financiando"} onChange={handleChange} className="input-admin font-bold"><option value="financiando">🟡 Buscando Fondos</option><option value="cuentaRegresiva">🟢 Cuenta Regresiva</option><option value="sorteando">🔴 Sorteando (En vivo)</option><option value="finalizado">⚫ Finalizado</option></select></div>
             <div><label className="label-admin">Fecha/Hora del Sorteo</label><input type="datetime-local" name="horaDeSorteo" value={timestampToString(formData.horaDeSorteo)} onChange={handleDateChange} className="input-admin" /></div>
             <div><label className="label-admin">Fecha Límite de Venta</label><input type="datetime-local" name="fechaLimite" value={timestampToString(formData.fechaLimite)} onChange={handleDateChange} className="input-admin" /></div>
          </div>
          <div className="mt-4 flex gap-6">
             <div className="flex items-center"><input type="checkbox" id="esEventoPrincipal" name="esEventoPrincipal" checked={formData.esEventoPrincipal || false} onChange={handleCheckboxChange} className="w-5 h-5 text-zenit-primary rounded" /><label htmlFor="esEventoPrincipal" className="ml-2 text-white">¿Es Evento Principal?</label></div>
          </div>
        </div>

        <button type="submit" disabled={saving || uploading} className="w-full bg-zenit-success hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-xl sticky bottom-4 shadow-2xl">
          <FaSave /> {saving ? "Guardando..." : "GUARDAR CAMBIOS"}
        </button>

      </form>
      <style jsx>{`.label-admin { display: block; font-size: 0.875rem; font-weight: 500; color: #9ca3af; margin-bottom: 0.5rem; } .input-admin { width: 100%; background-color: #111827; color: white; border-radius: 0.5rem; padding: 0.75rem; border: 1px solid #374151; } .input-admin:focus { border-color: #8A2BE2; outline: none; }`}</style>
    </div>
  );
}