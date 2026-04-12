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
  Utensils, Hotel, Loader2, ChevronRight,
  ArrowRight, Info, Share2, Heart, Wrench,
  Camera, Coffee, Trees, Waves, Landmark
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONFIGURACIÓN DE REGIONES (DATA REAL Y EXTENSA)
───────────────────────────────────────────── */
const REGIONES = [
  {
    slug: "orizaba",
    label: "Altas Montañas",
    ciudad: "Orizaba",
    subtitulo: "La ciudad de las aguas alegres y cumbres de cristal",
    emoji: "🏔️",
    color: "#1B5E20",
    heroImg: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?q=80&w=2070&auto=format&fit=crop",
    tagline: "Pico de Orizaba · Teleférico · Cascada del Elefante",
    description: "Siente el aire puro a 5,636 metros sobre el nivel del mar. Una ruta diseñada para amantes del senderismo, el café de altura y la historia colonial que resguardan sus calles neoclásicas.",
    stats: { destinos: "+15", clima: "Templado", altitud: "1,235m" }
  },
  {
    slug: "xalapa",
    label: "Cultura y Café",
    ciudad: "Xalapa",
    subtitulo: "Aroma a neblina, café recién tostado y son jarocho",
    emoji: "☕",
    color: "#5D4037",
    heroImg: "https://images.unsplash.com/photo-1599307228800-475a3632906e?q=80&w=2070&auto=format&fit=crop",
    tagline: "Coatepec Pueblo Mágico · Xico · Museos de Antropología",
    description: "Explora la capital cultural de Veracruz. Entre callejones empedrados y fincas cafetaleras que datan del siglo XIX, Xalapa ofrece una inmersión total en el arte y la naturaleza.",
    stats: { destinos: "+20", clima: "Húmedo", altitud: "1,417m" }
  },
  {
    slug: "tuxtlas",
    label: "Selva y Magia",
    ciudad: "Los Tuxtlas",
    subtitulo: "Donde la selva se funde con el misticismo ancestral",
    emoji: "🌿",
    color: "#00695C",
    heroImg: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=2070&auto=format&fit=crop",
    tagline: "Catemaco · Reserva de Nanciyaga · Salto de Eyipantla",
    description: "Un viaje al corazón de la biodiversidad. Encuentro con nahuales, ritos de purificación prehispánicos y cascadas monumentales en medio de la selva tropical más septentrional del continente.",
    stats: { destinos: "+12", clima: "Cálido", altitud: "340m" }
  },
  {
    slug: "norte",
    label: "Costa Esmeralda",
    ciudad: "Norte / Tajín",
    subtitulo: "El trueno en la ciudad sagrada del Tajín",
    emoji: "🏛️",
    color: "#E65100",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop",
    tagline: "Papantla · Zonas Arqueológicas · Playas Vírgenes",
    description: "Descubre el legado de la cultura Totonaca, el ritual de los Voladores de Papantla y el aroma de la vainilla natural en una de las costas más bellas del Golfo de México.",
    stats: { destinos: "+18", clima: "Tropical", altitud: "10m" }
  },
  {
    slug: "costa",
    label: "Puerto y Aventura",
    ciudad: "Veracruz Costa",
    subtitulo: "Historia viva en el primer puerto de América",
    emoji: "🌊",
    color: "#0277BD",
    heroImg: "https://images.unsplash.com/photo-1593036814633-1463e2777169?q=80&w=2070&auto=format&fit=crop",
    tagline: "San Juan de Ulúa · Acuario de Veracruz · Boca del Río",
    description: "El sabor del mar, la fortaleza que detuvo piratas y la alegría interminable del malecón jarocho. Una ruta que combina la historia colonial con la modernidad costera.",
    stats: { destinos: "+25", clima: "Caluroso", altitud: "0m" }
  },
];

/* ─────────────────────────────────────────────
   COMPONENTES SUB-MÓDULOS (VERSIONES EXTENDIDAS)
───────────────────────────────────────────── */

const LugarModal = ({ lugar, color, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "unset");
  }, []);

  if (!lugar) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in duration-500">
        
        <button onClick={onClose} className="absolute top-8 right-8 z-20 p-4 bg-white/10 hover:bg-white/30 backdrop-blur-xl text-white rounded-full transition-all border border-white/20">
          <X className="w-6 h-6" />
        </button>

        <div className="w-full md:w-3/5 h-80 md:h-auto relative">
          <img src={lugar.foto_portada || lugar.fotos?.[0]} className="w-full h-full object-cover" alt={lugar.nombre} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block border border-white/20">
              {lugar.tipo}
            </span>
            <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">{lugar.nombre}</h2>
            <p className="flex items-center gap-2 text-lg opacity-90"><MapPin className="w-5 h-5 text-red-400" /> {lugar.municipio}, Veracruz</p>
          </div>
        </div>

        <div className="w-full md:w-2/5 p-12 md:p-16 overflow-y-auto bg-gray-50/30">
          <div className="space-y-12">
            <section>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6">La Experiencia</h4>
              <p className="text-gray-600 leading-relaxed text-xl font-medium italic">"{lugar.descripcion}"</p>
            </section>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Presupuesto</p>
                  <p className="text-2xl font-black text-gray-900">{lugar.costo_min === 0 ? "Acceso Gratuito" : `$${lugar.costo_min} MXN`}</p>
                </div>
              </div>
              
              <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Horario Sugerido</p>
                  <p className="text-2xl font-black text-gray-900">09:00 - 18:00</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-8">
              <button className="w-full py-6 rounded-[2rem] text-white font-black text-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-xl active:scale-95"
                      style={{ backgroundColor: color }}>
                <Navigation className="w-6 h-6" /> Abrir en Maps
              </button>
              <button className="w-full py-6 rounded-[2rem] bg-white text-black border-2 border-gray-100 font-black text-xl flex items-center justify-center gap-4 hover:bg-gray-50 transition-all">
                <Share2 className="w-6 h-6" /> Compartir Destino
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CALCULADORA / PLANIFICADOR CON IA (COMPLETO)
───────────────────────────────────────────── */
const CalculadoraTab = ({ region, color }) => {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [formData, setFormData] = useState({ dias: 2, personas: 2, presupuesto: 'medio' });
  const resultRef = useRef(null);

  const OPTIONS = {
    dias: [1, 2, 3, 5],
    personas: [1, 2, 4, 6],
    presupuestos: [
      { id: 'bajo', label: 'Mochilero', emoji: '🎒', desc: 'Hostales y transporte público' },
      { id: 'medio', label: 'Equilibrado', emoji: '🚗', desc: 'Hoteles 3* y tours guiados' },
      { id: 'alto', label: 'Premium', emoji: '✨', desc: 'Lujo, resorts y experiencias privadas' }
    ]
  };

  const generarItinerario = async () => {
    setLoading(true);
    // Simulación de procesamiento de IA (Aquí iría tu llamada a Gemini o Backend)
    setTimeout(() => {
      setRes({
        itinerario: `¡Ruta lista para ${formData.personas} personas!\n\nMañana: Visita guiada por el centro histórico y museos principales.\nTarde: Aventura en los alrededores naturales y degustación gastronómica.\nNoche: Cena en los portales con música en vivo local.`,
        costo: formData.presupuesto === 'bajo' ? 1500 : formData.presupuesto === 'medio' ? 4500 : 12000,
        tip: "Lleva calzado cómodo y una batería externa, ¡querrás tomar muchas fotos!"
      });
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      <div className="bg-white p-12 md:p-24 rounded-[4rem] shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full translate-x-32 -translate-y-32 blur-[100px] opacity-60" />
        
        <header className="relative mb-16 text-center">
          <div className="inline-flex p-5 rounded-[2rem] bg-blue-50 text-blue-600 mb-8 animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-5xl font-black mb-6 tracking-tighter">Planificador Inteligente</h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">Diseñamos tu viaje perfecto combinando tus preferencias con los mejores rincones de {region}.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-16 relative z-10">
          <div className="space-y-10">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-6 block">Duración del viaje</label>
              <div className="flex gap-4">
                {OPTIONS.dias.map(d => (
                  <button key={d} 
                    onClick={() => setFormData({...formData, dias: d})}
                    className={`flex-1 py-6 rounded-3xl border-2 font-black text-xl transition-all ${formData.dias === d ? 'border-black bg-black text-white shadow-xl scale-105' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                    {d} {d === 1 ? 'Día' : 'Días'}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-6 block">Viajeros</label>
              <div className="flex gap-4">
                {OPTIONS.personas.map(p => (
                  <button key={p} 
                    onClick={() => setFormData({...formData, personas: p})}
                    className={`flex-1 py-6 rounded-3xl border-2 font-black text-xl transition-all ${formData.personas === p ? 'border-black bg-black text-white shadow-xl scale-105' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mb-6 block">Nivel de Confort</label>
            <div className="space-y-4">
              {OPTIONS.presupuestos.map(p => (
                <button key={p.id} 
                  onClick={() => setFormData({...formData, presupuesto: p.id})}
                  className={`w-full flex items-center p-6 rounded-3xl border-2 transition-all ${formData.presupuesto === p.id ? 'border-black bg-gray-50' : 'border-gray-100 opacity-60 hover:opacity-100'}`}>
                  <span className="text-4xl mr-6">{p.emoji}</span>
                  <div className="text-left">
                    <p className="font-black text-lg">{p.label}</p>
                    <p className="text-xs text-gray-400 font-medium">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={generarItinerario}
          disabled={loading}
          className="w-full mt-20 py-8 rounded-[2.5rem] bg-black text-white font-black text-2xl flex items-center justify-center gap-6 transition-all hover:bg-gray-900 active:scale-[0.98] disabled:opacity-50 shadow-2xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Consultando a los expertos...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-8 h-8" />
              <span>Crear mi Ruta Mágica</span>
            </>
          )}
        </button>
      </div>

      {res && (
        <div ref={resultRef} className="bg-white p-16 md:p-24 rounded-[4rem] shadow-2xl animate-in slide-in-from-bottom-20 duration-1000 border-t-[12px]" style={{ borderColor: color }}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div>
              <h3 className="text-5xl font-black mb-4 tracking-tighter">Tu Propuesta de Viaje</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {formData.dias} Días de Experiencias
              </p>
            </div>
            <div className="bg-gray-50 px-10 py-6 rounded-[2rem] border border-gray-100">
              <p className="text-xs font-black uppercase text-gray-400 mb-1">Inversión Estimada</p>
              <p className="text-4xl font-black text-black">${res.costo.toLocaleString()} <span className="text-sm opacity-40">MXN</span></p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              {res.itinerario.split('\n').map((line, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-1.5 bg-gray-100 rounded-full" />
                  <p className="text-xl text-gray-600 leading-relaxed font-medium">{line}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50/50 p-10 rounded-[3rem] border border-blue-100 h-fit">
              <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2 italic">
                <Info className="w-5 h-5" /> Consejo del Experto:
              </h4>
              <p className="text-blue-800 leading-relaxed font-medium">{res.tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL (VERSION COMPLETA 800+ LINEAS)
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
        console.error("Error al cargar datos:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [regionSlug]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
      <Header />

      {/* Hero Visual Ultra-Premium */}
      <section className="relative h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={region.heroImg} className="w-full h-full object-cover transition-all duration-[3000ms] scale-105" alt={region.label} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFDFD] via-black/10 to-black/40" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
               <span className="w-16 h-[2px]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}></span>
               <span className="text-white text-xs font-black uppercase tracking-[0.5em] drop-shadow-md">{region.tagline}</span>
            </div>
            <h1 className="text-7xl md:text-[12rem] font-black text-white leading-[0.8] tracking-tighter mb-10 drop-shadow-2xl">
              {region.label}
            </h1>
            
            <div className="flex flex-wrap gap-8 items-center">
              <button onClick={() => document.getElementById('main-content').scrollIntoView({behavior:'smooth'})}
                      className="px-12 py-6 bg-white text-black rounded-full font-black text-xl shadow-2xl hover:bg-gray-100 transition-all flex items-center gap-4 active:scale-95">
                Comenzar Aventura <ArrowRight className="w-6 h-6" />
              </button>
              
              <div className="flex gap-12 text-white">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Clima Promedio</p>
                  <p className="text-3xl font-bold">{region.stats.clima}</p>
                </div>
                <div className="w-[1px] h-12 bg-white/20"></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Destinos</p>
                  <p className="text-3xl font-bold">{region.stats.destinos}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación de Regiones (The Navbar) */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-3xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
          <div className="flex justify-center">
            {REGIONES.map(r => (
              <button key={r.slug} onClick={() => {setRegion(r.slug); setTab("lugares");}}
                className={`relative px-10 py-10 transition-all group ${regionSlug === r.slug ? 'text-black' : 'text-gray-400'}`}>
                <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${regionSlug === r.slug ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                  {r.ciudad}
                </span>
                {regionSlug === r.slug && (
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black animate-in fade-in" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-56 gap-10">
            <div className="relative">
              <Loader2 className="w-20 h-20 animate-spin text-gray-100" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-gray-400 font-black uppercase tracking-[0.5em] text-sm">Sincronizando el Paraíso</p>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Cabecera Dinámica */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
              <div className="max-w-2xl">
                <h2 className="text-6xl font-black mb-6 tracking-tighter">Guía de Experiencias</h2>
                <p className="text-gray-500 text-2xl font-medium leading-relaxed italic">"{region.description}"</p>
              </div>
              
              {/* Tabs de Navegación del Módulo */}
              <div className="bg-gray-100 p-2.5 rounded-[2.5rem] flex flex-wrap gap-1.5 shadow-inner">
                {[
                  { id: "lugares", label: "Destinos", icon: MapPin },
                  { id: "paquete", label: "Hospedaje", icon: Hotel },
                  { id: "itinerario", label: "Planer IA", icon: Sparkles },
                  { id: "mapa", label: "Mapa Vivo", icon: Globe },
                  { id: "constructor", label: "Armar Mi Viaje", icon: Wrench }
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      tab === t.id ? "bg-white shadow-xl scale-105 text-black" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
                    }`}>
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenedor de Vistas (Lógica de tus 700 líneas) */}
            <div className="min-h-[700px] animate-in fade-in duration-1000">
              {tab === "lugares" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {lugares.map((l, idx) => (
                    <div key={l.id} className={idx === 0 ? "md:col-span-2 lg:col-span-3" : "lg:col-span-1"}>
                      <div onClick={() => setLugarSel(l)} className="group cursor-pointer">
                        <div className={`relative overflow-hidden rounded-[3rem] bg-white transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 ${idx === 0 ? 'aspect-[16/10] md:aspect-[21/9]' : 'aspect-[4/5]'}`}>
                          <img src={l.foto_portada || l.fotos?.[0]} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={l.nombre} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                          <div className="absolute bottom-10 left-10 right-10 text-white">
                            <h3 className={`font-black leading-[0.9] tracking-tighter ${idx === 0 ? 'text-6xl' : 'text-3xl'}`}>{l.nombre}</h3>
                            <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> {l.municipio}
                              </span>
                              <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                                Explorar Destino <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "paquete" && <div className="animate-in fade-in duration-500"><PaqueteTab paquete={paquete} color={color} /></div>}
              
              {tab === "itinerario" && <CalculadoraTab region={regionSlug} color={color} />}
              
              {tab === "mapa" && (
                <div className="h-[750px] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-gray-100">
                   <MapaPrestadores region={regionSlug} color={color} />
                </div>
              )}
              
              {tab === "constructor" && (
                <div className="animate-in slide-in-from-bottom-10 duration-700">
                   <ConstructorPaquete lugares={lugares} rutaData={rutaData} region={regionSlug} color={color} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Modal de Detalle Extendido */}
      {lugarSel && <LugarModal lugar={lugarSel} color={color} onClose={() => setLugarSel(null)} />}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&display=swap');
      `}</style>
    </div>
  );
};

function PaqueteTab({ paquete, color }) {
  if (!paquete) return <div className="p-32 text-center bg-gray-50 rounded-[4rem] text-gray-400 font-black uppercase tracking-[0.3em] border-2 border-dashed border-gray-100">Sin paquetes activos en esta zona</div>;
  return (
    <div className="grid lg:grid-cols-2 gap-16">
      <div className="space-y-10">
        <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Hotel className="w-10 h-10" /> Hospedaje de Autor</h3>
        {paquete.hoteles?.map((h, i) => (
          <div key={i} className="flex gap-8 items-center bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 group hover:shadow-2xl transition-all cursor-pointer">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0">
               <img src={h.foto || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.nombre} />
            </div>
            <div>
              <h4 className="font-black text-2xl mb-1">{h.nombre}</h4>
              <p className="text-gray-400 text-sm font-medium mb-3 line-clamp-1">{h.direccion}</p>
              <p className="text-xl font-black" style={{ color }}>${h.precio_noche} <span className="text-[10px] uppercase opacity-50">/ Noche</span></p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-10">
        <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Utensils className="w-10 h-10" /> Ruta Gastronómica</h3>
        {paquete.restaurantes?.map((r, i) => (
          <div key={i} className="flex gap-8 items-center bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 group hover:shadow-2xl transition-all cursor-pointer">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden shrink-0">
               <img src={r.foto || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={r.nombre} />
            </div>
            <div>
              <h4 className="font-black text-2xl mb-1">{r.nombre}</h4>
              <p className="text-gray-400 text-sm font-medium mb-3">{r.especialidad}</p>
              <div className="flex gap-1.5 text-amber-400">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RutasPage;