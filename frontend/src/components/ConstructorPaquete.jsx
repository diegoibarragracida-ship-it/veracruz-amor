import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  Check, X, Plus, Minus, Calendar, DollarSign, Users,
  Car, Navigation, UserCheck, Shield, Camera, Package,
  ChevronRight, ChevronLeft, Save, Loader2, Star,
  Clock, MapPin, Hotel, Utensils, Mountain, Coffee,
  Sunrise, Sun, Sunset, Moon
} from "lucide-react";
import { toast } from "sonner";

/* ── Bloques del día ──────────────────────────────────────── */
const BLOQUES_DIA = [
  { id: "desayuno",  label: "Desayuno",     emoji: "☀️",  icon: Sunrise, tipos: ["GASTRONOMÍA"], hora: "8:00 AM",  color: "#F59E0B" },
  { id: "manana",    label: "Mañana",       emoji: "🌄",  icon: Sun,     tipos: ["atraccion","actividad"], hora: "9:00 AM",  color: null },
  { id: "comida",    label: "Comida",       emoji: "🍽️", icon: Utensils,tipos: ["GASTRONOMÍA"], hora: "2:00 PM",  color: "#10B981" },
  { id: "tarde",     label: "Tarde",        emoji: "🌇",  icon: Sunset,  tipos: ["atraccion","actividad"], hora: "4:00 PM",  color: null },
  { id: "cena",      label: "Cena",         emoji: "🌙",  icon: Moon,    tipos: ["GASTRONOMÍA"], hora: "8:00 PM",  color: "#6366F1" },
  { id: "hospedaje", label: "Hospedaje",    emoji: "🏨",  icon: Hotel,   tipos: ["HOSPEDAJE"],   hora: "Check-in", color: "#3B82F6" },
];

/* ── Servicios extra ──────────────────────────────────────── */
const SERVICIOS_DISPONIBLES = [
  { tipo: "auto",       nombre: "Renta de auto",       emoji: "🚗", precio_base: 800,  unidad: "por día",
    categorias: [{ label: "Compacto", precio: 600 }, { label: "SUV", precio: 1100 }, { label: "Camioneta", precio: 1400 }] },
  { tipo: "uber",       nombre: "Traslados Uber/taxi",  emoji: "🚖", precio_base: 400,  unidad: "por día", categorias: null },
  { tipo: "guia",       nombre: "Guía turístico local", emoji: "🧑‍🏫", precio_base: 1200, unidad: "por día",
    categorias: [{ label: "Medio día (4h)", precio: 700 }, { label: "Día completo", precio: 1200 }] },
  { tipo: "seguro",     nombre: "Seguro de viaje",      emoji: "🛡️", precio_base: 250,  unidad: "por persona",
    categorias: [{ label: "Básico", precio: 150 }, { label: "Completo", precio: 350 }] },
  { tipo: "tour",       nombre: "Tour especializado",   emoji: "🗺️", precio_base: 600,  unidad: "por persona",
    categorias: [{ label: "Tour de café", precio: 350 }, { label: "Tour arqueológico", precio: 500 }, { label: "Ecoturismo", precio: 650 }] },
  { tipo: "fotografia", nombre: "Sesión de fotos",      emoji: "📸", precio_base: 2500, unidad: "sesión",
    categorias: [{ label: "Media sesión (2h)", precio: 1500 }, { label: "Sesión completa", precio: 2800 }] },
];

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

/* ── Card de ítem seleccionable ──────────────────────────── */
const ItemCard = ({ item, incluido, onToggle, color, tipo }) => {
  const foto = item.foto_portada || item.foto_url || item.fotos?.[0];
  const esGastro = tipo === "GASTRONOMÍA";
  const esHotel = tipo === "HOSPEDAJE";
  const costo = item.costo_min ?? item.precio_promedio ?? item.precio_noche ?? 0;

  return (
    <div
      onClick={() => onToggle(!incluido)}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
        incluido ? "bg-white shadow-sm" : "bg-gray-50 border-transparent opacity-60"
      }`}
      style={incluido ? { borderColor: `${color}55` } : {}}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
        {foto ? (
          <img src={foto} alt={item.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl"
            style={{ background: `${color}22` }}>
            {esGastro ? "🍽️" : esHotel ? "🏨" : item.tipo === "actividad" ? "🎯" : "🏛️"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.subtipo && <span className="text-xs text-gray-400">{item.subtipo}</span>}
          {item.especialidad && <span className="text-xs text-gray-400">{item.especialidad}</span>}
          {costo > 0 && (
            <span className="text-xs font-medium text-gray-600">· ${costo}</span>
          )}
          {item.calificacion_promedio > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />{item.calificacion_promedio || item.calificacion}
            </span>
          )}
          {item.calificacion > 0 && !item.calificacion_promedio && (
            <span className="text-xs text-amber-600 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />{item.calificacion}
            </span>
          )}
        </div>
        {item.horarios && <p className="text-[11px] text-gray-400 mt-0.5 truncate">🕐 {item.horarios}</p>}
      </div>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
        incluido ? "text-white" : "bg-gray-200 text-gray-400"
      }`} style={incluido ? { backgroundColor: color } : {}}>
        {incluido ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </div>
    </div>
  );
};

/* ── Paso 1: Fechas y personas ───────────────────────────── */
const PasoFechas = ({ datos, onChange }) => (
  <div className="space-y-6">
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Nombre de tu viaje</label>
      <input type="text" value={datos.nombre} onChange={e => onChange({ nombre: e.target.value })}
        placeholder="Ej: Vacaciones en Orizaba 2025"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#1B5E20] text-sm placeholder-gray-400" />
    </div>
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Fecha de llegada</label>
      <input type="date" value={datos.fecha_inicio}
        min={new Date().toISOString().split("T")[0]}
        onChange={e => onChange({ fecha_inicio: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-[#1B5E20] text-sm" />
    </div>
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Número de personas</label>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange({ num_personas: Math.max(1, datos.num_personas - 1) })}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl">−</button>
        <span className="text-3xl font-bold text-gray-900 w-10 text-center">{datos.num_personas}</span>
        <button onClick={() => onChange({ num_personas: Math.min(20, datos.num_personas + 1) })}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-xl">+</button>
        <span className="text-gray-500 text-sm">personas</span>
      </div>
    </div>
  </div>
);

/* ── Paso 2: Planeación día a día ────────────────────────── */
const PasoLugares = ({ diasConfig, onToggleItem, numDias, color, loading }) => {
  const [diaActivo, setDiaActivo] = useState(0);
  const dia = diasConfig[diaActivo];

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
      <span className="text-gray-500 text-sm">Cargando opciones...</span>
    </div>
  );

  return (
    <div>
      {/* Selector de día */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Array.from({ length: numDias }, (_, i) => (
          <button key={i} onClick={() => setDiaActivo(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              diaActivo === i ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            style={diaActivo === i ? { backgroundColor: color } : {}}>
            Día {i + 1}
          </button>
        ))}
      </div>

      {/* Bloques del día */}
      <div className="space-y-4">
        {BLOQUES_DIA.map(bloque => {
          const itemsDelBloque = dia.bloques?.[bloque.id] || [];
          const seleccionados = itemsDelBloque.filter(i => i.incluido).length;
          const BloqueIcon = bloque.icon;

          return (
            <div key={bloque.id} className="bg-gray-50 rounded-2xl overflow-hidden">
              {/* Header bloque */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                  style={{ backgroundColor: bloque.color ? `${bloque.color}20` : `${color}20` }}>
                  {bloque.emoji}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{bloque.label}</p>
                  <p className="text-xs text-gray-400">{bloque.hora}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 bg-white px-2 py-1 rounded-full border">
                  {seleccionados} seleccionado{seleccionados !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items */}
              <div className="p-3 space-y-2">
                {itemsDelBloque.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No hay opciones disponibles para este bloque
                  </p>
                ) : (
                  itemsDelBloque.map(item => (
                    <ItemCard
                      key={item.item_id}
                      item={item}
                      incluido={item.incluido}
                      color={color}
                      tipo={bloque.tipos[0]}
                      onToggle={(val) => onToggleItem(diaActivo, bloque.id, item.item_id, val)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Paso 3: Servicios extra ─────────────────────────────── */
const PasoServicios = ({ servicios, onToggle, onCategoria, numDias, numPersonas, color }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-500">Selecciona los servicios adicionales para tu viaje.</p>
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
          className={`rounded-2xl border-2 transition-all overflow-hidden ${incluido ? "shadow-sm" : "border-gray-100"}`}
          style={incluido ? { borderColor: `${color}44` } : {}}>
          <div className={`flex items-center gap-4 p-4 cursor-pointer ${!incluido ? "hover:bg-gray-50" : ""}`}
            onClick={() => onToggle(svc)}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${!incluido ? "bg-gray-100" : ""}`}
              style={incluido ? { backgroundColor: color } : {}}>
              {svc.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 text-sm">{svc.nombre}</p>
                <p className="text-sm font-bold" style={{ color: incluido ? color : "#6B7280" }}>
                  ~${precioTotal.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500">{svc.descripcion} · {svc.unidad}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              incluido ? "border-transparent text-white" : "border-gray-300"
            }`} style={incluido ? { backgroundColor: color } : {}}>
              {incluido && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
          {incluido && svc.categorias && (
            <div className="px-4 pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {svc.categorias.map(cat => {
                  const sel = conf?.categoria === cat.label;
                  return (
                    <button key={cat.label} onClick={() => onCategoria(svc.tipo, cat.label)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border-2 transition-all ${
                        sel ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"
                      }`}
                      style={sel ? { backgroundColor: color, borderColor: color } : {}}>
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

/* ── Paso 4: Resumen ─────────────────────────────────────── */
const PasoResumen = ({ datos, diasConfig, servicios, costoTotal, region, color, onGuardar, loading }) => {
  const serviciosActivos = servicios.filter(s => s.incluido);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}22` }}>
        <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
          {datos.nombre || `Mi viaje a ${region}`}
        </h3>
        <div className="flex flex-wrap gap-3">
          {datos.fecha_inicio && (
            <span className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-xl shadow-sm text-gray-700">
              <Calendar className="w-3.5 h-3.5" style={{ color }} />
              {formatFecha(datos.fecha_inicio)} → {formatFecha(addDays(datos.fecha_inicio, diasConfig.length - 1))}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-xl shadow-sm text-gray-700">
            <Users className="w-3.5 h-3.5" style={{ color }} /> {datos.num_personas} personas
          </span>
        </div>
      </div>

      {diasConfig.map((dia, i) => {
        const todosItems = BLOQUES_DIA.flatMap(b => (dia.bloques?.[b.id] || []).filter(l => l.incluido).map(l => ({ ...l, bloque: b.label, emoji: b.emoji })));
        return (
          <div key={i} className="bg-gray-50 rounded-2xl p-4">
            <p className="font-bold text-gray-800 text-sm mb-3">
              Día {i + 1}
              {datos.fecha_inicio && <span className="font-normal text-gray-400 ml-2">{formatFecha(addDays(datos.fecha_inicio, i))}</span>}
            </p>
            {todosItems.length > 0 ? (
              <div className="space-y-2">
                {todosItems.map((l, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <span className="text-base">{l.emoji}</span>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{l.nombre}</p>
                      <p className="text-xs text-gray-400">{l.bloque}</p>
                    </div>
                    {l.costo_estimado > 0 && (
                      <span className="text-xs text-gray-500 ml-auto">${l.costo_estimado}/persona</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin ítems seleccionados</p>
            )}
          </div>
        );
      })}

      {serviciosActivos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Servicios adicionales</p>
          {serviciosActivos.map(s => (
            <div key={s.tipo} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 mb-2">
              <p className="text-sm text-gray-700">{s.nombre}</p>
              <p className="text-sm font-semibold text-gray-700">${s.precio_estimado.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5 flex items-center justify-between text-white"
        style={{ backgroundColor: color }}>
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wide">Costo total estimado</p>
          <p className="text-3xl font-bold mt-0.5">${costoTotal.toLocaleString()} MXN</p>
          <p className="text-white/60 text-xs mt-0.5">≈ ${Math.round(costoTotal / datos.num_personas).toLocaleString()} por persona</p>
        </div>
        <Package className="w-10 h-10 opacity-40" />
      </div>

      <button onClick={onGuardar} disabled={loading}
        className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2.5 hover:opacity-90 disabled:opacity-60 transition-all"
        style={{ backgroundColor: color }}>
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><Save className="w-5 h-5" /> Guardar mi itinerario</>}
      </button>
    </div>
  );
};

/* ── COMPONENTE PRINCIPAL ────────────────────────────────── */
const ConstructorPaquete = ({ lugares, rutaData, region, color }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const numDias = rutaData?.dias_recomendados || 3;

  const [paso, setPaso] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [restaurantes, setRestaurantes] = useState([]);
  const [hoteles, setHoteles] = useState([]);

  const [datos, setDatos] = useState({ nombre: "", fecha_inicio: "", num_personas: 2 });

  // Fetch prestadores al montar
  useEffect(() => {
    const fetchPrestadores = async () => {
      setLoadingItems(true);
      try {
        const [restRes, hotelRes] = await Promise.all([
          axios.get(`${API}/prestadores`, { params: { tipo: "GASTRONOMÍA", verificado: true, limit: 20 } }),
          axios.get(`${API}/prestadores`, { params: { tipo: "HOSPEDAJE", verificado: true, limit: 20 } }),
        ]);
        setRestaurantes(restRes.data.prestadores || []);
        setHoteles(hotelRes.data.prestadores || []);
      } catch (e) {
        console.error("Error cargando prestadores:", e);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchPrestadores();
  }, []);

  // Construir configuración de días con todos los bloques
  const [diasConfig, setDiasConfig] = useState(() =>
    Array.from({ length: numDias }, (_, i) => ({
      dia_num: i + 1,
      fecha: null,
      bloques: {}, // se populará cuando llegen los datos
    }))
  );

  // Cuando llegan prestadores, populamos los bloques
  useEffect(() => {
    if (loadingItems) return;
    setDiasConfig(Array.from({ length: numDias }, (_, diaIdx) => {
      const lugaresBase = lugares.slice(
        Math.floor((diaIdx / numDias) * lugares.length),
        Math.floor(((diaIdx + 1) / numDias) * lugares.length)
      );

      return {
        dia_num: diaIdx + 1,
        fecha: null,
        bloques: {
          desayuno: restaurantes.slice(0, 4).map(r => ({
            item_id: r.id, nombre: r.nombre, tipo: "GASTRONOMÍA",
            subtipo: r.subtipo, foto_url: r.foto_url,
            calificacion_promedio: r.calificacion_promedio,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: diaIdx === 0 && restaurantes.indexOf(r) === 0,
          })),
          manana: lugaresBase.filter(l => l.tipo !== "restaurante").slice(0, 3).map((l, j) => ({
            item_id: l.id, nombre: l.nombre, tipo: l.tipo,
            foto_portada: l.foto_portada, fotos: l.fotos,
            calificacion: l.calificacion, costo_estimado: l.costo_min || 0,
            horarios: l.horarios, incluido: j === 0,
          })),
          comida: restaurantes.slice(0, 4).map(r => ({
            item_id: r.id + "_comida", nombre: r.nombre, tipo: "GASTRONOMÍA",
            subtipo: r.subtipo, foto_url: r.foto_url,
            calificacion_promedio: r.calificacion_promedio,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: restaurantes.indexOf(r) === 1,
          })),
          tarde: lugaresBase.filter(l => l.tipo !== "restaurante").slice(1, 4).map((l, j) => ({
            item_id: l.id + "_tarde", nombre: l.nombre, tipo: l.tipo,
            foto_portada: l.foto_portada, fotos: l.fotos,
            calificacion: l.calificacion, costo_estimado: l.costo_min || 0,
            horarios: l.horarios, incluido: j === 0,
          })),
          cena: restaurantes.slice(0, 4).map(r => ({
            item_id: r.id + "_cena", nombre: r.nombre, tipo: "GASTRONOMÍA",
            subtipo: r.subtipo, foto_url: r.foto_url,
            calificacion_promedio: r.calificacion_promedio,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: restaurantes.indexOf(r) === 2,
          })),
          hospedaje: hoteles.slice(0, 3).map((h, j) => ({
            item_id: h.id, nombre: h.nombre, tipo: "HOSPEDAJE",
            subtipo: h.subtipo, foto_url: h.foto_url,
            calificacion_promedio: h.calificacion_promedio,
            horarios: h.horarios, costo_estimado: h.precio_noche || 0,
            incluido: j === 0,
          })),
        },
      };
    }));
  }, [loadingItems, lugares, restaurantes, hoteles, numDias]);

  const [servicios, setServicios] = useState(
    SERVICIOS_DISPONIBLES.map(s => ({ tipo: s.tipo, nombre: s.nombre, precio_estimado: s.precio_base, categoria: null, incluido: false }))
  );

  const costoTotal = useMemo(() => {
    const costoItems = diasConfig.reduce((acc, dia) =>
      acc + BLOQUES_DIA.reduce((a, b) =>
        a + (dia.bloques?.[b.id] || []).filter(i => i.incluido).reduce((s, i) => s + (i.costo_estimado || 0), 0)
      , 0)
    , 0);
    const costoServicios = servicios.filter(s => s.incluido).reduce((a, s) => a + s.precio_estimado, 0);
    return costoItems + costoServicios;
  }, [diasConfig, servicios]);

  const toggleItem = (diaIdx, bloqueId, itemId, incluido) => {
    setDiasConfig(prev => {
      const next = [...prev];
      const dia = { ...next[diaIdx], bloques: { ...next[diaIdx].bloques } };
      dia.bloques[bloqueId] = (dia.bloques[bloqueId] || []).map(item =>
        item.item_id === itemId ? { ...item, incluido } : item
      );
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
      // Convertir bloques a formato de días para la API
      const diasParaAPI = diasConfig.map((dia, i) => ({
        dia_num: dia.dia_num,
        fecha: datos.fecha_inicio ? addDays(datos.fecha_inicio, i) : null,
        lugares: BLOQUES_DIA.flatMap(b =>
          (dia.bloques?.[b.id] || []).filter(item => item.incluido).map(item => ({
            lugar_id: item.item_id,
            nombre: item.nombre,
            tipo: item.tipo,
            costo_estimado: item.costo_estimado || 0,
            estado: "pendiente",
            incluido: true,
            hora_visita: b.hora,
          }))
        ),
      }));

      const payload = {
        nombre: datos.nombre || `Mi viaje a ${region}`,
        region,
        fecha_inicio: datos.fecha_inicio || null,
        fecha_fin: datos.fecha_inicio ? addDays(datos.fecha_inicio, numDias - 1) : null,
        num_personas: datos.num_personas,
        dias: diasParaAPI,
        servicios_extra: servicios.filter(s => s.incluido),
        costo_total_estimado: costoTotal,
      };

      const { data } = await axios.post(`${API}/itinerarios`, payload);
      toast.success("¡Itinerario guardado!");
      navigate(`/mi-diario/${data.id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Inicia sesión para guardar tu itinerario");
        navigate("/login");
      } else {
        toast.error("Error al guardar. Intenta de nuevo.");
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const PASOS = [
    { label: "Fechas",    icon: Calendar },
    { label: "Planear",   icon: MapPin },
    { label: "Servicios", icon: Package },
    { label: "Resumen",   icon: Check },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {PASOS.map((p, i) => {
          const Icon = p.icon;
          const done = i < paso;
          const active = i === paso;
          return (
            <div key={i} className="flex items-center flex-1">
              <button onClick={() => i < paso && setPaso(i)}
                className={`flex flex-col items-center gap-1 flex-shrink-0 ${i < paso ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  !done && !active ? "bg-gray-100 text-gray-400" : "text-white"
                }`} style={(done || active) ? { backgroundColor: color } : {}}>
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}>
                  {p.label}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 transition-colors"
                  style={{ backgroundColor: i < paso ? color : "#E5E7EB" }} />
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

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {paso === 0 && <PasoFechas datos={datos} onChange={c => setDatos(d => ({ ...d, ...c }))} />}
        {paso === 1 && (
          <PasoLugares
            diasConfig={diasConfig}
            onToggleItem={toggleItem}
            numDias={numDias}
            color={color}
            loading={loadingItems}
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        {paso < PASOS.length - 1 && (
          <button onClick={() => setPaso(p => p + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: color }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConstructorPaquete;