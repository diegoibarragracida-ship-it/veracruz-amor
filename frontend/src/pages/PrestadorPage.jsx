import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin, Star, Phone, Globe, Clock, Users,
  MessageCircle, Share2, Heart, ArrowLeft, ChevronLeft,
  ChevronRight, BadgeCheck, Instagram, Facebook, Calendar,
  Utensils, Hotel, Car, Package, Navigation,
  CheckCircle, Loader2, X, Camera, Send, Sparkles,
  Award, ThumbsUp, Coffee, Beer, Truck, Compass,
  ShoppingBag, Leaf, Zap, Home, Music, Tag, DollarSign,
  TrendingUp, Pen, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

/* ─── helpers ─────────────────────────────────────────────── */
const norm = (s) => (s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const TIPO_CONFIG = {
  HOSPEDAJE:   { Icon: Hotel,       color: "#1565C0", label: "Hospedaje" },
  HOTEL:       { Icon: Hotel,       color: "#1565C0", label: "Hotel" },
  HOSTAL:      { Icon: Home,        color: "#1565C0", label: "Hostal" },
  CABANA:      { Icon: Home,        color: "#1565C0", label: "Cabaña" },
  GLAMPING:    { Icon: Leaf,        color: "#1565C0", label: "Glamping" },
  POSADA:      { Icon: Home,        color: "#1565C0", label: "Posada" },
  GASTRONOMIA: { Icon: Utensils,    color: "#C62828", label: "Restaurante" },
  CAFETERIA:   { Icon: Coffee,      color: "#C62828", label: "Cafetería" },
  BAR:         { Icon: Beer,        color: "#C62828", label: "Bar" },
  BEBIDAS:     { Icon: Coffee,      color: "#C62828", label: "Bebidas" },
  RESTAURANTE: { Icon: Utensils,    color: "#C62828", label: "Restaurante" },
  FOOD_TRUCK:  { Icon: Truck,       color: "#C62828", label: "Food Truck" },
  PUESTO:      { Icon: Utensils,    color: "#C62828", label: "Puesto" },
  TURISMO:     { Icon: Compass,     color: "#2E7D32", label: "Tour / Actividad" },
  GUIA:        { Icon: Compass,     color: "#2E7D32", label: "Guía Turístico" },
  ACTIVIDAD:   { Icon: Zap,         color: "#2E7D32", label: "Actividad" },
  TRANSPORTE:  { Icon: Car,         color: "#E65100", label: "Transporte" },
  COMERCIO:    { Icon: ShoppingBag, color: "#6A1B9A", label: "Comercio" },
  ECOTURISMO:  { Icon: Leaf,        color: "#2E7D32", label: "Ecoturismo" },
  BIENESTAR:   { Icon: Sparkles,    color: "#AD1457", label: "Bienestar" },
  CULTURA:     { Icon: Music,       color: "#4527A0", label: "Cultura" },
  default:     { Icon: MapPin,      color: "#546E7A", label: "Servicio" },
};

const TIPOS_ALIMENTOS = ["GASTRONOMIA","CAFETERIA","BAR","BEBIDAS","RESTAURANTE","FOOD_TRUCK","PUESTO"];
const TIPOS_HOSPEDAJE = ["HOSPEDAJE","HOTEL","HOSTAL","CABANA","GLAMPING","POSADA"];
const esAlimentos = (t) => TIPOS_ALIMENTOS.includes(norm(t));
const esHospedaje = (t) => TIPOS_HOSPEDAJE.includes(norm(t));
const getTipo = (t) => TIPO_CONFIG[norm(t)] || TIPO_CONFIG.default;

const CATEGORIAS_GALERIA = ["general","habitaciones","comida","tours","vehiculos","instalaciones"];

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
  body, html { font-family: 'Outfit', sans-serif; }
  .font-display { font-family: 'Cormorant Garamond', Georgia, serif !important; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes slideUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes starPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  .star-pop { animation: starPop 0.25s ease; }
  .card-hover { transition: box-shadow .2s, transform .2s; }
  .card-hover:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1); transform: translateY(-2px); }
  .fab-btn { box-shadow: 0 6px 24px rgba(0,0,0,0.18); }
`;

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
    <div className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center" style={{ animation: "fadeIn .18s ease" }}>
      <button onClick={onClose}
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm">
        <X className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}
        className="absolute left-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 backdrop-blur-sm">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent(c => Math.min(c + 1, fotos.length - 1))} disabled={current === fotos.length - 1}
        className="absolute right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 backdrop-blur-sm">
        <ChevronRight className="w-5 h-5" />
      </button>
      <img src={fotos[current].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tracking-widest">
        {current + 1} / {fotos.length}
      </p>
    </div>
  );
};

/* ─── Modal de Reserva ────────────────────────────────────── */
const ReservaModal = ({ prestador, servicio, onClose, onSuccess }) => {
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
      onSuccess();
      onClose();
    } catch { toast.error("Error al enviar la reserva. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl"
        style={{ animation: "slideUp .22s ease-out" }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Solicitar reserva</p>
            <h3 className="font-display text-2xl font-bold text-gray-900">
              {servicio ? servicio.nombre : prestador.nombre}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {servicio && (
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: `${tipoConf.color}0d` }}>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{servicio.nombre}</p>
                {servicio.duracion && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{servicio.duracion}</p>}
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

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">Fecha</label>
            <input type="date" value={form.fecha_reserva} min={new Date().toISOString().split("T")[0]}
              onChange={e => setForm({...form, fecha_reserva: e.target.value})}
              className="w-full border-2 border-gray-100 focus:border-current rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{ "--tw-ring-color": tipoConf.color }} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">Personas</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setForm({...form, num_personas: Math.max(1, form.num_personas - 1)})}
                className="w-10 h-10 rounded-xl border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl transition-colors">−</button>
              <span className="text-2xl font-bold text-gray-900 w-10 text-center">{form.num_personas}</span>
              <button onClick={() => setForm({...form, num_personas: Math.min(20, form.num_personas + 1)})}
                className="w-10 h-10 rounded-xl border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl transition-colors">+</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
              Nota opcional
            </label>
            <textarea value={form.nota_turista} onChange={e => setForm({...form, nota_turista: e.target.value})}
              placeholder="Alergias, preferencias, horario preferido..."
              className="w-full border-2 border-gray-100 focus:border-gray-300 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors" rows={3} />
          </div>

          <button onClick={reservar} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: tipoConf.color }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
            {loading ? "Enviando..." : isAuthenticated ? "Enviar reserva" : "Inicia sesión para reservar"}
          </button>
          <p className="text-center text-xs text-gray-400">Sin cargo ahora · El prestador confirmará tu reserva</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Star Rating ─────────────────────────────────────────── */
const StarRating = ({ value, onChange, size = "md" }) => {
  const [hovered, setHovered] = useState(0);
  const [popped, setPopped] = useState(0);
  const sizeClass = size === "xl" ? "w-10 h-10" : size === "lg" ? "w-8 h-8" : size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  const handleClick = (n) => {
    if (!onChange) return;
    onChange(n);
    setPopped(n);
    setTimeout(() => setPopped(0), 300);
  };

  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => handleClick(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} ${popped === n ? "star-pop" : ""}`}>
          <Star className={`${sizeClass} transition-all duration-150 ${
            n <= (hovered || value)
              ? "text-amber-400 fill-amber-400 drop-shadow-sm"
              : "text-gray-200 fill-gray-100"
          }`} />
        </button>
      ))}
    </div>
  );
};

const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

/* ─── Sección de Reseñas ──────────────────────────────────── */
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
    if (!form.calificacion) return toast.error("Selecciona al menos una estrella");
    setSaving(true);
    try {
      const res = await axios.post(`${API}/resenas`, { prestador_id: prestadorId, ...form });
      setResenas(prev => [res.data, ...prev]);
      setForm({ calificacion: 0, texto: "" });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      toast.success("¡Reseña publicada! Gracias por tu opinión.");
    } catch { toast.error("Error al publicar. Intenta de nuevo."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5" style={{ animation: "fadeIn .3s ease" }}>

      {/* ── Resumen visual ── */}
      {resenas.length > 0 && (
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
          <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
            <div className="text-center flex-shrink-0 space-y-2">
              <p className="font-display text-8xl font-bold leading-none" style={{ color: tipoConf.color }}>
                {avgRating}
              </p>
              <StarRating value={Math.round(avgRating)} size="sm" />
              <p className="text-xs text-gray-400 font-medium">
                {resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"}
              </p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {dist.map(({ n, count, pct }) => (
                <div key={n} className="flex items-center gap-2.5 text-xs">
                  <span className="text-gray-500 w-3 text-right font-semibold">{n}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: pct > 0 ? tipoConf.color : "transparent" }} />
                  </div>
                  <span className="text-gray-400 w-5">{count}</span>
                </div>
              ))}
            </div>
          </div>
          {avgRating >= 4 && (
            <div className="border-t border-gray-50 px-6 py-3 bg-gray-50/50 flex flex-wrap gap-2">
              {avgRating >= 4.5 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  <Award className="w-3.5 h-3.5" /> Top valorado
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                <ThumbsUp className="w-3.5 h-3.5" />
                {Math.round(resenas.filter(r => r.calificacion >= 4).length / resenas.length * 100)}% recomiendan
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Formulario nueva reseña ── */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${tipoConf.color}12, ${tipoConf.color}06)` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tipoConf.color}20` }}>
            <Pen className="w-4 h-4" style={{ color: tipoConf.color }} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Escribe tu reseña</h3>
            <p className="text-xs text-gray-500">Tu opinión ayuda a otros viajeros</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {sent ? (
            <div className="flex flex-col items-center py-8 gap-3 text-center" style={{ animation: "slideUp .3s ease" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${tipoConf.color}18` }}>
                <CheckCircle className="w-8 h-8" style={{ color: tipoConf.color }} />
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">¡Gracias!</p>
              <p className="text-sm text-gray-500 max-w-[220px]">Tu reseña ya es visible para otros viajeros</p>
            </div>
          ) : (
            <>
              {/* Stars selector */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tu calificación</p>
                <div className="flex items-center gap-4">
                  <StarRating value={form.calificacion} onChange={v => setForm(f => ({ ...f, calificacion: v }))} size="xl" />
                  {form.calificacion > 0 && (
                    <span className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ color: tipoConf.color, backgroundColor: `${tipoConf.color}14` }}>
                      {LABELS[form.calificacion]}
                    </span>
                  )}
                </div>
              </div>

              {/* Text */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Tu comentario <span className="normal-case font-normal text-gray-300">(opcional)</span>
                </p>
                <textarea
                  value={form.texto}
                  onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                  placeholder="¿Qué fue lo que más te gustó? ¿Regresarías?"
                  rows={4}
                  className="w-full text-sm border-2 border-gray-100 focus:border-gray-200 rounded-2xl px-4 py-3 resize-none outline-none transition-colors placeholder-gray-300 leading-relaxed"
                />
              </div>

              <button onClick={submit} disabled={saving || !form.calificacion}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
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
        <div className="text-center py-16 bg-white rounded-3xl" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-gray-200" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Sin reseñas todavía</p>
          <p className="text-sm text-gray-400">¡Sé el primero en compartir tu experiencia!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map((r, i) => (
            <div key={r.id}
              className="bg-white rounded-3xl p-5 card-hover"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)", animationDelay: `${i * 40}ms`, animation: "fadeIn .4s ease both" }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${tipoConf.color}, ${tipoConf.color}cc)` }}>
                  {r.turista_nombre?.[0]?.toUpperCase() || "V"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.turista_nombre || "Visitante"}</p>
                    <StarRating value={r.calificacion} size="sm" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.fecha?.slice(0, 10)}</p>
                </div>
              </div>
              {r.texto && (
                <p className="text-sm text-gray-600 leading-relaxed pl-13" style={{ paddingLeft: "3.25rem" }}>
                  {r.texto}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Review CTA (visible en tab Info) ───────────────────── */
const ReviewCTA = ({ tipoConf, avgRating, resenas, onGoToResenas }) => (
  <div className="rounded-3xl p-6 overflow-hidden relative"
    style={{ background: `linear-gradient(135deg, ${tipoConf.color}0f 0%, ${tipoConf.color}1a 100%)` }}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {avgRating ? (
            <>
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="font-bold text-gray-800 text-sm">{avgRating}</span>
              <span className="text-xs text-gray-500">({resenas.length} reseñas)</span>
            </>
          ) : (
            <p className="text-sm font-semibold text-gray-700">Aún no hay reseñas</p>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          ¿Visitaste este lugar? Tu opinión ayuda a otros viajeros a elegir.
        </p>
      </div>
      <button onClick={onGoToResenas}
        className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
        style={{ backgroundColor: tipoConf.color }}>
        <Star className="w-4 h-4 fill-white" />
        Calificar
      </button>
    </div>
  </div>
);

/* ─── PÁGINA PRINCIPAL ────────────────────────────────────── */
const PrestadorPage = () => {
  const { prestadorId } = useParams();
  const { isAuthenticated } = useAuth();

  const [prestador,     setPrestador]     = useState(null);
  const [imagenes,      setImagenes]      = useState([]);
  const [servicios,     setServicios]     = useState([]);
  const [menu,          setMenu]          = useState([]);
  const [habitaciones,  setHabitaciones]  = useState([]);
  const [promociones,   setPromociones]   = useState([]);
  const [resenas,       setResenas]       = useState([]);
  const [loading,       setLoading]       = useState(true);

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
        setPrestador(pRes.data);
        setImagenes(imgRes.data.imagenes || []);
        setServicios(svcRes.data.servicios || []);

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

  const goToResenas = () => setTab("resenas");

  if (loading) return (
    <div className="min-h-screen bg-[#F5F2EC]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{FONTS}</style>
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#1B5E20]" />
        <p className="text-sm text-gray-400 font-medium">Cargando...</p>
      </div>
    </div>
  );

  if (!prestador) return (
    <div className="min-h-screen bg-[#F5F2EC]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{FONTS}</style>
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <p className="text-gray-500 mb-4">Prestador no encontrado</p>
        <Link to="/prestadores" className="text-[#1B5E20] font-semibold hover:underline">← Volver</Link>
      </div>
    </div>
  );

  const tipoConf    = getTipo(prestador.tipo);
  const { Icon }    = tipoConf;
  const portada     = imagenes.find(i => i.es_portada) || imagenes[0];
  const promoActiva = promociones.find(p => p.activa);
  const fotosCat    = catFoto === "general" ? imagenes : imagenes.filter(i => i.categoria === catFoto);
  const tabs = [
    { v: "info",       l: "Info" },
    { v: "servicios",  l: `Servicios${servicios.length > 0 ? ` (${servicios.length})` : ""}` },
    ...(menu.length > 0        ? [{ v: "menu",         l: "Menú" }]          : []),
    ...(habitaciones.length > 0 ? [{ v: "habitaciones", l: "Habitaciones" }]  : []),
    { v: "galeria",    l: `Fotos${imagenes.length > 0 ? ` (${imagenes.length})` : ""}` },
    { v: "resenas",    l: `Reseñas${resenas.length > 0 ? ` (${resenas.length})` : ""}` },
  ];

  const avgRating = resenas.length
    ? (resenas.reduce((a, r) => a + r.calificacion, 0) / resenas.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#F5F2EC]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{FONTS}</style>
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[60vh] min-h-[380px] overflow-hidden">
        {portada?.url ? (
          <img src={portada.url} alt={prestador.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${tipoConf.color}22, ${tipoConf.color}55)` }}>
            <Icon className="w-28 h-28 opacity-20" style={{ color: tipoConf.color }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* Back */}
        <div className="absolute top-24 left-4 md:left-8 z-10">
          <Link to="/prestadores">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-semibold text-gray-800 transition-colors backdrop-blur-sm shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          </Link>
        </div>

        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 z-10 flex gap-2">
          <button onClick={handleFav}
            className="w-11 h-11 rounded-2xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm hover:scale-105">
            <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
          </button>
          <button onClick={handleShare}
            className="w-11 h-11 rounded-2xl bg-white/90 hover:bg-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm hover:scale-105">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {/* Tipo badge — con icono Lucide, sin emoji */}
              <span className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full text-white backdrop-blur-sm"
                style={{ backgroundColor: `${tipoConf.color}cc` }}>
                <Icon className="w-3.5 h-3.5" />
                {tipoConf.label}
              </span>

              {prestador.verificado && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/25">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              )}

              {promoActiva && (
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-400 text-amber-900">
                  <Tag className="w-3 h-3" /> {promoActiva.descuento_pct}% OFF
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
              {prestador.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/75 text-sm">
              {prestador.direccion && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {prestador.direccion}
                </span>
              )}
              {avgRating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <strong className="text-white font-bold">{avgRating}</strong>
                  <span className="text-white/60">({resenas.length} reseñas)</span>
                </span>
              )}
              {prestador.horarios && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  {prestador.horarios}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS STICKY ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20" style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            {tabs.map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
                  tab === t.v ? "text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={tab === t.v ? { backgroundColor: tipoConf.color } : {}}>
                {t.l}
              </button>
            ))}
          </div>
          <button onClick={() => setReservaModal(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: tipoConf.color }}>
            <Calendar className="w-4 h-4" /> Reservar
          </button>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna principal ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── TAB INFO ── */}
            {tab === "info" && (
              <>
                {/* Descripción */}
                {prestador.descripcion && (
                  <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
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
                  <div className="rounded-3xl p-5 text-amber-900" style={{ background: "linear-gradient(135deg, #FFC107, #FF8F00)" }}>
                    <div className="flex items-center gap-3">
                      <div className="text-5xl font-black">{promoActiva.descuento_pct}%</div>
                      <div>
                        <p className="font-bold text-lg">{promoActiva.titulo}</p>
                        {promoActiva.descripcion && <p className="text-sm opacity-80">{promoActiva.descripcion}</p>}
                        <p className="text-xs mt-1 opacity-60 flex items-center gap-1"><Clock className="w-3 h-3" />Válido hasta {promoActiva.fecha_fin}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview servicios */}
                {servicios.length > 0 && (
                  <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-xl font-bold text-gray-900">Servicios destacados</h2>
                      <button onClick={() => setTab("servicios")} className="text-sm font-semibold hover:underline" style={{ color: tipoConf.color }}>
                        Ver todos →
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {servicios.slice(0, 3).map(s => (
                        <div key={s.id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors"
                          onClick={() => setReservaModal(s)}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${tipoConf.color}18` }}>
                              <Icon className="w-4 h-4" style={{ color: tipoConf.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{s.nombre}</p>
                              {s.duracion && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{s.duracion}{s.capacidad ? ` · ${s.capacidad} personas` : ""}</p>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            {s.precio_promocional ? (
                              <>
                                <p className="text-[11px] text-gray-400 line-through">${s.precio}</p>
                                <p className="font-bold text-green-600 text-sm">${s.precio_promocional} MXN</p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900 text-sm">${s.precio} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview galería */}
                {imagenes.length > 0 && (
                  <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-xl font-bold text-gray-900">Galería</h2>
                      <button onClick={() => setTab("galeria")} className="text-sm font-semibold hover:underline" style={{ color: tipoConf.color }}>
                        Ver todas ({imagenes.length}) →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {imagenes.slice(0, 6).map((img, i) => (
                        <div key={img.id}
                          className="aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                          onClick={() => setGaleriaModal({ fotos: imagenes, idx: i })}>
                          <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── GASTRONOMÍA ── */}
                {esAlimentos(prestador.tipo) && (
                  <>
                    {(prestador.categoria_gastronomica || prestador.subcategoria_gastronomica) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Tipo de cocina</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.categoria_gastronomica && (
                            <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: tipoConf.color }}>
                              {prestador.categoria_gastronomica}
                            </span>
                          )}
                          {prestador.subcategoria_gastronomica && (
                            <span className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                              {prestador.subcategoria_gastronomica}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {((prestador.momentos?.length > 0) || (prestador.etiquetas?.length > 0)) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        {prestador.momentos?.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Ideal para</h3>
                            <div className="flex flex-wrap gap-2">
                              {prestador.momentos.map(m => (
                                <span key={m} className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {prestador.etiquetas?.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Características</h3>
                            <div className="flex flex-wrap gap-2">
                              {prestador.etiquetas.map(e => (
                                <span key={e} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(prestador.precio_min || prestador.precio_max) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Rango de precios</h2>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 text-center p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Desde</p>
                            <p className="text-2xl font-bold text-gray-900">${prestador.precio_min}</p>
                            <p className="text-xs text-gray-400">MXN/persona</p>
                          </div>
                          {prestador.precio_max && prestador.precio_max !== prestador.precio_min && (
                            <>
                              <span className="text-gray-200 text-2xl font-light">—</span>
                              <div className="flex-1 text-center p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Hasta</p>
                                <p className="text-2xl font-bold text-gray-900">${prestador.precio_max}</p>
                                <p className="text-xs text-gray-400">MXN/persona</p>
                              </div>
                            </>
                          )}
                          {prestador.precio_familia && (
                            <div className="flex-1 text-center p-4 rounded-2xl" style={{ backgroundColor: `${tipoConf.color}0d` }}>
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tipoConf.color }}>Familia</p>
                              <p className="text-2xl font-bold" style={{ color: tipoConf.color }}>${prestador.precio_familia}</p>
                              <p className="text-xs" style={{ color: `${tipoConf.color}88` }}>MXN</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {prestador.metodos_pago?.length > 0 && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Métodos de pago</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.metodos_pago.map(m => (
                            <span key={m} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {prestador.pedidos_whatsapp_activo && prestador.whatsapp && (
                      <a href={`https://wa.me/${prestador.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(prestador.pedidos_whatsapp_mensaje || `Hola, quisiera hacer un pedido en ${prestador.nombre}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-5 rounded-3xl text-white hover:opacity-95 transition-opacity"
                        style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Pedir por WhatsApp</p>
                          <p className="text-green-100 text-sm">Haz tu pedido directo al restaurante</p>
                        </div>
                      </a>
                    )}

                    {prestador.reservas_mesa_activas && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Reservas de mesa</h2>
                        {prestador.reservas_mesa_notas && (
                          <p className="text-sm text-gray-500 mb-4">{prestador.reservas_mesa_notas}</p>
                        )}
                        <button onClick={() => setReservaModal(true)}
                          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: tipoConf.color }}>
                          Reservar mesa →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── HOSPEDAJE ── */}
                {esHospedaje(prestador.tipo) && (
                  <>
                    {(prestador.checkin_desde || prestador.checkout_hasta) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Check-in / Check-out</h2>
                        <div className="grid grid-cols-2 gap-3">
                          {prestador.checkin_desde && (
                            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-100">
                              <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">Check-in desde</p>
                              <p className="text-3xl font-bold text-green-800">{prestador.checkin_desde}</p>
                              <p className="text-xs text-green-400 mt-0.5">hrs</p>
                            </div>
                          )}
                          {prestador.checkout_hasta && (
                            <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-100">
                              <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Check-out hasta</p>
                              <p className="text-3xl font-bold text-red-800">{prestador.checkout_hasta}</p>
                              <p className="text-xs text-red-400 mt-0.5">hrs</p>
                            </div>
                          )}
                        </div>
                        {prestador.checkin_notas && (
                          <p className="text-xs text-gray-500 mt-3 p-3 bg-gray-50 rounded-xl">{prestador.checkin_notas}</p>
                        )}
                      </div>
                    )}

                    {(prestador.precio_noche_desde || prestador.precio_noche_hasta) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Precio por noche</h2>
                        <div className="flex items-center gap-3">
                          {prestador.precio_noche_desde && (
                            <div className="flex-1 text-center p-4 rounded-2xl" style={{ backgroundColor: `${tipoConf.color}0d` }}>
                              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: tipoConf.color }}>Desde</p>
                              <p className="text-2xl font-bold" style={{ color: tipoConf.color }}>${prestador.precio_noche_desde}</p>
                              <p className="text-xs opacity-60" style={{ color: tipoConf.color }}>MXN / noche</p>
                            </div>
                          )}
                          {prestador.precio_noche_hasta && prestador.precio_noche_hasta !== prestador.precio_noche_desde && (
                            <>
                              <span className="text-gray-200 text-xl">—</span>
                              <div className="flex-1 text-center p-4 rounded-2xl" style={{ backgroundColor: `${tipoConf.color}0d` }}>
                                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: tipoConf.color }}>Hasta</p>
                                <p className="text-2xl font-bold" style={{ color: tipoConf.color }}>${prestador.precio_noche_hasta}</p>
                                <p className="text-xs opacity-60" style={{ color: tipoConf.color }}>MXN / noche</p>
                              </div>
                            </>
                          )}
                        </div>
                        {prestador.desayuno_incluido && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-semibold">Desayuno incluido</span>
                          </div>
                        )}
                      </div>
                    )}

                    {prestador.amenidades_hotel?.length > 0 && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Amenidades</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.amenidades_hotel.map(a => (
                            <span key={a} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              <CheckCircle className="w-3 h-3" />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {prestador.etiquetas_hospedaje?.length > 0 && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Ideal para</h2>
                        <div className="flex flex-wrap gap-2">
                          {prestador.etiquetas_hospedaje.map(e => (
                            <span key={e} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(prestador.politica_cancelacion || prestador.politica_mascotas !== undefined || prestador.politica_menores) && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Políticas</h2>
                        <div className="space-y-2">
                          {prestador.politica_cancelacion && (
                            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl">
                              <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Tag className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">Cancelación</p>
                                <p className="text-gray-500 text-xs mt-0.5">{prestador.politica_cancelacion}</p>
                              </div>
                            </div>
                          )}
                          {prestador.politica_mascotas !== undefined && (
                            <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${prestador.politica_mascotas ? "bg-green-100" : "bg-red-100"}`}>
                                <Heart className={`w-3.5 h-3.5 ${prestador.politica_mascotas ? "text-green-600" : "text-red-400"}`} />
                              </div>
                              <p className="text-gray-700 text-sm font-medium">{prestador.politica_mascotas ? "Se aceptan mascotas" : "No se aceptan mascotas"}</p>
                            </div>
                          )}
                          {prestador.politica_menores && (
                            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-2xl">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <p className="text-gray-700 text-sm">{prestador.politica_menores}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {prestador.reservas_activas && (
                      <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Reservaciones en línea</h2>
                        {prestador.reservas_notas && <p className="text-sm text-gray-500 mb-4">{prestador.reservas_notas}</p>}
                        <button onClick={() => setReservaModal(true)}
                          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: tipoConf.color }}>
                          Consultar disponibilidad →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ── CTA RESEÑAS (siempre visible en info) ── */}
                <ReviewCTA
                  tipoConf={tipoConf}
                  avgRating={avgRating}
                  resenas={resenas}
                  onGoToResenas={goToResenas}
                />
              </>
            )}

            {/* ── TAB SERVICIOS ── */}
            {tab === "servicios" && (
              <div className="space-y-3" style={{ animation: "fadeIn .25s ease" }}>
                {servicios.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">Sin servicios publicados aún</p>
                  </div>
                ) : servicios.map(s => (
                  <div key={s.id}
                    className="bg-white rounded-3xl p-5 card-hover"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${tipoConf.color}18` }}>
                        <Icon className="w-5 h-5" style={{ color: tipoConf.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{s.nombre}</h3>
                            {s.descripcion && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.descripcion}</p>}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                              {s.duracion && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duracion}</span>}
                              {s.capacidad && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Hasta {s.capacidad} personas</span>}
                              {!s.disponible && <span className="text-red-500 font-semibold">No disponible</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.precio_promocional ? (
                              <>
                                <p className="text-xs text-gray-400 line-through">${s.precio}</p>
                                <p className="font-bold text-green-600">${s.precio_promocional} MXN</p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900">${s.precio} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                            )}
                          </div>
                        </div>
                        {s.disponible && (
                          <button onClick={() => setReservaModal(s)}
                            className="mt-3 w-full py-2.5 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
              <div className="space-y-4" style={{ animation: "fadeIn .25s ease" }}>
                {prestador.pedidos_whatsapp_activo && prestador.whatsapp && (
                  <a href={`https://wa.me/${prestador.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(prestador.pedidos_whatsapp_mensaje || `Hola, quisiera hacer un pedido en ${prestador.nombre}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-3xl text-white hover:opacity-95 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold">Pedir por WhatsApp</p>
                      <p className="text-green-100 text-xs">Selecciona lo que quieres y manda tu pedido</p>
                    </div>
                  </a>
                )}
                {menu.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <Utensils className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">Menú no disponible aún</p>
                  </div>
                ) : menu.map(cat => (
                  <div key={cat.id} className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <div className="px-5 py-3.5 flex items-center gap-2.5"
                      style={{ background: `linear-gradient(135deg, ${tipoConf.color}0d, ${tipoConf.color}06)` }}>
                      <Utensils className="w-4 h-4" style={{ color: tipoConf.color }} />
                      <h3 className="font-bold text-gray-900">{cat.nombre}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {cat.items?.map(item => (
                        <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${!item.disponible ? "opacity-50" : ""}`}>
                          {item.foto_url && (
                            <img src={item.foto_url} alt={item.nombre} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{item.nombre}</p>
                            {item.descripcion && <p className="text-xs text-gray-400 mt-0.5">{item.descripcion}</p>}
                            {!item.disponible && <span className="text-xs text-red-500 font-semibold">Agotado</span>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ animation: "fadeIn .25s ease" }}>
                {habitaciones.length === 0 ? (
                  <div className="col-span-2 text-center py-16 bg-white rounded-3xl" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    <Hotel className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">Sin habitaciones publicadas aún</p>
                  </div>
                ) : habitaciones.map(h => (
                  <div key={h.id} className="bg-white rounded-3xl overflow-hidden card-hover"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                    {h.fotos?.[0] && (
                      <img src={h.fotos[0]} alt={h.nombre} className="w-full h-44 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Home className="w-4 h-4" style={{ color: tipoConf.color }} />
                          {h.nombre}
                        </h3>
                        <p className="font-bold flex-shrink-0" style={{ color: tipoConf.color }}>
                          ${h.precio_noche} <span className="text-xs font-normal text-gray-400">MXN/noche</span>
                        </p>
                      </div>
                      {h.descripcion && <p className="text-xs text-gray-500 mb-3">{h.descripcion}</p>}
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{h.capacidad} personas</span>
                      </div>
                      {h.amenidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {h.amenidades.map(a => <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">{a}</span>)}
                        </div>
                      )}
                      {h.disponible && (
                        <button onClick={() => setReservaModal({ nombre: h.nombre, precio: h.precio_noche, id: h.id })}
                          className="w-full py-2.5 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
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
              <div className="space-y-4" style={{ animation: "fadeIn .25s ease" }}>
                <div className="flex flex-wrap gap-2">
                  {["general", ...CATEGORIAS_GALERIA.slice(1).filter(c => imagenes.some(i => i.categoria === c))].map(c => (
                    <button key={c} onClick={() => setCatFoto(c)}
                      className={`text-xs px-3.5 py-2 rounded-full font-semibold capitalize transition-all ${
                        catFoto === c ? "text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                      style={catFoto === c ? { backgroundColor: tipoConf.color } : { boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                      {c} ({c === "general" ? imagenes.length : imagenes.filter(i => i.categoria === c).length})
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotosCat.map((img, i) => (
                    <div key={img.id}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative"
                      onClick={() => setGaleriaModal({ fotos: fotosCat, idx: i })}>
                      <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
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
            <div className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Contactar</h3>
              <div className="space-y-3">
                {prestador.whatsapp && (
                  <button onClick={() => handleContact("whatsapp")}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                )}
                {prestador.telefono && (
                  <button onClick={() => handleContact("phone")}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all">
                    <Phone className="w-4 h-4" /> {prestador.telefono}
                  </button>
                )}
                <button onClick={() => setReservaModal(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: tipoConf.color }}>
                  <Calendar className="w-4 h-4" /> Hacer una reserva
                </button>
              </div>
            </div>

            {/* Info rápida */}
            <div className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Información</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {prestador.horarios && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tipoConf.color}14` }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: tipoConf.color }} />
                    </div>
                    <span className="mt-1">{prestador.horarios}</span>
                  </div>
                )}
                {prestador.direccion && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tipoConf.color}14` }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: tipoConf.color }} />
                    </div>
                    <span className="mt-1">{prestador.direccion}</span>
                  </div>
                )}
                {prestador.website && (
                  <a href={prestador.website.startsWith("http") ? prestador.website : `https://${prestador.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 hover:underline" style={{ color: tipoConf.color }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tipoConf.color}14` }}>
                      <Globe className="w-3.5 h-3.5" style={{ color: tipoConf.color }} />
                    </div>
                    <span className="truncate mt-1">{prestador.website}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Redes sociales */}
            {(prestador.instagram || prestador.facebook || prestador.tiktok) && (
              <div className="bg-white rounded-3xl p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-3">Redes sociales</h3>
                <div className="flex gap-3">
                  {prestador.instagram && (
                    <a href={`https://instagram.com/${prestador.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white hover:opacity-90 hover:scale-105 transition-all"
                      style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.facebook && (
                    <a href={`https://facebook.com/${prestador.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 hover:scale-105 transition-all">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {prestador.tiktok && (
                    <a href={`https://tiktok.com/@${prestador.tiktok.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center text-white hover:opacity-90 hover:scale-105 transition-all text-[10px] font-black tracking-tight">
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Maps */}
            {prestador.lat && prestador.lng && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${prestador.lat},${prestador.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 hover:bg-white transition-all">
                <Navigation className="w-4 h-4" /> Ver en Google Maps
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* ── FAB de reseña (solo móvil, si no está en tab resenas) ── */}
      {tab !== "resenas" && (
        <button
          onClick={goToResenas}
          className="fixed bottom-6 right-5 z-30 lg:hidden flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold text-sm fab-btn transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: tipoConf.color, animation: "slideUp .3s ease" }}>
          <Star className="w-4 h-4 fill-white" />
          Calificar
        </button>
      )}

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
    </div>
  );
};

export default PrestadorPage;