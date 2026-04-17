import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin, Star, Phone, Globe, Clock, Users, MessageCircle,
  Share2, Heart, ArrowLeft, ChevronLeft, ChevronRight,
  BadgeCheck, Instagram, Facebook, Calendar, Navigation,
  CheckCircle, Loader2, X, Camera, Utensils, Hotel, Car,
  Package, ExternalLink, CreditCard, Tag
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers de tipo ───────────────────────────────────────────
const norm = (s) => s?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

const TIPO_CONFIG = {
  HOSPEDAJE:   { color: "#1565C0", label: "Hospedaje" },
  HOTEL:       { color: "#1565C0", label: "Hotel" },
  HOSTAL:      { color: "#1565C0", label: "Hostal" },
  CABANA:      { color: "#2E7D32", label: "Cabaña" },
  GLAMPING:    { color: "#2E7D32", label: "Glamping" },
  POSADA:      { color: "#1565C0", label: "Posada" },
  GASTRONOMIA: { color: "#D32F2F", label: "Restaurante" },
  CAFETERIA:   { color: "#6D4C41", label: "Cafetería" },
  BAR:         { color: "#4A148C", label: "Bar" },
  BEBIDAS:     { color: "#0277BD", label: "Bebidas" },
  RESTAURANTE: { color: "#D32F2F", label: "Restaurante" },
  FOOD_TRUCK:  { color: "#E65100", label: "Food Truck" },
  PUESTO:      { color: "#E65100", label: "Puesto" },
  TURISMO:     { color: "#2E7D32", label: "Tour / Actividad" },
  TRANSPORTE:  { color: "#E65100", label: "Transporte" },
  SERVICIOS:   { color: "#546E7A", label: "Servicio" },
  default:     { color: "#1B5E20", label: "Negocio" },
};
const getTipo = (t) => TIPO_CONFIG[norm(t)] || TIPO_CONFIG.default;

const TIPOS_MENU = ["GASTRONOMIA","GASTRONOMIA","CAFETERIA","BAR","BEBIDAS","RESTAURANTE","FOOD_TRUCK","PUESTO"];
const TIPOS_HAB  = ["HOSPEDAJE","HOTEL","HOSTAL","CABANA","CABANA","GLAMPING","POSADA","BNB","HACIENDA","VILLA"];
const TIPOS_TOUR = ["TURISMO","TOUR","ECOTURISMO","AVENTURA","EXCURSION","ACTIVIDAD"];
const TIPOS_TRANS = ["TRANSPORTE","TRASLADO","RENTA","VEHICULO","TAXI","SHUTTLE","BUS","LANCHA"];

const esMenuTipo = (t) => TIPOS_MENU.includes(norm(t));
const esHabTipo  = (t) => TIPOS_HAB.includes(norm(t));
const esTourTipo = (t) => TIPOS_TOUR.includes(norm(t));
const esTransTipo = (t) => TIPOS_TRANS.includes(norm(t));

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

// ── Chip de etiqueta ──────────────────────────────────────────
const Chip = ({ label, color = "#1B5E20" }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
    style={{ backgroundColor: `${color}12`, color, borderColor: `${color}30` }}>
    {label}
  </span>
);

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
      <img src={fotos[current].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{current + 1} / {fotos.length}</p>
    </div>
  );
};

// ── Modal de Reserva ──────────────────────────────────────────
const ReservaModal = ({ prestador, servicio, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fecha_reserva: "", num_personas: 2, nota_turista: "" });
  const [loading, setLoading] = useState(false);
  const tipoConf = getTipo(prestador.tipo);

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
      onClose();
    } catch { toast.error("Error al enviar la reserva."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{ animation: "slideUp .2s ease-out" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 text-lg">
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
                {servicio.precio_promocional
                  ? <><p className="text-xs text-gray-400 line-through">${servicio.precio}</p><p className="font-bold text-green-600">${servicio.precio_promocional} MXN</p></>
                  : <p className="font-bold text-gray-900">${servicio.precio} MXN</p>}
              </div>
            </div>
          )}

          {/* Nota de reserva de hospedaje */}
          {prestador.reservas_notas && (
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-xs text-blue-700">
              ℹ️ {prestador.reservas_notas}
            </div>
          )}
          {/* Nota de reserva de mesa */}
          {prestador.reservas_mesa_notas && !servicio && (
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
              🪑 {prestador.reservas_mesa_notas}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Fecha</label>
              <input type="date" value={form.fecha_reserva} min={new Date().toISOString().split("T")[0]}
                onChange={e => setForm({ ...form, fecha_reserva: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B5E20]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Personas</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm({ ...form, num_personas: Math.max(1, form.num_personas - 1) })}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">−</button>
                <span className="text-xl font-bold text-gray-900 w-8 text-center">{form.num_personas}</span>
                <button onClick={() => setForm({ ...form, num_personas: Math.min(20, form.num_personas + 1) })}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nota para el prestador (opcional)</label>
              <textarea value={form.nota_turista} onChange={e => setForm({ ...form, nota_turista: e.target.value })}
                placeholder="Alergias, preferencias, horario preferido..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1B5E20]" rows={3} />
            </div>
          </div>

          <button onClick={reservar} disabled={loading}
            className="mt-5 w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: tipoConf.color }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {loading ? "Enviando..." : isAuthenticated ? "Enviar reserva" : "Inicia sesión para reservar"}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">Sin cobro ahora · El prestador confirmará tu reserva</p>
        </div>
      </div>
    </div>
  );
};

// ── Horarios por día ──────────────────────────────────────────
const HorariosDia = ({ horarios }) => {
  if (!horarios || Object.keys(horarios).length === 0) return null;
  return (
    <div className="space-y-1.5">
      {DIAS.map(dia => {
        const info = horarios[dia];
        if (!info) return null;
        return (
          <div key={dia} className="flex items-center justify-between text-xs">
            <span className={`font-medium w-20 ${info.activo ? "text-gray-700" : "text-gray-400"}`}>{dia}</span>
            <span className={info.activo ? "text-gray-600" : "text-gray-400"}>
              {info.activo ? `${info.apertura} – ${info.cierre}` : "Cerrado"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
const PrestadorPage = () => {
  const { prestadorId } = useParams();
  const { isAuthenticated } = useAuth();

  const [prestador,    setPrestador]    = useState(null);
  const [imagenes,     setImagenes]     = useState([]);
  const [servicios,    setServicios]    = useState([]);
  const [menu,         setMenu]         = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [promociones,  setPromociones]  = useState([]);
  const [resenas,      setResenas]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  const [catFoto,      setCatFoto]      = useState("general");
  const [galeriaModal, setGaleriaModal] = useState(null);
  const [reservaModal, setReservaModal] = useState(null);
  const [isFav,        setIsFav]        = useState(false);
  const [tab,          setTab]          = useState("info");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pRes, imgRes, svcRes] = await Promise.all([
          axios.get(`${API}/prestadores/${prestadorId}`),
          axios.get(`${API}/prestadores/${prestadorId}/imagenes`),
          axios.get(`${API}/prestadores/${prestadorId}/servicios`),
        ]);
        const p = pRes.data;
        setPrestador(p);
        setImagenes(imgRes.data.imagenes || []);
        setServicios(svcRes.data.servicios || []);

        // Cargar extras según tipo — normalizado para evitar bugs de acentos
        const promises = [];
        if (esMenuTipo(p.tipo)) promises.push(
          axios.get(`${API}/prestadores/${prestadorId}/menu`).catch(() => ({ data: { categorias: [] } }))
        );
        if (esHabTipo(p.tipo)) promises.push(
          axios.get(`${API}/prestadores/${prestadorId}/habitaciones`).catch(() => ({ data: { habitaciones: [] } }))
        );
        const extras = await Promise.all(promises);
        let idx = 0;
        if (esMenuTipo(p.tipo)) { setMenu(extras[idx]?.data?.categorias || []); idx++; }
        if (esHabTipo(p.tipo))  { setHabitaciones(extras[idx]?.data?.habitaciones || []); }

        const [promoRes, resenasRes] = await Promise.all([
          axios.get(`${API}/prestadores/${prestadorId}/promociones`).catch(() => ({ data: { promociones: [] } })),
          axios.get(`${API}/resenas?prestador_id=${prestadorId}`).catch(() => ({ data: [] })),
        ]);
        setPromociones(promoRes.data.promociones || []);
        setResenas(Array.isArray(resenasRes.data) ? resenasRes.data : []);

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

  const handlePedidoWhatsapp = () => {
    const msg = prestador.pedidos_whatsapp_mensaje || `Hola, vi tu perfil en Veracruz Contigo y me gustaría hacer un pedido en ${prestador.nombre}.`;
    const num = prestador.whatsapp?.replace(/\D/g, "");
    if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
    axios.post(`${API}/analytics/track`, { event_type: "contact", target_type: "prestador", target_id: prestadorId }).catch(() => {});
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: prestador.nombre, url: window.location.href });
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

  if (!prestador) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <p className="text-gray-500 mb-4">Prestador no encontrado</p>
        <Link to="/prestadores" className="text-[#1B5E20] font-semibold hover:underline">← Volver</Link>
      </div>
    </div>
  );

  const tipoConf    = getTipo(prestador.tipo);
  const portada     = imagenes.find(i => i.es_portada) || imagenes[0];
  const promoActiva = promociones.find(p => p.activa);
  const fotosCat    = catFoto === "general" ? imagenes : imagenes.filter(i => i.categoria === catFoto);
  const avgRating   = resenas.length
    ? (resenas.reduce((a, r) => a + r.calificacion, 0) / resenas.length).toFixed(1)
    : null;

  const tieneMenu  = menu.length > 0 || prestador.menu_url;
  const tieneHabs  = habitaciones.length > 0;

  const tabs = [
    { v: "info",         l: "Info" },
    ...(tieneMenu        ? [{ v: "menu",         l: "Menú" }]          : []),
    ...(tieneHabs        ? [{ v: "habitaciones", l: "Habitaciones" }]  : []),
    ...(servicios.length ? [{ v: "servicios",    l: `Servicios (${servicios.length})` }] : []),
    ...(imagenes.length  ? [{ v: "galeria",      l: `Fotos (${imagenes.length})` }]    : []),
    ...(resenas.length   ? [{ v: "resenas",      l: `Reseñas (${resenas.length})` }]   : []),
  ];

  // ── render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {portada?.url
          ? <img src={portada.url} alt={prestador.nombre} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-8xl font-black"
              style={{ background: `linear-gradient(135deg, ${tipoConf.color}22, ${tipoConf.color}55)` }}>
              {prestador.nombre?.charAt(0)}
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-20 left-0 right-0 px-4 md:px-8 flex items-center justify-between z-10">
          <Link to="/prestadores">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-800 backdrop-blur-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver
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
            {/* Badges superiores */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: `${tipoConf.color}dd` }}>
                {tipoConf.label}
                {prestador.subcategoria_gastronomica && ` · ${prestador.subcategoria_gastronomica}`}
                {prestador.subcategoria_turismo && ` · ${prestador.subcategoria_turismo}`}
                {prestador.subcategoria_transporte && ` · ${prestador.subcategoria_transporte}`}
                {prestador.subcategoria_servicio && ` · ${prestador.subcategoria_servicio}`}
              </span>
              {prestador.verificado && (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              )}
              {/* Estado abierto/cerrado */}
              {prestador.esta_abierto !== undefined && prestador.esta_abierto !== null && (
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                  prestador.esta_abierto ? "bg-green-500 text-white" : "bg-red-500/90 text-white"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${prestador.esta_abierto ? "bg-white" : "bg-white"}`} />
                  {prestador.esta_abierto ? "Abierto ahora" : "Cerrado ahora"}
                </span>
              )}
              {promoActiva && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-900">
                  🎁 {promoActiva.descuento_pct}% OFF
                </span>
              )}
            </div>

            {/* Nombre + logo */}
            <div className="flex items-end gap-4 mb-3">
              {prestador.logo_url && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-lg border-2 border-white/30">
                  <img src={prestador.logo_url} className="w-full h-full object-contain p-1" alt="Logo" />
                </div>
              )}
              <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg leading-tight"
                style={{ fontFamily: "Playfair Display, serif" }}>
                {prestador.nombre}
              </h1>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
              {prestador.direccion && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{prestador.direccion}</span>
              )}
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <strong className="text-white">{avgRating}</strong>
                  <span className="text-white/60">({resenas.length})</span>
                </span>
              )}
              {/* Precio */}
              {(prestador.precio_min || prestador.precio_noche_desde) && (
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  💰 Desde ${prestador.precio_min || prestador.precio_noche_desde} MXN
                  {(prestador.precio_max || prestador.precio_noche_hasta) && ` – $${prestador.precio_max || prestador.precio_noche_hasta}`}
                </span>
              )}
              {prestador.horarios && (
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{prestador.horarios}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BARRA STICKY DE TABS ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto gap-1" style={{ scrollbarWidth: "none" }}>
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
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ backgroundColor: tipoConf.color }}>
            <Calendar className="w-4 h-4" /> Reservar
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-5xl mx-auto px-4 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── TAB INFO ── */}
            {tab === "info" && (
              <>
                {/* Descripción */}
                {(prestador.descripcion || prestador.descripcion_larga) && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="font-bold text-gray-900 text-xl mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                      Acerca de {prestador.nombre}
                    </h2>
                    {prestador.descripcion && (
                      <p className="text-gray-600 text-sm leading-relaxed">{prestador.descripcion}</p>
                    )}
                    {prestador.descripcion_larga && (
                      <p className="text-gray-500 text-sm leading-relaxed mt-3 pl-4 border-l-2"
                        style={{ borderColor: tipoConf.color }}>
                        {prestador.descripcion_larga}
                      </p>
                    )}
                  </div>
                )}

                {/* Promo activa */}
                {promoActiva && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5 text-amber-900">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-black">{promoActiva.descuento_pct}%</span>
                      <div>
                        <p className="font-bold text-lg">🎁 {promoActiva.titulo}</p>
                        {promoActiva.descripcion && <p className="text-sm opacity-80">{promoActiva.descripcion}</p>}
                        <p className="text-xs mt-1 opacity-70">Válido hasta {promoActiva.fecha_fin}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Etiquetas / Tags */}
                {(prestador.etiquetas?.length > 0 || prestador.etiquetas_hospedaje?.length > 0 ||
                  prestador.etiquetas_turismo?.length > 0 || prestador.etiquetas_transporte?.length > 0 ||
                  prestador.etiquetas_servicio?.length > 0) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Características
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ...(prestador.etiquetas || []),
                        ...(prestador.etiquetas_hospedaje || []),
                        ...(prestador.etiquetas_turismo || []),
                        ...(prestador.etiquetas_transporte || []),
                        ...(prestador.etiquetas_servicio || []),
                        ...(prestador.etiquetas_bebidas || []),
                      ].map(e => <Chip key={e} label={e} color={tipoConf.color} />)}
                    </div>
                  </div>
                )}

                {/* Momentos ideales */}
                {prestador.momentos?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⏰ Ideal para</h3>
                    <div className="flex flex-wrap gap-2">
                      {prestador.momentos.map(m => (
                        <span key={m} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tipos de bebidas */}
                {prestador.tipo_bebidas?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🍹 Bebidas que ofrecemos</h3>
                    <div className="flex flex-wrap gap-2">
                      {prestador.tipo_bebidas.map(b => <Chip key={b} label={b} color="#0277BD" />)}
                    </div>
                  </div>
                )}

                {/* Info específica por tipo */}

                {/* HOSPEDAJE */}
                {esHabTipo(prestador.tipo) && (prestador.checkin_desde || prestador.amenidades_hotel?.length > 0) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">🏨 Información del hospedaje</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {prestador.precio_noche_desde && (
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                          <p className="text-xl font-black text-blue-700">${prestador.precio_noche_desde}</p>
                          <p className="text-[10px] text-blue-500 uppercase tracking-wide">desde/noche</p>
                        </div>
                      )}
                      {prestador.checkin_desde && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-lg font-bold text-gray-700">{prestador.checkin_desde}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-in</p>
                        </div>
                      )}
                      {prestador.checkout_hasta && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-lg font-bold text-gray-700">{prestador.checkout_hasta}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Check-out</p>
                        </div>
                      )}
                      {prestador.num_habitaciones && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-xl font-black text-gray-700">{prestador.num_habitaciones}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Habitaciones</p>
                        </div>
                      )}
                    </div>

                    {prestador.checkin_notas && (
                      <div className="mb-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                        ℹ️ {prestador.checkin_notas}
                      </div>
                    )}
                    {prestador.desayuno_incluido && (
                      <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700">
                        🍳 <span className="font-semibold">Desayuno incluido</span>
                      </div>
                    )}
                    {prestador.amenidades_hotel?.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenidades</p>
                        <div className="flex flex-wrap gap-2">
                          {prestador.amenidades_hotel.map(a => (
                            <span key={a} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">{a}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {prestador.politica_cancelacion && (
                      <p className="mt-4 text-xs text-gray-500">📋 Cancelación: {prestador.politica_cancelacion}</p>
                    )}
                    {prestador.politica_mascotas && (
                      <p className="mt-1 text-xs text-green-600">🐾 Se aceptan mascotas</p>
                    )}
                  </div>
                )}

                {/* TURISMO */}
                {esTourTipo(prestador.tipo) && (prestador.duracion_tour || prestador.amenidades_tour?.length > 0) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">🗺️ Detalles del tour</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {prestador.duracion_tour && (
                        <div className="p-3 bg-green-50 rounded-xl">
                          <p className="text-xs text-green-500 uppercase tracking-wide mb-1">Duración</p>
                          <p className="text-sm font-bold text-green-800">{prestador.duracion_tour}</p>
                        </div>
                      )}
                      {(prestador.min_personas || prestador.max_personas) && (
                        <div className="p-3 bg-green-50 rounded-xl">
                          <p className="text-xs text-green-500 uppercase tracking-wide mb-1">Personas</p>
                          <p className="text-sm font-bold text-green-800">
                            {prestador.min_personas && `Mín. ${prestador.min_personas}`}
                            {prestador.min_personas && prestador.max_personas && " – "}
                            {prestador.max_personas && `Máx. ${prestador.max_personas}`}
                          </p>
                        </div>
                      )}
                      {prestador.punto_salida && (
                        <div className="p-3 bg-green-50 rounded-xl">
                          <p className="text-xs text-green-500 uppercase tracking-wide mb-1">Salida desde</p>
                          <p className="text-sm font-bold text-green-800">{prestador.punto_salida}</p>
                        </div>
                      )}
                    </div>

                    {/* Incluye */}
                    {(prestador.incluye_transporte || prestador.incluye_alimentacion || prestador.incluye_equipo || prestador.incluye_guia) && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✅ Incluye</p>
                        <div className="flex flex-wrap gap-2">
                          {prestador.incluye_transporte    && <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">🚗 Transporte</span>}
                          {prestador.incluye_alimentacion  && <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">🍽️ Alimentación</span>}
                          {prestador.incluye_equipo        && <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">🎒 Equipo</span>}
                          {prestador.incluye_guia          && <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">🧭 Guía certificado</span>}
                        </div>
                      </div>
                    )}

                    {prestador.idiomas_guia?.length > 0 && (
                      <p className="text-xs text-gray-500 mb-3">🌐 Idiomas: {prestador.idiomas_guia.join(", ")}</p>
                    )}

                    {prestador.amenidades_tour?.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Equipamiento</p>
                        <div className="flex flex-wrap gap-2">
                          {prestador.amenidades_tour.map(a => (
                            <span key={a} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-200">{a}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TRANSPORTE */}
                {esTransTipo(prestador.tipo) && (prestador.marca_vehiculo || prestador.amenidades_vehiculo?.length > 0) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">🚗 Datos del servicio</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {prestador.marca_vehiculo && (
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-xs text-orange-500 uppercase tracking-wide mb-1">Vehículo</p>
                          <p className="text-sm font-bold text-orange-800">
                            {[prestador.marca_vehiculo, prestador.modelo_vehiculo, prestador.anio_vehiculo].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      )}
                      {prestador.capacidad_vehiculo && (
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-xs text-orange-500 uppercase tracking-wide mb-1">Capacidad</p>
                          <p className="text-sm font-bold text-orange-800">{prestador.capacidad_vehiculo} personas</p>
                        </div>
                      )}
                      {prestador.tarifa_base && (
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-xs text-orange-500 uppercase tracking-wide mb-1">Tarifa base</p>
                          <p className="text-sm font-bold text-orange-800">${prestador.tarifa_base} MXN</p>
                        </div>
                      )}
                    </div>
                    {prestador.servicio_24h && <p className="text-xs text-green-600 mb-3 font-semibold">⏰ Servicio disponible 24 horas</p>}
                    {prestador.cobertura_zonas && (
                      <p className="text-xs text-gray-500 mb-3">📍 Cobertura: {prestador.cobertura_zonas}</p>
                    )}
                    {prestador.amenidades_vehiculo?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {prestador.amenidades_vehiculo.map(a => (
                          <span key={a} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-200">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SERVICIOS genérico */}
                {!esTourTipo(prestador.tipo) && !esTransTipo(prestador.tipo) && !esMenuTipo(prestador.tipo) && !esHabTipo(prestador.tipo) &&
                  (prestador.modalidad_servicio || prestador.duracion_sesion || prestador.certificaciones) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">💼 Detalles del servicio</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {prestador.modalidad_servicio && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Modalidad</p>
                          <p className="text-sm font-bold text-gray-800">{prestador.modalidad_servicio}</p>
                        </div>
                      )}
                      {prestador.duracion_sesion && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duración</p>
                          <p className="text-sm font-bold text-gray-800">{prestador.duracion_sesion}</p>
                        </div>
                      )}
                      {prestador.precio_sesion && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Precio sesión</p>
                          <p className="text-sm font-bold text-gray-800">${prestador.precio_sesion} MXN</p>
                        </div>
                      )}
                    </div>
                    {prestador.atiende_domicilio && <p className="text-xs text-green-600 mb-1.5">🏠 Atiende a domicilio</p>}
                    {prestador.requiere_cita && <p className="text-xs text-blue-600 mb-1.5">📅 Requiere cita previa</p>}
                    {prestador.certificaciones && (
                      <p className="text-xs text-gray-500 mt-2">🎓 {prestador.certificaciones}</p>
                    )}
                  </div>
                )}

                {/* Métodos de pago */}
                {prestador.metodos_pago?.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Métodos de pago
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {prestador.metodos_pago.map(m => (
                        <span key={m} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview galería */}
                {imagenes.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Galería</h3>
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

                {/* Preview servicios */}
                {servicios.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Servicios destacados</h3>
                      <button onClick={() => setTab("servicios")} className="text-sm font-medium hover:underline" style={{ color: tipoConf.color }}>
                        Ver todos →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {servicios.slice(0, 3).map(s => (
                        <div key={s.id} onClick={() => setReservaModal(s)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{s.nombre}</p>
                            {s.duracion && <p className="text-xs text-gray-500">⏱ {s.duracion}{s.capacidad ? ` · 👥 ${s.capacidad}p` : ""}</p>}
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            {s.precio_promocional
                              ? <><p className="text-xs text-gray-400 line-through">${s.precio}</p><p className="font-bold text-green-600 text-sm">${s.precio_promocional} MXN</p></>
                              : <p className="font-bold text-gray-900 text-sm">${s.precio} MXN</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB MENÚ ── */}
            {tab === "menu" && (
              <div className="space-y-5">
                {prestador.menu_url && (
                  <a href={prestador.menu_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors">
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">Ver menú digital completo</p>
                      <p className="text-xs text-blue-600 mt-0.5 truncate max-w-xs">{prestador.menu_url}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </a>
                )}
                {menu.length === 0 && !prestador.menu_url ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <Utensils className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Menú no disponible aún</p>
                  </div>
                ) : menu.map(cat => (
                  <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-100" style={{ backgroundColor: `${tipoConf.color}08` }}>
                      <h3 className="font-bold text-gray-900">{cat.nombre}</h3>
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
                            {!item.disponible && <span className="text-[11px] text-red-500 font-medium">Agotado</span>}
                          </div>
                          <p className="font-bold text-gray-900 text-sm flex-shrink-0">${item.precio} <span className="text-xs font-normal text-gray-400">MXN</span></p>
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
                {habitaciones.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {h.fotos?.length > 0 && (
                      <div className="relative">
                        <img src={h.fotos[0]} alt={h.nombre} className="w-full h-44 object-cover" />
                        {h.fotos.length > 1 && (
                          <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-lg">
                            +{h.fotos.length - 1} fotos
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{h.nombre}</h3>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-lg" style={{ color: tipoConf.color }}>${h.precio_noche}</p>
                          <p className="text-[10px] text-gray-400">MXN/noche</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <Users className="w-3 h-3" /> {h.capacidad} personas
                      </p>
                      {h.descripcion && <p className="text-xs text-gray-600 mb-3">{h.descripcion}</p>}
                      {h.amenidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {h.amenidades.slice(0, 5).map(a => (
                            <span key={a} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                          {h.amenidades.length > 5 && <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+{h.amenidades.length - 5}</span>}
                        </div>
                      )}
                      {h.disponible && (
                        <button onClick={() => setReservaModal({ nombre: h.nombre, precio: h.precio_noche, id: h.id })}
                          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: tipoConf.color }}>
                          Reservar habitación
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ backgroundColor: `${tipoConf.color}15` }}>
                        {tipoConf.label.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{s.nombre}</h3>
                            {s.descripcion && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.descripcion}</p>}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                              {s.duracion  && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duracion}</span>}
                              {s.capacidad && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Hasta {s.capacidad} personas</span>}
                              {!s.disponible && <span className="text-red-500 font-medium">No disponible</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.precio_promocional
                              ? <><p className="text-xs text-gray-400 line-through">${s.precio}</p><p className="font-bold text-green-600">${s.precio_promocional} MXN</p></>
                              : <p className="font-bold text-gray-900 text-lg">${s.precio} <span className="text-xs font-normal text-gray-500">MXN</span></p>}
                          </div>
                        </div>
                        {s.disponible && (
                          <button onClick={() => setReservaModal(s)}
                            className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
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

            {/* ── TAB GALERÍA ── */}
            {tab === "galeria" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["general","habitaciones","comida","tours","vehiculos","instalaciones"]
                    .filter(c => c === "general" || imagenes.some(i => i.categoria === c))
                    .map(c => (
                      <button key={c} onClick={() => setCatFoto(c)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${catFoto === c ? "text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
                        style={catFoto === c ? { backgroundColor: tipoConf.color } : {}}>
                        {c} ({c === "general" ? imagenes.length : imagenes.filter(i => i.categoria === c).length})
                      </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotosCat.map((img, i) => (
                    <div key={img.id} className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative"
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
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-5xl font-black text-gray-900">{avgRating}</p>
                      <div className="flex justify-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-amber-400 fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{resenas.length} reseñas</p>
                    </div>
                  </div>
                )}
                {resenas.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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

            {/* Contacto y acciones */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Contactar</h3>
              <div className="space-y-2.5">
                {/* Pedido por WhatsApp — si está activo */}
                {prestador.pedidos_whatsapp_activo && prestador.whatsapp && (
                  <button onClick={handlePedidoWhatsapp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-colors"
                    style={{ backgroundColor: "#25D366" }}>
                    <MessageCircle className="w-4 h-4" /> Hacer pedido por WhatsApp
                  </button>
                )}
                {/* WhatsApp normal */}
                {prestador.whatsapp && !prestador.pedidos_whatsapp_activo && (
                  <button onClick={() => handleContact("whatsapp")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                )}
                {prestador.whatsapp && prestador.pedidos_whatsapp_activo && (
                  <button onClick={() => handleContact("whatsapp")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-200 text-green-700 font-medium text-sm hover:bg-green-50 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Solo chatear
                  </button>
                )}
                {prestador.telefono && (
                  <button onClick={() => handleContact("phone")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" /> {prestador.telefono}
                  </button>
                )}
                {/* Reserva de mesa */}
                {prestador.reservas_mesa_activas && (
                  <button onClick={() => setReservaModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-colors hover:opacity-90"
                    style={{ borderColor: tipoConf.color, color: tipoConf.color, backgroundColor: `${tipoConf.color}08` }}>
                    🪑 Reservar mesa
                    {prestador.reservas_mesa_capacidad && <span className="text-xs font-normal">(hasta {prestador.reservas_mesa_capacidad} personas)</span>}
                  </button>
                )}
                <button onClick={() => setReservaModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: tipoConf.color }}>
                  <Calendar className="w-4 h-4" /> Hacer una reserva
                </button>
              </div>
            </div>

            {/* Información */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Información</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {/* Estado abierto/cerrado */}
                {prestador.esta_abierto !== undefined && prestador.esta_abierto !== null && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    prestador.esta_abierto ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${prestador.esta_abierto ? "bg-green-500" : "bg-red-500"}`} />
                    {prestador.esta_abierto ? "Abierto ahora" : "Cerrado ahora"}
                  </div>
                )}
                {prestador.horarios && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tipoConf.color }} />
                    <span>{prestador.horarios}</span>
                  </div>
                )}
                {/* Horarios detallados */}
                {prestador.horarios_detallados && Object.values(prestador.horarios_detallados).some(d => d?.activo) && (
                  <div className="pt-2 border-t border-gray-100">
                    <HorariosDia horarios={prestador.horarios_detallados} />
                  </div>
                )}
                {prestador.direccion && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tipoConf.color }} />
                    <span>{prestador.direccion}</span>
                  </div>
                )}
                {prestador.capacidad_personas && (
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 flex-shrink-0" style={{ color: tipoConf.color }} />
                    <span>Capacidad: {prestador.capacidad_personas} personas</span>
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
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Redes sociales</h3>
                <div className="flex gap-3">
                  {prestador.instagram && (
                    <a href={`https://instagram.com/${prestador.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-90">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.facebook && (
                    <a href={`https://facebook.com/${prestador.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:opacity-90">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.tiktok && (
                    <a href={`https://tiktok.com/@${prestador.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white hover:opacity-90 text-xs font-bold">
                      TK
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Google Maps */}
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

      {galeriaModal && (
        <GaleriaModal fotos={galeriaModal.fotos} idx={galeriaModal.idx} onClose={() => setGaleriaModal(null)} />
      )}
      {reservaModal && (
        <ReservaModal
          prestador={prestador}
          servicio={reservaModal === true ? null : reservaModal}
          onClose={() => setReservaModal(null)}
        />
      )}
    </div>
  );
};

export default PrestadorPage;