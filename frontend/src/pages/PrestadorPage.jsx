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
  CheckCircle, Loader2, X, Camera, Send, Sparkles,
  TrendingUp, Award, ThumbsUp
} from "lucide-react";
import { toast } from "sonner";

/* ─── helpers ─────────────────────────────────────────────── */
const norm = (s) => (s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const TIPO_CONFIG = {
  HOSPEDAJE:   { emoji: "🏨", color: "#1565C0", label: "Hospedaje" },
  HOTEL:       { emoji: "🏨", color: "#1565C0", label: "Hotel" },
  HOSTAL:      { emoji: "🏨", color: "#1565C0", label: "Hostal" },
  CABANA:      { emoji: "🏕️", color: "#1565C0", label: "Cabaña" },
  GLAMPING:    { emoji: "⛺", color: "#1565C0", label: "Glamping" },
  POSADA:      { emoji: "🏠", color: "#1565C0", label: "Posada" },
  GASTRONOMIA: { emoji: "🍽️", color: "#D32F2F", label: "Restaurante" },
  CAFETERIA:   { emoji: "☕", color: "#D32F2F", label: "Cafetería" },
  BAR:         { emoji: "🍺", color: "#D32F2F", label: "Bar" },
  BEBIDAS:     { emoji: "🥤", color: "#D32F2F", label: "Bebidas" },
  RESTAURANTE: { emoji: "🍽️", color: "#D32F2F", label: "Restaurante" },
  FOOD_TRUCK:  { emoji: "🚚", color: "#D32F2F", label: "Food Truck" },
  PUESTO:      { emoji: "🌮", color: "#D32F2F", label: "Puesto" },
  TURISMO:     { emoji: "🗺️", color: "#2E7D32", label: "Tour / Actividad" },
  GUIA:        { emoji: "🧭", color: "#2E7D32", label: "Guía Turístico" },
  ACTIVIDAD:   { emoji: "⚡", color: "#2E7D32", label: "Actividad" },
  TRANSPORTE:  { emoji: "🚗", color: "#E65100", label: "Transporte" },
  COMERCIO:    { emoji: "🛍️", color: "#6A1B9A", label: "Comercio" },
  ECOTURISMO:  { emoji: "🌿", color: "#2E7D32", label: "Ecoturismo" },
  BIENESTAR:   { emoji: "💆", color: "#AD1457", label: "Bienestar" },
  CULTURA:     { emoji: "🎭", color: "#4527A0", label: "Cultura" },
  default:     { emoji: "📍", color: "#546E7A", label: "Servicio" },
};

const TIPOS_ALIMENTOS = ["GASTRONOMIA","CAFETERIA","BAR","BEBIDAS","RESTAURANTE","FOOD_TRUCK","PUESTO"];
const TIPOS_HOSPEDAJE = ["HOSPEDAJE","HOTEL","HOSTAL","CABANA","GLAMPING","POSADA"];
const esAlimentos = (t) => TIPOS_ALIMENTOS.includes(norm(t));
const esHospedaje = (t) => TIPOS_HOSPEDAJE.includes(norm(t));

const getTipo = (t) => TIPO_CONFIG[norm(t)] || TIPO_CONFIG.default;

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

/* ─── Sección de Reseñas ──────────────────────────────────── */
const StarRating = ({ value, onChange, size = "lg" }) => {
  const [hovered, setHovered] = useState(0);
  const s = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}>
          <Star className={`${s} transition-colors ${
            n <= (hovered || value)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }`} />
        </button>
      ))}
    </div>
  );
};

const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

const ResenasSection = ({ prestadorId, resenas, setResenas, avgRating, isAuthenticated, tipoConf }) => {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ calificacion: 0, texto: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent]     = useState(false);

  const dist = [5,4,3,2,1].map(n => ({
    n,
    count: resenas.filter(r => r.calificacion === n).length,
    pct: resenas.length ? Math.round(resenas.filter(r => r.calificacion === n).length / resenas.length * 100) : 0,
  }));

  const submit = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!form.calificacion) return toast.error("Selecciona una calificación");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/resenas`, { prestador_id: prestadorId, ...form });
      setResenas(prev => [res.data, ...prev]);
      setForm({ calificacion: 0, texto: "" });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      toast.success("¡Reseña publicada!");
    } catch { toast.error("Error al publicar. Intenta de nuevo."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">

      {/* ── Resumen visual ── */}
      {resenas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
            {/* Score grande */}
            <div className="text-center flex-shrink-0">
              <p className="text-7xl font-black tracking-tighter" style={{ color: tipoConf.color, fontFamily: "Georgia, serif" }}>
                {avgRating}
              </p>
              <StarRating value={Math.round(avgRating)} size="sm" />
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}
              </p>
            </div>
            {/* Barras */}
            <div className="flex-1 w-full space-y-2">
              {dist.map(({ n, count, pct }) => (
                <div key={n} className="flex items-center gap-2.5 text-xs">
                  <span className="text-gray-500 w-4 text-right font-medium">{n}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: pct > 0 ? tipoConf.color : "transparent" }} />
                  </div>
                  <span className="text-gray-400 w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Badges destacados */}
          {avgRating >= 4 && (
            <div className="border-t border-gray-50 px-6 py-3 bg-gray-50/50 flex flex-wrap gap-2">
              {avgRating >= 4.5 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Award className="w-3.5 h-3.5" /> Top valorado
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                <ThumbsUp className="w-3.5 h-3.5" /> {Math.round(resenas.filter(r => r.calificacion >= 4).length / resenas.length * 100)}% recomiendan
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Formulario nueva reseña ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: tipoConf.color }} />
          <h3 className="font-bold text-gray-900 text-sm">Escribe tu reseña</h3>
        </div>
        <div className="p-6 space-y-4">
          {sent ? (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${tipoConf.color}15` }}>
                <CheckCircle className="w-7 h-7" style={{ color: tipoConf.color }} />
              </div>
              <p className="font-bold text-gray-900">¡Gracias por tu reseña!</p>
              <p className="text-sm text-gray-500">Tu opinión ayuda a otros viajeros</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tu calificación</p>
                <div className="flex items-center gap-4">
                  <StarRating value={form.calificacion} onChange={v => setForm(f => ({ ...f, calificacion: v }))} />
                  {form.calificacion > 0 && (
                    <span className="text-sm font-semibold" style={{ color: tipoConf.color }}>
                      {LABELS[form.calificacion]}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tu comentario <span className="normal-case font-normal text-gray-400">(opcional)</span></p>
                <textarea
                  value={form.texto}
                  onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                  placeholder="Cuéntanos tu experiencia... ¿Qué fue lo que más te gustó?"
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                  style={{ "--tw-ring-color": tipoConf.color + "40" }}
                />
              </div>
              <button onClick={submit} disabled={saving || !form.calificacion}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: tipoConf.color }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {saving ? "Publicando..." : isAuthenticated ? "Publicar reseña" : "Inicia sesión para opinar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Lista de reseñas ── */}
      {resenas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Sin reseñas todavía</p>
          <p className="text-sm text-gray-400">¡Sé el primero en compartir tu experiencia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map((r, i) => (
            <div key={r.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: tipoConf.color }}>
                    {r.turista_nombre?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.turista_nombre || "Visitante"}</p>
                    <p className="text-xs text-gray-400">{r.fecha?.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StarRating value={r.calificacion} size="sm" />
                </div>
              </div>
              {r.texto && (
                <p className="text-sm text-gray-600 leading-relaxed pl-12">{r.texto}</p>
              )}
            </div>
          ))}
        </div>
      )}
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
        const tipo = pRes.data.tipo || "";
        const extras = [];
        if (esAlimentos(tipo)) extras.push(axios.get(`${API}/prestadores/${prestadorId}/menu`).catch(() => ({ data: { categorias: [] } })));
        else extras.push(Promise.resolve({ data: { categorias: [] } }));
        if (esHospedaje(tipo)) extras.push(axios.get(`${API}/prestadores/${prestadorId}/habitaciones`).catch(() => ({ data: { habitaciones: [] } })));
        else extras.push(Promise.resolve({ data: { habitaciones: [] } }));

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
    { v: "info",        l: "Info" },
    { v: "servicios",   l: `Servicios ${servicios.length > 0 ? `(${servicios.length})` : ""}` },
    ...(menu.length > 0 ? [{ v: "menu", l: "Menú" }] : []),
    ...(habitaciones.length > 0 ? [{ v: "habitaciones", l: "Habitaciones" }] : []),
    { v: "galeria",     l: `Fotos ${imagenes.length > 0 ? `(${imagenes.length})` : ""}` },
    { v: "resenas",     l: `Reseñas ${resenas.length > 0 ? `(${resenas.length})` : ""}` },
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

                {/* ── SECCIÓN GASTRONOMÍA ── */}
                {esAlimentos(prestador.tipo) && (
                  <>
                    {/* Categoría y etiquetas */}
                    {(prestador.categoria_gastronomica || prestador.subcategoria_gastronomica) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">🍽️ Tipo de cocina</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.categoria_gastronomica && (
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: tipoConf.color }}>
                              {prestador.categoria_gastronomica}
                            </span>
                          )}
                          {prestador.subcategoria_gastronomica && (
                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                              {prestador.subcategoria_gastronomica}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Momentos y etiquetas */}
                    {((prestador.momentos?.length > 0) || (prestador.etiquetas?.length > 0)) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        {prestador.momentos?.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">⏰ Ideal para</h3>
                            <div className="flex flex-wrap gap-2">
                              {prestador.momentos.map(m => (
                                <span key={m} className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {prestador.etiquetas?.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">🏷️ Características</h3>
                            <div className="flex flex-wrap gap-2">
                              {prestador.etiquetas.map(e => (
                                <span key={e} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Precio por persona */}
                    {(prestador.precio_min || prestador.precio_max) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-3">💰 Rango de precios</h2>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Desde</p>
                            <p className="text-xl font-bold text-gray-900">${prestador.precio_min}</p>
                            <p className="text-xs text-gray-400">MXN por persona</p>
                          </div>
                          {prestador.precio_max && prestador.precio_max !== prestador.precio_min && (
                            <>
                              <span className="text-gray-300 text-2xl">—</span>
                              <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1">Hasta</p>
                                <p className="text-xl font-bold text-gray-900">${prestador.precio_max}</p>
                                <p className="text-xs text-gray-400">MXN por persona</p>
                              </div>
                            </>
                          )}
                          {prestador.precio_familia && (
                            <div className="flex-1 text-center p-3 bg-green-50 rounded-xl">
                              <p className="text-xs text-green-600 mb-1">👨‍👩‍👧 Familia</p>
                              <p className="text-xl font-bold text-green-700">${prestador.precio_familia}</p>
                              <p className="text-xs text-green-500">MXN</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Métodos de pago */}
                    {prestador.metodos_pago?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-3">💳 Métodos de pago</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.metodos_pago.map(m => (
                            <span key={m} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pedidos por WhatsApp */}
                    {prestador.pedidos_whatsapp_activo && prestador.whatsapp && (
                      <a href={`https://wa.me/${prestador.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(prestador.pedidos_whatsapp_mensaje || `Hola, quisiera hacer un pedido en ${prestador.nombre}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-5 bg-green-500 hover:bg-green-600 transition-colors rounded-2xl text-white">
                        <span className="text-3xl">📱</span>
                        <div>
                          <p className="font-bold text-lg">Pedir por WhatsApp</p>
                          <p className="text-green-100 text-sm">Haz tu pedido directamente al restaurante</p>
                        </div>
                      </a>
                    )}

                    {/* Reservas de mesa */}
                    {prestador.reservas_mesa_activas && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-2">🪑 Reservas de mesa</h2>
                        {prestador.reservas_mesa_notas && (
                          <p className="text-sm text-gray-600 mb-3">{prestador.reservas_mesa_notas}</p>
                        )}
                        <button onClick={() => setReservaModal(true)}
                          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: tipoConf.color }}>
                          Reservar mesa →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── SECCIÓN HOSPEDAJE ── */}
                {esHospedaje(prestador.tipo) && (
                  <>
                    {/* Check-in / Check-out */}
                    {(prestador.checkin_desde || prestador.checkout_hasta) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">🕐 Check-in / Check-out</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {prestador.checkin_desde && (
                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Check-in desde</p>
                              <p className="text-2xl font-bold text-green-800">{prestador.checkin_desde}</p>
                              <p className="text-xs text-green-500 mt-1">hrs</p>
                            </div>
                          )}
                          {prestador.checkout_hasta && (
                            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                              <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">Check-out hasta</p>
                              <p className="text-2xl font-bold text-red-800">{prestador.checkout_hasta}</p>
                              <p className="text-xs text-red-500 mt-1">hrs</p>
                            </div>
                          )}
                        </div>
                        {prestador.checkin_notas && (
                          <p className="text-xs text-gray-500 mt-3 p-3 bg-gray-50 rounded-lg">ℹ️ {prestador.checkin_notas}</p>
                        )}
                      </div>
                    )}

                    {/* Precio por noche */}
                    {(prestador.precio_noche_desde || prestador.precio_noche_hasta) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-3">💰 Precio por noche</h2>
                        <div className="flex items-center gap-3">
                          {prestador.precio_noche_desde && (
                            <div className="flex-1 text-center p-4 bg-blue-50 rounded-xl">
                              <p className="text-xs text-blue-600 mb-1">Desde</p>
                              <p className="text-2xl font-bold text-blue-900">${prestador.precio_noche_desde}</p>
                              <p className="text-xs text-blue-400">MXN / noche</p>
                            </div>
                          )}
                          {prestador.precio_noche_hasta && prestador.precio_noche_hasta !== prestador.precio_noche_desde && (
                            <>
                              <span className="text-gray-300 text-2xl">—</span>
                              <div className="flex-1 text-center p-4 bg-blue-50 rounded-xl">
                                <p className="text-xs text-blue-600 mb-1">Hasta</p>
                                <p className="text-2xl font-bold text-blue-900">${prestador.precio_noche_hasta}</p>
                                <p className="text-xs text-blue-400">MXN / noche</p>
                              </div>
                            </>
                          )}
                        </div>
                        {prestador.desayuno_incluido && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                            <span>🍳</span>
                            <span className="font-medium">Desayuno incluido</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amenidades */}
                    {prestador.amenidades_hotel?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">✨ Amenidades</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.amenidades_hotel.map(a => (
                            <span key={a} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Etiquetas hospedaje */}
                    {prestador.etiquetas_hospedaje?.length > 0 && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-3">🏷️ Ideal para</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.etiquetas_hospedaje.map(e => (
                            <span key={e} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Políticas */}
                    {(prestador.politica_cancelacion || prestador.politica_mascotas !== undefined || prestador.politica_menores) && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">📋 Políticas</h2>
                        <div className="space-y-2 text-sm">
                          {prestador.politica_cancelacion && (
                            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                              <span>🔄</span>
                              <div>
                                <p className="font-medium text-gray-800">Cancelación</p>
                                <p className="text-gray-600 text-xs mt-0.5">{prestador.politica_cancelacion}</p>
                              </div>
                            </div>
                          )}
                          {prestador.politica_mascotas !== undefined && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <span>{prestador.politica_mascotas ? "🐾" : "🚫"}</span>
                              <p className="text-gray-700">{prestador.politica_mascotas ? "Se aceptan mascotas" : "No se aceptan mascotas"}</p>
                            </div>
                          )}
                          {prestador.politica_menores && (
                            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                              <span>👶</span>
                              <p className="text-gray-700">{prestador.politica_menores}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reservas hospedaje */}
                    {prestador.reservas_activas && (
                      <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-2">📅 Reservaciones en línea</h2>
                        {prestador.reservas_notas && (
                          <p className="text-sm text-gray-600 mb-3">{prestador.reservas_notas}</p>
                        )}
                        <button onClick={() => setReservaModal(true)}
                          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: tipoConf.color }}>
                          Consultar disponibilidad →
                        </button>
                      </div>
                    )}
                  </>
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
                {/* Botón pedir por WhatsApp arriba del menú */}
                {prestador.pedidos_whatsapp_activo && prestador.whatsapp && (
                  <a href={`https://wa.me/${prestador.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(prestador.pedidos_whatsapp_mensaje || `Hola, quisiera hacer un pedido en ${prestador.nombre}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-green-500 hover:bg-green-600 transition-colors rounded-2xl text-white">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-bold">Pedir por WhatsApp</p>
                      <p className="text-green-100 text-xs">Selecciona lo que quieres y manda tu pedido</p>
                    </div>
                  </a>
                )}
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
                          <div className="text-right flex-shrink-0">
                            {item.precio_promocional ? (
                              <>
                                <p className="text-xs text-gray-400 line-through">${item.precio}</p>
                                <p className="font-bold text-green-600 text-sm">${item.precio_promocional} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900">${item.precio} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                            )}
                          </div>
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
              <ResenasSection
                prestadorId={prestadorId}
                resenas={resenas}
                setResenas={setResenas}
                avgRating={avgRating}
                isAuthenticated={isAuthenticated}
                tipoConf={tipoConf}
              />
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