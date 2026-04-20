import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { Link } from "react-router-dom";
import { Star, BadgeCheck, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const TIPO_COLOR = {
  hospedaje:"#1565C0", hotel:"#1565C0", hostal:"#1565C0",
  gastronomia:"#D32F2F", restaurante:"#D32F2F", cafeteria:"#795548",
  turismo:"#2E7D32", actividad:"#2E7D32",
  transporte:"#E65100", comercio:"#6A1B9A",
};
const getColor = (t) => TIPO_COLOR[(t||"").toLowerCase()] || "#546E7A";

/* ── Borde Gemini animado ── */
const GeminiBorder = () => (
  <>
    <style>{`
      @keyframes gemini-spin {
        0%   { transform: rotate(0deg);   }
        100% { transform: rotate(360deg); }
      }
      @keyframes gemini-pulse {
        0%,100% { opacity: 1; }
        50%      { opacity: 0.6; }
      }
      .gemini-border-wrap {
        position: absolute;
        inset: -2px;
        border-radius: 26px;
        overflow: hidden;
        z-index: 0;
      }
      .gemini-border-wrap::before {
        content: "";
        position: absolute;
        inset: -100%;
        background: conic-gradient(
          from 0deg,
          #4285F4 0%,
          #9B59B6 15%,
          #EA4335 30%,
          #FBBC05 45%,
          #34A853 60%,
          #4285F4 75%,
          #9B59B6 90%,
          #4285F4 100%
        );
        animation: gemini-spin 3s linear infinite;
      }
      .gemini-border-wrap::after {
        content: "";
        position: absolute;
        inset: 3px;
        border-radius: 23px;
        background: white;
      }
      .gemini-glow {
        position: absolute;
        inset: -4px;
        border-radius: 28px;
        background: conic-gradient(
          from 0deg,
          #4285F4, #9B59B6, #EA4335, #FBBC05, #34A853, #4285F4
        );
        filter: blur(12px);
        opacity: 0.5;
        animation: gemini-spin 3s linear infinite, gemini-pulse 2s ease-in-out infinite;
        z-index: -1;
      }
    `}</style>
    <div className="gemini-glow" />
    <div className="gemini-border-wrap" />
  </>
);

const WidgetPrestadoresDestacados = () => {
  const [prestadores, setPrestadores] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [idx,         setIdx]         = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    axios.get(`${API}/prestadores`, { params: { verificado: true, limit: 8, orden: "calificacion" } })
      .then(({ data }) => setPrestadores(data.prestadores || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (prestadores.length < 2) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % prestadores.length), 4500);
    return () => clearInterval(timer.current);
  }, [prestadores.length]);

  const go = (dir) => {
    clearInterval(timer.current);
    setIdx(i => (i + dir + prestadores.length) % prestadores.length);
  };

  if (loading) return (
    <div className="relative" style={{ borderRadius: 26 }}>
      <GeminiBorder />
      <div className="relative z-10 rounded-3xl bg-white animate-pulse" style={{ minHeight: 340 }} />
    </div>
  );

  if (prestadores.length === 0) return null;

  const p     = prestadores[idx];
  const color = getColor(p.tipo);

  return (
    <div className="relative" style={{ borderRadius: 26 }}>
      {/* Borde Gemini */}
      <GeminiBorder />

      {/* Contenido */}
      <div className="relative z-10 bg-white rounded-3xl overflow-hidden">
        {/* Badge "Publicidad" */}
        <div className="absolute top-3 left-3 z-20">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white"
            style={{ background: "linear-gradient(90deg, #4285F4, #9B59B6, #EA4335, #FBBC05, #34A853)", backgroundSize: "200%", animation: "gemini-spin 3s linear infinite" }}>
            ✦ DESTACADO
          </span>
        </div>

        {/* Navegación */}
        <div className="absolute top-3 right-3 z-20 flex gap-1">
          <button onClick={() => go(-1)}
            className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => go(1)}
            className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Imagen */}
        <Link to={`/prestador/${p.id}`}>
          <div className="relative h-44 overflow-hidden">
            {p.foto_portada_url || p.foto_url ? (
              <img src={p.foto_portada_url || p.foto_url} alt={p.nombre}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl"
                style={{ background: `linear-gradient(135deg, ${color}20, ${color}50)` }}>
                {p.tipo?.toLowerCase().includes("hotel") ? "🏨"
                 : p.tipo?.toLowerCase().includes("restaurante") ? "🍽️"
                 : p.tipo?.toLowerCase().includes("tour") ? "🗺️" : "📍"}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Rating sobre imagen */}
            {p.calificacion_promedio > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-gray-800">{p.calificacion_promedio.toFixed(1)}</span>
              </div>
            )}

            {/* Tipo badge */}
            <div className="absolute bottom-3 left-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-lg"
                style={{ backgroundColor: color }}>
                {p.tipo || "Servicio"}
              </span>
            </div>
          </div>
        </Link>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={`/prestador/${p.id}`} className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-black text-gray-900 text-base leading-tight truncate hover:underline">{p.nombre}</h3>
              {p.verificado && <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            </Link>
          </div>

          {p.municipio_nombre && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" /> {p.municipio_nombre}, Veracruz
            </p>
          )}

          {p.descripcion && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{p.descripcion}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            {p.precio_min ? (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Desde</p>
                <p className="font-black text-sm" style={{ color }}>${p.precio_min.toLocaleString()} MXN</p>
              </div>
            ) : <div />}

            <Link to={`/prestador/${p.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all hover:scale-105 shadow-md"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
              Ver perfil →
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {prestadores.map((_, i) => (
            <button key={i} onClick={() => { clearInterval(timer.current); setIdx(i); }}
              className={`rounded-full transition-all ${i === idx ? "w-5 h-1.5" : "w-1.5 h-1.5 bg-gray-200"}`}
              style={i === idx ? { background: `linear-gradient(90deg, #4285F4, #EA4335)` } : {}} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WidgetPrestadoresDestacados;