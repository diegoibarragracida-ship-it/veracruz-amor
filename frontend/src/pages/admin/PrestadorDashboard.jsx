"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { User, BadgeCheck } from "lucide-react";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PrestadorDashboard() {
  const [prestador, setPrestador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ⭐ NUEVOS STATES GALERÍA
  const [imagenes, setImagenes] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // ─────────────────────────────────────
  // TRAER PRESTADOR
  // ─────────────────────────────────────
  const fetchPrestador = async () => {
    try {
      const res = await axios.get(`${API}/prestadores/me`);
      const found = res.data;

      if (found) {
        setPrestador(found);
        fetchImagenes(found.id); // ⭐ cargar galería
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cargando perfil");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // TRAER GALERÍA
  // ─────────────────────────────────────
  const fetchImagenes = async (prestadorId) => {
    try {
      const res = await axios.get(`${API}/prestadores/${prestadorId}/imagenes`);
      setImagenes(res.data.imagenes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrestador();
  }, []);

  // ─────────────────────────────────────
  // SUBIR FOTO PRINCIPAL
  // ─────────────────────────────────────
  const handleUploadMainPhoto = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await axios.put(`${API}/prestadores/${prestador.id}`, {
        foto_url: uploadRes.data.url,
      });

      toast.success("Foto actualizada");
      fetchPrestador();
    } catch {
      toast.error("Error subiendo foto");
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────
  // SUBIR IMAGEN GALERÍA
  // ─────────────────────────────────────
  const handleUploadGallery = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingGallery(true);

      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await axios.post(`${API}/prestadores/${prestador.id}/imagenes`, {
        url: uploadRes.data.url,
      });

      toast.success("Imagen agregada a galería");
      fetchImagenes(prestador.id);
    } catch {
      toast.error("Error subiendo imagen");
    } finally {
      setUploadingGallery(false);
    }
  };

  // ─────────────────────────────────────
  // ELIMINAR IMAGEN GALERÍA
  // ─────────────────────────────────────
  const handleDeleteImage = async (id) => {
    try {
      await axios.delete(`${API}/prestadores/imagenes/${id}`);
      setImagenes(imagenes.filter((img) => img.id !== id));
    } catch {
      toast.error("Error eliminando imagen");
    }
  };

  if (loading) return <p className="p-10">Cargando...</p>;
  if (!prestador) return <p className="p-10">No tienes perfil aún</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
      
      {/* ───────── LEFT COLUMN ───────── */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          {prestador.foto_url ? (
            <img
              src={prestador.foto_url}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-yellow-200 flex items-center justify-center">
              <User className="w-12 h-12 text-yellow-600" />
            </div>
          )}

          <h2 className="font-semibold text-lg">{prestador.nombre}</h2>
          <p className="text-sm text-gray-500">{prestador.tipo}</p>

          {prestador.verificado && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
              <BadgeCheck className="w-4 h-4" />
              Verificado
            </div>
          )}

          <input
            type="file"
            className="mt-6"
            onChange={(e) => handleUploadMainPhoto(e.target.files[0])}
            disabled={uploading}
          />
        </div>
      </div>

      {/* ───────── RIGHT COLUMN ───────── */}
      <div className="md:col-span-2 space-y-6">

        {/* GALERÍA */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Galería del negocio</h3>

          <input
            type="file"
            accept="image/*"
            disabled={uploadingGallery}
            onChange={(e) => handleUploadGallery(e.target.files[0])}
          />

          <div className="grid grid-cols-3 gap-4 mt-6">
            {imagenes.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  className="w-full h-28 object-cover rounded-lg"
                />

                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-white text-sm rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}