import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const toISO = (d) => d.toISOString().split("T")[0];
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

/**
 * CalendarioDisponibilidad
 * Props:
 *   habitacionId  — string
 *   onRangoSelect — fn({ entrada, salida }) llamada cuando el turista selecciona rango
 *   color         — color del tipo de prestador
 *   modoAdmin     — bool, si true el prestador puede bloquear fechas
 */
const CalendarioDisponibilidad = ({ habitacionId, onRangoSelect, color = "#1565C0", modoAdmin = false }) => {
  const [año, setAño]         = useState(new Date().getFullYear());
  const [mes, setMes]         = useState(new Date().getMonth());
  const [bloqueadas, setBloqueadas] = useState(new Set());
  const [ocupadas,   setOcupadas]   = useState(new Set());
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  // Selección de rango
  const [inicio, setInicio] = useState(null);
  const [fin,    setFin]    = useState(null);
  const [hover,  setHover]  = useState(null);

  useEffect(() => {
    if (!habitacionId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dispRes, ocRes] = await Promise.all([
          axios.get(`${API}/habitaciones/${habitacionId}/disponibilidad`).catch(() => ({ data: { fechas_bloqueadas: [] } })),
          axios.get(`${API}/habitaciones/${habitacionId}/reservas-fechas`).catch(() => ({ data: { fechas_ocupadas: [] } })),
        ]);
        setBloqueadas(new Set(dispRes.data.fechas_bloqueadas || []));
        setOcupadas(new Set(ocRes.data.fechas_ocupadas || []));
      } finally { setLoading(false); }
    };
    fetchData();
  }, [habitacionId]);

  const getDiasDelMes = () => {
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    return { primerDia, diasEnMes };
  };

  const { primerDia, diasEnMes } = getDiasDelMes();

  const getFechaStr = (dia) => {
    const m = String(mes + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${año}-${m}-${d}`;
  };

  const esPasado = (dia) => {
    const f = new Date(año, mes, dia);
    f.setHours(0,0,0,0);
    return f < today();
  };

  const esBloqueada = (f) => bloqueadas.has(f);
  const esOcupada   = (f) => ocupadas.has(f);
  const esNoDisp    = (f, dia) => esPasado(dia) || esBloqueada(f) || esOcupada(f);

  const enRango = (f) => {
    if (!inicio) return false;
    const end = fin || hover;
    if (!end) return false;
    const [a, b] = inicio <= end ? [inicio, end] : [end, inicio];
    return f > a && f < b;
  };

  const esInicio = (f) => f === inicio;
  const esFin    = (f) => f === fin;

  const handleClick = (dia) => {
    const f = getFechaStr(dia);
    if (esNoDisp(f, dia)) return;

    if (modoAdmin) {
      // Toggle bloqueo
      const nuevas = new Set(bloqueadas);
      if (nuevas.has(f)) nuevas.delete(f);
      else nuevas.add(f);
      setBloqueadas(nuevas);
      return;
    }

    // Selección de rango para turista
    if (!inicio || (inicio && fin)) {
      setInicio(f); setFin(null); setHover(null);
    } else {
      if (f === inicio) { setInicio(null); return; }
      const [a, b] = f > inicio ? [inicio, f] : [f, inicio];
      // Verificar que no haya fechas no disponibles en el rango
      const rangoLimpio = !Array.from({ length: 60 }, (_, i) => {
        const d = new Date(a); d.setDate(d.getDate() + i);
        return toISO(d);
      }).filter(x => x > a && x < b).some(x => esBloqueada(x) || esOcupada(x));
      if (!rangoLimpio) return; // no hacer nada si hay fechas bloqueadas en medio
      setFin(b); setInicio(a);
      onRangoSelect && onRangoSelect({ entrada: a, salida: b });
    }
  };

  const guardarDisponibilidad = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/habitaciones/${habitacionId}/disponibilidad`, {
        fechas_bloqueadas: Array.from(bloqueadas),
      });
      alert("✅ Disponibilidad guardada");
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  const mesAnterior = () => { if (mes === 0) { setMes(11); setAño(a => a - 1); } else setMes(m => m - 1); };
  const mesSiguiente = () => { if (mes === 11) { setMes(0); setAño(a => a + 1); } else setMes(m => m + 1); };

  const noches = inicio && fin ? Math.round((new Date(fin) - new Date(inicio)) / 86400000) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={mesAnterior} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h3 className="font-bold text-gray-900 text-sm">{MESES[mes]} {año}</h3>
        <button onClick={mesSiguiente} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="p-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`} />)}

            {Array.from({ length: diasEnMes }, (_, i) => i + 1).map(dia => {
              const f = getFechaStr(dia);
              const pasado   = esPasado(dia);
              const bloq     = esBloqueada(f);
              const ocup     = esOcupada(f);
              const noDisp   = pasado || bloq || ocup;
              const enR      = enRango(f);
              const esIni    = esInicio(f);
              const esFn     = esFin(f);
              const esHoy    = f === toISO(today());

              return (
                <div key={dia}
                  className={`relative flex items-center justify-center h-9 text-sm cursor-pointer select-none transition-all
                    ${enR ? "bg-blue-50" : ""}
                    ${esIni || esFn ? "rounded-xl" : enR ? "" : "rounded-xl"}
                    ${esIni ? "rounded-l-xl" : ""}
                    ${esFn ? "rounded-r-xl" : ""}
                  `}
                  onClick={() => handleClick(dia)}
                  onMouseEnter={() => inicio && !fin && setHover(f)}
                  onMouseLeave={() => setHover(null)}>
                  <span className={`
                    w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${noDisp && !modoAdmin ? "text-gray-300 cursor-not-allowed line-through" : ""}
                    ${bloq && modoAdmin ? "bg-red-100 text-red-600 font-semibold" : ""}
                    ${ocup && !modoAdmin ? "bg-gray-100 text-gray-300" : ""}
                    ${esIni || esFn ? "text-white font-bold" : ""}
                    ${!noDisp && !esIni && !esFn ? "hover:bg-gray-100" : ""}
                    ${esHoy && !esIni && !esFn ? "border-2 font-bold" : ""}
                  `}
                  style={{
                    backgroundColor: esIni || esFn ? color : undefined,
                    borderColor: esHoy && !esIni && !esFn ? color : undefined,
                    color: esIni || esFn ? "white" : undefined,
                  }}>
                    {dia}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {!modoAdmin && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-200" /> No disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} /> Seleccionado
                </span>
                {inicio && fin && (
                  <span className="flex items-center gap-1.5 font-semibold ml-auto" style={{ color }}>
                    {noches} noche{noches !== 1 ? "s" : ""}
                  </span>
                )}
              </>
            )}
            {modoAdmin && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-200" /> Bloqueado por ti
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-200" /> Reservado
                </span>
              </>
            )}
          </div>

          {/* Botón guardar (solo admin) */}
          {modoAdmin && (
            <button onClick={guardarDisponibilidad} disabled={saving}
              className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: color }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Guardando..." : "Guardar disponibilidad"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarioDisponibilidad;