import { useState, useMemo } from "react";
import axios from "axios";
import { API } from "@/App";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  Check, X, Plus, Minus, Calendar, DollarSign, Users,
  Car, Navigation, UserCheck, Shield, Camera, Package,
  ChevronRight, ChevronLeft, Save, Loader2, Star,
  Clock, MapPin, Hotel, Utensils, Mountain
} from "lucide-react";
import { toast } from "sonner";

/* ── Servicios extra disponibles ─────────────────────────── */
const SERVICIOS_DISPONIBLES = [
  {
    tipo: "auto",
    nombre: "Renta de auto",
    descripcion: "Vehículo compacto con seguro incluido",
    emoji: "🚗",
    precio_base: 800,
    unidad: "por día",
    categorias: [
      { label: "Compacto",   precio: 600 },
      { label: "SUV",        precio: 1100 },
      { label: "Camioneta",  precio: 1400 },
    ],
  },
  {
    tipo: "uber",
    nombre: "Traslados Uber/taxi",
    descripcion: "Estimado de traslados durante el viaje",
    emoji: "🚖",
    precio_base: 400,
    unidad: "por día",
    categorias: null,
  },
  {
    tipo: "guia",
    nombre: "Guía turístico local",
    descripcion: "Guía certificado que conoce la región",
    emoji: "🧑‍🏫",
    precio_base: 1200,
    unidad: "por día",
    categorias: [
      { label: "Medio día (4h)", precio: 700 },
      { label: "Día completo",   precio: 1200 },
      { label: "Tour nocturno",  precio: 900 },
    ],
  },
  {
    tipo: "seguro",
    nombre: "Seguro de viaje",
    descripcion: "Cobertura médica y cancelación",
    emoji: "🛡️",
    precio_base: 250,
    unidad: "por persona",
    categorias: [
      { label: "Básico",    precio: 150 },
      { label: "Completo",  precio: 350 },
    ],
  },
  {
    tipo: "tour",
    nombre: "Tour especializado",
    descripcion: "Experiencia única con operador local",
    emoji: "🗺️",
    precio_base: 600,
    unidad: "por persona",
    categorias: [
      { label: "Tour de café",      precio: 350 },
      { label: "Tour arqueológico", precio: 500 },
      { label: "Ecoturismo",        precio: 650 },
      { label: "Gastronómico",      precio: 800 },
    ],
  },
  {
    tipo: "fotografia",
    nombre: "Sesión de fotos",
    descripcion: "Fotógrafo profesional para tu viaje",
    emoji: "📸",
    precio_base: 2500,
    unidad: "sesión",
    categorias: [
      { label: "Media sesión (2h)", precio: 1500 },
      { label: "Sesión completa",   precio: 2800 },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────── */
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const formatFecha = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
};

/* ── Paso 1: Fechas y personas ───────────────────────────── */
const PasoFechas = ({ datos, onChange }) => (
  <div className="space-y-6">
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
        Fecha de llegada
      </label>
      <input
        type="date"
        value={datos.fecha_inicio}
        min={new Date().toISOString().split("T")[0]}
        onChange={e => onChange({ fecha_inicio: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] text-sm"
      />
    </div>

    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
        Número de personas
      </label>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange({ num_personas: Math.max(1, datos.num_personas - 1) })}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl">
          −
        </button>
        <span className="text-3xl font-bold text-gray-900 w-10 text-center">{datos.num_personas}</span>
        <button onClick={() => onChange({ num_personas: Math.min(20, datos.num_personas + 1) })}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl">
          +
        </button>
        <span className="text-gray-500 text-sm">personas</span>
      </div>
    </div>

    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
        Nombre de tu viaje (opcional)
      </label>
      <input
        type="text"
        value={datos.nombre}
        onChange={e => onChange({ nombre: e.target.value })}
        placeholder="Ej: Vacaciones en Orizaba 2025"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#1B5E20] text-sm placeholder-gray-400"
      />
    </div>
  </div>
);

/* ── Paso 2: Elegir lugares por día ──────────────────────── */
const PasoLugares = ({ lugares, diasConfig, onToggleLugar, numDias, color }) => {
  // Distribuir lugares por días
  const lugaresPorDia = useMemo(() => {
    const chunks = [];
    const perDia = Math.ceil(lugares.length / numDias);
    for (let i = 0; i < numDias; i++) {
      chunks.push(lugares.slice(i * perDia, (i + 1) * perDia));
    }
    return chunks;
  }, [lugares, numDias]);

  return (
    <div className="space-y-6">
      {Array.from({ length: numDias }, (_, diaIdx) => {
        const lugaresDelDia = lugaresPorDia[diaIdx] || [];
        const diaConf = diasConfig[diaIdx] || { lugares: [] };
        const incluidosCount = diaConf.lugares.filter(l => l.incluido).length;

        return (
          <div key={diaIdx} className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 text-sm">
                Día {diaIdx + 1}
              </h4>
              <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border">
                {incluidosCount} lugar{incluidosCount !== 1 ? "es" : ""} seleccionado{incluidosCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {lugaresDelDia.map(lugar => {
                const lugarConf = diaConf.lugares.find(l => l.lugar_id === lugar.id);
                const incluido = lugarConf ? lugarConf.incluido : true;

                return (
                  <div key={lugar.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      incluido ? "bg-white border-transparent shadow-sm" : "bg-gray-100 border-transparent opacity-60"
                    }`}
                    onClick={() => onToggleLugar(diaIdx, lugar, !incluido)}>

                    {/* Foto miniatura */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                      {lugar.foto_portada || lugar.fotos?.[0] ? (
                        <img src={lugar.foto_portada || lugar.fotos[0]} alt={lugar.nombre}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl"
                          style={{ background: `${color}22` }}>
                          {lugar.tipo === "atraccion" ? "🏛️" : lugar.tipo === "actividad" ? "🎯" : "📍"}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{lugar.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{lugar.tipo}</span>
                        {lugar.costo_min !== undefined && (
                          <span className="text-xs font-medium text-gray-600">
                            · ${lugar.costo_min === 0 ? "Gratis" : `${lugar.costo_min}`}
                          </span>
                        )}
                        {lugar.calificacion && (
                          <span className="text-xs text-amber-600 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />{lugar.calificacion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      incluido ? "text-white" : "bg-gray-200 text-gray-400"
                    }`} style={incluido ? { backgroundColor: color } : {}}>
                      {incluido ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Paso 3: Servicios extra ─────────────────────────────── */
const PasoServicios = ({ servicios, onToggle, onCategoria, numDias, numPersonas, color }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-500">Selecciona los servicios que quieres incluir en tu paquete.</p>
    {SERVICIOS_DISPONIBLES.map(svc => {
      const conf = servicios.find(s => s.tipo === svc.tipo);
      const incluido = conf?.incluido || false;

      let precioTotal = svc.precio_base;
      if (conf?.categoria) {
        const catConf = svc.categorias?.find(c => c.label === conf.categoria);
        if (catConf) precioTotal = catConf.precio;
      }
      if (svc.unidad === "por día") precioTotal *= numDias;
      if (svc.unidad === "por persona") precioTotal *= numPersonas;

      return (
        <div key={svc.tipo}
          className={`rounded-2xl border-2 transition-all overflow-hidden ${
            incluido ? "shadow-sm" : "border-gray-100"
          }`}
          style={incluido ? { borderColor: `${color}44` } : {}}>

          {/* Header del servicio */}
          <div
            className={`flex items-center gap-4 p-4 cursor-pointer ${incluido ? "" : "hover:bg-gray-50"}`}
            onClick={() => onToggle(svc)}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
              incluido ? "text-white" : "bg-gray-100"
            }`} style={incluido ? { backgroundColor: color } : {}}>
              {svc.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 text-sm">{svc.nombre}</p>
                <p className="text-sm font-bold" style={incluido ? { color } : { color: "#6B7280" }}>
                  ~${precioTotal.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500">{svc.descripcion} · {svc.unidad}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              incluido ? "border-transparent text-white" : "border-gray-300"
            }`} style={incluido ? { backgroundColor: color } : {}}>
              {incluido && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Categorías (si el servicio está incluido y tiene opciones) */}
          {incluido && svc.categorias && (
            <div className="px-4 pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de servicio</p>
              <div className="flex flex-wrap gap-2">
                {svc.categorias.map(cat => {
                  const seleccionado = conf?.categoria === cat.label;
                  return (
                    <button key={cat.label}
                      onClick={() => onCategoria(svc.tipo, cat.label)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border-2 transition-all ${
                        seleccionado ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"
                      }`}
                      style={seleccionado ? { backgroundColor: color, borderColor: color } : {}}>
                      {cat.label} · ${cat.precio.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

/* ── Paso 4: Resumen y guardar ───────────────────────────── */
const PasoResumen = ({ datos, diasConfig, servicios, costoTotal, region, color, onGuardar, loading }) => {
  const lugaresTotales = diasConfig.reduce((acc, d) =>
    acc + d.lugares.filter(l => l.incluido).length, 0);

  const serviciosActivos = servicios.filter(s => s.incluido);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}22` }}>
        <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
          {datos.nombre || `Mi viaje a ${region}`}
        </h3>
        <div className="flex flex-wrap gap-3 mt-3">
          {datos.fecha_inicio && (
            <span className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-xl shadow-sm text-gray-700 font-medium">
              <Calendar className="w-3.5 h-3.5" style={{ color }} />
              {formatFecha(datos.fecha_inicio)} → {formatFecha(addDays(datos.fecha_inicio, diasConfig.length - 1))}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-xl shadow-sm text-gray-700 font-medium">
            <Users className="w-3.5 h-3.5" style={{ color }} />
            {datos.num_personas} persona{datos.num_personas !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-xl shadow-sm text-gray-700 font-medium">
            <MapPin className="w-3.5 h-3.5" style={{ color }} />
            {lugaresTotales} lugares
          </span>
        </div>
      </div>

      {/* Días */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Itinerario</p>
        <div className="space-y-3">
          {diasConfig.map((dia, i) => {
            const incluidos = dia.lugares.filter(l => l.incluido);
            return (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-sm mb-2">
                  Día {i + 1}
                  {datos.fecha_inicio && (
                    <span className="font-normal text-gray-400 ml-2">{formatFecha(addDays(datos.fecha_inicio, i))}</span>
                  )}
                </p>
                {incluidos.length > 0 ? (
                  <div className="space-y-1.5">
                    {incluidos.map(l => (
                      <div key={l.lugar_id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px]"
                          style={{ backgroundColor: color }}>✓</div>
                        <p className="text-sm text-gray-700">{l.nombre}</p>
                        {l.costo_estimado > 0 && (
                          <span className="text-xs text-gray-400 ml-auto">${l.costo_estimado}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sin lugares seleccionados</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Servicios */}
      {serviciosActivos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Servicios incluidos</p>
          <div className="space-y-2">
            {serviciosActivos.map(s => (
              <div key={s.tipo} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <p className="text-sm text-gray-700">{s.nombre}</p>
                <p className="text-sm font-semibold text-gray-700">${s.precio_estimado.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{ backgroundColor: color, color: "white" }}>
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wide">Costo total estimado</p>
          <p className="text-3xl font-bold mt-0.5">${costoTotal.toLocaleString()} MXN</p>
          <p className="text-white/60 text-xs mt-0.5">
            ≈ ${Math.round(costoTotal / datos.num_personas).toLocaleString()} por persona
          </p>
        </div>
        <Package className="w-10 h-10 opacity-40" />
      </div>

      {/* Botón guardar */}
      <button onClick={onGuardar} disabled={loading}
        className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: color }}>
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
          : <><Save className="w-5 h-5" /> Guardar mi itinerario</>
        }
      </button>
    </div>
  );
};

/* ── COMPONENTE PRINCIPAL ────────────────────────────────── */
const ConstructorPaquete = ({ lugares, rutaData, region, color }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const numDias = rutaData?.dias_recomendados || 3;

  const [paso,    setPaso]    = useState(0);
  const [saving,  setSaving]  = useState(false);

  const [datos, setDatos] = useState({
    nombre: "",
    fecha_inicio: "",
    num_personas: 2,
  });

  // Estado de los días: cada uno tiene lista de lugares con flag incluido
  const [diasConfig, setDiasConfig] = useState(() => {
    const lugaresPorDia = Math.ceil(lugares.length / numDias);
    return Array.from({ length: numDias }, (_, i) => ({
      dia_num: i + 1,
      fecha: null,
      lugares: lugares.slice(i * lugaresPorDia, (i + 1) * lugaresPorDia).map(l => ({
        lugar_id: l.id,
        nombre: l.nombre,
        tipo: l.tipo,
        municipio: l.municipio,
        lat: l.lat,
        lng: l.lng,
        foto_portada: l.foto_portada,
        costo_estimado: l.costo_min || 0,
        estado: "pendiente",
        incluido: true,
      })),
    }));
  });

  const [servicios, setServicios] = useState(
    SERVICIOS_DISPONIBLES.map(s => ({
      tipo: s.tipo,
      nombre: s.nombre,
      precio_estimado: s.precio_base,
      categoria: null,
      incluido: false,
    }))
  );

  // Calcular costo total
  const costoTotal = useMemo(() => {
    const costoLugares = diasConfig.reduce((acc, dia) =>
      acc + dia.lugares.filter(l => l.incluido).reduce((a, l) => a + l.costo_estimado, 0), 0);
    const costoServicios = servicios.filter(s => s.incluido).reduce((acc, s) => acc + s.precio_estimado, 0);
    const baseRuta = rutaData?.costo_estimado_min || 0;
    return costoLugares + costoServicios + baseRuta;
  }, [diasConfig, servicios, rutaData]);

  const toggleLugar = (diaIdx, lugar, incluido) => {
    setDiasConfig(prev => {
      const next = [...prev];
      const dia = { ...next[diaIdx] };
      const lugarIdx = dia.lugares.findIndex(l => l.lugar_id === lugar.id);
      if (lugarIdx >= 0) {
        const updatedLugares = [...dia.lugares];
        updatedLugares[lugarIdx] = { ...updatedLugares[lugarIdx], incluido };
        dia.lugares = updatedLugares;
      }
      next[diaIdx] = dia;
      return next;
    });
  };

  const toggleServicio = (svc) => {
    setServicios(prev => prev.map(s => {
      if (s.tipo !== svc.tipo) return s;
      const nuevoIncluido = !s.incluido;
      let precio = svc.precio_base;
      if (svc.unidad === "por día") precio *= numDias;
      if (svc.unidad === "por persona") precio *= datos.num_personas;
      return { ...s, incluido: nuevoIncluido, precio_estimado: precio };
    }));
  };

  const setCategoria = (tipo, categoria) => {
    setServicios(prev => prev.map(s => {
      if (s.tipo !== tipo) return s;
      const svcDef = SERVICIOS_DISPONIBLES.find(d => d.tipo === tipo);
      const cat = svcDef?.categorias?.find(c => c.label === categoria);
      let precio = cat ? cat.precio : svcDef?.precio_base || 0;
      if (svcDef?.unidad === "por día") precio *= numDias;
      if (svcDef?.unidad === "por persona") precio *= datos.num_personas;
      return { ...s, categoria, precio_estimado: precio };
    }));
  };

  const guardar = async () => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar tu itinerario");
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      const diasConFecha = diasConfig.map((d, i) => ({
        ...d,
        fecha: datos.fecha_inicio ? addDays(datos.fecha_inicio, i) : null,
      }));

      const payload = {
        nombre: datos.nombre || `Mi viaje a ${region}`,
        region,
        fecha_inicio: datos.fecha_inicio || null,
        fecha_fin: datos.fecha_inicio ? addDays(datos.fecha_inicio, numDias - 1) : null,
        num_personas: datos.num_personas,
        dias: diasConFecha,
        servicios_extra: servicios.filter(s => s.incluido),
        costo_total_estimado: costoTotal,
      };

      const { data } = await axios.post(`${API}/itinerarios`, payload);
      toast.success("¡Itinerario guardado! Puedes verlo en tu diario.");
      navigate(`/mi-diario/${data.id}`);
    } catch (err) {
      toast.error("Error al guardar. Intenta de nuevo.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const PASOS = [
    { label: "Fechas",    icon: Calendar },
    { label: "Lugares",   icon: MapPin },
    { label: "Servicios", icon: Package },
    { label: "Resumen",   icon: Check },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8">
        {PASOS.map((p, i) => {
          const Icon = p.icon;
          const done = i < paso;
          const active = i === paso;
          return (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => i < paso && setPaso(i)}
                className={`flex flex-col items-center gap-1 flex-shrink-0 ${i < paso ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done   ? "text-white" :
                  active ? "text-white ring-4 ring-offset-2" :
                  "bg-gray-100 text-gray-400"
                }`} style={
                  done   ? { backgroundColor: color } :
                  active ? { backgroundColor: color, ringColor: `${color}40` } :
                  {}
                }>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}>
                  {p.label}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < paso ? "" : "bg-gray-200"}`}
                  style={i < paso ? { backgroundColor: color } : {}} />
              )}
            </div>
          );
        })}
      </div>

      {/* Costo flotante */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
        <span className="text-sm text-gray-500">Costo estimado total</span>
        <span className="text-xl font-bold" style={{ color }}>${costoTotal.toLocaleString()} MXN</span>
      </div>

      {/* Contenido del paso */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {paso === 0 && (
          <PasoFechas datos={datos} onChange={changes => setDatos(d => ({ ...d, ...changes }))} />
        )}
        {paso === 1 && (
          <PasoLugares
            lugares={lugares}
            diasConfig={diasConfig}
            onToggleLugar={toggleLugar}
            numDias={numDias}
            color={color}
          />
        )}
        {paso === 2 && (
          <PasoServicios
            servicios={servicios}
            onToggle={toggleServicio}
            onCategoria={setCategoria}
            numDias={numDias}
            numPersonas={datos.num_personas}
            color={color}
          />
        )}
        {paso === 3 && (
          <PasoResumen
            datos={datos}
            diasConfig={diasConfig}
            servicios={servicios}
            costoTotal={costoTotal}
            region={region}
            color={color}
            onGuardar={guardar}
            loading={saving}
          />
        )}
      </div>

      {/* Navegación */}
      <div className="flex gap-3 mt-5">
        {paso > 0 && (
          <button onClick={() => setPaso(p => p - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        {paso < PASOS.length - 1 && (
          <button onClick={() => setPaso(p => p + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: color }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConstructorPaquete;