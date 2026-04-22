import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin, Clock, DollarSign, Phone, Globe, ArrowLeft,
  ChevronLeft, ChevronRight, Star, Navigation, Share2,
  Heart, Camera, Play, BadgeCheck, MessageCircle
} from "lucide-react";

const ICONOS = {
  Natural: "🌿", Cultural: "🎭", Histórico: "🏛️", Familiar: "👨‍👩‍👧",
  Aventura: "🧗", Gastronomía: "🍽️", Religioso: "⛪", Arqueológico: "🏺"
};

const COLORES = {
  Natural: "#2E7D32", Cultural: "#6A1B9A", Histórico: "#4A148C",
  Familiar: "#0277BD", Aventura: "#E65100", Gastronomía: "#D32F2F",
  Religioso: "#1565C0", Arqueológico: "#795548"
};

const AtraccionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lugar,    setLugar]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [fotoIdx,  setFotoIdx]  = useState(0);
  const [galeria,  setGaleria]  = useState(false);
  const [isFav,    setIsFav]    = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data } = await axios.get(`${API}/lugares/${id}`);
        setLugar(data);
      } catch {
        // Try getting from list
        try {
          const { data } = await axios.get(`${API}/lugares`, { params: { limit: 1000 } });
          const found = (data.lugares || []).find(l => l.id === id);
          if (found) setLugar(found);
        } catch {}
      } finally { setLoading(false); }
    };
    fetch_();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!lugar) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-5xl">😕</p>
      <p className="text-gray-600 font-semibold">Atracción no encontrada</p>
      <Link to="/explorar" className="text-[#1B5E20] font-bold hover:underline">Explorar municipios</Link>
    </div>
  );

  const color   = COLORES[lugar.tipo] || "#1B5E20";
  const emoji   = ICONOS[lugar.tipo] || "📍";
  const fotos   = lugar.fotos?.length > 0 ? lugar.fotos : (lugar.foto_portada ? [lugar.foto_portada] : []);
  const fotoActual = fotos[fotoIdx];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: lugar.nombre, text: lugar.descripcion, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        {/* Título */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link to={lugar.municipio_id ? `/municipio/${lugar.slug?.split("-")[0] || ""}` : "/explorar"}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: color }}>
              {emoji} {lugar.tipo}
            </span>
            {lugar.destacado && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                ⭐ Destacado
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                {lugar.nombre}
              </h1>
              {lugar.municipio && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {lugar.municipio}, Veracruz
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setIsFav(f => !f)}
                className={`p-2 rounded-xl border text-sm transition-colors ${isFav ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
              </button>
              <button onClick={handleShare}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Galería */}
        {fotos.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden">
            {fotos.length === 1 ? (
              <div className="h-[400px] cursor-pointer" onClick={() => setGaleria(true)}>
                <img src={fotos[0]} alt={lugar.nombre} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px]">
                <div className="col-span-2 row-span-2 overflow-hidden cursor-pointer" onClick={() => { setFotoIdx(0); setGaleria(true); }}>
                  <img src={fotos[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                {fotos.slice(1, 5).map((f, i) => (
                  <div key={i} className="overflow-hidden cursor-pointer relative" onClick={() => { setFotoIdx(i+1); setGaleria(true); }}>
                    <img src={f} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    {i === 3 && fotos.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{fotos.length - 5}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setGaleria(true)}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-semibold text-gray-800 shadow-lg border border-gray-200 hover:bg-gray-50">
              <Camera className="w-4 h-4" /> Ver fotos ({fotos.length})
            </button>
            {lugar.video_url && (
              <a href={lugar.video_url} target="_blank" rel="noopener noreferrer"
                className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/80 text-white rounded-xl text-sm font-semibold hover:bg-black">
                <Play className="w-4 h-4" /> Ver video
              </a>
            )}
          </div>
        ) : (
          <div className="h-64 rounded-2xl flex items-center justify-center text-7xl"
            style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
            {emoji}
          </div>
        )}
      </section>

      {/* ── CONTENIDO ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            {lugar.descripcion && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 text-xl mb-3">Acerca de {lugar.nombre}</h2>
                <p className="text-gray-600 leading-relaxed">{lugar.descripcion}</p>
              </div>
            )}

            {/* Info rápida */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Información práctica</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lugar.horarios && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Horarios</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{lugar.horarios}</p>
                    </div>
                  </div>
                )}
                {(lugar.costo !== undefined || lugar.costo_min !== undefined) && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <DollarSign className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Costo</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {lugar.costo || (lugar.costo_min === 0 ? "Gratis" : `$${lugar.costo_min}${lugar.costo_max && lugar.costo_max !== lugar.costo_min ? `–$${lugar.costo_max}` : ""} MXN`)}
                      </p>
                    </div>
                  </div>
                )}
                {lugar.telefono && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Teléfono</p>
                      <a href={`tel:${lugar.telefono}`} className="text-sm font-semibold text-gray-800 mt-0.5 hover:underline block">{lugar.telefono}</a>
                    </div>
                  </div>
                )}
                {lugar.website && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sitio web</p>
                      <a href={lugar.website} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold mt-0.5 hover:underline block truncate" style={{ color }}>
                        {lugar.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recomendaciones */}
            {lugar.recomendaciones && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                  💡 Recomendaciones para visitantes
                </h3>
                <p className="text-green-700 text-sm leading-relaxed">{lugar.recomendaciones}</p>
              </div>
            )}

            {/* Dirección */}
            {lugar.direccion && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-2">📍 Cómo llegar</h3>
                <p className="text-gray-600 text-sm">{lugar.direccion}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* WhatsApp */}
            {lugar.whatsapp && (
              <a href={`https://wa.me/${lugar.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-md">
                <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
              </a>
            )}
            {lugar.telefono && (
              <a href={`tel:${lugar.telefono}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" /> {lugar.telefono}
              </a>
            )}

            {/* Mapa */}
            {lugar.lat && lugar.lng && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <iframe
                  title="Mapa"
                  width="100%" height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${lugar.lat},${lugar.lng}&z=15&output=embed`}
                />
                <a href={`https://www.google.com/maps?q=${lugar.lat},${lugar.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <Navigation className="w-4 h-4" /> Abrir en Google Maps
                </a>
              </div>
            )}

            {/* Info extra */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Detalles</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span className="text-gray-400">Tipo</span><span className="font-semibold">{emoji} {lugar.tipo}</span></div>
                {lugar.municipio && <div className="flex justify-between"><span className="text-gray-400">Municipio</span><span className="font-semibold">{lugar.municipio}</span></div>}
                {lugar.costo_min === 0 && <div className="flex justify-between"><span className="text-gray-400">Entrada</span><span className="font-semibold text-green-600">✅ Gratuita</span></div>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL GALERÍA ── */}
      {galeria && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setGaleria(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">✕</button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <img src={fotos[fotoIdx]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }}>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {fotos.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setFotoIdx(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === fotoIdx ? "bg-white scale-125" : "bg-white/40"}`} />
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AtraccionPage;