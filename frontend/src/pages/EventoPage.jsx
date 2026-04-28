import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar, MapPin, DollarSign, ArrowLeft, Share2,
  Heart, Clock, Users, Phone, Globe, ChevronLeft, ChevronRight
} from "lucide-react";

const COLORES_TIPO = {
  Festival: "#6A1B9A", Cultural: "#1565C0", Deportivo: "#2E7D32",
  Concierto: "#C62878", Feria: "#E65100", Gastronómico: "#D32F2F",
  Religioso: "#1565C0", Artesanal: "#795548", Otro: "#546E7A"
};

const EMOJIS_TIPO = {
  Festival: "🎪", Cultural: "🎭", Deportivo: "⚽", Concierto: "🎵",
  Feria: "🎡", Gastronómico: "🍽️", Religioso: "⛪", Artesanal: "🏺", Otro: "🎉"
};

const EventoPage = () => {
  const { id } = useParams();
  const [evento,   setEvento]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [isFav,    setIsFav]    = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data } = await axios.get(`${API}/eventos/${id}`);
        setEvento(data);
      } catch {
        try {
          const { data } = await axios.get(`${API}/eventos`, { params: { limit: 500 } });
          const found = (data.eventos || []).find(e => e.id === id);
          if (found) setEvento(found);
        } catch {}
      } finally { setLoading(false); }
    };
    fetch_();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!evento) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-5xl">😕</p>
      <p className="text-gray-600 font-semibold">Evento no encontrado</p>
      <Link to="/eventos" className="text-[#1B5E20] font-bold hover:underline">Ver todos los eventos</Link>
    </div>
  );

  const color = COLORES_TIPO[evento.tipo] || "#1B5E20";
  const emoji = EMOJIS_TIPO[evento.tipo] || "🎉";

  const formatFecha = (f) => {
    if (!f) return "";
    const d = new Date(f + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const esMultidia = evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio;
  const esFuturo   = evento.fecha_inicio >= new Date().toISOString().split("T")[0];
  const esHoy      = evento.fecha_inicio === new Date().toISOString().split("T")[0];

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: evento.nombre, text: evento.descripcion, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); alert("Link copiado"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-6 pb-0">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link to="/eventos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Eventos
            </Link>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
              {emoji} {evento.tipo}
            </span>
            {esHoy && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 animate-pulse">🔴 Hoy</span>}
            {!esFuturo && !esHoy && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Finalizado</span>}
          </div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{evento.nombre}</h1>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setIsFav(f => !f)}
                className={`p-2 rounded-xl border text-sm transition-colors ${isFav ? "border-red-200 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              <button onClick={handleShare} className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Imagen principal */}
        {evento.foto_url ? (
          <div className="rounded-2xl overflow-hidden h-72 sm:h-96">
            <img src={evento.foto_url} alt={evento.nombre} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-2xl h-48 flex items-center justify-center text-7xl"
            style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
            {emoji}
          </div>
        )}
      </section>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {evento.descripcion && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 text-xl mb-3">Acerca del evento</h2>
                <p className="text-gray-600 leading-relaxed">{evento.descripcion}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Detalles</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fecha</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 capitalize">{formatFecha(evento.fecha_inicio)}</p>
                    {esMultidia && <p className="text-xs text-gray-500 mt-0.5">Hasta: {formatFecha(evento.fecha_fin)}</p>}
                  </div>
                </div>
                {evento.lugar && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Lugar</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{evento.lugar}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <DollarSign className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Precio</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {evento.es_gratis || evento.precio_min === 0
                        ? "🆓 Entrada gratuita"
                        : `$${evento.precio_min}${evento.precio_max && evento.precio_max !== evento.precio_min ? `–$${evento.precio_max}` : ""} MXN`}
                    </p>
                  </div>
                
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* CTA principal */}
            {esFuturo && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xl">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{emoji}</div>
                  <p className="font-black text-gray-900">{evento.es_gratis || evento.precio_min === 0 ? "Entrada Gratuita" : `Desde $${evento.precio_min} MXN`}</p>
                  {esHoy && <p className="text-green-600 font-semibold text-sm mt-1 animate-pulse">¡Hoy es el evento!</p>}
                </div>
                <button className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                  {evento.es_gratis ? "Asistir al evento" : "Ver precios y boletos"}
                </button>
              </div>
            )}

            {/* Fecha destacada */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                  style={{ backgroundColor: color }}>
                  {new Date(evento.fecha_inicio + "T12:00:00").getDate()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm capitalize">
                    {new Date(evento.fecha_inicio + "T12:00:00").toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                  </p>
                  {esMultidia && <p className="text-xs text-gray-400">Termina: {new Date(evento.fecha_fin + "T12:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" })}</p>}
                </div>
              </div>
            </div>

            {/* Municipio */}
            {evento.municipio_nombre && (
              <Link to={`/municipio/${evento.municipio_slug || ""}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Municipio</p>
                  <p className="font-bold text-gray-900 text-sm">{evento.municipio_nombre}</p>
                </div>
              </Link>
            )}

            {/* Compartir */}
            <button onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" /> Compartir evento
            </button>
          </div>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventoPage;