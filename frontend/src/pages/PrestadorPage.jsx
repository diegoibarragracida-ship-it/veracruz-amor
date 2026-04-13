import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin, Star, Phone, Globe, Clock, Users, DollarSign,
  MessageCircle, Share2, Heart, ArrowLeft, ChevronLeft,
  ChevronRight, BadgeCheck, Instagram, Facebook, Calendar,
  Tag, Utensils, Hotel, Car, Package, Navigation,
  CheckCircle, Loader2, X, Camera
} from "lucide-react";
import { toast } from "sonner";

/* ─── helpers ─────────────────────────────────────────────── */
const TIPO_CONFIG = {
  HOSPEDAJE:   { emoji: "🏨", color: "#1565C0", label: "Hospedaje" },
  GASTRONOMÍA: { emoji: "🍽️", color: "#D32F2F", label: "Restaurante" },
  TURISMO:     { emoji: "🗺️", color: "#2E7D32", label: "Tour / Actividad" },
  TRANSPORTE:  { emoji: "🚗", color: "#E65100", label: "Transporte" },
  default:     { emoji: "📍", color: "#546E7A", label: "Servicio" },
};
const getTipo = (t) => TIPO_CONFIG[t] || TIPO_CONFIG.default;

const CATEGORIAS_GALERIA = ["general","habitaciones","comida","tours","vehiculos","instalaciones"];

/* ─── Galería fullscreen ──────────────────────────────────── */
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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
        <X className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}
        className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.min(c + 1, fotos.length - 1))} disabled={current === fotos.length - 1}
        className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30">
        <ChevronRight className="w-5 h-5" />
      </button>
      <img src={fotos[current].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{current + 1} / {fotos.length}</p>
    </div>
  );
};

/* ─── Modal de Reserva ────────────────────────────────────── */
const ReservaModal = ({ prestador, servicio, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fecha_reserva: "", num_personas: 2, nota_turista: "" });
  const [loading, setLoading] = useState(false);

  const reservar = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!form.fecha_reserva) return toast.error("Selecciona una fecha");
    setLoading(true);
    try {
      await axios.post(`${API}/reservas`, {
        prestador_id: prestador.id,
        servicio_id: servicio?.id || null,
        ...form,
        num_personas: parseInt(form.num_personas),
      });
      toast.success("¡Reserva enviada! El prestador confirmará pronto.");
      onSuccess();
      onClose();
    } catch { toast.error("Error al enviar la reserva. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp .2s ease-out" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
              {servicio ? `Reservar: ${servicio.nombre}` : `Reservar en ${prestador.nombre}`}
            </h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {servicio && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{servicio.nombre}</p>
                {servicio.duracion && <p className="text-xs text-gray-500 mt-0.5">⏱ {servicio.duracion}</p>}
              </div>
              <div className="text-right">
                {servicio.precio_promocional ? (
                  <>
                    <p className="text-xs text-gray-400 line-through">${servicio.precio}</p>
                    <p className="font-bold text-green-600">${servicio.precio_promocional} MXN</p>
                  </>
                ) : (
                  <p className="font-bold text-gray-900">${servicio.precio} MXN</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Fecha</label>
              <input type="date" value={form.fecha_reserva} min={new Date().toISOString().split("T")[0]}
                onChange={e => setForm({...form, fecha_reserva: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B5E20]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Personas</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm({...form, num_personas: Math.max(1, form.num_personas - 1)})}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">−</button>
                <span className="text-xl font-bold text-gray-900 w-8 text-center">{form.num_personas}</span>
                <button onClick={() => setForm({...form, num_personas: Math.min(20, form.num_personas + 1)})}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nota para el prestador (opcional)</label>
              <textarea value={form.nota_turista} onChange={e => setForm({...form, nota_turista: e.target.value})}
                placeholder="Alergias, preferencias, horario preferido..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1B5E20]" rows={3} />
            </div>
          </div>

          <button onClick={reservar} disabled={loading}
            className="mt-5 w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: getTipo(prestador.tipo).color }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? "Enviando..." : isAuthenticated ? "Enviar reserva" : "Inicia sesión para reservar"}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Sin cobro ahora · El prestador confirmará tu reserva</p>
        </div>
      </div>
    </div>
  );
};

/* ─── PÁGINA PRINCIPAL ────────────────────────────────────── */
const PrestadorPage = () => {
  const { prestadorId } = useParams();
  const { isAuthenticated } = useAuth();

  const [prestador,  setPrestador]  = useState(null);
  const [imagenes,   setImagenes]   = useState([]);
  const [servicios,  setServicios]  = useState([]);
  const [menu,       setMenu]       = useState([]);
  const [habitaciones,setHabitaciones] = useState([]);
  const [promociones,setPromociones]= useState([]);
  const [resenas,    setResenas]    = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [catFoto,    setCatFoto]    = useState("general");
  const [galeriaModal, setGaleriaModal] = useState(null); // {fotos, idx}
  const [reservaModal, setReservaModal] = useState(null); // servicio o true
  const [isFav,      setIsFav]      = useState(false);
  const [tab,        setTab]        = useState("info");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pRes, imgRes, svcRes] = await Promise.all([
          axios.get(`${API}/prestadores/${prestadorId}`),
          axios.get(`${API}/prestadores/${prestadorId}/imagenes`),
          axios.get(`${API}/prestadores/${prestadorId}/servicios`),
        ]);
        setPrestador(pRes.data);
        setImagenes(imgRes.data.imagenes || []);
        setServicios(svcRes.data.servicios || []);

        // Cargar extras según tipo
        const tipo = pRes.data.tipo;
        const extras = [];
        if (tipo === "GASTRONOMÍA") extras.push(axios.get(`${API}/prestadores/${prestadorId}/menu`).catch(() => ({ data: { categorias: [] } })));
        if (tipo === "HOSPEDAJE")   extras.push(axios.get(`${API}/prestadores/${prestadorId}/habitaciones`).catch(() => ({ data: { habitaciones: [] } })));

        const [menuRes, habRes] = await Promise.all(extras);
        if (menuRes) setMenu(menuRes.data.categorias || []);
        if (habRes)  setHabitaciones(habRes.data.habitaciones || []);

        const [promoRes, resenasRes] = await Promise.all([
          axios.get(`${API}/prestadores/${prestadorId}/promociones`).catch(() => ({ data: { promociones: [] } })),
          axios.get(`${API}/resenas?prestador_id=${prestadorId}`).catch(() => []),
        ]);
        setPromociones(promoRes.data.promociones || []);
        setResenas(Array.isArray(resenasRes.data) ? resenasRes.data : []);

        // track view
        axios.post(`${API}/analytics/track`, { event_type: "view", target_type: "prestador", target_id: prestadorId }).catch(() => {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [prestadorId]);

  const handleFav = async () => {
    if (!isAuthenticated) { toast.error("Inicia sesión para guardar favoritos"); return; }
    try {
      await axios.post(`${API}/favoritos`, { tipo: "prestador", referencia_id: prestadorId });
      setIsFav(true); toast.success("Guardado en favoritos");
    } catch { toast.info("Ya está en tus favoritos"); setIsFav(true); }
  };

  const handleContact = (tipo) => {
    axios.post(`${API}/analytics/track`, { event_type: "contact", target_type: "prestador", target_id: prestadorId }).catch(() => {});
    if (tipo === "whatsapp") window.open(`https://wa.me/${prestador.whatsapp?.replace(/\D/g, "")}`, "_blank");
    if (tipo === "phone")    window.open(`tel:${prestador.telefono}`);
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: prestador.nombre, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success("Enlace copiado"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1B5E20]" />
      </div>
    </div>
  );

  if (!prestador) return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <p className="text-gray-500 mb-4">Prestador no encontrado</p>
        <Link to="/prestadores" className="text-[#1B5E20] font-semibold hover:underline">← Volver</Link>
      </div>
    </div>
  );

  const tipoConf   = getTipo(prestador.tipo);
  const portada    = imagenes.find(i => i.es_portada) || imagenes[0];
  const promoActiva = promociones.find(p => p.activa);
  const fotosCat   = catFoto === "general" ? imagenes : imagenes.filter(i => i.categoria === catFoto);
  const tabs       = [
    { v: "info",        l: "ℹ️ Info" },
    { v: "servicios",   l: `💰 Servicios (${servicios.length})` },
    ...(menu.length > 0 ? [{ v: "menu", l: "🍽️ Menú" }] : []),
    ...(habitaciones.length > 0 ? [{ v: "habitaciones", l: "🛏️ Habitaciones" }] : []),
    { v: "galeria",     l: `📸 Fotos (${imagenes.length})` },
    { v: "resenas",     l: `⭐ Reseñas (${resenas.length})` },
  ];

  const avgRating = resenas.length
    ? (resenas.reduce((a, r) => a + r.calificacion, 0) / resenas.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] overflow-hidden">
        {portada?.url ? (
          <img src={portada.url} alt={prestador.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: `linear-gradient(135deg, ${tipoConf.color}33, ${tipoConf.color}66)` }}>
            {tipoConf.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Back */}
        <div className="absolute top-24 left-4 md:left-8 z-10">
          <Link to="/prestadores">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-800 transition-colors backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          </Link>
        </div>

        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 z-10 flex gap-2">
          <button onClick={handleFav}
            className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-colors">
            <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
          </button>
          <button onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-colors">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Info sobre imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold px-3 py-1 rounded-full text-white backdrop-blur-sm"
                style={{ backgroundColor: `${tipoConf.color}cc` }}>
                {tipoConf.emoji} {tipoConf.label}
              </span>
              {prestador.verificado && (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              )}
              {promoActiva && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-900">
                  🎁 {promoActiva.descuento_pct}% OFF
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg"
              style={{ fontFamily: "Playfair Display, serif" }}>
              {prestador.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              {prestador.direccion && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{prestador.direccion}</span>
              )}
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <strong className="text-white">{avgRating}</strong> ({resenas.length} reseñas)
                </span>
              )}
              {prestador.horarios && (
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{prestador.horarios}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA STICKY ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            {tabs.map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                  tab === t.v ? "text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
                style={tab === t.v ? { backgroundColor: tipoConf.color } : {}}>
                {t.l}
              </button>
            ))}
          </div>
          <button onClick={() => setReservaModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: tipoConf.color }}>
            <Calendar className="w-4 h-4" /> Reservar
          </button>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── TAB INFO ── */}
            {tab === "info" && (
              <>
                {/* Descripción */}
                {prestador.descripcion && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h2 className="font-bold text-gray-900 text-xl mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                      Acerca de {prestador.nombre}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{prestador.descripcion}</p>
                    {prestador.descripcion_larga && (
                      <p className="text-gray-500 text-sm leading-relaxed mt-3 pl-4 border-l-2" style={{ borderColor: tipoConf.color }}>
                        {prestador.descripcion_larga}
                      </p>
                    )}
                  </div>
                )}

                {/* Promo activa */}
                {promoActiva && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 text-amber-900">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black">{promoActiva.descuento_pct}%</span>
                      <div>
                        <p className="font-bold text-lg">🎁 {promoActiva.titulo}</p>
                        {promoActiva.descripcion && <p className="text-sm opacity-80">{promoActiva.descripcion}</p>}
                        <p className="text-xs mt-1 opacity-70">Válido hasta {promoActiva.fecha_fin}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview servicios */}
                {servicios.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900">Servicios destacados</h2>
                      <button onClick={() => setTab("servicios")} className="text-sm font-medium hover:underline" style={{ color: tipoConf.color }}>
                        Ver todos →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {servicios.slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setReservaModal(s)}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{s.nombre}</p>
                            {s.duracion && <p className="text-xs text-gray-500 mt-0.5">⏱ {s.duracion}{s.capacidad ? ` · 👥 ${s.capacidad}p` : ""}</p>}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            {s.precio_promocional ? (
                              <>
                                <p className="text-[11px] text-gray-400 line-through">${s.precio}</p>
                                <p className="font-bold text-green-600 text-sm">${s.precio_promocional} MXN</p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900 text-sm">${s.precio} MXN</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview galería */}
                {imagenes.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900">Galería</h2>
                      <button onClick={() => setTab("galeria")} className="text-sm font-medium hover:underline" style={{ color: tipoConf.color }}>
                        Ver todas ({imagenes.length}) →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {imagenes.slice(0, 6).map((img, i) => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setGaleriaModal({ fotos: imagenes, idx: i })}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB SERVICIOS ── */}
            {tab === "servicios" && (
              <div className="space-y-3">
                {servicios.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin servicios publicados aún</p>
                  </div>
                ) : servicios.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${tipoConf.color}18` }}>
                        {tipoConf.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{s.nombre}</h3>
                            {s.descripcion && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.descripcion}</p>}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                              {s.duracion && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duracion}</span>}
                              {s.capacidad && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Hasta {s.capacidad} personas</span>}
                              {!s.disponible && <span className="text-red-500 font-medium">No disponible</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.precio_promocional ? (
                              <>
                                <p className="text-xs text-gray-400 line-through">${s.precio}</p>
                                <p className="font-bold text-green-600">${s.precio_promocional} MXN</p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900 text-lg">${s.precio} <span className="text-xs font-normal text-gray-500">MXN</span></p>
                            )}
                          </div>
                        </div>
                        {s.disponible && (
                          <button onClick={() => setReservaModal(s)}
                            className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                            style={{ backgroundColor: tipoConf.color }}>
                            Reservar este servicio
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB MENÚ ── */}
            {tab === "menu" && (
              <div className="space-y-5">
                {menu.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <Utensils className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Menú no disponible aún</p>
                  </div>
                ) : menu.map(cat => (
                  <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">🍽️ {cat.nombre}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {cat.items?.map(item => (
                        <div key={item.id} className={`flex items-center gap-4 px-5 py-3.5 ${!item.disponible ? "opacity-50" : ""}`}>
                          {item.foto_url && (
                            <img src={item.foto_url} alt={item.nombre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                            {item.descripcion && <p className="text-xs text-gray-500 mt-0.5">{item.descripcion}</p>}
                            {!item.disponible && <span className="text-xs text-red-500 font-medium">Agotado</span>}
                          </div>
                          <p className="font-bold text-gray-900 flex-shrink-0">${item.precio} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB HABITACIONES ── */}
            {tab === "habitaciones" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {habitaciones.length === 0 ? (
                  <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <Hotel className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin habitaciones publicadas aún</p>
                  </div>
                ) : habitaciones.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {h.fotos?.[0] && (
                      <img src={h.fotos[0]} alt={h.nombre} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">🛏️ {h.nombre}</h3>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold" style={{ color: tipoConf.color }}>${h.precio_noche} <span className="text-xs font-normal text-gray-400">MXN/noche</span></p>
                        </div>
                      </div>
                      {h.descripcion && <p className="text-xs text-gray-500 mb-3">{h.descripcion}</p>}
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{h.capacidad} personas</span>
                      </div>
                      {h.amenidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {h.amenidades.map(a => <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>)}
                        </div>
                      )}
                      {h.disponible && (
                        <button onClick={() => setReservaModal({ nombre: h.nombre, precio: h.precio_noche, id: h.id })}
                          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                          style={{ backgroundColor: tipoConf.color }}>
                          Reservar habitación
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB GALERÍA ── */}
            {tab === "galeria" && (
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap gap-2">
                  {["general", ...CATEGORIAS_GALERIA.slice(1).filter(c => imagenes.some(i => i.categoria === c))].map(c => (
                    <button key={c} onClick={() => setCatFoto(c)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                        catFoto === c ? "text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                      style={catFoto === c ? { backgroundColor: tipoConf.color } : {}}>
                      {c} ({c === "general" ? imagenes.length : imagenes.filter(i => i.categoria === c).length})
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotosCat.map((img, i) => (
                    <div key={img.id} className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group relative"
                      onClick={() => setGaleriaModal({ fotos: fotosCat, idx: i })}>
                      <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB RESEÑAS ── */}
            {tab === "resenas" && (
              <div className="space-y-4">
                {avgRating && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-5xl font-black text-gray-900">{avgRating}</p>
                      <div className="flex mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-amber-400 fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{resenas.length} reseñas</p>
                    </div>
                  </div>
                )}

                {resenas.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Sin reseñas aún. ¡Sé el primero en opinar!</p>
                  </div>
                ) : resenas.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.calificacion ? "text-amber-400 fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{r.fecha?.slice(0, 10)}</span>
                    </div>
                    {r.texto && <p className="text-sm text-gray-700 leading-relaxed">{r.texto}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Contacto */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Contactar</h3>
              <div className="space-y-3">
                {prestador.whatsapp && (
                  <button onClick={() => handleContact("whatsapp")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                )}
                {prestador.telefono && (
                  <button onClick={() => handleContact("phone")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" /> {prestador.telefono}
                  </button>
                )}
                <button onClick={() => setReservaModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: tipoConf.color }}>
                  <Calendar className="w-4 h-4" /> Hacer una reserva
                </button>
              </div>
            </div>

            {/* Info rápida */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Información</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {prestador.horarios && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tipoConf.color }} />
                    <span>{prestador.horarios}</span>
                  </div>
                )}
                {prestador.direccion && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tipoConf.color }} />
                    <span>{prestador.direccion}</span>
                  </div>
                )}
                {prestador.website && (
                  <a href={prestador.website.startsWith("http") ? prestador.website : `https://${prestador.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:underline" style={{ color: tipoConf.color }}>
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{prestador.website}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Redes sociales */}
            {(prestador.instagram || prestador.facebook || prestador.tiktok) && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">Redes sociales</h3>
                <div className="flex gap-3">
                  {prestador.instagram && (
                    <a href={`https://instagram.com/${prestador.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.facebook && (
                    <a href={`https://facebook.com/${prestador.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.tiktok && (
                    <a href={`https://tiktok.com/@${prestador.tiktok.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white hover:opacity-90 transition-opacity text-xs font-bold">
                      TK
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Maps */}
            {prestador.lat && prestador.lng && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${prestador.lat},${prestador.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-all">
                <Navigation className="w-4 h-4" /> Ver en Google Maps
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Modales */}
      {galeriaModal && (
        <GaleriaModal fotos={galeriaModal.fotos} idx={galeriaModal.idx} onClose={() => setGaleriaModal(null)} />
      )}
      {reservaModal && (
        <ReservaModal
          prestador={prestador}
          servicio={reservaModal === true ? null : reservaModal}
          onClose={() => setReservaModal(null)}
          onSuccess={() => {}}
        />
      )}

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

export default PrestadorPage;