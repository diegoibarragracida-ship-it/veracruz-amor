import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrestadorCard from "@/components/PrestadorCard";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import useAnalytics from "@/hooks/useAnalytics";
import {
  MapPin, Star, Heart, Share2, ArrowLeft, Camera,
  Users, Calendar, Navigation, Loader2, ChevronLeft,
  ChevronRight, X, Phone, Clock, AlertTriangle,
  Newspaper, Shield, CheckCircle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────
const TIPO_SERVICIO_CONFIG = {
  "Hospital":          { emoji: "🏥", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100" },
  "Clínica":           { emoji: "🏥", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100" },
  "Policía":           { emoji: "👮", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-100" },
  "Protección Civil":  { emoji: "🛡️", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  "Bomberos":          { emoji: "🚒", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-100" },
  "Cruz Roja":         { emoji: "🚑", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100" },
  "Farmacia":          { emoji: "💊", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-100" },
  default:             { emoji: "📞", color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-100" },
};

const NOTICIA_COLOR = {
  "Aviso":     "bg-blue-50   text-blue-700   border-blue-100",
  "Seguridad": "bg-red-50    text-red-700    border-red-100",
  "Cultura":   "bg-purple-50 text-purple-700 border-purple-100",
  "Obras":     "bg-amber-50  text-amber-700  border-amber-100",
  "Turismo":   "bg-green-50  text-green-700  border-green-100",
  "Salud":     "bg-teal-50   text-teal-700   border-teal-100",
  default:     "bg-gray-50   text-gray-600   border-gray-100",
};

const TAG_CONFIG = {
  "Pueblo Mágico": { bg: "bg-amber-400",  text: "text-amber-900" },
  "Playa":         { bg: "bg-blue-500",   text: "text-white"     },
  "Sierra":        { bg: "bg-emerald-600",text: "text-white"     },
  "Gastronomía":   { bg: "bg-orange-500", text: "text-white"     },
  "Naturaleza":    { bg: "bg-green-600",  text: "text-white"     },
  "Cultura":       { bg: "bg-purple-600", text: "text-white"     },
  "Aventura":      { bg: "bg-red-500",    text: "text-white"     },
  default:         { bg: "bg-white/20",   text: "text-white"     },
};

// ── Galería fullscreen ────────────────────────────────────────
const GaleriaModal = ({ fotos, idx, onClose }) => {
  const [current, setCurrent] = useState(idx);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(c => Math.min(c + 1, fotos.length - 1));
      if (e.key === "ArrowLeft")  setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", fn);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", fn); };
  }, [onClose, fotos.length]);

  const foto = fotos[current];
  const url = foto?.url || foto;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
        <X className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}
        className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.min(c + 1, fotos.length - 1))} disabled={current === fotos.length - 1}
        className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30">
        <ChevronRight className="w-5 h-5" />
      </button>
      <img src={url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{current + 1} / {fotos.length}</p>
    </div>
  );
};

// ── PÁGINA ────────────────────────────────────────────────────
const MunicipioPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { trackView }       = useAnalytics();

  const [municipio,   setMunicipio]   = useState(null);
  const [prestadores, setPrestadores] = useState([]);
  const [eventos,     setEventos]     = useState([]);
  const [atracciones, setAtracciones] = useState([]);
  const [noticias,    setNoticias]    = useState([]);
  const [servicios,   setServicios]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [isFav,       setIsFav]       = useState(false);
  const [tab,         setTab]         = useState("info");
  const [galeriaIdx,  setGaleriaIdx]  = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const munRes = await axios.get(`${API}/municipios/${slug}`);
        const m = munRes.data;
        setMunicipio(m);
        if (m.id) trackView("municipio", m.id);

        const [prestRes, eventosRes, atracRes, notRes, svcRes] = await Promise.all([
          axios.get(`${API}/prestadores`, { params: { municipio_id: m.id, verificado: true } }),
          axios.get(`${API}/eventos`,     { params: { municipio_id: m.id, publicado: true } }),
          axios.get(`${API}/lugares`,     { params: { municipio_id: m.id } }).catch(() => ({ data: { lugares: [] } })),
          axios.get(`${API}/noticias`,    { params: { municipio_id: m.id, publicado: true } }).catch(() => ({ data: [] })),
          axios.get(`${API}/servicios-municipales`, { params: { municipio_id: m.id } }).catch(() => ({ data: [] })),
        ]);

        setPrestadores(prestRes.data.prestadores || []);
        setEventos(eventosRes.data.eventos || []);
        setAtracciones(atracRes.data.lugares || []);
        setNoticias(Array.isArray(notRes.data) ? notRes.data : notRes.data.noticias || []);
        setServicios(Array.isArray(svcRes.data) ? svcRes.data : svcRes.data.servicios || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [slug]);

  const handleFav = async () => {
    if (!isAuthenticated) { toast.error("Inicia sesión para guardar favoritos"); return; }
    try {
      await axios.post(`${API}/favoritos`, { tipo: "municipio", referencia_id: municipio.id });
      setIsFav(true); toast.success("Agregado a favoritos");
    } catch { toast.info("Ya está en tus favoritos"); setIsFav(true); }
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: `${municipio?.nombre} - Veracruz Contigo`, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success("Enlace copiado"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1B5E20]" />
      </div>
    </div>
  );

  if (!municipio) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <MapPin className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Municipio no encontrado</p>
        <Link to="/explorar" className="text-[#1B5E20] font-semibold hover:underline">← Explorar municipios</Link>
      </div>
    </div>
  );

  const fotos     = municipio.fotos || [];
  const portada   = fotos[0]?.url || fotos[0] || null;
  const esPueblo  = municipio.pueblo_magico;

  // Tabs dinámicos según contenido
  const tabs = [
    { v: "info",       l: "Información" },
    ...(fotos.length > 0               ? [{ v: "galeria",     l: `Fotos (${fotos.length})` }]        : []),
    ...(atracciones.length > 0         ? [{ v: "atracciones", l: `Atracciones (${atracciones.length})` }] : []),
    ...(prestadores.length > 0         ? [{ v: "servicios_t", l: `Servicios (${prestadores.length})` }]  : []),
    ...(eventos.length > 0             ? [{ v: "eventos",     l: `Eventos (${eventos.length})` }]     : []),
    ...(noticias.length > 0            ? [{ v: "noticias",    l: "Noticias" }]                        : []),
    ...(servicios.length > 0           ? [{ v: "emergencias", l: "Emergencias" }]                     : []),
  ];

  if (municipio.estado === "sin_configurar" || municipio.estado === "borrador") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <section className="relative h-64 overflow-hidden bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-black mb-2" style={{ fontFamily: "Playfair Display, serif" }}>{municipio.nombre}</h1>
            <p className="text-white/70 text-sm">Veracruz, México</p>
          </div>
        </section>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-[#1B5E20]/30" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display" }}>Próximamente</h2>
          <p className="text-gray-500">Este municipio está preparando su contenido turístico. Pronto podrás conocer todos sus atractivos.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {portada
          ? <img src={portada} alt={municipio.nombre} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1B5E20] to-[#0277BD] flex items-center justify-center text-8xl font-black text-white/20">
              {municipio.nombre?.charAt(0)}
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* Back + Actions */}
        <div className="absolute top-20 left-0 right-0 px-4 md:px-8 flex items-center justify-between z-10">
          <Link to="/explorar">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-800 backdrop-blur-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Explorar
            </button>
          </Link>
          <div className="flex gap-2">
            <button onClick={handleFav}
              className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-colors">
              <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
            </button>
            <button onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-colors">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Contenido hero */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {esPueblo && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold">
                  ✨ Pueblo Mágico
                </span>
              )}
              {municipio.tags?.map(tag => {
                const cfg = TAG_CONFIG[tag] || TAG_CONFIG.default;
                return (
                  <span key={tag} className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                    {tag}
                  </span>
                );
              })}
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 drop-shadow-lg"
              style={{ fontFamily: "Playfair Display, serif" }}>
              {municipio.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />Veracruz, México</span>
              {municipio.region && <span>📍 Región {municipio.region}</span>}
              {municipio.clima  && <span>🌤️ {municipio.clima}</span>}
              {municipio.altitud && <span>⛰️ {municipio.altitud}</span>}
              {prestadores.length > 0 && (
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{prestadores.length} servicios</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS STICKY ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-4 py-3.5 whitespace-nowrap text-sm border-b-2 transition-all flex-shrink-0 font-medium ${
                tab === t.v
                  ? "border-[#1B5E20] text-[#1B5E20] font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <main className="max-w-5xl mx-auto px-4 py-7">

        {/* ── INFO ── */}
        {tab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-5">

              {/* Descripción */}
              {municipio.descripcion && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
                    Acerca de {municipio.nombre}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{municipio.descripcion}</p>
                </div>
              )}

              {/* Historia */}
              {municipio.historia && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Historia</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{municipio.historia}</p>
                </div>
              )}

              {/* Qué hacer */}
              {municipio.que_hacer?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Qué hacer aquí</h2>
                  <ul className="space-y-2.5">
                    {municipio.que_hacer.filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-[#1B5E20] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Noticias recientes (preview en info) */}
              {noticias.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Noticias recientes</h2>
                    <button onClick={() => setTab("noticias")} className="text-sm font-medium text-[#1B5E20] hover:underline">
                      Ver todas →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {noticias.slice(0, 3).map(n => {
                      const cls = NOTICIA_COLOR[n.categoria] || NOTICIA_COLOR.default;
                      return (
                        <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          {n.imagen_url && (
                            <img src={n.imagen_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{n.categoria}</span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm truncate">{n.titulo}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.contenido}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Servicios de emergencia (preview) */}
              {servicios.length > 0 && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Servicios de emergencia
                    </h2>
                    <button onClick={() => setTab("emergencias")} className="text-xs font-medium text-red-600 hover:underline">
                      Ver todos →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {servicios.slice(0, 4).map(s => {
                      const cfg = TIPO_SERVICIO_CONFIG[s.tipo] || TIPO_SERVICIO_CONFIG.default;
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-red-100">
                          <span className="text-xl">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{s.nombre}</p>
                            {(s.telefono_emergencia || s.telefono) && (
                              <a href={`tel:${s.telefono_emergencia || s.telefono}`}
                                className="text-xs text-red-600 font-medium hover:underline">
                                📞 {s.telefono_emergencia || s.telefono}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preview atracciones */}
              {atracciones.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Atracciones destacadas</h2>
                    <button onClick={() => setTab("atracciones")} className="text-sm font-medium text-[#1B5E20] hover:underline">
                      Ver todas →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {atracciones.filter(a => a.destacado).slice(0, 3).concat(atracciones.filter(a => !a.destacado)).slice(0, 3).map((a, i) => (
                      <Link key={a.id} to={`/atraccion/${a.id}`}
                        className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group block">
                        {(a.foto_portada || a.fotos?.[0])
                          ? <img src={a.foto_portada || a.fotos[0]} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-3xl">🏛️</div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold line-clamp-2">{a.nombre}</p>
                        {a.destacado && <span className="absolute top-2 right-2 text-[10px] bg-amber-400 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">⭐</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {/* Info rápida */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Información rápida</h3>
                <div className="space-y-3 text-sm">
                  {municipio.clima && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌤️</span>
                      <div><p className="text-xs text-gray-400">Clima</p><p className="font-medium text-gray-800">{municipio.clima}</p></div>
                    </div>
                  )}
                  {municipio.altitud && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⛰️</span>
                      <div><p className="text-xs text-gray-400">Altitud</p><p className="font-medium text-gray-800">{municipio.altitud}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div><p className="text-xs text-gray-400">Región</p><p className="font-medium text-gray-800">{municipio.region}</p></div>
                  </div>
                  {prestadores.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏪</span>
                      <div><p className="text-xs text-gray-400">Servicios verificados</p><p className="font-medium text-gray-800">{prestadores.length} negocios</p></div>
                    </div>
                  )}
                  {eventos.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎪</span>
                      <div><p className="text-xs text-gray-400">Próximos eventos</p><p className="font-medium text-gray-800">{eventos.length} eventos</p></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cómo llegar */}
              {municipio.como_llegar && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Cómo llegar</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{municipio.como_llegar}</p>
                  {municipio.lat && municipio.lng && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${municipio.lat},${municipio.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-[#1B5E20] hover:underline">
                      <Navigation className="w-4 h-4" /> Cómo llegar en Google Maps
                    </a>
                  )}
                </div>
              )}

              {/* Ver en mapa */}
              {municipio.lat && municipio.lng && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${municipio.lat},${municipio.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-all">
                  <MapPin className="w-4 h-4" /> Ver en Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── GALERÍA ── */}
        {tab === "galeria" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {fotos.map((foto, i) => {
                const url = foto?.url || foto;
                return (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => setGaleriaIdx(i)}>
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ATRACCIONES ── */}
        {tab === "atracciones" && (
          <div className="space-y-4">
            {/* Destacadas primero */}
            {atracciones.some(a => a.destacado) && (
              <div className="mb-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">⭐ Destacadas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  {atracciones.filter(a => a.destacado).map(a => (
                    <AtraccionCard key={a.id} lugar={a} />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {atracciones.filter(a => !a.destacado).map(a => (
                <AtraccionCard key={a.id} lugar={a} />
              ))}
            </div>
            {atracciones.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sin atracciones registradas aún</p>
              </div>
            )}
          </div>
        )}

        {/* ── SERVICIOS TURÍSTICOS ── */}
        {tab === "servicios_t" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prestadores.map(p => <PrestadorCard key={p.id} prestador={p} />)}
          </div>
        )}

        {/* ── EVENTOS ── */}
        {tab === "eventos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {eventos.map(e => <EventoCard key={e.id} evento={e} municipioNombre={municipio.nombre} />)}
            {eventos.length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay eventos próximos</p>
              </div>
            )}
          </div>
        )}

        {/* ── NOTICIAS ── */}
        {tab === "noticias" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {noticias.map(n => {
              const cls = NOTICIA_COLOR[n.categoria] || NOTICIA_COLOR.default;
              return (
                <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {n.imagen_url && (
                    <img src={n.imagen_url} alt={n.titulo} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>{n.categoria}</span>
                      {n.created_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{n.titulo}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{n.contenido}</p>
                  </div>
                </div>
              );
            })}
            {noticias.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sin noticias recientes</p>
              </div>
            )}
          </div>
        )}

        {/* ── SERVICIOS DE EMERGENCIA ── */}
        {tab === "emergencias" && (
          <div className="space-y-5">
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                <strong>En caso de emergencia</strong> — llama directamente al número correspondiente o usa el botón de pánico en la parte inferior de la pantalla.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicios.map(s => {
                const cfg = TIPO_SERVICIO_CONFIG[s.tipo] || TIPO_SERVICIO_CONFIG.default;
                return (
                  <div key={s.id} className={`rounded-2xl p-5 border shadow-sm ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${cfg.color}`}>{s.tipo}</p>
                        <h3 className="font-semibold text-gray-900">{s.nombre}</h3>
                        {s.direccion && <p className="text-xs text-gray-500 mt-0.5">{s.direccion}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {s.telefono_emergencia && (
                        <a href={`tel:${s.telefono_emergencia}`}
                          className="flex items-center gap-2 text-sm font-bold text-red-600 hover:underline">
                          <Phone className="w-4 h-4" /> {s.telefono_emergencia}
                          <span className="text-xs font-normal text-red-400">(Emergencias)</span>
                        </a>
                      )}
                      {s.telefono && s.telefono !== s.telefono_emergencia && (
                        <a href={`tel:${s.telefono}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:underline">
                          <Phone className="w-4 h-4" /> {s.telefono}
                        </a>
                      )}
                    </div>

                    {s.descripcion && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{s.descripcion}</p>
                    )}

                    {s.lat && s.lng && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:underline">
                        <Navigation className="w-3.5 h-3.5" /> Ver ubicación
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {servicios.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sin servicios de emergencia registrados</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <PanicButton />

      {/* Modal galería */}
      {galeriaIdx !== null && (
        <GaleriaModal
          fotos={fotos}
          idx={galeriaIdx}
          onClose={() => setGaleriaIdx(null)}
        />
      )}
    </div>
  );
};

// ── Componente AtraccionCard ──────────────────────────────────
const AtraccionCard = ({ lugar }) => (
  <Link to={`/atraccion/${lugar.id}`} className="block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
    <div className="relative h-48 bg-gray-100 overflow-hidden">
      {lugar.foto_portada || lugar.fotos?.[0]
        ? <img src={lugar.foto_portada || lugar.fotos[0]} alt={lugar.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-emerald-100">
            {lugar.tipo === "Natural" ? "🌿" : lugar.tipo === "Cultural" || lugar.tipo === "Histórico" ? "🏛️" : lugar.tipo === "Aventura" ? "🎯" : "📍"}
          </div>}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 capitalize">{lugar.tipo}</span>
      </div>
      {lugar.destacado && (
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" /> Destacado
        </span>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>{lugar.nombre}</h3>
      {lugar.descripcion && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{lugar.descripcion}</p>}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-3">
          {lugar.costo_min !== undefined && (
            <span className="font-medium text-gray-700">
              {lugar.costo_min === 0 ? "✅ Gratis" : `💲 $${lugar.costo_min}${lugar.costo_max && lugar.costo_max !== lugar.costo_min ? `–$${lugar.costo_max}` : ""}`}
            </span>
          )}
          {lugar.horarios && <span className="truncate max-w-[140px]">🕐 {lugar.horarios}</span>}
        </div>
      </div>

      {lugar.recomendaciones && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2 mb-2">💡 {lugar.recomendaciones}</p>
      )}

      {lugar.lat && lugar.lng && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`}
          target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] hover:underline mt-1">
          <Navigation className="w-3.5 h-3.5" /> Cómo llegar
        </a>
      )}
    </div>
  </Link>
);

export default MunicipioPage;