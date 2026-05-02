import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapaPrestadores from "@/components/MapaPrestadores";
import ConstructorPaquete from "@/components/ConstructorPaquete";
import {
  MapPin, Clock, DollarSign, Mountain, X, Star,
  Phone, Globe, Calendar, Sparkles, Navigation,
  Utensils, Hotel, Loader2, ChevronRight, ChevronDown,
  ArrowRight, Car, Train, Bus, Plane, Wallet,
  Users, Coffee, Sun, Sunset, Moon, Sunrise,
  Camera, Heart, Share2, ExternalLink, Wrench
} from "lucide-react";

/* ─── REGIONES ─────────────────────────────────────────────── */
const REGIONES = [
  {
    slug: "orizaba", label: "Altas Montañas", ciudad: "Orizaba",
    subtitulo: "Cumbres, café y arquitectura única",
    emoji: "🏔️", color: "#1B5E20", light: "#E8F5E9",
    heroImg: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=2070",
    tagline: "Pico de Orizaba · Teleférico · Palacio de Hierro",
  },
  {
    slug: "xalapa", label: "Capital Cultural", ciudad: "Xalapa",
    subtitulo: "Arte, niebla y café de altura",
    emoji: "☕", color: "#5D4037", light: "#EFEBE9",
    heroImg: "https://images.unsplash.com/photo-1599307228800-475a3632906e?q=80&w=2070",
    tagline: "Coatepec · Museo Antropología · Naolinco",
  },
  {
    slug: "tuxtlas", label: "Selva y Magia", ciudad: "Los Tuxtlas",
    subtitulo: "Selva tropical, laguna y brujos",
    emoji: "🌿", color: "#00695C", light: "#E0F2F1",
    heroImg: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=2070",
    tagline: "Catemaco · Nanciyaga · Eyipantla",
  },
  {
    slug: "norte", label: "Costa Esmeralda", ciudad: "Norte / Tajín",
    subtitulo: "Patrimonio UNESCO y playas vírgenes",
    emoji: "🏛️", color: "#E65100", light: "#FBE9E7",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070",
    tagline: "El Tajín · Papantla · Voladores",
  },
  {
    slug: "costa", label: "Puerto Jarocho", ciudad: "Veracruz",
    subtitulo: "Historia viva, mariscos y carnaval",
    emoji: "🌊", color: "#0277BD", light: "#E1F5FE",
    heroImg: "https://images.unsplash.com/photo-1593036814633-1463e2777169?q=80&w=2070",
    tagline: "San Juan de Ulúa · Malecón · Boca del Río",
  },
];

const DIFICULTAD = {
  facil:    { label: "Fácil",    cls: "bg-emerald-100 text-emerald-800" },
  moderada: { label: "Moderada", cls: "bg-amber-100 text-amber-800" },
  dificil:  { label: "Difícil",  cls: "bg-red-100 text-red-800" },
};

/* ─── MODAL DE LUGAR ────────────────────────────────────────── */
const LugarModal = ({ lugar, color, onClose }) => {
  const [fotoIdx, setFotoIdx] = useState(0);
  const fotos = [lugar.foto_portada, ...(lugar.fotos || [])].filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Foto */}
        <div className="relative h-64 sm:h-80 flex-shrink-0 bg-gray-100">
          {fotos.length > 0 ? (
            <>
              <img src={fotos[fotoIdx]} alt={lugar.nombre} className="w-full h-full object-cover" />
              {fotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={() => setFotoIdx(i)}
                      className={`rounded-full transition-all ${i === fotoIdx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl"
              style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}>
              {lugar.tipo === "actividad" ? "🎯" : lugar.tipo === "restaurante" ? "🍽️" : "🏛️"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
            <X className="w-5 h-5" />
          </button>
          <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 capitalize">
            {lugar.tipo}
          </span>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{lugar.nombre}</h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color }} /> {lugar.municipio || lugar.direccion || "Veracruz"}
              </p>
            </div>
            {lugar.calificacion && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-2 rounded-2xl flex-shrink-0">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="font-bold text-amber-700">{lugar.calificacion}</span>
              </div>
            )}
          </div>

          {/* Chips info */}
          <div className="flex flex-wrap gap-2 mb-4">
            {lugar.costo_min !== undefined && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign className="w-3 h-3" />
                {lugar.costo_min === 0 ? "Entrada gratuita" : `$${lugar.costo_min}–$${lugar.costo_max} MXN`}
              </span>
            )}
            {lugar.horarios && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" /> {lugar.horarios}
              </span>
            )}
            {lugar.tags?.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 capitalize border border-gray-200">{t}</span>
            ))}
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-3">{lugar.descripcion}</p>
          {lugar.descripcion_larga && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 pl-4 border-l-2 rounded-r-lg" style={{ borderColor: color }}>
              {lugar.descripcion_larga}
            </p>
          )}
          {lugar.historia && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Historia</p>
              <p className="text-sm text-amber-900 leading-relaxed">{lugar.historia}</p>
            </div>
          )}

          {(lugar.direccion || lugar.telefono || lugar.web) && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              {lugar.direccion && (
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} /> {lugar.direccion}
                </p>
              )}
              {lugar.telefono && (
                <a href={`tel:${lugar.telefono}`} className="text-xs flex items-center gap-2 hover:underline" style={{ color }}>
                  <Phone className="w-3.5 h-3.5" /> {lugar.telefono}
                </a>
              )}
              {lugar.web && (
                <a href={lugar.web} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-2 hover:underline" style={{ color }}>
                  <Globe className="w-3.5 h-3.5" /> {lugar.web}
                </a>
              )}
            </div>
          )}
        </div>

        {lugar.lat && lugar.lng && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100">
            <a href={`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color }}>
              <Navigation className="w-4 h-4" /> Cómo llegar · Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── CARD DE LUGAR ─────────────────────────────────────────── */
const LugarCard = ({ lugar, color, onClick, featured = false }) => {
  const foto = lugar.foto_portada || lugar.fotos?.[0];
  return (
    <button onClick={() => onClick(lugar)}
      className={`group text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100
        hover:shadow-xl hover:-translate-y-1 transition-all duration-200 w-full
        ${featured ? "md:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden bg-gray-100 ${featured ? "h-64" : "h-48"}`}>
        {foto ? (
          <img src={foto} alt={lugar.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
            {lugar.tipo === "actividad" ? "🎯" : lugar.tipo === "restaurante" ? "🍽️" : "🏛️"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-sm text-gray-700 capitalize">
            {lugar.tipo}
          </span>
          {lugar.destacado && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-900 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> Top
            </span>
          )}
        </div>
        {lugar.calificacion && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-white text-xs font-bold">{lugar.calificacion}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 text-sm leading-snug group-hover:underline decoration-dotted line-clamp-2">
          {lugar.nombre}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{lugar.descripcion}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {lugar.costo_min !== undefined && (
              <span className="font-medium">
                {lugar.costo_min === 0 ? "✅ Gratis" : `💲$${lugar.costo_min}`}
              </span>
            )}
            {lugar.horarios && <span className="truncate max-w-[100px]">🕐 {lugar.horarios.split(" ")[0]}</span>}
          </div>
          <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color }}>
            Ver <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
};

/* ─── TAB PAQUETE ───────────────────────────────────────────── */
const PaqueteTab = ({ paquete, hoteles, restaurantes, color, light }) => {
  if (!paquete && !hoteles?.length && !restaurantes?.length) return (
    <div className="text-center py-20 text-gray-400">
      <Hotel className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No hay paquete configurado para esta región.</p>
      <p className="text-sm mt-1">El superadmin puede crear uno desde el panel.</p>
    </div>
  );

  // Usar hoteles/restaurantes reales de la BD, con fallback al paquete
  const hotelesShow = hoteles?.length ? hoteles : (paquete?.hoteles_reales || paquete?.hoteles || []);
  const restaurantesShow = restaurantes?.length ? restaurantes : (paquete?.restaurantes_reales || paquete?.restaurantes || []);

  return (
    <div className="space-y-8">
      {paquete && (
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: light, borderColor: `${color}33` }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{paquete.nombre}</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xl">{paquete.descripcion}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white rounded-xl shadow-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4" style={{ color }} /> {paquete.dias} días
              </span>
              <span className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white rounded-xl shadow-sm font-semibold text-gray-700">
                <DollarSign className="w-4 h-4" style={{ color }} />
                ${paquete.precio_min?.toLocaleString()}–${paquete.precio_max?.toLocaleString()} MXN
              </span>
            </div>
          </div>
          {paquete.incluye?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {paquete.incluye.map((item, i) => (
                <span key={i} className="text-xs px-3 py-1.5 bg-white rounded-full text-gray-700 border border-gray-200 flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hoteles */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Hotel className="w-5 h-5" style={{ color }} /> Hospedaje
          </h3>
          {hotelesShow.length > 0 ? (
            <div className="space-y-3">
              {hotelesShow.map((h, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {h.foto_url && (
                      <img src={h.foto_url} alt={h.nombre} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{h.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{h.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {h.calificacion_promedio > 0 && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {h.calificacion_promedio?.toFixed(1)}
                          </span>
                        )}
                        {/* Estrellas si es paquete estático */}
                        {h.estrellas && (
                          <div className="flex">
                            {[...Array(h.estrellas)].map((_, s) => (
                              <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />
                            ))}
                          </div>
                        )}
                        {h.precio_noche && (
                          <span className="text-xs font-bold ml-auto" style={{ color }}>
                            ${h.precio_noche?.toLocaleString()}/noche
                          </span>
                        )}
                      </div>
                      {h.telefono && (
                        <a href={`tel:${h.telefono}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {h.telefono}
                        </a>
                      )}
                      {h.whatsapp && (
                        <a href={`https://wa.me/${h.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-0.5">
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin hoteles registrados aún en esta región.</p>
          )}
        </div>

        {/* Restaurantes */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5" style={{ color }} /> Gastronomía
          </h3>
          {restaurantesShow.length > 0 ? (
            <div className="space-y-3">
              {restaurantesShow.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {r.foto_url && (
                      <img src={r.foto_url} alt={r.nombre} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.descripcion || r.especialidad}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {r.calificacion_promedio > 0 && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {r.calificacion_promedio?.toFixed(1)}
                          </span>
                        )}
                        {r.horarios && <span className="text-xs text-gray-400 truncate max-w-[120px]">🕐 {r.horarios}</span>}
                        {r.precio_promedio && (
                          <span className="text-xs font-bold ml-auto" style={{ color }}>~${r.precio_promedio}/p</span>
                        )}
                      </div>
                      {r.telefono && (
                        <a href={`tel:${r.telefono}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {r.telefono}
                        </a>
                      )}
                      {r.whatsapp && (
                        <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-0.5">
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin restaurantes registrados aún.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── GENERADOR DE ITINERARIO ───────────────────────────────── */
const ItinerarioTab = ({ region, color, regionLabel }) => {
  const [dias, setDias] = useState(3);
  const [personas, setPersonas] = useState(2);
  const [presupuesto, setPresupuesto] = useState("medio");
  const [intereses, setIntereses] = useState([]);
  const [transporte, setTransporte] = useState("auto");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  const INTERESES = [
    { v: "naturaleza", l: "🌿 Naturaleza" },
    { v: "cultura", l: "🏛️ Cultura" },
    { v: "gastronomia", l: "🍽️ Gastronomía" },
    { v: "aventura", l: "🧗 Aventura" },
    { v: "historia", l: "📜 Historia" },
    { v: "fotografía", l: "📸 Fotografía" },
    { v: "familia", l: "👨‍👩‍👧 Familia" },
    { v: "romantico", l: "💑 Romántico" },
  ];

  const TRANSPORTES = [
    { v: "auto", l: "🚗 Auto propio" },
    { v: "uber", l: "🚖 Uber/taxi" },
    { v: "autobus", l: "🚌 Autobús" },
  ];

  const toggle = (v) => setIntereses(p => p.includes(v) ? p.filter(i => i !== v) : [...p, v]);

  const generar = async () => {
    setLoading(true);
    setResultado("");
    try {
      const { data } = await axios.post(`${API}/itinerario/generar`, {
        region, dias, num_personas: personas,
        presupuesto, intereses: [...intereses, `transporte_${transporte}`],
      });
      setResultado(data.itinerario);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch {
      setResultado("❌ Error generando el itinerario. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const Counter = ({ label, val, dec, inc, min = 1, max = 99 }) => (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button onClick={dec} disabled={val <= min}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xl font-bold">−</button>
        <span className="text-3xl font-black text-gray-900 w-10 text-center">{val}</span>
        <button onClick={inc} disabled={val >= max}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xl font-bold">+</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}22` }}>✨</div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">VeraCruz AI — Tu Guía Personal</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Dinos cómo eres y la IA arma un itinerario completo día a día con horarios, costos de transporte, restaurantes reales y tips locales.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">

        {/* Días y personas */}
        <div className="grid grid-cols-2 gap-8">
          <Counter label="Días de viaje" val={dias} dec={() => setDias(d => d - 1)} inc={() => setDias(d => d + 1)} min={1} max={7} />
          <Counter label="Viajeros" val={personas} dec={() => setPersonas(p => p - 1)} inc={() => setPersonas(p => p + 1)} min={1} max={15} />
        </div>

        {/* Presupuesto */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Presupuesto por persona por día</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "bajo", l: "💚 Económico", sub: "< $800/día" },
              { v: "medio", l: "💛 Moderado", sub: "$800–2,500/día" },
              { v: "alto", l: "💜 Premium", sub: "> $2,500/día" },
            ].map(({ v, l, sub }) => (
              <button key={v} onClick={() => setPresupuesto(v)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${presupuesto === v ? "shadow-sm" : "border-gray-100 hover:border-gray-200"}`}
                style={presupuesto === v ? { borderColor: color, backgroundColor: `${color}0d` } : {}}>
                <p className="text-sm font-bold mb-0.5" style={presupuesto === v ? { color } : { color: "#374151" }}>{l}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Transporte */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cómo te vas a mover</p>
          <div className="flex gap-3 flex-wrap">
            {TRANSPORTES.map(({ v, l }) => (
              <button key={v} onClick={() => setTransporte(v)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${transporte === v ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                style={transporte === v ? { backgroundColor: color } : {}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Intereses */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            ¿Qué te emociona? <span className="font-normal normal-case text-gray-400">(elige varios)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESES.map(({ v, l }) => (
              <button key={v} onClick={() => toggle(v)}
                className={`text-sm px-4 py-2 rounded-full font-medium border-2 transition-all ${intereses.includes(v) ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                style={intereses.includes(v) ? { backgroundColor: color, borderColor: color } : {}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Botón */}
        <button onClick={generar} disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 hover:opacity-90 active:scale-[.98] disabled:opacity-60 transition-all"
          style={{ backgroundColor: color }}>
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Creando tu itinerario perfecto...</>
            : <><Sparkles className="w-5 h-5" /> Generar mi itinerario para {regionLabel}</>}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div ref={resultRef} className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-base" style={{ backgroundColor: color }}>✨</div>
            <div>
              <p className="font-black text-gray-900">Tu itinerario personalizado para {regionLabel}</p>
              <p className="text-xs text-gray-400 mt-0.5">{dias} días · {personas} {personas === 1 ? "viajero" : "viajeros"} · presupuesto {presupuesto}</p>
            </div>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{resultado}</div>
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button onClick={() => { navigator.clipboard.writeText(resultado); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              📋 Copiar
            </button>
            <button onClick={() => setResultado("")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              🔄 Generar otro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── PÁGINA PRINCIPAL ──────────────────────────────────────── */
const RutasPage = () => {
  const [regionSlug, setRegion] = useState("orizaba");
  const [rutaData, setRuta] = useState(null);
  const [lugares, setLugares] = useState([]);
  const [paquete, setPaquete] = useState(null);
  const [hoteles, setHoteles] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [lugarSel, setLugarSel] = useState(null);
  const [tab, setTab] = useState("lugares");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  const region = REGIONES.find(r => r.slug === regionSlug) || REGIONES[0];
  const { color, light } = region;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRuta(null); setLugares([]); setPaquete(null);
      setHoteles([]); setRestaurantes([]);
      try {
        const [rutaRes, paqueteRes] = await Promise.all([
          axios.get(`${API}/rutas/${regionSlug}`),
          axios.get(`${API}/paquetes/${regionSlug}`).catch(() => ({ data: {} })),
        ]);
        setRuta(rutaRes.data.ruta || null);
        setLugares(rutaRes.data.lugares || []);
        setHoteles(rutaRes.data.hoteles || []);
        setRestaurantes(rutaRes.data.restaurantes || []);
        setPaquete(paqueteRes.data.paquete || null);
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

  const TABS = [
    { id: "lugares", label: "Destinos", icon: MapPin, count: lugares.length },
    { id: "hospedaje", label: "Hospedaje y Comida", icon: Hotel },
    { id: "itinerario", label: "✨ Planear con IA", icon: Sparkles },
    { id: "mapa", label: "Mapa", icon: Globe },
    { id: "constructor", label: "Armar viaje", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[420px] sm:h-[480px] flex items-end overflow-hidden">
        <div className="absolute inset-0 transition-all duration-700">
          <img src={region.heroImg} alt={region.label} key={region.slug}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-10 fade-up" key={region.slug}>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
            Veracruz Contigo · Rutas Turísticas
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-black text-white leading-none mb-2 tracking-tight">
                {region.emoji} {region.label}
              </h1>
              <p className="text-white/70 text-lg italic mb-3">{region.subtitulo}</p>
              <p className="text-white/40 text-sm hidden sm:block">{region.tagline}</p>
            </div>
            {rutaData && !loading && (
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold">
                  <Clock className="w-4 h-4 opacity-70" /> {rutaData.dias_recomendados} días
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold">
                  <DollarSign className="w-4 h-4 opacity-70" />
                  ${rutaData.costo_estimado_min?.toLocaleString()}–${rutaData.costo_estimado_max?.toLocaleString()}
                </div>
                {rutaData.dificultad && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold ${DIFICULTAD[rutaData.dificultad]?.cls}`}>
                    <Mountain className="w-4 h-4" /> {DIFICULTAD[rutaData.dificultad]?.label}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TABS REGIONES ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto scrollbar-hide">
          {REGIONES.map(r => (
            <button key={r.slug} onClick={() => switchRegion(r.slug)}
              className={`flex items-center gap-2 px-5 py-4 whitespace-nowrap text-sm transition-all flex-shrink-0 border-b-[3px] ${
                regionSlug === r.slug ? "font-black" : "border-transparent text-gray-500 hover:text-gray-800 font-medium"
              }`}
              style={regionSlug === r.slug ? { color: r.color, borderColor: r.color } : {}}>
              <span>{r.emoji}</span> {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <main ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: color, borderTopColor: "transparent" }} />
            <p className="text-gray-400 text-sm font-medium">Cargando {region.label}…</p>
          </div>
        ) : (
          <div className="fade-up" key={regionSlug}>

            {/* Info de ruta */}
            {rutaData && (
              <div className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: light, borderColor: `${color}33` }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-gray-900 mb-1">{rutaData.nombre}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">{rutaData.descripcion}</p>
                    {rutaData.como_llegar && (
                      <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
                        <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {rutaData.como_llegar}
                      </p>
                    )}
                    {rutaData.mejor_epoca && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Mejor época: {rutaData.mejor_epoca}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6 overflow-x-auto scrollbar-hide">
              {TABS.map(({ id, label, count }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    tab === id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {label}{count !== undefined ? ` (${count})` : ""}
                </button>
              ))}
            </div>

            {/* Destinos */}
            {tab === "lugares" && (
              lugares.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {lugares.map((l, i) => (
                    <LugarCard key={l.id || i} lugar={l} color={color} onClick={setLugarSel} featured={i === 0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Sin destinos registrados para esta región.</p>
                  <p className="text-sm mt-1">El encargado puede agregar lugares desde el panel de administración.</p>
                </div>
              )
            )}

            {/* Hospedaje y comida */}
            {tab === "hospedaje" && (
              <PaqueteTab
                paquete={paquete}
                hoteles={hoteles}
                restaurantes={restaurantes}
                color={color}
                light={light}
              />
            )}

            {/* Itinerario IA */}
            {tab === "itinerario" && (
              <ItinerarioTab region={regionSlug} color={color} regionLabel={region.label} />
            )}

            {/* Mapa */}
            {tab === "mapa" && (
              <div className="h-[600px] rounded-3xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-gray-100">
                <MapaPrestadores region={regionSlug} color={color} />
              </div>
            )}

            {/* Constructor */}
            {tab === "constructor" && (
              <ConstructorPaquete lugares={lugares} rutaData={rutaData} region={regionSlug} color={color} />
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {lugarSel && <LugarModal lugar={lugarSel} color={color} onClose={() => setLugarSel(null)} />}

      <Footer />
    </div>
  );
};

export default RutasPage;