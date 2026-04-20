import { useState, useEffect } from "react";
import { MapPin, Wind, Droplets, Eye, RefreshCw, Thermometer } from "lucide-react";

const WMO = {
  0:  { desc: "Despejado",            emoji: "☀️", bg: "from-amber-400 via-orange-400 to-yellow-500" },
  1:  { desc: "Mayormente despejado", emoji: "🌤️", bg: "from-sky-400 via-blue-400 to-cyan-500" },
  2:  { desc: "Parcialmente nublado", emoji: "⛅",  bg: "from-slate-400 via-sky-500 to-blue-500" },
  3:  { desc: "Nublado",              emoji: "☁️",  bg: "from-slate-500 via-slate-600 to-gray-600" },
  45: { desc: "Niebla",               emoji: "🌫️", bg: "from-gray-400 via-slate-500 to-gray-600" },
  51: { desc: "Llovizna",             emoji: "🌦️", bg: "from-blue-500 via-cyan-600 to-teal-600" },
  61: { desc: "Lluvia",               emoji: "🌧️", bg: "from-blue-700 via-indigo-700 to-blue-800" },
  80: { desc: "Chubascos",            emoji: "⛈️", bg: "from-indigo-700 via-purple-700 to-slate-800" },
  95: { desc: "Tormenta",             emoji: "⛈️", bg: "from-gray-800 via-slate-800 to-zinc-900" },
};
const getWMO = (c) => WMO[c] || WMO[1];
const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const WidgetClima = ({ lat, lng, ciudad }) => {
  const [clima,   setClima]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [loc,     setLoc]     = useState({ lat, lng, ciudad: ciudad || "Veracruz" });
  const [tab,     setTab]     = useState("hoy");

  const fetchClima = async (lt, lg) => {
    setLoading(true); setError(false);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lt}&longitude=${lg}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature,visibility` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=America%2FMexico_City&forecast_days=7`
      );
      setClima(await res.json());
    } catch { setError(true); }
    finally  { setLoading(false); }
  };

  useEffect(() => {
    if (lat && lng) { fetchClima(lat, lng); return; }
    navigator.geolocation?.getCurrentPosition(
      async (p) => {
        const lt = p.coords.latitude, lg = p.coords.longitude;
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lt}&lon=${lg}&format=json`);
          const d = await g.json();
          setLoc({ lat: lt, lng: lg, ciudad: d.address?.city || d.address?.town || "Tu ubicación" });
        } catch {}
        fetchClima(lt, lg);
      },
      () => { setLoc({ lat: 19.18, lng: -96.14, ciudad: "Veracruz" }); fetchClima(19.18, -96.14); }
    );
  }, [lat, lng]);

  const wmo = clima ? getWMO(clima.current.weathercode) : getWMO(1);

  return (
    <div className={`relative rounded-3xl overflow-hidden text-white shadow-2xl bg-gradient-to-br ${wmo.bg}`}
      style={{ minHeight: 280 }}>
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5" />{loc.ciudad}
        </div>
        <div className="flex bg-black/20 rounded-full p-0.5">
          {["hoy","semana"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[11px] px-3 py-1 rounded-full font-bold capitalize transition-all ${
                tab === t ? "bg-white text-gray-800 shadow-sm" : "text-white/70 hover:text-white"
              }`}>
              {t === "hoy" ? "Hoy" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="relative z-10 flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-xs">Obteniendo clima…</p>
        </div>
      ) : error ? (
        <div className="relative z-10 flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-4xl">🌡️</p>
          <p className="text-white/60 text-sm">Sin conexión</p>
          <button onClick={() => fetchClima(loc.lat, loc.lng)}
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white mt-1">
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      ) : tab === "hoy" ? (
        <div className="relative z-10 px-5 pb-4">
          <div className="flex items-end justify-between mt-2">
            <div>
              <div className="flex items-start">
                <span className="text-8xl font-black leading-none tracking-tighter">
                  {Math.round(clima.current.temperature_2m)}
                </span>
                <span className="text-3xl font-bold mt-3 text-white/80">°C</span>
              </div>
              <p className="text-white/90 font-bold text-base mt-1">{wmo.desc}</p>
              <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                Sensación {Math.round(clima.current.apparent_temperature)}°
              </p>
            </div>
            <div className="text-7xl drop-shadow-lg">{wmo.emoji}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: Droplets, val: `${clima.current.relative_humidity_2m}%`,         label: "Humedad" },
              { icon: Wind,     val: `${Math.round(clima.current.wind_speed_10m)}km/h`, label: "Viento"  },
              { icon: Eye,      val: `${Math.round((clima.current.visibility||10000)/1000)}km`, label: "Visión" },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-white/60" />
                <p className="text-sm font-black">{val}</p>
                <p className="text-white/50 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 px-4 pb-4 space-y-0.5">
          {clima.daily.time.map((fecha, i) => {
            const d = new Date(fecha + "T12:00:00");
            const w = getWMO(clima.daily.weathercode[i]);
            return (
              <div key={fecha} className="flex items-center gap-3 py-1.5 border-b border-white/10 last:border-0">
                <span className="text-white/60 text-xs w-7 font-semibold">{i === 0 ? "Hoy" : DIAS[d.getDay()]}</span>
                <span className="text-lg">{w.emoji}</span>
                <span className="text-white/50 text-xs flex-1">{w.desc}</span>
                {clima.daily.precipitation_probability_max[i] > 20 && (
                  <span className="text-blue-200 text-[10px] font-bold">{clima.daily.precipitation_probability_max[i]}%💧</span>
                )}
                <span className="text-xs font-black">{Math.round(clima.daily.temperature_2m_max[i])}°</span>
                <span className="text-white/40 text-xs">/{Math.round(clima.daily.temperature_2m_min[i])}°</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative z-10 px-5 pb-3 flex items-center justify-between">
        <p className="text-white/25 text-[10px]">Open-Meteo · sin costo</p>
        <button onClick={() => fetchClima(loc.lat, loc.lng)} className="text-white/30 hover:text-white/70 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default WidgetClima;