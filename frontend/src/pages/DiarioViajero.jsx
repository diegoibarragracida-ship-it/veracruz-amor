import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CheckCircle2, Circle, XCircle, ChevronLeft,
  Camera, MessageSquare, Share2, MapPin, Clock,
  DollarSign, Star, Trash2, Loader2, Calendar,
  Users, ArrowLeft, Twitter, Facebook, Link2,
  CheckCheck, AlertCircle, Navigation, Trophy
} from "lucide-react";
import { toast } from "sonner";

/* ── Helpers ────────────────────────────────────────────── */
const ESTADO_CONFIG = {
  visitado:  { label: "Visitado",  Icon: CheckCircle2, color: "#16A34A", bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  pendiente: { label: "Pendiente", Icon: Circle,       color: "#6B7280", bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-600"   },
  cancelado: { label: "Cancelado", Icon: XCircle,      color: "#DC2626", bg: "bg-red-50",    border: "border-red-200",    text: "text-red-600"    },
};

const formatFechaLarga = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });
};

const formatFechaCorta = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric", month: "short",
  });
};

const REGIONES_COLOR = {
  orizaba: "#1B5E20", xalapa: "#1565C0", tuxtlas: "#00695C",
  norte:   "#4A148C", costa:  "#01579B",
};

/* ── Lista de mis itinerarios ────────────────────────────── */
const MisItinerarios = ({ onSelect }) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${API}/itinerarios`);
        setItems(data.itinerarios || []);
      } catch {
        toast.error("Error cargando tus itinerarios");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const eliminar = async (id, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este itinerario?")) return;
    try {
      await axios.delete(`${API}/itinerarios/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Itinerario eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  if (!items.length) return (
    <div className="text-center py-24 px-4">
      <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gray-100 flex items-center justify-center text-4xl">🗺️</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Tu diario está vacío
      </h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
        Crea tu primer itinerario en la sección de Rutas y guárdalo aquí.
      </p>
      <Link to="/rutas"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#145218] transition-colors">
        <MapPin className="w-4 h-4" /> Explorar rutas
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {items.map(item => {
        const color = REGIONES_COLOR[item.region] || "#1B5E20";
        const totalLugares = item.dias?.reduce((a, d) => a + (d.lugares?.length || 0), 0) || 0;
        const visitados    = item.dias?.reduce((a, d) =>
          a + (d.lugares?.filter(l => l.estado === "visitado").length || 0), 0) || 0;
        const pct = totalLugares > 0 ? Math.round((visitados / totalLugares) * 100) : 0;

        const ESTADO_VIAJE = {
          planificado: { label: "Planificado", cls: "bg-blue-100 text-blue-700" },
          en_curso:    { label: "En curso",    cls: "bg-amber-100 text-amber-700" },
          completado:  { label: "Completado",  cls: "bg-green-100 text-green-700" },
        };

        return (
          <div key={item.id}
            onClick={() => navigate(`/mi-diario/${item.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden">

            {/* Barra de color de la región */}
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_VIAJE[item.estado]?.cls || "bg-gray-100 text-gray-600"}`}>
                      {ESTADO_VIAJE[item.estado]?.label || item.estado}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{item.region}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base" style={{ fontFamily: "Playfair Display, serif" }}>
                    {item.nombre}
                  </h3>
                </div>
                <button onClick={(e) => eliminar(item.id, e)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                {item.fecha_inicio && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatFechaCorta(item.fecha_inicio)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {item.num_personas} persona{item.num_personas !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${item.costo_total_estimado?.toLocaleString()} MXN
                </span>
              </div>

              {/* Barra de progreso */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{visitados} de {totalLugares} lugares visitados</span>
                  <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Vista del diario de un itinerario ──────────────────── */
const VistaDiario = ({ itinerarioId }) => {
  const [itinerario, setItinerario] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(null); // lugar_id en proceso
  const [notaActiva, setNotaActiva] = useState(null); // {diaNum, lugarId}
  const [textNota,   setTextNota]   = useState("");
  const [showShare,  setShowShare]  = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingFoto, setUploadingFoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${API}/itinerarios/${itinerarioId}`);
        setItinerario(data);
      } catch {
        toast.error("Itinerario no encontrado");
        navigate("/mi-diario");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [itinerarioId]);

  const color = REGIONES_COLOR[itinerario?.region] || "#1B5E20";

  const actualizarEstado = async (diaNum, lugarId, estadoActual) => {
    const CICLO = ["pendiente", "visitado", "cancelado"];
    const sigIdx = (CICLO.indexOf(estadoActual) + 1) % CICLO.length;
    const nuevoEstado = CICLO[sigIdx];

    setUpdating(lugarId);
    try {
      const { data } = await axios.put(`${API}/itinerarios/${itinerarioId}/lugar`, {
        dia_num: diaNum,
        lugar_id: lugarId,
        estado: nuevoEstado,
      });

      setItinerario(prev => {
        const dias = prev.dias.map(d => ({
          ...d,
          lugares: d.lugares.map(l =>
            l.lugar_id === lugarId && d.dia_num === diaNum
              ? { ...l, estado: nuevoEstado }
              : l
          ),
        }));
        return { ...prev, dias, estado: data.estado_general };
      });
    } catch {
      toast.error("Error actualizando estado");
    } finally {
      setUpdating(null);
    }
  };

  const guardarNota = async () => {
    if (!notaActiva || !textNota.trim()) return;
    try {
      await axios.put(`${API}/itinerarios/${itinerarioId}/lugar`, {
        dia_num: notaActiva.diaNum,
        lugar_id: notaActiva.lugarId,
        estado: itinerario.dias
          .find(d => d.dia_num === notaActiva.diaNum)
          ?.lugares.find(l => l.lugar_id === notaActiva.lugarId)?.estado || "pendiente",
        nota: textNota.trim(),
      });

      setItinerario(prev => ({
        ...prev,
        dias: prev.dias.map(d => ({
          ...d,
          lugares: d.lugares.map(l =>
            l.lugar_id === notaActiva.lugarId && d.dia_num === notaActiva.diaNum
              ? { ...l, nota: textNota.trim() }
              : l
          ),
        })),
      }));
      toast.success("Nota guardada");
      setNotaActiva(null);
      setTextNota("");
    } catch {
      toast.error("Error guardando nota");
    }
  };

  const subirFoto = async (e, diaNum, lugarId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(lugarId);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await axios.post(
        `${API}/itinerarios/${itinerarioId}/foto?dia_num=${diaNum}&lugar_id=${lugarId}`,
        form, { headers: { "Content-Type": "multipart/form-data" } }
      );
      setItinerario(prev => ({
        ...prev,
        dias: prev.dias.map(d => ({
          ...d,
          lugares: d.lugares.map(l =>
            l.lugar_id === lugarId && d.dia_num === diaNum
              ? { ...l, fotos_usuario: [...(l.fotos_usuario || []), data.url] }
              : l
          ),
        })),
      }));
      toast.success("Foto subida");
    } catch {
      toast.error("Error subiendo foto");
    } finally {
      setUploadingFoto(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  if (!itinerario) return null;

  const totalLugares = itinerario.dias.reduce((a, d) => a + (d.lugares?.length || 0), 0);
  const visitados    = itinerario.dias.reduce((a, d) =>
    a + (d.lugares?.filter(l => l.estado === "visitado").length || 0), 0);
  const pct = totalLugares > 0 ? Math.round((visitados / totalLugares) * 100) : 0;
  const completado = pct === 100;

  const shareText = `Estoy explorando ${itinerario.nombre} con Veracruz Contigo 🗺️✨ ¡${pct}% completado! #VeracruzContigo #Veracruz`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Botón volver */}
      <Link to="/mi-diario"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mis viajes
      </Link>

      {/* Header del diario */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
        {/* Franja de color */}
        <div className="h-2" style={{ backgroundColor: color }} />

        <div className="p-6">
          {/* Título + estado */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 capitalize" style={{ color }}>
                {itinerario.region} · Diario del viajero
              </p>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
                {itinerario.nombre}
              </h2>
            </div>
            {completado && (
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-amber-50">
                🏆
              </div>
            )}
          </div>

          {/* Info del viaje */}
          <div className="flex flex-wrap gap-3 mb-5 text-xs">
            {itinerario.fecha_inicio && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-gray-600 font-medium">
                <Calendar className="w-3.5 h-3.5" style={{ color }} />
                {formatFechaCorta(itinerario.fecha_inicio)}
                {itinerario.fecha_fin && ` → ${formatFechaCorta(itinerario.fecha_fin)}`}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-gray-600 font-medium">
              <Users className="w-3.5 h-3.5" style={{ color }} />
              {itinerario.num_personas} persona{itinerario.num_personas !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-gray-600 font-medium">
              <DollarSign className="w-3.5 h-3.5" style={{ color }} />
              ${itinerario.costo_total_estimado?.toLocaleString()} MXN
            </span>
          </div>

          {/* Barra de progreso grande */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {completado ? "🎉 ¡Viaje completado!" : `${visitados} de ${totalLugares} lugares visitados`}
              </span>
              <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 relative"
                style={{ width: `${pct}%`, backgroundColor: color }}>
                <div className="absolute inset-0 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Días completados */}
          <div className="flex gap-1.5 mt-3">
            {itinerario.dias.map((d, i) => {
              const dLugares = d.lugares?.length || 0;
              const dVisitados = d.lugares?.filter(l => l.estado === "visitado").length || 0;
              const dPct = dLugares > 0 ? dVisitados / dLugares : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${dPct * 100}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-gray-400">D{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón compartir */}
        <div className="px-6 pb-6">
          <button onClick={() => setShowShare(s => !s)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-current"
            style={{ borderColor: `${color}44`, color }}>
            <Share2 className="w-4 h-4" /> Compartir mi diario
          </button>

          {showShare && (
            <div className="mt-3 flex gap-2">
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors">
                <Twitter className="w-4 h-4" /> Twitter
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado"); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline de días ──────────────────────────────── */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-8">
          {itinerario.dias.map((dia, diaIdx) => {
            const dLugares = dia.lugares?.length || 0;
            const dVisitados = dia.lugares?.filter(l => l.estado === "visitado").length || 0;
            const dCompletado = dLugares > 0 && dVisitados === dLugares;

            return (
              <div key={diaIdx} className="relative pl-14">
                {/* Círculo del día en la línea */}
                <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-sm z-10 ${dCompletado ? "" : "bg-gray-200"}`}
                  style={dCompletado ? { backgroundColor: color } : {}}>
                  {dCompletado ? <CheckCheck className="w-4 h-4" /> : diaIdx + 1}
                </div>

                {/* Header del día */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Día {diaIdx + 1}</h3>
                    {dia.fecha && (
                      <span className="text-sm text-gray-400">{formatFechaLarga(dia.fecha)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dVisitados}/{dLugares} lugares visitados
                  </p>
                </div>

                {/* Lugares del día */}
                <div className="space-y-3">
                  {dia.lugares?.map((lugar, lIdx) => {
                    const eConf = ESTADO_CONFIG[lugar.estado] || ESTADO_CONFIG.pendiente;
                    const EIcon = eConf.Icon;
                    const isUpdating = updating === lugar.lugar_id;
                    const tieneNota = !!lugar.nota;
                    const tieneFotos = lugar.fotos_usuario?.length > 0;
                    const notaAbierta = notaActiva?.lugarId === lugar.lugar_id && notaActiva?.diaNum === dia.dia_num;

                    return (
                      <div key={lIdx} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${eConf.border}`}>
                        {/* Fotos del usuario */}
                        {tieneFotos && (
                          <div className="flex gap-1 overflow-x-auto p-2">
                            {lugar.fotos_usuario.map((url, fi) => (
                              <img key={fi} src={url} alt=""
                                className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
                            ))}
                          </div>
                        )}

                        <div className="p-4">
                          {/* Header del lugar */}
                          <div className="flex items-start gap-3">
                            {/* Foto miniatura */}
                            {lugar.foto_portada && (
                              <img src={lugar.foto_portada} alt={lugar.nombre}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight">{lugar.nombre}</h4>
                                {/* Botón de estado (cíclico) */}
                                <button
                                  onClick={() => actualizarEstado(dia.dia_num, lugar.lugar_id, lugar.estado)}
                                  disabled={isUpdating}
                                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border-2 transition-all ${eConf.bg} ${eConf.border} ${eConf.text}`}>
                                  {isUpdating
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <EIcon className="w-3.5 h-3.5" />
                                  }
                                  <span className="hidden sm:inline">{eConf.label}</span>
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500">
                                <span className="capitalize">{lugar.tipo}</span>
                                {lugar.costo_estimado > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <DollarSign className="w-3 h-3" /> ${lugar.costo_estimado}
                                  </span>
                                )}
                                {lugar.hora_visita && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> {lugar.hora_visita}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nota guardada */}
                          {tieneNota && !notaAbierta && (
                            <div className="mt-3 pl-3 border-l-2 border-amber-300 bg-amber-50 rounded-r-xl py-2 pr-2">
                              <p className="text-xs text-amber-800 leading-relaxed">{lugar.nota}</p>
                            </div>
                          )}

                          {/* Input de nota */}
                          {notaAbierta && (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={textNota}
                                onChange={e => setTextNota(e.target.value)}
                                placeholder="¿Cómo estuvo? Escribe tu experiencia..."
                                rows={3}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-amber-400 placeholder-gray-400"
                              />
                              <div className="flex gap-2">
                                <button onClick={guardarNota}
                                  className="px-4 py-2 rounded-xl bg-amber-400 text-amber-900 font-semibold text-xs hover:bg-amber-500 transition-colors">
                                  Guardar nota
                                </button>
                                <button onClick={() => { setNotaActiva(null); setTextNota(""); }}
                                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs hover:bg-gray-50">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Acciones */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                            {/* Nota */}
                            <button
                              onClick={() => {
                                setNotaActiva(notaAbierta ? null : { diaNum: dia.dia_num, lugarId: lugar.lugar_id });
                                setTextNota(lugar.nota || "");
                              }}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium ${
                                tieneNota ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50"
                              }`}>
                              <MessageSquare className="w-3.5 h-3.5" />
                              {tieneNota ? "Editar nota" : "Agregar nota"}
                            </button>

                            {/* Foto */}
                            <label className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium cursor-pointer ${
                              tieneFotos ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
                            }`}>
                              {uploadingFoto === lugar.lugar_id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Camera className="w-3.5 h-3.5" />
                              }
                              {tieneFotos ? `${lugar.fotos_usuario.length} foto${lugar.fotos_usuario.length !== 1 ? "s" : ""}` : "Subir foto"}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => subirFoto(e, dia.dia_num, lugar.lugar_id)} />
                            </label>

                            {/* Maps */}
                            {lugar.lat && lugar.lng && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-gray-500 hover:bg-gray-50 ml-auto transition-colors">
                                <Navigation className="w-3.5 h-3.5" /> Cómo llegar
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensaje de viaje completado */}
      {completado && (
        <div className="mt-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 text-center text-amber-900">
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            ¡Viaje completado!
          </h3>
          <p className="text-amber-800 text-sm mb-4">
            Exploraste {totalLugares} lugares increíbles en {itinerario.region}. ¡Eso es Veracruz Contigo!
          </p>
          <Link to="/rutas"
            className="inline-flex items-center gap-2 bg-white text-amber-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-50 transition-colors">
            <MapPin className="w-4 h-4" /> Planear otro viaje
          </Link>
        </div>
      )}

      {/* Input file oculto global */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
};

/* ── PÁGINA PRINCIPAL ────────────────────────────────────── */
const DiarioViajero = () => {
  const { itinerarioId } = useParams();

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header de sección */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Tu espacio personal</p>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "Playfair Display, serif" }}>
            {itinerarioId ? "Mi diario de viaje" : "Mis viajes"}
          </h1>
        </div>

        {itinerarioId
          ? <VistaDiario itinerarioId={itinerarioId} />
          : <MisItinerarios />
        }
      </main>
      <Footer />
    </div>
  );
};

export default DiarioViajero;