import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapaPrestadores from "@/components/MapaPrestadores";
import {
  MapPin, Clock, DollarSign, Mountain, X, Star,
  Phone, Globe, Calendar, Sparkles, Navigation,
  Utensils, Hotel, Loader2, ChevronDown,
  ArrowRight, Info, Waves, Trees, Landmark, Coffee
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONFIGURACIÓN DE REGIONES
───────────────────────────────────────────── */
const REGIONES = [
  {
    slug: "orizaba",
    label: "Orizaba",
    subtitulo: "Entre cumbres y flores",
    emoji: "🏔️",
    color: "#1B5E20",
    bgPattern: "radial-gradient(ellipse at 20% 50%, #1B5E2044 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #81C78444 0%, transparent 50%)",
    heroImg: "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=1400&q=80",
    accentLight: "#E8F5E9",
    tagline: "Pico de Orizaba · Palacio de Hierro · Xico · Fortín",
  },
  {
    slug: "xalapa",
    label: "Xalapa",
    subtitulo: "La capital de la cultura",
    emoji: "☕",
    color: "#1565C0",
    bgPattern: "radial-gradient(ellipse at 70% 30%, #1565C044 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #42A5F544 0%, transparent 50%)",
    heroImg: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=1400&q=80",
    accentLight: "#E3F2FD",
    tagline: "Museo de Antropología · Coatepec · Naolinco · Lagos del Dique",
  },
  {
    slug: "tuxtlas",
    label: "Los Tuxtlas",
    subtitulo: "Selva, magia y laguna",
    emoji: "🌿",
    color: "#00695C",
    bgPattern: "radial-gradient(ellipse at 30% 60%, #00695C44 0%, transparent 60%), radial-gradient(ellipse at 80% 10%, #26A69A44 0%, transparent 50%)",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&q=80",
    accentLight: "#E0F2F1",
    tagline: "Catemaco · Nanciyaga · San Andrés Tuxtla · Selva Tropical",
  },
  {
    slug: "norte",
    label: "Norte / Tajín",
    subtitulo: "Patrimonio de la humanidad",
    emoji: "🏛️",
    color: "#4A148C",
    bgPattern: "radial-gradient(ellipse at 60% 40%, #6A1B9A44 0%, transparent 60%), radial-gradient(ellipse at 10% 70%, #AB47BC44 0%, transparent 50%)",
    heroImg: "https://images.unsplash.com/photo-1547558902-c0aa7f2e6c37?w=1400&q=80",
    accentLight: "#F3E5F5",
    tagline: "El Tajín · Papantla · Voladores · Tuxpan",
  },
  {
    slug: "costa",
    label: "Costa",
    subtitulo: "El puerto más jarocho",
    emoji: "🌊",
    color: "#01579B",
    bgPattern: "radial-gradient(ellipse at 40% 20%, #0277BD44 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, #29B6F644 0%, transparent 50%)",
    heroImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80",
    accentLight: "#E1F5FE",
    tagline: "Veracruz Puerto · San Juan de Ulúa · Boca del Río · Alvarado",
  },
];

const DIFICULTAD = {
  facil:    { label: "Fácil",    cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  moderada: { label: "Moderada", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  dificil:  { label: "Difícil",  cls: "bg-red-100 text-red-800 border-red-200" },
};

/* ─────────────────────────────────────────────
   MODAL DE LUGAR
───────────────────────────────────────────── */
const LugarModal = ({ lugar, color, onClose }) => {
  const fotos = [lugar.foto_portada, ...(lugar.fotos || [])].filter(Boolean);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ animation: "slideUp .25s ease-out" }}
      >
        {/* Galería */}
        <div className="relative h-64 sm:h-72 bg-gray-100 flex-shrink-0 overflow-hidden">
          {fotos.length > 0 ? (
            <>
              <img src={fotos[fotoIdx]} alt={lugar.nombre} className="w-full h-full object-cover" />
              {fotos.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={() => setFotoIdx(i)}
                      className={`rounded-full transition-all ${i === fotoIdx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl"
              style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)` }}>
              {lugar.tipo === "atraccion" ? "🏛️" : lugar.tipo === "actividad" ? "🎯" : lugar.tipo === "restaurante" ? "🍽️" : "🏨"}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 capitalize">
              {lugar.tipo}
            </span>
            {lugar.destacado && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Destacado
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1"
                style={{ fontFamily: "Playfair Display, serif" }}>{lugar.nombre}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                {lugar.municipio}, Veracruz
              </p>
            </div>
            {lugar.calificacion && (
              <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-2 rounded-2xl">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="font-bold text-amber-700 text-sm">{lugar.calificacion}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {lugar.costo_min !== undefined && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign className="w-3 h-3" />
                {lugar.costo_min === 0 ? "Entrada gratis" : `$${lugar.costo_min}–$${lugar.costo_max} MXN`}
              </span>
            )}
            {lugar.horarios && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" /> {lugar.horarios}
              </span>
            )}
            {lugar.tags?.slice(0, 4).map(t => (
              <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 capitalize border border-gray-200">{t}</span>
            ))}
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-4">{lugar.descripcion}</p>

          {lugar.descripcion_larga && (
            <div className="mb-4 pl-4 border-l-[3px] rounded-r-lg" style={{ borderColor: color }}>
              <p className="text-gray-600 text-sm leading-relaxed">{lugar.descripcion_larga}</p>
            </div>
          )}

          {lugar.historia && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">Historia</p>
              <p className="text-sm text-amber-900 leading-relaxed">{lugar.historia}</p>
            </div>
          )}

          {(lugar.direccion || lugar.telefono || lugar.web) && (
            <div className="border-t border-gray-100 pt-4 mt-2 space-y-2.5">
              {lugar.direccion && (
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                  {lugar.direccion}
                </p>
              )}
              {lugar.telefono && (
                <a href={`tel:${lugar.telefono}`} className="text-xs flex items-center gap-2 hover:underline" style={{ color }}>
                  <Phone className="w-3.5 h-3.5" /> {lugar.telefono}
                </a>
              )}
              {lugar.web && (
                <a href={lugar.web} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-2 hover:underline" style={{ color }}>
                  <Globe className="w-3.5 h-3.5" /> {lugar.web}
                </a>
              )}
            </div>
          )}
        </div>

        {lugar.lat && lugar.lng && (
          <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
            <a href={`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}>
              <Navigation className="w-4 h-4" /> Cómo llegar · Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CARD DE LUGAR
───────────────────────────────────────────── */
const LugarCard = ({ lugar, color, onClick, size = "normal" }) => {
  const foto = lugar.foto_portada || lugar.fotos?.[0];
  const isLarge = size === "large";

  return (
    <button onClick={() => onClick(lugar)}
      className={`group text-left relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100
        hover:shadow-xl hover:-translate-y-1 transition-all duration-200 w-full h-full
        ${isLarge ? "flex flex-col" : ""}`}>
      <div className={`relative overflow-hidden bg-gray-100 flex-shrink-0 ${isLarge ? "h-56" : "h-44"}`}>
        {foto ? (
          <img src={foto} alt={lugar.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}>
            {lugar.tipo === "atraccion" ? "🏛️" : lugar.tipo === "actividad" ? "🎯" : lugar.tipo === "restaurante" ? "🍽️" : "🏨"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 capitalize">
            {lugar.tipo}
          </span>
        </div>
        {lugar.destacado && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-900">
            <Star className="w-3 h-3 fill-current" /> Top
          </span>
        )}
        {lugar.calificacion && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-white text-xs font-bold">{lugar.calificacion}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={`font-semibold text-gray-900 mb-1.5 transition-colors leading-snug
          ${isLarge ? "text-base" : "text-sm"} line-clamp-2`}
          style={{ fontFamily: "Playfair Display, serif" }}>
          {lugar.nombre}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1 mb-3">
          {lugar.descripcion}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {lugar.costo_min !== undefined && (
              <span className="flex items-center gap-1 font-medium">
                <DollarSign className="w-3 h-3" />
                {lugar.costo_min === 0 ? "Gratis" : `$${lugar.costo_min}`}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold flex items-center gap-1 transition-transform group-hover:translate-x-1" style={{ color }}>
            Ver <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────
   BENTO GRID
───────────────────────────────────────────── */
const LugaresBento = ({ lugares, color, onSelect }) => {
  if (!lugares.length) return (
    <div className="text-center py-24 text-gray-400">
      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">Próximamente más lugares para esta región.</p>
    </div>
  );

  const destacados = lugares.filter(l => l.destacado);
  const resto = lugares.filter(l => !l.destacado);
  const ordered = [...destacados, ...resto];

  return (
    <div className="space-y-4">
      {ordered.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 min-h-[340px]">
            <LugarCard lugar={ordered[0]} color={color} onClick={onSelect} size="large" />
          </div>
          <div className="grid grid-rows-2 gap-4">
            {ordered[1] && <LugarCard lugar={ordered[1]} color={color} onClick={onSelect} />}
            {ordered[2] && <LugarCard lugar={ordered[2]} color={color} onClick={onSelect} />}
          </div>
        </div>
      )}
      {ordered.length > 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ordered.slice(3).map(l => (
            <LugarCard key={l.id} lugar={l} color={color} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   TAB PAQUETE
───────────────────────────────────────────── */
const PaqueteTab = ({ paquete, color, light }) => {
  if (!paquete) return (
    <div className="text-center py-24 text-gray-400">
      <Info className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">Paquete disponible próximamente.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl p-6" style={{ backgroundColor: light, border: `1px solid ${color}22` }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${color}22` }}>📦</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                {paquete.nombre}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{paquete.descripcion}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700">
              <Calendar className="w-4 h-4" style={{ color }} /> {paquete.dias} días
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700">
              <DollarSign className="w-4 h-4" style={{ color }} />
              ${paquete.precio_min?.toLocaleString()}–${paquete.precio_max?.toLocaleString()} MXN/persona
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paquete.incluye?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">✅ Incluye</p>
              <ul className="space-y-2">
                {paquete.incluye.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {paquete.no_incluye?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">❌ No incluye</p>
              <ul className="space-y-2">
                {paquete.no_incluye.map((item, i) => (
                  <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                    <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✗</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {paquete.hoteles?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5" style={{ color }} /> Hoteles recomendados
            </p>
            <div className="space-y-3">
              {paquete.hoteles.map((h, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{h.nombre}</p>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                      ${h.precio_noche?.toLocaleString()}<span className="text-xs font-normal text-gray-400">/noche</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">{h.descripcion}</p>
                  <div className="flex">
                    {[...Array(h.estrellas || 0)].map((_, s) => (
                      <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paquete.restaurantes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" style={{ color }} /> Dónde comer
            </p>
            <div className="space-y-3">
              {paquete.restaurantes.map((r, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{r.nombre}</p>
                    <span className="text-xs font-bold text-gray-600 flex-shrink-0">
                      ~${r.precio_promedio}<span className="font-normal text-gray-400">/p</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.especialidad}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CALCULADORA DE ITINERARIO
───────────────────────────────────────────── */
const CalculadoraTab = ({ region, color }) => {
  const [dias,      setDias]    = useState(3);
  const [personas,  setPersonas]= useState(2);
  const [presu,     setPresu]   = useState("medio");
  const [intereses, setIntere]  = useState([]);
  const [resultado, setResult]  = useState("");
  const [loading,   setLoading] = useState(false);
  const resultRef = useRef(null);

  const OPTS = [
    { v: "naturaleza",  l: "🌿 Naturaleza" },
    { v: "cultura",     l: "🏛️ Cultura" },
    { v: "gastronomia", l: "🍽️ Gastronomía" },
    { v: "aventura",    l: "🧗 Aventura" },
    { v: "historia",    l: "📜 Historia" },
    { v: "fotografía",  l: "📸 Fotografía" },
    { v: "familia",     l: "👨‍👩‍👧 Familia" },
    { v: "romantico",   l: "💑 Romántico" },
  ];

  const toggle = (v) => setIntere(p => p.includes(v) ? p.filter(i => i !== v) : [...p, v]);

  const generar = async () => {
    setLoading(true); setResult("");
    try {
      const { data } = await axios.post(`${API}/itinerario/generar`, {
        region, dias, num_personas: personas, presupuesto: presu, intereses,
      });
      setResult(data.itinerario);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch {
      setResult("❌ Error generando el itinerario. Intenta de nuevo.");
    } finally { setLoading(false); }
  };

  const Counter = ({ label, value, onDec, onInc, min = 1, max = 99 }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button onClick={onDec} disabled={value <= min}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 font-bold text-lg">−</button>
        <span className="text-2xl font-bold text-gray-900 w-8 text-center">{value}</span>
        <button onClick={onInc} disabled={value >= max}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 font-bold text-lg">+</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}22` }}>✨</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
          VeraCruz AI planea tu viaje
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Cuéntanos cómo eres y Gemini arma tu itinerario perfecto día a día con horarios y costos reales.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Counter label="Días de viaje" value={dias} onDec={() => setDias(d => d - 1)} onInc={() => setDias(d => d + 1)} min={1} max={7} />
          <Counter label="Personas" value={personas} onDec={() => setPersonas(p => p - 1)} onInc={() => setPersonas(p => p + 1)} min={1} max={15} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Presupuesto por persona</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "bajo",  l: "💚 Económico", sub: "< $1,500/día" },
              { v: "medio", l: "💛 Moderado",   sub: "$1,500–$3,000/día" },
              { v: "alto",  l: "💜 Premium",    sub: "> $3,000/día" },
            ].map(({ v, l, sub }) => (
              <button key={v} onClick={() => setPresu(v)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${presu === v ? "shadow-sm" : "border-gray-100 hover:border-gray-200"}`}
                style={presu === v ? { borderColor: color, backgroundColor: `${color}0d` } : {}}>
                <p className="text-sm font-semibold mb-0.5" style={presu === v ? { color } : { color: "#374151" }}>{l}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ¿Qué te emociona más? <span className="text-gray-400 font-normal normal-case">(elige varios)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {OPTS.map(({ v, l }) => (
              <button key={v} onClick={() => toggle(v)}
                className={`text-sm px-4 py-2 rounded-full font-medium border-2 transition-all ${
                  intereses.includes(v) ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
                style={intereses.includes(v) ? { backgroundColor: color, borderColor: color } : {}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generar} disabled={loading}
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-60"
          style={{ backgroundColor: color }}>
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando con Gemini AI...</>
            : <><Sparkles className="w-5 h-5" /> Generar mi itinerario</>}
        </button>
      </div>

      {resultado && (
        <div ref={resultRef} className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm" style={{ backgroundColor: color }}>✨</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Tu itinerario personalizado</p>
              <p className="text-xs text-gray-500">{dias} días · {personas} {personas === 1 ? "persona" : "personas"} · presupuesto {presu}</p>
            </div>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{resultado}</div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
const RutasPage = () => {
  const [regionSlug, setRegion]  = useState("orizaba");
  const [rutaData,   setRuta]    = useState(null);
  const [lugares,    setLugares] = useState([]);
  const [paquete,    setPaquete] = useState(null);
  const [lugarSel,   setLugarSel]= useState(null);
  const [tab,        setTab]     = useState("lugares");
  const [loading,    setLoading] = useState(true);
  const contentRef = useRef(null);

  const region = REGIONES.find(r => r.slug === regionSlug) || REGIONES[0];
  const { color, accentLight: light } = region;

  useEffect(() => {
    const load = async () => {
      setLoading(true); setRuta(null); setLugares([]); setPaquete(null);
      try {
        const [rRes, pRes] = await Promise.all([
          axios.get(`${API}/rutas/${regionSlug}`),
          axios.get(`${API}/paquetes/${regionSlug}`).catch(() => ({ data: {} })),
        ]);
        setRuta(rRes.data.ruta);
        setLugares(rRes.data.lugares || []);
        setPaquete(pRes.data.paquete || null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [regionSlug]);

  const switchRegion = (slug) => {
    if (slug === regionSlug) return;
    setRegion(slug);
    setTab("lugares");
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <style>{`
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .35s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[440px] sm:h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0 transition-all duration-700">
          <img
            src={region.heroImg}
            alt={region.label}
            className="w-full h-full object-cover"
            key={region.slug}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-0" style={{ background: region.bgPattern }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-12 fade-in" key={region.slug + "_text"}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Veracruz Contigo · Rutas Turísticas
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2 drop-shadow-lg leading-none"
                style={{ fontFamily: "Playfair Display, serif" }}>
                {region.emoji} {region.label}
              </h1>
              <p className="text-white/75 text-lg sm:text-xl mb-3 font-light italic">{region.subtitulo}</p>
              <p className="text-white/50 text-sm hidden sm:block">{region.tagline}</p>
            </div>

            {rutaData && !loading && (
              <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-sm font-medium">
                  <Clock className="w-4 h-4 opacity-70" /> {rutaData.dias_recomendados} días recomendados
                </div>
                <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-sm font-medium">
                  <DollarSign className="w-4 h-4 opacity-70" />
                  ${rutaData.costo_estimado_min?.toLocaleString()}–${rutaData.costo_estimado_max?.toLocaleString()} MXN/persona
                </div>
                {rutaData.dificultad && (
                  <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-sm font-medium">
                    <Mountain className="w-4 h-4 opacity-70" /> {DIFICULTAD[rutaData.dificultad]?.label}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TABS DE REGIONES ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto scrollbar-hide">
          {REGIONES.map(r => {
            const active = regionSlug === r.slug;
            return (
              <button key={r.slug} onClick={() => switchRegion(r.slug)}
                className={`flex items-center gap-2 px-5 py-4 whitespace-nowrap text-sm transition-all flex-shrink-0 border-b-[3px] ${
                  active ? "font-bold" : "border-transparent text-gray-500 hover:text-gray-800 font-medium"
                }`}
                style={active ? { color: r.color, borderColor: r.color } : {}}>
                <span className="text-base">{r.emoji}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <main ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: color, borderTopColor: "transparent" }} />
            <p className="text-gray-400 text-sm">Cargando {region.label}…</p>
          </div>
        ) : (
          <div className="fade-in" key={regionSlug + "_content"}>

            {/* Chips mobile */}
            {rutaData && (
              <div className="sm:hidden flex flex-wrap gap-2 mb-5">
                <span className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white rounded-xl shadow-sm font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5" style={{ color }} /> {rutaData.dias_recomendados} días
                </span>
                <span className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white rounded-xl shadow-sm font-medium text-gray-700">
                  <DollarSign className="w-3.5 h-3.5" style={{ color }} />
                  ${rutaData.costo_estimado_min?.toLocaleString()}–${rutaData.costo_estimado_max?.toLocaleString()}
                </span>
                {rutaData.dificultad && (
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium border ${DIFICULTAD[rutaData.dificultad]?.cls}`}>
                    <Mountain className="w-3.5 h-3.5" /> {DIFICULTAD[rutaData.dificultad]?.label}
                  </span>
                )}
              </div>
            )}

            {/* Descripción de la ruta */}
            {rutaData?.descripcion_larga && (
              <div className="mb-6 pl-4 border-l-[3px] py-1 rounded-r-xl" style={{ borderColor: color }}>
                <p className="text-sm text-gray-600 leading-relaxed">{rutaData.descripcion_larga}</p>
                {rutaData.como_llegar && (
                  <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
                    <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {rutaData.como_llegar}
                  </p>
                )}
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl w-fit mb-6 shadow-inner">
              {[
                { v: "lugares",    l: `📍 Lugares`, count: lugares.length },
                { v: "paquete",    l: "📦 Paquete" },
                { v: "itinerario", l: "✨ Planear con IA" },
                { v: "mapa",        l: "🗺️ Mapa" },
                { v: "constructor", l: "🛠️ Armar paquete" },
              ].map(({ v, l, count }) => (
                <button key={v} onClick={() => setTab(v)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {l}{count !== undefined ? ` (${count})` : ""}
                </button>
              ))}
            </div>

            {tab === "lugares"    && <LugaresBento lugares={lugares} color={color} onSelect={setLugarSel} />}
            {tab === "paquete"    && <PaqueteTab paquete={paquete} color={color} light={light} />}
            {tab === "itinerario" && <CalculadoraTab region={regionSlug} color={color} />}
            {tab === "mapa"        && <MapaPrestadores region={regionSlug} color={color} />}
            {tab === "constructor" && <ConstructorPaquete lugares={lugares} rutaData={rutaData} region={regionSlug} color={color} />}
          </div>
        )}
      </main>

      {lugarSel && <LugarModal lugar={lugarSel} color={color} onClose={() => setLugarSel(null)} />}

      <Footer />
    </div>
  );
};

export default RutasPage;