import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight, BadgeCheck, Sparkles } from "lucide-react";

const TIPO_COLOR = {
  hospedaje: "#1565C0", hotel: "#1565C0", hostal: "#1565C0",
  gastronomia: "#D32F2F", restaurante: "#D32F2F", cafeteria: "#795548",
  turismo: "#2E7D32", actividad: "#2E7D32", guia: "#2E7D32",
  transporte: "#E65100", comercio: "#6A1B9A",
};
const getColor = (tipo) => TIPO_COLOR[(tipo || "").toLowerCase()] || "#546E7A";

const WidgetPrestadoresDestacados = () => {
  const [prestadores, setPrestadores] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [idx,         setIdx]         = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data } = await axios.get(`${API}/prestadores`, {
          params: { verificado: true, limit: 8, orden: "calificacion" }
        });
        setPrestadores(data.prestadores || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  // Auto-avance cada 4s
  useEffect(() => {
    if (prestadores.length < 2) return;
    intervalRef.current = setInterval(() => {
      setIdx(i => (i + 1) % prestadores.length);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [prestadores.length]);

  const prev = () => {
    clearInterval(intervalRef.current);
    setIdx(i => (i - 1 + prestadores.length) % prestadores.length);
  };
  const next = () => {
    clearInterval(intervalRef.current);
    setIdx(i => (i + 1) % prestadores.length);
  };

  if (loading) return (
    <div className="rounded-3xl bg-gray-100 animate-pulse h-64" />
  );

  if (prestadores.length === 0) return null;

  const p = prestadores[idx];
  const color = getColor(p.tipo);

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Prestadores destacados</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button onClick={next}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Card del prestador */}
      <Link to={`/prestador/${p.id}`} className="block group">
        {/* Imagen */}
        <div className="relative h-40 overflow-hidden">
          {p.foto_portada_url || p.foto_url ? (
            <img src={p.foto_portada_url || p.foto_url} alt={p.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
              {p.tipo?.toLowerCase().includes("hotel") ? "🏨"
               : p.tipo?.toLowerCase().includes("restaurante") ? "🍽️"
               : p.tipo?.toLowerCase().includes("tour") ? "🗺️"
               : "📍"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badge tipo */}
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: color }}>
              {p.tipo || "Servicio"}
            </span>
          </div>

          {/* Rating */}
          {p.calificacion_promedio > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-gray-800">{p.calificacion_promedio.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-black text-gray-900 text-sm truncate">{p.nombre}</h3>
                {p.verificado && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
              </div>
              {p.municipio_nombre && (
                <p className="text-xs text-gray-400 truncate">📍 {p.municipio_nombre}, Ver.</p>
              )}
              {p.descripcion && (
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{p.descripcion}</p>
              )}
            </div>
          </div>

          {/* Precio si aplica */}
          {p.precio_min && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">Desde</span>
              <span className="font-black text-sm" style={{ color }}>
                ${p.precio_min.toLocaleString()} MXN
              </span>
            </div>
          )}

          <div className="mt-3 w-full py-2.5 rounded-xl text-white text-xs font-bold text-center hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}>
            Ver perfil completo →
          </div>
        </div>
      </Link>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {prestadores.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${
              i === idx ? "w-4 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-300"
            }`} />
        ))}
      </div>
    </div>
  );
};

export default WidgetPrestadoresDestacados;