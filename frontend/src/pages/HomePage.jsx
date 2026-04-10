import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import MunicipioCard from "@/components/MunicipioCard";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import AlertBanner from "@/components/AlertBanner";
import { Link } from "react-router-dom";
import {
  MapPin, Calendar, Users, ShieldAlert, BookOpen,
  Star, ChevronRight, Shield, BadgeCheck, Heart,
  Map, Clock, DollarSign, ArrowRight, Mountain,
  Waves, Trees, Landmark, Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Datos de regiones (sin fetch, estáticos para el home) ── */
const REGIONES_HOME = [
  {
    slug: "orizaba",
    label: "Orizaba",
    subtitulo: "Entre cumbres y flores",
    emoji: "🏔️",
    color: "#1B5E20",
    light: "#E8F5E9",
    heroImg: "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800&q=75",
    highlights: ["Palacio de Hierro", "Teleférico", "Xico", "Fortín"],
    dias: 3,
    desde: 1200,
  },
  {
    slug: "xalapa",
    label: "Xalapa",
    subtitulo: "La capital de la cultura",
    emoji: "☕",
    color: "#1565C0",
    light: "#E3F2FD",
    heroImg: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=75",
    highlights: ["Museo de Antropología", "Coatepec", "Naolinco", "Lagos del Dique"],
    dias: 3,
    desde: 1500,
  },
  {
    slug: "tuxtlas",
    label: "Los Tuxtlas",
    subtitulo: "Selva, magia y laguna",
    emoji: "🌿",
    color: "#00695C",
    light: "#E0F2F1",
    heroImg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=75",
    highlights: ["Laguna Catemaco", "Nanciyaga", "San Andrés Tuxtla"],
    dias: 4,
    desde: 2000,
  },
  {
    slug: "norte",
    label: "Norte / Tajín",
    subtitulo: "Patrimonio de la humanidad",
    emoji: "🏛️",
    color: "#4A148C",
    light: "#F3E5F5",
    heroImg: "https://images.unsplash.com/photo-1547558902-c0aa7f2e6c37?w=800&q=75",
    highlights: ["El Tajín (UNESCO)", "Voladores de Papantla", "Tuxpan"],
    dias: 3,
    desde: 1500,
  },
  {
    slug: "costa",
    label: "Costa",
    subtitulo: "El puerto más jarocho",
    emoji: "🌊",
    color: "#01579B",
    light: "#E1F5FE",
    heroImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=75",
    highlights: ["San Juan de Ulúa", "Malecón", "Boca del Río", "Alvarado"],
    dias: 3,
    desde: 1800,
  },
];

/* ── Card de región para el home ── */
const RegionCard = ({ region, index }) => {
  const isLarge = index === 0;

  return (
    <Link
      to={`/rutas`}
      state={{ region: region.slug }}
      className={`group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1 block
        ${isLarge ? "md:row-span-2" : ""}`}
      style={{ minHeight: isLarge ? "420px" : "200px" }}
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img
          src={region.heroImg}
          alt={region.label}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5">
        {/* Badge días */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/20">
            <Clock className="w-3 h-3" /> {region.dias} días
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/20">
            <DollarSign className="w-3 h-3" /> desde ${region.desde.toLocaleString()}
          </span>
        </div>

        <div className="flex items-start gap-2 mb-1">
          <span className="text-2xl">{region.emoji}</span>
          <div>
            <h3 className={`font-bold text-white leading-tight ${isLarge ? "text-2xl sm:text-3xl" : "text-lg"}`}
              style={{ fontFamily: "Playfair Display, serif" }}>
              {region.label}
            </h3>
            <p className="text-white/70 text-sm italic">{region.subtitulo}</p>
          </div>
        </div>

        {/* Highlights — solo en card grande o si hay espacio */}
        {isLarge && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {region.highlights.map(h => (
              <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/10">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center gap-1.5 text-white/90 text-sm font-semibold group-hover:gap-3 transition-all">
          Explorar ruta
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const [municipios, setMunicipios]       = useState([]);
  const [pueblosMagicos, setPueblosMagicos] = useState([]);
  const [eventos, setEventos]             = useState([]);
  const [alertas, setAlertas]             = useState([]);
  const [loading, setLoading]             = useState(true);

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
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroImage = "https://res.cloudinary.com/dcdjo3rtm/image/upload/v1775722096/hero-home.png_xsvo9l.png";

  const quickLinks = [
    { href: "/explorar",    label: "Explorar",    icon: MapPin,     color: "bg-[#1B5E20]" },
    { href: "/rutas",       label: "Rutas",        icon: Map,        color: "bg-[#6A1B9A]" },
    { href: "/emergencia",  label: "Emergencias",  icon: ShieldAlert,color: "bg-[#D32F2F]" },
    { href: "/eventos",     label: "Eventos",      icon: Calendar,   color: "bg-[#0277BD]" },
    { href: "/prestadores", label: "Prestadores",  icon: Users,      color: "bg-[#F9A825]" },
  ];

  const features = [
    { icon: Shield,    title: "Viaja con Seguridad",      description: "Botón de pánico con GPS para emergencias las 24 horas" },
    { icon: BadgeCheck,title: "Prestadores Verificados",  description: "Servicios turísticos revisados y certificados" },
    { icon: Heart,     title: "Experiencias Auténticas",  description: "Descubre la verdadera esencia de Veracruz" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="home-page">
      <Header />
      <AlertBanner alertas={alertas} />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 hero-overlay" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
            style={{ fontFamily: "Playfair Display" }}
            data-testid="hero-title">
            Veracruz te espera
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Explora con seguridad. Descubre la magia de nuestros 232 municipios,
            playas paradisíacas y la mejor gastronomía de México.
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar variant="hero" />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}
                className={`flex items-center gap-2 px-6 py-3 ${link.color} text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg`}
                data-testid={`quick-link-${link.label.toLowerCase()}`}>
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          RUTAS TURÍSTICAS — NUEVA SECCIÓN ★
      ══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" data-testid="rutas-section">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Map className="w-6 h-6 text-[#6A1B9A]" />
                <span className="text-[#6A1B9A] font-semibold uppercase tracking-wider text-sm">
                  5 regiones · itinerarios completos
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900"
                style={{ fontFamily: "Playfair Display" }}>
                Rutas Turísticas de Veracruz
              </h2>
              <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
                Desde las cumbres nevadas de Orizaba hasta las playas del Golfo.
                Hoteles, restaurantes y un itinerario generado con IA incluido.
              </p>
            </div>
            <Link to="/rutas"
              className="hidden md:flex items-center gap-2 text-[#6A1B9A] font-semibold hover:underline flex-shrink-0">
              Ver todas las rutas
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Bento grid de regiones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridTemplateRows: "auto auto" }}>

            {/* Card grande — Orizaba */}
            <div className="md:row-span-2">
              <RegionCard region={REGIONES_HOME[0]} index={0} />
            </div>

            {/* Cards medianas — Xalapa y Los Tuxtlas */}
            <RegionCard region={REGIONES_HOME[1]} index={1} />
            <RegionCard region={REGIONES_HOME[2]} index={2} />

            {/* Cards pequeñas — Norte y Costa (ocupan las 2 cols restantes) */}
            <RegionCard region={REGIONES_HOME[3]} index={3} />
            <RegionCard region={REGIONES_HOME[4]} index={4} />
          </div>

          {/* CTA móvil */}
          <div className="md:hidden text-center mt-6">
            <Link to="/rutas">
              <Button className="bg-[#6A1B9A] hover:bg-[#4A148C] text-white px-8 py-5 text-base rounded-xl">
                <Map className="w-5 h-5 mr-2" />
                Explorar todas las rutas
              </Button>
            </Link>
          </div>

          {/* Badges de características */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "📍", title: "Lugares clickeables", desc: "Cada lugar tiene fotos, horarios y cómo llegar" },
              { icon: "📦", title: "Paquetes armados",    desc: "Hoteles y restaurantes reales con precios" },
              { icon: "✨", title: "Itinerario con IA",   desc: "Gemini planea tu viaje día a día según tu presupuesto" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PUEBLOS MÁGICOS
      ══════════════════════════════════════ */}
      <section className="py-20 px-4" data-testid="pueblos-magicos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-6 h-6 text-[#F9A825]" />
                <span className="text-[#F9A825] font-semibold uppercase tracking-wider text-sm">Destinos destacados</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display" }}>
                Pueblos Mágicos de Veracruz
              </h2>
            </div>
            <Link to="/explorar?filter=pueblo_magico"
              className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
              Ver todos <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {pueblosMagicos.slice(0, 1).map((m) => (
              <div key={m.id} className="col-span-12 md:col-span-8 row-span-2">
                <MunicipioCard municipio={m} size="large" />
              </div>
            ))}
            {pueblosMagicos.slice(1, 3).map((m) => (
              <div key={m.id} className="col-span-12 md:col-span-4">
                <MunicipioCard municipio={m} />
              </div>
            ))}
          </div>

          {pueblosMagicos.length > 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {pueblosMagicos.slice(3, 6).map((m) => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          EVENTOS
      ══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" data-testid="eventos-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-6 h-6 text-[#0277BD]" />
                <span className="text-[#0277BD] font-semibold uppercase tracking-wider text-sm">Agenda cultural</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display" }}>
                Próximos Eventos
              </h2>
            </div>
            <Link to="/eventos" className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
              Ver todos <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.slice(0, 6).map((evento) => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>

          {eventos.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Próximamente más eventos</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]" data-testid="features-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display" }}>
            ¿Por qué Veracruz Contigo?
          </h2>
          <p className="text-white/80 mb-12 max-w-2xl mx-auto">
            La plataforma oficial de turismo que te acompaña en cada paso de tu aventura
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-left">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TODOS LOS MUNICIPIOS
      ══════════════════════════════════════ */}
      {municipios.length > 0 && (
        <section className="py-20 px-4" data-testid="municipios-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-6 h-6 text-[#1B5E20]" />
                  <span className="text-[#1B5E20] font-semibold uppercase tracking-wider text-sm">232 municipios</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display" }}>
                  Explora Veracruz
                </h2>
              </div>
              <Link to="/explorar" className="hidden md:flex items-center gap-2 text-[#1B5E20] font-medium hover:underline">
                Ver todos <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {municipios.slice(0, 8).map((m) => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/explorar">
                <Button className="bg-[#1B5E20] hover:bg-[#145218] text-white px-8 py-6 text-lg rounded-xl">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explorar todos los municipios
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <PanicButton />
    </div>
  );
};

export default HomePage;