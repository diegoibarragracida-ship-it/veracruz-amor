import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin, Clock, DollarSign, Mountain, X, ChevronRight,
  Star, Phone, Globe, Calendar, Users, Sparkles,
  Navigation, Utensils, Hotel, Camera, Loader2,
  ChevronDown, ChevronLeft, ArrowRight, Info
} from "lucide-react";

// ─── Mapa de regiones ───
const REGIONES = [
  { slug: "orizaba", label: "Orizaba",     emoji: "🏔️", color: "#2E7D32", light: "#E8F5E9" },
  { slug: "xalapa",  label: "Xalapa",      emoji: "☕", color: "#1565C0", light: "#E3F2FD" },
  { slug: "tuxtlas", label: "Los Tuxtlas", emoji: "🌿", color: "#00695C", light: "#E0F2F1" },
  { slug: "norte",   label: "Norte / Tajín",emoji: "🏛️", color: "#6A1B9A", light: "#F3E5F5" },
  { slug: "costa",   label: "Costa",        emoji: "🌊", color: "#0277BD", light: "#E1F5FE" },
];

const DIFICULTAD = {
  facil:    { label: "Fácil",    color: "bg-green-100 text-green-800" },
  moderada: { label: "Moderada", color: "bg-amber-100 text-amber-800" },
  dificil:  { label: "Difícil",  color: "bg-red-100 text-red-800" },
};

const TIPOS_ICON = {
  atraccion:  <Camera  className="w-3.5 h-3.5" />,
  restaurante:<Utensils className="w-3.5 h-3.5" />,
  hotel:      <Hotel   className="w-3.5 h-3.5" />,
  actividad:  <Mountain className="w-3.5 h-3.5" />,
};

// ─── Componente: Card de lugar ───
const LugarCard = ({ lugar, color, onClick }) => (
  <button
    onClick={() => onClick(lugar)}
    className="group text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 w-full"
  >
    {/* Imagen */}
    <div className="relative h-44 overflow-hidden bg-gray-100">
      {lugar.foto_portada || lugar.fotos?.[0] ? (
        <img
          src={lugar.foto_portada || lugar.fotos[0]}
          alt={lugar.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src = ""; e.target.parentElement.classList.add("bg-gradient-to-br", "from-gray-200", "to-gray-300"); }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
          {lugar.tipo === "atraccion" ? "🏛️" : lugar.tipo === "actividad" ? "🎯" : lugar.tipo === "restaurante" ? "🍽️" : "🏨"}
        </div>
      )}
      {/* Badge tipo */}
      <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700">
        {TIPOS_ICON[lugar.tipo]}
        <span className="capitalize">{lugar.tipo}</span>
      </span>
      {lugar.destacado && (
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-400 text-amber-900">
          <Star className="w-3 h-3 fill-current" /> Destacado
        </span>
      )}
    </div>

    {/* Info */}
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-snug group-hover:text-[#1B5E20] transition-colors line-clamp-2">
        {lugar.nombre}
      </h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{lugar.descripcion}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {lugar.costo_min !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {lugar.costo_min === 0 ? "Gratis" : `$${lugar.costo_min}–$${lugar.costo_max}`}
            </span>
          )}
          {lugar.calificacion && (
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="w-3 h-3 fill-current" />
              {lugar.calificacion}
            </span>
          )}
        </div>
        <span className="text-xs font-medium flex items-center gap-1" style={{ color }}>
          Ver más <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  </button>
);

// ─── Componente: Modal de lugar ───
const LugarModal = ({ lugar, onClose, color }) => {
  const fotos = [lugar.foto_portada, ...(lugar.fotos || [])].filter(Boolean);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl">

        {/* Galería */}
        <div className="relative h-64 sm:h-80 bg-gray-100 overflow-hidden flex-shrink-0">
          {fotos.length > 0 ? (
            <>
              <img src={fotos[fotoIdx]} alt={lugar.nombre} className="w-full h-full object-cover" />
              {fotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {fotos.map((_, i) => (
                    <button key={i} onClick={() => setFotoIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === fotoIdx ? "bg-white scale-125" : "bg-white/50"}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl"
              style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}>
              {lugar.tipo === "atraccion" ? "🏛️" : lugar.tipo === "actividad" ? "🎯" : "📍"}
            </div>
          )}
          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          {/* Badge tipo */}
          <span className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700">
            {TIPOS_ICON[lugar.tipo]} <span className="capitalize">{lugar.tipo}</span>
          </span>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                {lugar.nombre}
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {lugar.municipio}, Veracruz
              </p>
            </div>
            {lugar.calificacion && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl flex-shrink-0">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="font-bold text-amber-700">{lugar.calificacion}</span>
              </div>
            )}
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {lugar.costo !== undefined && (
              <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
                <DollarSign className="w-3 h-3" />
                {lugar.costo_min === 0 ? "Entrada gratis" : lugar.costo}
              </span>
            )}
            {lugar.horarios && (
              <span className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                <Clock className="w-3 h-3" /> {lugar.horarios}
              </span>
            )}
            {lugar.tags?.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full capitalize">{t}</span>
            ))}
          </div>

          {/* Descripción */}
          <p className="text-gray-700 text-sm leading-relaxed mb-4">{lugar.descripcion}</p>
          {lugar.descripcion_larga && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 border-l-2 pl-4" style={{ borderColor: color }}>
              {lugar.descripcion_larga}
            </p>
          )}
          {lugar.historia && (
            <div className="bg-amber-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Historia</p>
              <p className="text-sm text-amber-900 leading-relaxed">{lugar.historia}</p>
            </div>
          )}

          {/* Contacto */}
          {(lugar.direccion || lugar.telefono || lugar.web) && (
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
              {lugar.direccion && (
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {lugar.direccion}
                </p>
              )}
              {lugar.telefono && (
                <a href={`tel:${lugar.telefono}`} className="text-xs flex items-center gap-2 text-blue-600 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {lugar.telefono}
                </a>
              )}
              {lugar.web && (
                <a href={lugar.web} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-2 text-blue-600 hover:underline">
                  <Globe className="w-3.5 h-3.5" /> {lugar.web}
                </a>
              )}
            </div>
          )}

          {/* Botón Maps */}
          {lugar.lat && lugar.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              <Navigation className="w-4 h-4" /> Cómo llegar
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Componente: Calculadora de Itinerario ───
const CalculadoraItinerario = ({ region, color }) => {
  const [dias, setDias]         = useState(3);
  const [personas, setPersonas] = useState(2);
  const [presupuesto, setPresu] = useState("medio");
  const [intereses, setIntere]  = useState([]);
  const [resultado, setResult]  = useState("");
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const resultRef = useRef(null);

  const INTERESES_OPC = [
    { v: "naturaleza", l: "🌿 Naturaleza" },
    { v: "cultura",    l: "🏛️ Cultura" },
    { v: "gastronomia",l: "🍽️ Gastronomía" },
    { v: "aventura",   l: "🧗 Aventura" },
    { v: "historia",   l: "📜 Historia" },
    { v: "fotografía", l: "📸 Fotografía" },
  ];

  const toggleInteres = (v) =>
    setIntere(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v]);

  const generar = async () => {
    setLoading(true);
    setResult("");
    try {
      const { data } = await axios.post(`${API}/itinerario/generar`, {
        region, dias, num_personas: personas, presupuesto, intereses,
      });
      setResult(data.itinerario);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setResult("❌ Hubo un error generando el itinerario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Genera tu itinerario personalizado</p>
            <p className="text-xs text-gray-500">VeraCruz AI arma tu plan día a día con IA</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* Días */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Días de viaje</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setDias(d => Math.max(1, d - 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                <span className="text-lg font-bold text-gray-900 w-6 text-center">{dias}</span>
                <button onClick={() => setDias(d => Math.min(7, d + 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
              </div>
            </div>
            {/* Personas */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Personas</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setPersonas(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                <span className="text-lg font-bold text-gray-900 w-6 text-center">{personas}</span>
                <button onClick={() => setPersonas(p => Math.min(10, p + 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
              </div>
            </div>
            {/* Presupuesto */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Presupuesto</label>
              <select value={presupuesto} onChange={e => setPresu(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#1B5E20]">
                <option value="bajo">💚 Económico</option>
                <option value="medio">💛 Moderado</option>
                <option value="alto">💜 Premium</option>
              </select>
            </div>
          </div>

          {/* Intereses */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600 block mb-2">Intereses (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESES_OPC.map(({ v, l }) => (
                <button key={v} onClick={() => toggleInteres(v)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    intereses.includes(v)
                      ? "text-white border-transparent"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                  style={intereses.includes(v) ? { backgroundColor: color, borderColor: color } : {}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Botón generar */}
          <button onClick={generar} disabled={loading}
            className="mt-4 w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: color }}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando con IA...</>
              : <><Sparkles className="w-4 h-4" /> Generar mi itinerario</>
            }
          </button>

          {/* Resultado */}
          {resultado && (
            <div ref={resultRef} className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Tu itinerario personalizado
              </p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{resultado}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Componente: Sección de Paquete ───
const PaqueteSection = ({ paquete, color }) => {
  if (!paquete) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: color }}>📦</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{paquete.nombre}</h3>
          <p className="text-xs text-gray-500">{paquete.dias} días · desde ${paquete.precio_min.toLocaleString()} MXN/persona</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{paquete.descripcion}</p>

      {/* Incluye */}
      {paquete.incluye?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Incluye</p>
          <ul className="space-y-1">
            {paquete.incluye.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hoteles */}
      {paquete.hoteles?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Hotel className="w-3.5 h-3.5" /> Hoteles recomendados
          </p>
          <div className="space-y-2">
            {paquete.hoteles.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.nombre}</p>
                  <p className="text-xs text-gray-500">{h.descripcion}</p>
                  <div className="flex mt-0.5">
                    {[...Array(h.estrellas)].map((_, s) => (
                      <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />
                    ))}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0 ml-3">
                  ${h.precio_noche.toLocaleString()}<span className="text-xs font-normal text-gray-400">/noche</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurantes */}
      {paquete.restaurantes?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5" /> Dónde comer
          </p>
          <div className="space-y-2">
            {paquete.restaurantes.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.nombre}</p>
                  <p className="text-xs text-gray-500">{r.especialidad}</p>
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-shrink-0 ml-3">
                  ~${r.precio_promedio}<span className="text-xs font-normal text-gray-400">/persona</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PÁGINA PRINCIPAL ───
const RutasPage = () => {
  const [regionActiva, setRegion]   = useState("orizaba");
  const [rutaData, setRutaData]     = useState(null);
  const [lugares, setLugares]       = useState([]);
  const [paquete, setPaquete]       = useState(null);
  const [lugarSel, setLugarSel]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("lugares"); // lugares | paquete

  const regionInfo = REGIONES.find(r => r.slug === regionActiva);

  useEffect(() => {
    const fetchRegion = async () => {
      setLoading(true);
      setRutaData(null);
      setLugares([]);
      setPaquete(null);
      try {
        const [rutaRes, paqueteRes] = await Promise.all([
          axios.get(`${API}/rutas/${regionActiva}`),
          axios.get(`${API}/paquetes/${regionActiva}`).catch(() => ({ data: {} })),
        ]);
        setRutaData(rutaRes.data.ruta);
        setLugares(rutaRes.data.lugares || []);
        setPaquete(paqueteRes.data.paquete || null);
      } catch (err) {
        console.error("Error cargando región:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegion();
  }, [regionActiva]);

  const color = regionInfo?.color || "#1B5E20";
  const light = regionInfo?.light || "#E8F5E9";

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-10 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block text-white/80 text-sm font-medium uppercase tracking-widest mb-3">
            Veracruz Contigo
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            Rutas Turísticas
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            5 regiones, decenas de experiencias únicas. Explora, planea y viaja con VeraCruz AI.
          </p>
        </div>
      </section>

      {/* ── Tabs de regiones ── */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {REGIONES.map(r => (
              <button
                key={r.slug}
                onClick={() => { setRegion(r.slug); setTab("lugares"); }}
                className={`flex items-center gap-2 px-5 py-4 whitespace-nowrap text-sm font-medium border-b-2 transition-all flex-shrink-0 ${
                  regionActiva === r.slug
                    ? "border-current font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
                style={regionActiva === r.slug ? { color: r.color, borderColor: r.color } : {}}
              >
                <span>{r.emoji}</span> {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido de región ── */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: color, borderTopColor: "transparent" }} />
            <p className="text-gray-500 text-sm">Cargando {regionInfo?.label}...</p>
          </div>
        ) : (
          <>
            {/* Info de la ruta */}
            {rutaData && (
              <div className="rounded-2xl p-6 mb-6 border" style={{ backgroundColor: light, borderColor: `${color}33` }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                      {rutaData.nombre}
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed max-w-2xl">{rutaData.descripcion}</p>
                    {rutaData.como_llegar && (
                      <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                        <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {rutaData.como_llegar}
                      </p>
                    )}
                  </div>
                  {/* Chips de info */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white rounded-xl shadow-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" style={{ color }} />
                      {rutaData.dias_recomendados} días
                    </span>
                    <span className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white rounded-xl shadow-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" style={{ color }} />
                      ${rutaData.costo_estimado_min?.toLocaleString()}–${rutaData.costo_estimado_max?.toLocaleString()}
                    </span>
                    {rutaData.dificultad && (
                      <span className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium ${DIFICULTAD[rutaData.dificultad]?.color}`}>
                        <Mountain className="w-4 h-4" />
                        {DIFICULTAD[rutaData.dificultad]?.label}
                      </span>
                    )}
                    {rutaData.distancia_km && (
                      <span className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white rounded-xl shadow-sm font-medium text-gray-700">
                        <MapPin className="w-4 h-4" style={{ color }} />
                        {rutaData.distancia_km} km
                      </span>
                    )}
                  </div>
                </div>
                {rutaData.mejor_epoca && (
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Mejor época: {rutaData.mejor_epoca}
                  </p>
                )}
              </div>
            )}

            {/* Sub-tabs: Lugares | Paquete */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
              <button onClick={() => setTab("lugares")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === "lugares" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                📍 Lugares ({lugares.length})
              </button>
              <button onClick={() => setTab("paquete")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === "paquete" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                📦 Paquete
              </button>
              <button onClick={() => setTab("itinerario")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === "itinerario" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                <Sparkles className="w-3.5 h-3.5" /> Planear con IA
              </button>
            </div>

            {/* Tab: Lugares */}
            {tab === "lugares" && (
              lugares.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {lugares.map(l => (
                    <LugarCard key={l.id} lugar={l} color={color} onClick={setLugarSel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Próximamente más lugares para esta región.</p>
                </div>
              )
            )}

            {/* Tab: Paquete */}
            {tab === "paquete" && (
              paquete ? (
                <PaqueteSection paquete={paquete} color={color} />
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Paquete para esta región disponible próximamente.</p>
                </div>
              )
            )}

            {/* Tab: Itinerario AI */}
            {tab === "itinerario" && (
              <CalculadoraItinerario region={regionActiva} color={color} />
            )}
          </>
        )}
      </main>

      {/* ── Modal de Lugar ── */}
      {lugarSel && (
        <LugarModal lugar={lugarSel} color={color} onClose={() => setLugarSel(null)} />
      )}

      <Footer />
    </div>
  );
};

export default RutasPage;