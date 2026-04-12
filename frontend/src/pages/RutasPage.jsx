import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapaPrestadores from "@/components/MapaPrestadores";
import ConstructorPaquete from "@/components/ConstructorPaquete";
import {
  MapPin, Clock, DollarSign, Mountain, X, Star,
  Phone, Globe, Calendar, Sparkles, Navigation,
  Utensils, Hotel, Loader2, ArrowRight, Info,
  ChevronRight, Facebook, Instagram, Share2
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONFIGURACIÓN DE REGIONES (Visual Enhancements)
───────────────────────────────────────────── */
const REGIONES = [
  {
    slug: "orizaba",
    label: "Altas Montañas",
    ciudad: "Orizaba",
    subtitulo: "La ciudad de las aguas alegres",
    emoji: "🏔️",
    color: "#1B5E20",
    heroImg: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=2070&auto=format&fit=crop",
    tagline: "Pico de Orizaba · Teleférico · Cascada de Elefante",
  },
  {
    slug: "xalapa",
    label: "Cultura y Café",
    ciudad: "Xalapa",
    subtitulo: "Aroma a café y neblina",
    emoji: "☕",
    color: "#5D4037",
    heroImg: "https://images.unsplash.com/photo-1599307228800-475a3632906e?q=80&w=2070&auto=format&fit=crop",
    tagline: "Coatepec · Xico · Museo de Antropología",
  },
  {
    slug: "tuxtlas",
    label: "Selva y Magia",
    ciudad: "Los Tuxtlas",
    subtitulo: "Tierra de nahuales y cascadas",
    emoji: "🌿",
    color: "#00695C",
    heroImg: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=2070&auto=format&fit=crop",
    tagline: "Catemaco · Nanciyaga · Salto de Eyipantla",
  },
  {
    slug: "norte",
    label: "Costa Esmeralda",
    ciudad: "Norte / Tajín",
    subtitulo: "El trueno en la ciudad sagrada",
    emoji: "🏛️",
    color: "#E65100",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop",
    tagline: "El Tajín · Papantla · Tecolutla",
  },
  {
    slug: "costa",
    label: "Puerto y Aventura",
    ciudad: "Veracruz Costa",
    subtitulo: "Donde el mar se hace canción",
    emoji: "🌊",
    color: "#0277BD",
    heroImg: "https://images.unsplash.com/photo-1593036814633-1463e2777169?q=80&w=2070&auto=format&fit=crop",
    tagline: "San Juan de Ulúa · Acuario · Alvarado",
  },
];

const DIFICULTAD = {
  facil:    { label: "Fácil",    color: "#10B981", bg: "#ECFDF5" },
  moderada: { label: "Moderada", color: "#F59E0B", bg: "#FFFBEB" },
  dificil:  { label: "Desafiante", color: "#EF4444", bg: "#FEF2F2" },
};

/* ─────────────────────────────────────────────
   COMPONENTES SUB-MÓDULOS (Rediseñados)
───────────────────────────────────────────── */

const LugarModal = ({ lugar, color, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "unset");
  }, []);

  if (!lugar) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-black/60">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>

        {/* Galería de Imágenes Izquierda */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative group">
          <img 
            src={lugar.foto_portada || lugar.fotos?.[0]} 
            className="w-full h-full object-cover"
            alt={lugar.nombre}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase mb-2 inline-block">
              {lugar.tipo}
            </span>
            <h2 className="text-4xl font-black">{lugar.nombre}</h2>
          </div>
        </div>

        {/* Contenido Derecho */}
        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-400 mb-6 uppercase tracking-widest text-xs font-bold">
            <MapPin className="w-4 h-4" />
            <span>{lugar.municipio}, Veracruz</span>
          </div>

          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-black text-gray-900 mb-3 uppercase">Sobre este destino</h4>
              <p className="text-gray-600 leading-relaxed text-lg">{lugar.descripcion}</p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Costo Estimado</p>
                <p className="text-xl font-black text-gray-900">
                  {lugar.costo_min === 0 ? "Acceso Libre" : `$${lugar.costo_min} MXN`}
                </p>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Horario Sugerido</p>
                <p className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> 09:00 - 18:00
                </p>
              </div>
            </div>

            <button className="w-full py-5 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: color }}>
              <Navigation className="w-5 h-5" /> Cómo llegar con Google Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LugarCard = ({ lugar, color, onClick, size = "normal" }) => {
  const foto = lugar.foto_portada || lugar.fotos?.[0];
  const isLarge = size === "large";

  return (
    <div onClick={() => onClick(lugar)} className="group cursor-pointer">
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${isLarge ? 'aspect-[16/10] md:aspect-[16/7]' : 'aspect-[4/5]'}`}>
        <img 
          src={foto} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={lugar.nombre}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 flex gap-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase border border-white/30">
            {lugar.tipo}
          </span>
          {lugar.destacado && (
            <span className="px-3 py-1 bg-amber-400 rounded-full text-[10px] font-black text-amber-950 uppercase flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> Destacado
            </span>
          )}
        </div>

        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h3 className={`font-black leading-tight ${isLarge ? 'text-4xl' : 'text-2xl'}`}>{lugar.nombre}</h3>
          <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <span className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {lugar.municipio}
            </span>
            <div className="flex items-center gap-2 font-bold text-sm">
              Ver más <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LugaresBento = ({ lugares, color, onSelect }) => {
  if (!lugares.length) return (
    <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
      <Loader2 className="w-10 h-10 animate-spin text-gray-200 mb-4" />
      <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Buscando rutas...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {lugares.map((l, idx) => (
        <div key={l.id} className={idx === 0 ? "md:col-span-2 lg:col-span-3" : "lg:col-span-1"}>
          <LugarCard 
            lugar={l} 
            color={color} 
            onClick={onSelect} 
            size={idx === 0 ? "large" : "normal"}
          />
        </div>
      ))}
    </div>
  );
};

const PaqueteTab = ({ paquete, color }) => {
  if (!paquete) return (
    <div className="p-12 text-center bg-white rounded-[3rem] shadow-sm border border-gray-100">
      <p className="text-gray-400">Pronto tendremos paquetes disponibles para esta zona.</p>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Hoteles */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <Hotel className="w-6 h-6" style={{ color }} /> Hospedaje Recomendado
        </h3>
        {paquete.hoteles?.map((h, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex gap-4 items-center group">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
               <img src={h.foto || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{h.nombre}</h4>
              <p className="text-sm text-gray-500 line-clamp-1">{h.direccion}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Desde ${h.precio_noche} MXN</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Restaurantes */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <Utensils className="w-6 h-6" style={{ color }} /> Sabores Locales
        </h3>
        {paquete.restaurantes?.map((r, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex gap-4 items-center group">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
               <img src={r.foto || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200"} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{r.nombre}</h4>
              <p className="text-sm text-gray-500">{r.especialidad}</p>
              <div className="mt-2 flex gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-current" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CalculadoraTab = ({ region, color }) => {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const resultRef = useRef(null);

  const OPTIONS = {
    dias: [1, 2, 3, 5],
    personas: [1, 2, 4, 6],
    presupuesto: [
      { id: 'bajo', label: 'Económico', emoji: '🎒' },
      { id: 'medio', label: 'Equilibrado', emoji: '🚗' },
      { id: 'alto', label: 'Premium', emoji: '✨' }
    ]
  };

  const generar = async () => {
    setLoading(true);
    // Simulación de llamada a IA (Gemini)
    setTimeout(() => {
      setRes({
        itinerario: "Día 1: Desayuno en el mercado central. Visita al Pico de Orizaba por la mañana. Tarde de café en el centro histórico.\nDía 2: Senderismo en el Cerro del Borrego y cena frente al Palacio de Hierro.",
        consejo: "No olvides llevar ropa térmica, el clima cambia rápido."
      });
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full translate-x-20 -translate-y-20 blur-3xl opacity-50" />
        
        <header className="relative mb-12 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-blue-600 mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black mb-4">Planificador con IA</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Personalizamos tu ruta en segundos usando inteligencia artificial basada en tus preferencias.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <label className="text-sm font-black uppercase text-gray-400 tracking-widest">¿Cuántos días?</label>
            <div className="flex gap-3">
              {OPTIONS.dias.map(d => (
                <button key={d} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-bold hover:border-black transition-all">
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <label className="text-sm font-black uppercase text-gray-400 tracking-widest">Estilo de viaje</label>
            <div className="grid grid-cols-3 gap-3">
              {OPTIONS.presupuesto.map(p => (
                <button key={p.id} className="flex flex-col items-center p-4 rounded-2xl border-2 border-gray-100 hover:border-black transition-all">
                  <span className="text-xl mb-1">{p.emoji}</span>
                  <span className="text-[10px] font-bold uppercase">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={generar}
          disabled={loading}
          className="w-full mt-12 py-6 rounded-[2rem] bg-black text-white font-black text-xl flex items-center justify-center gap-4 transition-all hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Generar Itinerario Mágico"}
        </button>
      </div>

      {res && (
        <div ref={resultRef} className="bg-white p-12 rounded-[4rem] shadow-2xl border-t-8 animate-in slide-in-from-bottom-10 duration-700"
             style={{ borderColor: color }}>
          <h3 className="text-3xl font-black mb-8 flex items-center gap-3">
            <Calendar className="w-8 h-8" /> Tu Plan Personalizado
          </h3>
          <div className="prose prose-lg max-w-none text-gray-600">
            {res.itinerario.split('\n').map((line, i) => (
              <p key={i} className="mb-4 bg-gray-50 p-4 rounded-2xl border-l-4 border-gray-200">{line}</p>
            ))}
          </div>
          <div className="mt-8 p-6 bg-blue-50 rounded-3xl flex gap-4 items-start">
            <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <p className="text-blue-800 font-medium"><strong>Tip Pro:</strong> {res.consejo}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL (Orquestador de 700+ líneas)
───────────────────────────────────────────── */

const RutasPage = () => {
  const [regionSlug, setRegion]  = useState("orizaba");
  const [rutaData,   setRuta]    = useState(null);
  const [lugares,    setLugares] = useState([]);
  const [paquete,    setPaquete] = useState(null);
  const [lugarSel,   setLugarSel]= useState(null);
  const [tab,        setTab]     = useState("lugares");
  const [loading,    setLoading] = useState(true);

  const region = REGIONES.find(r => r.slug === regionSlug) || REGIONES[0];
  const { color } = region;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rRes, pRes] = await Promise.all([
          axios.get(`${API}/rutas/${regionSlug}`),
          axios.get(`${API}/paquetes/${regionSlug}`).catch(() => ({ data: {} })),
        ]);
        setRuta(rRes.data.ruta);
        setLugares(rRes.data.lugares || []);
        setPaquete(pRes.data.paquete || null);
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [regionSlug]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
      <Header />

      {/* Hero Visual Immersivo */}
      <section className="relative h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={region.heroImg} 
            className="w-full h-full object-cover transition-all duration-[2000ms] scale-105"
            alt={region.label}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFDFD] via-black/20 to-black/30" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
               <span className="w-12 h-[2px] bg-white/60"></span>
               <span className="text-white text-sm font-black uppercase tracking-[0.4em]">{region.tagline}</span>
            </div>
            <h1 className="text-7xl md:text-[10rem] font-black text-white leading-[0.85] tracking-tighter mb-8 drop-shadow-2xl">
              {region.label.split(' ')[0]}<br/>
              <span className="text-outline-white opacity-90">{region.label.split(' ')[1] || ""}</span>
            </h1>
            
            <div className="flex flex-wrap gap-6 items-center">
              <button onClick={() => document.getElementById('content').scrollIntoView({behavior:'smooth'})}
                      className="px-10 py-5 bg-white text-black rounded-full font-black text-lg shadow-2xl hover:bg-gray-100 transition-all flex items-center gap-3">
                Explorar Ruta <ArrowRight className="w-5 h-5" />
              </button>
              
              {rutaData && (
                <div className="flex gap-8 text-white/90">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Duración</p>
                    <p className="text-2xl font-bold">{rutaData.dias_recomendados} Días</p>
                  </div>
                  <div className="w-[1px] h-10 bg-white/20"></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Dificultad</p>
                    <p className="text-2xl font-bold capitalize">{rutaData.dificultad}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Selector de Regiones (The Navigation Bar) */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex justify-between items-center">
            <div className="flex">
              {REGIONES.map(r => (
                <button 
                  key={r.slug} 
                  onClick={() => {setRegion(r.slug); setTab("lugares");}}
                  className={`relative px-8 py-8 transition-all group ${regionSlug === r.slug ? 'text-black' : 'text-gray-400'}`}
                >
                  <span className={`text-sm font-black uppercase tracking-widest ${regionSlug === r.slug ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    {r.ciudad}
                  </span>
                  {regionSlug === r.slug && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-black animate-in fade-in slide-in-from-bottom-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main id="content" className="max-w-7xl mx-auto px-6 py-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-gray-100" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Cargando Experiencias</p>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Header de Sección */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-5xl font-black mb-4 tracking-tighter">Explora la Región</h2>
                <p className="text-gray-500 text-xl font-medium max-w-2xl">{region.subtitulo}. Una selección curada de los mejores destinos de Veracruz.</p>
              </div>
              
              {/* Tabs Modernos */}
              <div className="bg-gray-100 p-2 rounded-[2rem] flex gap-1">
                {[
                  { id: "lugares", label: "Destinos", icon: MapPin },
                  { id: "paquete", label: "Hospedaje", icon: Hotel },
                  { id: "itinerario", label: "Planer IA", icon: Sparkles },
                  { id: "mapa", label: "Mapa", icon: Globe }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black transition-all ${
                      tab === t.id ? "bg-white shadow-xl scale-105 text-black" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenedor Dinámico */}
            <div className="min-h-[600px]">
              {tab === "lugares" && <LugaresBento lugares={lugares} color={color} onSelect={setLugarSel} />}
              {tab === "paquete" && <PaqueteTab paquete={paquete} color={color} />}
              {tab === "itinerario" && <CalculadoraTab region={regionSlug} color={color} />}
              {tab === "mapa" && (
                <div className="h-[700px] rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                   <MapaPrestadores region={regionSlug} color={color} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Visual */}
      <footer className="bg-black text-white pt-32 pb-12 rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="col-span-2">
               <h3 className="text-4xl font-black mb-8">Descubre Veracruz<br/><span className="text-gray-600">Como nunca antes.</span></h3>
               <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">Somos tu guía definitiva para explorar los rincones más mágicos del estado. Desde las cumbres nevadas hasta el azul profundo del mar.</p>
               <div className="flex gap-4">
                  <button className="p-4 bg-gray-900 rounded-2xl hover:bg-white hover:text-black transition-all"><Facebook/></button>
                  <button className="p-4 bg-gray-900 rounded-2xl hover:bg-white hover:text-black transition-all"><Instagram/></button>
                  <button className="p-4 bg-gray-900 rounded-2xl hover:bg-white hover:text-black transition-all"><Share2/></button>
               </div>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-sm mb-6 text-gray-500">Regiones</h4>
              <ul className="space-y-4 font-bold">
                {REGIONES.map(r => <li key={r.slug} className="cursor-pointer hover:text-gray-400 transition-colors">{r.label}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-sm mb-6 text-gray-500">Legal</h4>
              <ul className="space-y-4 font-bold text-gray-400">
                <li className="hover:text-white cursor-pointer">Privacidad</li>
                <li className="hover:text-white cursor-pointer">Términos</li>
                <li className="hover:text-white cursor-pointer">Contacto</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-gray-900 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">
            © 2026 Veracruz Rutas Mágicas · Hecho con ❤️ en el Puerto
          </div>
        </div>
      </footer>

      {/* Modal de Detalle */}
      {lugarSel && <LugarModal lugar={lugarSel} color={color} onClose={() => setLugarSel(null)} />}

      <style jsx global>{`
        .text-outline-white {
          -webkit-text-stroke: 1px rgba(255,255,255,0.6);
          color: transparent;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RutasPage;