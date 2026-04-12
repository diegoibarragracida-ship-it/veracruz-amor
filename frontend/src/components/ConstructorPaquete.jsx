import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  Check, Plus, Calendar, DollarSign, Users,
  Package, ChevronRight, ChevronLeft, Save,
  Loader2, Star, Clock, MapPin, Hotel, Utensils,
  Sunrise, Sun, Sunset, Moon, Sparkles, Zap,
  Coffee, Navigation
} from "lucide-react";
import { toast } from "sonner";

/* ─── Bloques del día ─────────────────────────────────────── */
const BLOQUES_DIA = [
  { id: "desayuno",  label: "Desayuno",  emoji: "☀️",  icon: Sunrise,  tipos: ["GASTRONOMÍA"],            hora: "8:00 AM",  colorKey: "#F59E0B" },
  { id: "manana",    label: "Mañana",    emoji: "🌄",  icon: Sun,      tipos: ["atraccion","actividad"],   hora: "9:00 AM",  colorKey: null },
  { id: "comida",    label: "Comida",    emoji: "🍽️", icon: Utensils, tipos: ["GASTRONOMÍA"],            hora: "2:00 PM",  colorKey: "#10B981" },
  { id: "tarde",     label: "Tarde",     emoji: "🌇",  icon: Sunset,   tipos: ["atraccion","actividad"],   hora: "4:00 PM",  colorKey: null },
  { id: "cena",      label: "Cena",      emoji: "🌙",  icon: Moon,     tipos: ["GASTRONOMÍA"],            hora: "8:00 PM",  colorKey: "#6366F1" },
  { id: "hospedaje", label: "Hospedaje", emoji: "🏨",  icon: Hotel,    tipos: ["HOSPEDAJE"],              hora: "Check-in", colorKey: "#3B82F6" },
];

const SERVICIOS_DISPONIBLES = [
  { tipo: "auto",       nombre: "Renta de auto",        emoji: "🚗", precio_base: 800,  unidad: "por día",
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

/* ─── Item Card ───────────────────────────────────────────── */
const ItemCard = ({ item, incluido, onToggle, color }) => {
  const foto = item.foto_portada || item.foto_url || item.fotos?.[0];
  const costo = item.costo_min ?? item.precio_promedio ?? item.precio_noche ?? 0;

  return (
    <div
      onClick={() => onToggle(!incluido)}
      className="group flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none"
      style={{
        borderColor: incluido ? color : "transparent",
        backgroundColor: incluido ? `${color}08` : "#F9FAFB",
        transform: incluido ? "scale(1.01)" : "scale(1)",
        boxShadow: incluido ? `0 4px 20px ${color}20` : "none",
      }}
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
        {foto ? (
          <img
            src={foto}
            alt={item.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
          >
            {item.tipo === "GASTRONOMÍA" ? "🍽️" : item.tipo === "HOSPEDAJE" ? "🏨" : item.tipo === "actividad" ? "🎯" : "🏛️"}
          </div>
        )}
        {item.destacado && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-amber-900 fill-current" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate" style={{ fontFamily: "Playfair Display, serif" }}>
          {item.nombre}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.subtipo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.subtipo}</span>
          )}
          {(item.calificacion > 0 || item.calificacion_promedio > 0) && (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-semibold">
              <Star className="w-2.5 h-2.5 fill-current" />
              {item.calificacion || item.calificacion_promedio}
            </span>
          )}
          {costo > 0 ? (
            <span className="text-[10px] text-emerald-600 font-semibold">${costo} MXN</span>
          ) : (
            <span className="text-[10px] text-emerald-600 font-semibold">✓ Gratis</span>
          )}
        </div>
        {item.horarios && (
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {item.horarios}
          </p>
        )}
      </div>

      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          backgroundColor: incluido ? color : "#E5E7EB",
          color: incluido ? "white" : "#9CA3AF",
        }}
      >
        {incluido ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </div>
    </div>
  );
};

/* ─── Paso 1: Fechas ─────────────────────────────────────── */
const PasoFechas = ({ datos, onChange, color, numDias }) => (
  <div className="space-y-8">
    <div className="text-center pb-2">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
      >
        🗓️
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
        ¿Cuándo y con quién?
      </h3>
      <p className="text-sm text-gray-400">Configura los detalles básicos de tu viaje</p>
    </div>

    <div className="space-y-5">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Nombre de tu viaje</label>
        <input
          type="text"
          value={datos.nombre}
          onChange={e => onChange({ nombre: e.target.value })}
          placeholder="Ej: Vacaciones en Orizaba 2025"
          className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 focus:outline-none text-sm placeholder-gray-300 transition-all"
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = "#F3F4F6"}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Fecha de llegada</label>
        <input
          type="date"
          value={datos.fecha_inicio}
          min={new Date().toISOString().split("T")[0]}
          onChange={e => onChange({ fecha_inicio: e.target.value })}
          className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-800 focus:outline-none text-sm transition-all"
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = "#F3F4F6"}
        />
        {datos.fecha_inicio && (
          <p className="text-xs text-gray-400 mt-2 pl-1">
            Tu viaje termina el {formatFecha(addDays(datos.fecha_inicio, numDias - 1))}
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Número de personas</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange({ num_personas: Math.max(1, datos.num_personas - 1) })}
            className="w-12 h-12 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:border-gray-300 font-bold text-xl transition-all"
          >−</button>
          <div className="flex-1 text-center">
            <span className="text-4xl font-bold text-gray-900">{datos.num_personas}</span>
            <p className="text-xs text-gray-400 mt-0.5">{datos.num_personas === 1 ? "persona" : "personas"}</p>
          </div>
          <button
            onClick={() => onChange({ num_personas: Math.min(20, datos.num_personas + 1) })}
            className="w-12 h-12 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:border-gray-300 font-bold text-xl transition-all"
          >+</button>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Paso 2: Lugares ────────────────────────────────────── */
const PasoLugares = ({ diasConfig, onToggleItem, numDias, color, loading }) => {
  const [diaActivo, setDiaActivo] = useState(0);
  const [bloqueActivo, setBloqueActivo] = useState("manana");
  const dia = diasConfig[diaActivo];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
      >
        <Loader2 className="w-7 h-7 animate-spin" style={{ color }} />
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-semibold text-sm">Cargando lugares</p>
        <p className="text-gray-400 text-xs mt-1">Jalando datos desde MongoDB...</p>
      </div>
    </div>
  );

  const bloqueActual = BLOQUES_DIA.find(b => b.id === bloqueActivo);
  const itemsDelBloque = dia?.bloques?.[bloqueActivo] || [];
  const seleccionados = itemsDelBloque.filter(i => i.incluido).length;

  return (
    <div>
      {/* Selector de días */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Array.from({ length: numDias }, (_, i) => {
          const totalDiaI = BLOQUES_DIA.reduce((acc, b) =>
            acc + (diasConfig[i]?.bloques?.[b.id] || []).filter(x => x.incluido).length, 0
          );
          return (
            <button
              key={i}
              onClick={() => setDiaActivo(i)}
              className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
              style={
                diaActivo === i
                  ? { backgroundColor: color, color: "white" }
                  : { backgroundColor: "#F3F4F6", color: "#6B7280" }
              }
            >
              <span>Día {i + 1}</span>
              {totalDiaI > 0 && (
                <span className="mt-0.5 text-[10px] font-normal opacity-80">{totalDiaI} selec.</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selector de bloques */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-5">
        {BLOQUES_DIA.map(b => {
          const items = dia?.bloques?.[b.id] || [];
          const sel = items.filter(i => i.incluido).length;
          const isActive = bloqueActivo === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setBloqueActivo(b.id)}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all border-2"
              style={
                isActive
                  ? { borderColor: color, backgroundColor: `${color}10`, color }
                  : { borderColor: "transparent", backgroundColor: "#F9FAFB", color: "#6B7280" }
              }
            >
              <span className="text-lg leading-none">{b.emoji}</span>
              <span className="text-[10px] font-semibold leading-none">{b.label}</span>
              {sel > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
                  style={{ backgroundColor: color }}
                >
                  {sel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header bloque activo */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl mb-3"
        style={{ background: `linear-gradient(135deg, ${color}0d, ${color}18)` }}
      >
        <span className="text-2xl">{bloqueActual?.emoji}</span>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{bloqueActual?.label}</p>
          <p className="text-xs text-gray-500">{bloqueActual?.hora} · {itemsDelBloque.length} opciones</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            backgroundColor: seleccionados > 0 ? color : "#E5E7EB",
            color: seleccionados > 0 ? "white" : "#9CA3AF"
          }}
        >
          {seleccionados} elegido{seleccionados !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Lista de items */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {itemsDelBloque.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl block mb-2">🏜️</span>
            <p className="text-sm text-gray-400">Sin opciones para este bloque</p>
          </div>
        ) : (
          itemsDelBloque.map(item => (
            <ItemCard
              key={item.item_id}
              item={item}
              incluido={item.incluido}
              color={color}
              onToggle={(val) => onToggleItem(diaActivo, bloqueActivo, item.item_id, val)}
            />
          ))
        )}
      </div>
    </div>
  );
};

/* ─── Paso 3: Servicios ──────────────────────────────────── */
const PasoServicios = ({ servicios, onToggle, onCategoria, numDias, numPersonas, color }) => (
  <div className="space-y-3">
    <div className="text-center pb-2">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
      >
        ✨
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
        Servicios adicionales
      </h3>
      <p className="text-sm text-gray-400">Personaliza tu experiencia al máximo</p>
    </div>

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
        <div
          key={svc.tipo}
          className="rounded-2xl border-2 transition-all duration-200 overflow-hidden"
          style={{
            borderColor: incluido ? color : "#F3F4F6",
            boxShadow: incluido ? `0 4px 20px ${color}15` : "none",
          }}
        >
          <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => onToggle(svc)}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-all"
              style={incluido ? { backgroundColor: color } : { backgroundColor: "#F3F4F6" }}
            >
              {svc.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 text-sm">{svc.nombre}</p>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: incluido ? color : "#9CA3AF" }}>
                  ~${precioTotal.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{svc.unidad}</p>
            </div>
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={incluido ? { backgroundColor: color, borderColor: color } : { borderColor: "#D1D5DB" }}
            >
              {incluido && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {incluido && svc.categorias && (
            <div className="px-4 pb-4 border-t border-gray-50 pt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Elige el tipo</p>
              <div className="flex flex-wrap gap-2">
                {svc.categorias.map(cat => {
                  const sel = conf?.categoria === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => onCategoria(svc.tipo, cat.label)}
                      className="text-xs px-3 py-2 rounded-xl font-semibold border-2 transition-all"
                      style={
                        sel
                          ? { backgroundColor: color, borderColor: color, color: "white" }
                          : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#374151" }
                      }
                    >
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

/* ─── Paso 4: Resumen ────────────────────────────────────── */
const PasoResumen = ({ datos, diasConfig, servicios, costoTotal, region, color, onGuardar, loading }) => {
  const serviciosActivos = servicios.filter(s => s.incluido);
  const totalItems = diasConfig.reduce((acc, dia) =>
    acc + BLOQUES_DIA.reduce((a, b) =>
      a + (dia.bloques?.[b.id] || []).filter(i => i.incluido).length, 0
    ), 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white -translate-y-8 translate-x-8" />
        <div className="relative">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Tu itinerario</p>
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
            {datos.nombre || `Mi viaje a ${region}`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {datos.fecha_inicio && (
              <span className="flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white font-medium">
                <Calendar className="w-3 h-3" />
                {formatFecha(datos.fecha_inicio)} → {formatFecha(addDays(datos.fecha_inicio, diasConfig.length - 1))}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white font-medium">
              <Users className="w-3 h-3" /> {datos.num_personas} personas
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white font-medium">
              <MapPin className="w-3 h-3" /> {totalItems} actividades
            </span>
          </div>
        </div>
      </div>

      {/* Días */}
      {diasConfig.map((dia, i) => {
        const todosItems = BLOQUES_DIA.flatMap(b =>
          (dia.bloques?.[b.id] || [])
            .filter(l => l.incluido)
            .map(l => ({ ...l, bloqueLabel: b.label, bloqueEmoji: b.emoji }))
        );
        return (
          <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden">
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ background: `linear-gradient(90deg, ${color}12, transparent)` }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {i + 1}
              </div>
              <p className="font-bold text-gray-800 text-sm">
                Día {i + 1}
                {datos.fecha_inicio && (
                  <span className="font-normal text-gray-400 ml-2 text-xs">{formatFecha(addDays(datos.fecha_inicio, i))}</span>
                )}
              </p>
              <span className="ml-auto text-xs text-gray-400">{todosItems.length} actividades</span>
            </div>
            <div className="px-4 pb-4 pt-2">
              {todosItems.length > 0 ? (
                <div className="space-y-2">
                  {todosItems.map((l, j) => (
                    <div key={j} className="flex items-center gap-2.5 py-1">
                      <span className="text-base flex-shrink-0">{l.bloqueEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{l.nombre}</p>
                        <p className="text-xs text-gray-400">{l.bloqueLabel}</p>
                      </div>
                      {l.costo_estimado > 0 && (
                        <span className="text-xs text-gray-500 flex-shrink-0 font-medium">${l.costo_estimado}/p</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic py-2">Sin ítems seleccionados</p>
              )}
            </div>
          </div>
        );
      })}

      {/* Servicios */}
      {serviciosActivos.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Servicios adicionales</p>
          {serviciosActivos.map(s => (
            <div key={s.tipo} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-700">{s.nombre}</p>
              <p className="text-sm font-bold text-gray-900">${s.precio_estimado.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)`, border: `2px solid ${color}30` }}
      >
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Costo total estimado</p>
          <p className="text-4xl font-bold mt-1" style={{ color, fontFamily: "Playfair Display, serif" }}>
            ${costoTotal.toLocaleString()}
            <span className="text-base font-normal text-gray-400 ml-1">MXN</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ≈ ${Math.round(costoTotal / datos.num_personas).toLocaleString()} por persona
          </p>
        </div>
        <Package className="w-12 h-12 opacity-20" style={{ color }} />
      </div>

      <button
        onClick={onGuardar}
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-60"
        style={{ backgroundColor: color }}
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
          : <><Save className="w-5 h-5" /> Guardar mi itinerario</>
        }
      </button>
    </div>
  );
};

/* ─── COMPONENTE PRINCIPAL ───────────────────────────────── */
const ConstructorPaquete = ({ rutaData, region, color }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const numDias = rutaData?.dias_recomendados || 3;

  const [paso, setPaso] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  const [lugaresDB, setLugaresDB] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [hoteles, setHoteles] = useState([]);
  const [datos, setDatos] = useState({ nombre: "", fecha_inicio: "", num_personas: 2 });

  // ── Fetch desde MongoDB igual que MunicipioPage ─────────
  useEffect(() => {
    const fetchTodo = async () => {
      setLoadingItems(true);
      try {
        const munRes = await axios.get(`${API}/municipios/${region}`);
        const municipioId = munRes.data?.id;

        const [lugaresRes, restRes, hotelRes] = await Promise.all([
          municipioId
            ? axios.get(`${API}/lugares`, { params: { municipio_id: municipioId } })
            : axios.get(`${API}/lugares`, { params: { region } }),
          axios.get(`${API}/prestadores`, { params: { tipo: "GASTRONOMÍA", verificado: true, limit: 20 } }),
          axios.get(`${API}/prestadores`, { params: { tipo: "HOSPEDAJE",   verificado: true, limit: 20 } }),
        ]);

        setLugaresDB(lugaresRes.data.lugares || []);
        setRestaurantes(restRes.data.prestadores || []);
        setHoteles(hotelRes.data.prestadores || []);
      } catch (e) {
        console.error("Error cargando datos:", e);
        toast.error("Error cargando los lugares.");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchTodo();
  }, [region]);

  // ── Construir días con TODOS los lugares ────────────────
  const [diasConfig, setDiasConfig] = useState(() =>
    Array.from({ length: numDias }, (_, i) => ({ dia_num: i + 1, fecha: null, bloques: {} }))
  );

  useEffect(() => {
    if (loadingItems) return;

    // ✅ TODOS los lugares van a cada bloque — el usuario elige
    const atracciones = lugaresDB.filter(l => l.tipo === "atraccion" || l.tipo === "actividad");

    setDiasConfig(
      Array.from({ length: numDias }, (_, diaIdx) => ({
        dia_num: diaIdx + 1,
        fecha: null,
        bloques: {
          desayuno: restaurantes.map((r, j) => ({
            item_id: `${r.id}_des_${diaIdx}`,
            nombre: r.nombre, tipo: "GASTRONOMÍA", subtipo: r.subtipo,
            foto_url: r.foto_url, calificacion: r.calificacion_promedio || 0,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: j === (diaIdx % Math.max(restaurantes.length, 1)),
          })),

          // ✅ TODAS las atracciones en mañana
          manana: atracciones.map((l, j) => ({
            item_id: `${l.id}_man_${diaIdx}`,
            nombre: l.nombre, tipo: l.tipo, subtipo: l.subtipo,
            foto_portada: l.foto_portada, fotos: l.fotos,
            calificacion: l.calificacion || 0, destacado: l.destacado,
            horarios: l.horarios, costo_estimado: l.costo_min || 0,
            incluido: j === 0 && diaIdx === 0,
          })),

          comida: restaurantes.map((r, j) => ({
            item_id: `${r.id}_com_${diaIdx}`,
            nombre: r.nombre, tipo: "GASTRONOMÍA", subtipo: r.subtipo,
            foto_url: r.foto_url, calificacion: r.calificacion_promedio || 0,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: j === ((diaIdx + 1) % Math.max(restaurantes.length, 1)),
          })),

          // ✅ TODAS las atracciones en tarde
          tarde: atracciones.map((l, j) => ({
            item_id: `${l.id}_tar_${diaIdx}`,
            nombre: l.nombre, tipo: l.tipo, subtipo: l.subtipo,
            foto_portada: l.foto_portada, fotos: l.fotos,
            calificacion: l.calificacion || 0, destacado: l.destacado,
            horarios: l.horarios, costo_estimado: l.costo_min || 0,
            incluido: false,
          })),

          cena: restaurantes.map((r, j) => ({
            item_id: `${r.id}_cen_${diaIdx}`,
            nombre: r.nombre, tipo: "GASTRONOMÍA", subtipo: r.subtipo,
            foto_url: r.foto_url, calificacion: r.calificacion_promedio || 0,
            horarios: r.horarios, costo_estimado: r.precio_promedio || 0,
            incluido: j === ((diaIdx + 2) % Math.max(restaurantes.length, 1)),
          })),

          hospedaje: hoteles.map((h, j) => ({
            item_id: `${h.id}_hos_${diaIdx}`,
            nombre: h.nombre, tipo: "HOSPEDAJE", subtipo: h.subtipo,
            foto_url: h.foto_url, calificacion: h.calificacion_promedio || 0,
            horarios: h.horarios, costo_estimado: h.precio_noche || 0,
            incluido: j === 0,
          })),
        },
      }))
    );
  }, [loadingItems, lugaresDB, restaurantes, hoteles, numDias]);

  const [servicios, setServicios] = useState(
    SERVICIOS_DISPONIBLES.map(s => ({
      tipo: s.tipo, nombre: s.nombre,
      precio_estimado: s.precio_base, categoria: null, incluido: false,
    }))
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
      let precio = svc.precio_base;
      if (svc.unidad === "por día") precio *= numDias;
      if (svc.unidad === "por persona") precio *= datos.num_personas;
      return { ...s, incluido: !s.incluido, precio_estimado: precio };
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
      const diasParaAPI = diasConfig.map((dia, i) => ({
        dia_num: dia.dia_num,
        fecha: datos.fecha_inicio ? addDays(datos.fecha_inicio, i) : null,
        lugares: BLOQUES_DIA.flatMap(b =>
          (dia.bloques?.[b.id] || []).filter(item => item.incluido).map(item => ({
            lugar_id: item.item_id, nombre: item.nombre, tipo: item.tipo,
            costo_estimado: item.costo_estimado || 0,
            estado: "pendiente", incluido: true, hora_visita: b.hora,
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
        toast.error("Inicia sesión para guardar");
        navigate("/login");
      } else {
        toast.error("Error al guardar. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  };

  const PASOS = [
    { label: "Fechas",    icon: Calendar },
    { label: "Planear",   icon: MapPin },
    { label: "Servicios", icon: Sparkles },
    { label: "Resumen",   icon: Package },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner datos cargados */}
      {!loadingItems && lugaresDB.length > 0 && (
        <div
          className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl text-sm"
          style={{ backgroundColor: `${color}0d`, border: `1px solid ${color}25` }}
        >
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color }} />
          <span className="text-gray-600">
            <span className="font-bold" style={{ color }}>{lugaresDB.length}</span> atracciones ·{" "}
            <span className="font-bold" style={{ color }}>{restaurantes.length}</span> restaurantes ·{" "}
            <span className="font-bold" style={{ color }}>{hoteles.length}</span> hoteles disponibles
          </span>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {PASOS.map((p, i) => {
          const Icon = p.icon;
          const done = i < paso;
          const active = i === paso;
          return (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => i < paso && setPaso(i)}
                className={`flex flex-col items-center gap-1 flex-shrink-0 ${i < paso ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-300"
                  style={
                    done || active
                      ? { backgroundColor: color, color: "white", boxShadow: `0 4px 12px ${color}40` }
                      : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
                  }
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-bold hidden sm:block tracking-wider uppercase ${active ? "text-gray-800" : "text-gray-300"}`}>
                  {p.label}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i < paso ? color : "#E5E7EB" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Costo flotante */}
      <div
        className="flex items-center justify-between mb-5 px-5 py-3.5 rounded-2xl"
        style={{ background: `linear-gradient(90deg, ${color}0d, ${color}18)`, border: `1px solid ${color}20` }}
      >
        <span className="text-sm text-gray-500 font-medium">Costo estimado</span>
        <span className="text-2xl font-bold" style={{ color, fontFamily: "Playfair Display, serif" }}>
          ${costoTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">MXN</span>
        </span>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        {paso === 0 && <PasoFechas datos={datos} onChange={c => setDatos(d => ({ ...d, ...c }))} color={color} numDias={numDias} />}
        {paso === 1 && <PasoLugares diasConfig={diasConfig} onToggleItem={toggleItem} numDias={numDias} color={color} loading={loadingItems} />}
        {paso === 2 && <PasoServicios servicios={servicios} onToggle={toggleServicio} onCategoria={setCategoria} numDias={numDias} numPersonas={datos.num_personas} color={color} />}
        {paso === 3 && <PasoResumen datos={datos} diasConfig={diasConfig} servicios={servicios} costoTotal={costoTotal} region={region} color={color} onGuardar={guardar} loading={saving} />}
      </div>

      {/* Navegación */}
      <div className="flex gap-3 mt-4">
        {paso > 0 && (
          <button
            onClick={() => setPaso(p => p - 1)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold text-sm hover:border-gray-200 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        {paso < PASOS.length - 1 && (
          <button
            onClick={() => setPaso(p => p + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[.98]"
            style={{ backgroundColor: color, boxShadow: `0 4px 20px ${color}40` }}
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConstructorPaquete;