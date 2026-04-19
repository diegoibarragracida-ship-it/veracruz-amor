import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import MunicipioCard from "@/components/MunicipioCard";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import AlertBanner from "@/components/AlertBanner";
import WidgetClima from "@/components/WidgetClima";
import WidgetEmergencia from "@/components/WidgetEmergencia";
import WidgetPrestadoresDestacados from "@/components/WidgetPrestadoresDestacados";
import { Link } from "react-router-dom";
import {
  MapPin, Calendar, Users, ShieldAlert, BookOpen,
  Star, ChevronRight, Shield, BadgeCheck, Heart,
  Map, Clock, DollarSign, ArrowRight, Mountain,
  Waves, Trees, Landmark, Coffee, Sparkles, Play
} from "lucide-react";

/* ── Regiones ─────────────────────────────────────────────── */
const REGIONES_HOME = [
  {
    slug: "orizaba", label: "Orizaba", subtitulo: "Entre cumbres y flores",
    emoji: "🏔️", color: "#1B5E20", light: "#E8F5E9",
    heroImg: "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800&q=75",
    highlights: ["Palacio de Hierro", "Teleférico", "Xico", "Fortín"],
    dias: 3, desde: 1200,
  },
  {
    slug: "xalapa", label: "Xalapa", subtitulo: "La capital de la cultura",
    emoji: "☕", color: "#1565C0", light: "#E3F2FD",
    heroImg: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=75",
    highlights: ["Museo de Antropología", "Coatepec", "Naolinco", "Lagos del Dique"],
    dias: 3, desde: 1500,
  },
  {
    slug: "tuxtlas", label: "Los Tuxtlas", subtitulo: "Selva, magia y laguna",
    emoji: "🌿", color: "#00695C", light: "#E0F2F1",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=75",
    highlights: ["Laguna Catemaco", "Nanciyaga", "San Andrés Tuxtla"],
    dias: 4, desde: 2000,
  },
  {
    slug: "norte", label: "Norte / Tajín", subtitulo: "Patrimonio de la humanidad",
    emoji: "🏛️", color: "#4A148C", light: "#F3E5F5",
    heroImg: "https://images.unsplash.com/photo-1547558902-c0aa7f2e6c37?w=800&q=75",
    highlights: ["El Tajín (UNESCO)", "Voladores de Papantla", "Tuxpan"],
    dias: 3, desde: 1500,
  },
  {
    slug: "costa", label: "Costa", subtitulo: "El puerto más jarocho",
    emoji: "🌊", color: "#01579B", light: "#E1F5FE",
    heroImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=75",
    highlights: ["San Juan de Ulúa", "Malecón", "Boca del Río", "Alvarado"],
    dias: 3, desde: 1800,
  },
];

/* ── Stat counter animado ─────────────────────────────────── */
const StatCounter = ({ value, label, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const end = parseInt(value);
        const duration = 1500;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl sm:text-5xl font-black text-white">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-white/60 text-sm mt-1 font-medium">{label}</p>
    </div>
  );
};

/* ── Region Card ──────────────────────────────────────────── */
const RegionCard = ({ region, large = false }) => (
  <Link to="/rutas" state={{ region: region.slug }}
    className={`group relative overflow-hidden rounded-3xl block ${large ? "h-[420px]" : "h-[200px]"}`}>
    <img src={region.heroImg} alt={region.label}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
    <div className="relative z-10 h-full flex flex-col justify-end p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20">
          ⏱ {region.dias} días
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20">
          desde ${region.desde.toLocaleString()}
        </span>
      </div>
      <h3 className={`font-black text-white leading-tight ${large ? "text-3xl" : "text-xl"}`}>
        {region.emoji} {region.label}
      </h3>
      <p className="text-white/70 text-sm italic mb-2">{region.subtitulo}</p>
      {large && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {region.highlights.map(h => (
            <span key={h} className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90">
              {h}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold mt-3 group-hover:text-white group-hover:gap-3 transition-all">
        Explorar ruta <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </Link>
);

/* ── HomePage ─────────────────────────────────────────────── */
const HomePage = () => {
  const [municipios,    setMunicipios]    = useState([]);
  const [pueblosMagicos,setPueblosMagicos]= useState([]);
  const [eventos,       setEventos]       = useState([]);
  const [alertas,       setAlertas]       = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [municipiosRes, pueblosRes, eventosRes, alertasRes] = await Promise.all([
          axios.get(`${API}/municipios`, { params: { estado: "publicado", limit: 8 } }),
          axios.get(`${API}/municipios`, { params: { pueblo_magico: true, limit: 6 } }),
          axios.get(`${API}/eventos`,    { params: { publicado: true, limit: 6 } }),
          axios.get(`${API}/alertas`,    { params: { activa: true } }),
        ]);
        setMunicipios(municipiosRes.data.municipios || []);
        setPueblosMagicos(pueblosRes.data.municipios || []);
        setEventos(eventosRes.data.eventos || []);
        setAlertas(alertasRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const heroImage = "https://res.cloudinary.com/dcdjo3rtm/image/upload/v1775722096/hero-home.png_xsvo9l.png";

  return (
    <div className="min-h-screen bg-[#F8F8F6]" data-testid="home-page">
      <Header />
      <AlertBanner alertas={alertas} />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Veracruz" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Plataforma oficial de turismo de Veracruz
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white mb-6 leading-none tracking-tight"
            data-testid="hero-title"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Veracruz<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #FFD700, #FFA000)" }}>
              te espera
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Explora con seguridad 232 municipios, playas paradisíacas,
            selvas y la mejor gastronomía de México.
          </p>

          {/* SearchBar */}
          <div className="max-w-2xl mx-auto mb-10">
            <SearchBar variant="hero" />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { href: "/explorar",    label: "Explorar",    icon: MapPin,      bg: "bg-[#1B5E20]" },
              { href: "/rutas",       label: "Rutas",        icon: Map,         bg: "bg-[#6A1B9A]" },
              { href: "/emergencia",  label: "Emergencias",  icon: ShieldAlert, bg: "bg-[#C62828]" },
              { href: "/eventos",     label: "Eventos",      icon: Calendar,    bg: "bg-[#0277BD]" },
              { href: "/prestadores", label: "Prestadores",  icon: Users,       bg: "bg-[#E65100]" },
            ].map(l => (
              <Link key={l.href} to={l.href}
                className={`flex items-center gap-2 px-5 py-2.5 ${l.bg} text-white rounded-2xl text-sm font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg backdrop-blur-sm`}
                data-testid={`quick-link-${l.label.toLowerCase()}`}>
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats flotantes */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-16 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "232", label: "Municipios", suffix: "" },
              { value: "12",  label: "Pueblos Mágicos", suffix: "" },
              { value: "500", label: "Prestadores verificados", suffix: "+" },
              { value: "5",   label: "Regiones turísticas", suffix: "" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center">
                <StatCounter value={s.value} label={s.label} suffix={s.suffix} />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 text-xs animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2.5 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══ WIDGETS ═══════════════════════════════════════════ */}
      <section className="py-10 px-4 bg-[#F8F8F6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WidgetClima />
            <WidgetEmergencia />
            <WidgetPrestadoresDestacados />
          </div>
        </div>
      </section>

      {/* ══ RUTAS ═════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" data-testid="rutas-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#6A1B9A] font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                <Map className="w-4 h-4" /> 5 regiones · itinerarios completos
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight"
                style={{ fontFamily: "Playfair Display, serif" }}>
                Rutas Turísticas<br />de Veracruz
              </h2>
              <p className="text-gray-400 mt-2 text-sm max-w-md">
                De las cumbres nevadas de Orizaba hasta las playas del Golfo — hoteles, restaurantes e itinerario con IA incluido.
              </p>
            </div>
            <Link to="/rutas"
              className="hidden md:flex items-center gap-1.5 text-[#6A1B9A] font-semibold text-sm hover:gap-3 transition-all">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:row-span-2">
              <RegionCard region={REGIONES_HOME[0]} large />
            </div>
            <RegionCard region={REGIONES_HOME[1]} />
            <RegionCard region={REGIONES_HOME[2]} />
            <RegionCard region={REGIONES_HOME[3]} />
            <RegionCard region={REGIONES_HOME[4]} />
          </div>

          {/* Features row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "📍", title: "Lugares clickeables",  desc: "Cada lugar tiene fotos, horarios y cómo llegar" },
              { icon: "📦", title: "Paquetes armados",     desc: "Hoteles y restaurantes reales con precios" },
              { icon: "✨", title: "Itinerario con IA",    desc: "Gemini planea tu viaje día a día según tu presupuesto" },
            ].map(({ icon, title, desc }) => (
              <div key={title}
                className="flex items-start gap-3 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA móvil */}
          <div className="md:hidden text-center mt-6">
            <Link to="/rutas"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6A1B9A] text-white rounded-2xl font-bold text-sm hover:bg-[#4A148C] transition-colors">
              <Map className="w-4 h-4" /> Explorar todas las rutas
            </Link>
          </div>
        </div>
      </section>

      {/* ══ PUEBLOS MÁGICOS ═══════════════════════════════════ */}
      <section className="py-20 px-4 bg-[#F8F8F6]" data-testid="pueblos-magicos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" /> Destinos destacados
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900"
                style={{ fontFamily: "Playfair Display, serif" }}>
                Pueblos Mágicos<br />de Veracruz
              </h2>
            </div>
            <Link to="/explorar?filter=pueblo_magico"
              className="hidden md:flex items-center gap-1.5 text-[#1B5E20] font-semibold text-sm hover:gap-3 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {pueblosMagicos.slice(0, 1).map(m => (
              <div key={m.id} className="col-span-12 md:col-span-8 row-span-2">
                <MunicipioCard municipio={m} size="large" />
              </div>
            ))}
            {pueblosMagicos.slice(1, 3).map(m => (
              <div key={m.id} className="col-span-12 md:col-span-4">
                <MunicipioCard municipio={m} />
              </div>
            ))}
          </div>

          {pueblosMagicos.length > 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {pueblosMagicos.slice(3, 6).map(m => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ BANNER INTERMEDIO ════════════════════════════════ */}
      <section className="py-16 px-4"
        style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #00695C 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield,     title: "Viaja con seguridad",     desc: "Botón de pánico con GPS para emergencias 24/7",     color: "text-green-300" },
              { icon: BadgeCheck, title: "Prestadores verificados", desc: "Servicios turísticos revisados y certificados",       color: "text-blue-300" },
              { icon: Heart,      title: "Experiencias auténticas", desc: "Descubre la verdadera esencia de Veracruz",           color: "text-pink-300" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  <p className="text-white/60 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EVENTOS ═══════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" data-testid="eventos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#0277BD] font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Agenda cultural
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900"
                style={{ fontFamily: "Playfair Display, serif" }}>
                Próximos Eventos
              </h2>
            </div>
            <Link to="/eventos"
              className="hidden md:flex items-center gap-1.5 text-[#1B5E20] font-semibold text-sm hover:gap-3 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {eventos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {eventos.slice(0, 6).map(evento => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Próximamente más eventos</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/eventos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-[#0277BD] text-[#0277BD] font-bold text-sm hover:bg-[#0277BD] hover:text-white transition-all">
              <Calendar className="w-4 h-4" /> Ver agenda completa
            </Link>
          </div>
        </div>
      </section>

      {/* ══ MUNICIPIOS ════════════════════════════════════════ */}
      {municipios.length > 0 && (
        <section className="py-20 px-4 bg-[#F8F8F6]" data-testid="municipios-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#1B5E20] font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> 232 municipios
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900"
                  style={{ fontFamily: "Playfair Display, serif" }}>
                  Explora Veracruz
                </h2>
              </div>
              <Link to="/explorar"
                className="hidden md:flex items-center gap-1.5 text-[#1B5E20] font-semibold text-sm hover:gap-3 transition-all">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {municipios.slice(0, 8).map(m => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/explorar"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B5E20] text-white rounded-2xl font-bold text-base hover:bg-[#145218] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <MapPin className="w-5 h-5" />
                Explorar todos los municipios
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA FINAL ═════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #1B5E20 0%, transparent 50%), radial-gradient(circle at 80% 50%, #0277BD 0%, transparent 50%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-4">¿Listo para explorar?</p>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight"
            style={{ fontFamily: "Playfair Display, serif" }}>
            Tu próxima aventura<br />en Veracruz empieza aquí
          </h2>
          <p className="text-white/60 mb-10 text-base">
            Planea, reserva y viaja con seguridad con la plataforma oficial de turismo de Veracruz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/explorar"
              className="flex items-center gap-2 px-8 py-4 bg-[#1B5E20] text-white rounded-2xl font-bold hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-xl">
              <MapPin className="w-5 h-5" /> Explorar destinos
            </Link>
            <Link to="/rutas"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
              <Map className="w-5 h-5" /> Ver rutas turísticas
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default HomePage;