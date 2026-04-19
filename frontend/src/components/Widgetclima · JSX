import { useState, useEffect } from "react";
import { MapPin, Wind, Droplets, Eye, Thermometer, RefreshCw } from "lucide-react";

/* ── Códigos WMO → descripción + emoji ── */
const WMO = {
  0:  { desc: "Despejado",         emoji: "☀️" },
  1:  { desc: "Mayormente despejado", emoji: "🌤️" },
  2:  { desc: "Parcialmente nublado", emoji: "⛅" },
  3:  { desc: "Nublado",           emoji: "☁️" },
  45: { desc: "Niebla",            emoji: "🌫️" },
  48: { desc: "Niebla con escarcha",emoji: "🌫️" },
  51: { desc: "Llovizna ligera",   emoji: "🌦️" },
  53: { desc: "Llovizna",          emoji: "🌦️" },
  55: { desc: "Llovizna intensa",  emoji: "🌧️" },
  61: { desc: "Lluvia ligera",     emoji: "🌧️" },
  63: { desc: "Lluvia moderada",   emoji: "🌧️" },
  65: { desc: "Lluvia intensa",    emoji: "🌧️" },
  80: { desc: "Chubascos",         emoji: "🌦️" },
  81: { desc: "Chubascos moderados",emoji: "⛈️" },
  82: { desc: "Chubascos fuertes", emoji: "⛈️" },
  95: { desc: "Tormenta eléctrica",emoji: "⛈️" },
  99: { desc: "Tormenta con granizo",emoji: "⛈️" },
};

const getWMO = (code) => WMO[code] || { desc: "Variable", emoji: "🌡️" };

/* ── Días de la semana ── */
const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const WidgetClima = ({ lat, lng, ciudad = "Veracruz" }) => {
  const [clima,    setClima]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [ubicacion,setUbicacion]= useState({ lat, lng, ciudad });
  const [tab,      setTab]      = useState("hoy"); // "hoy" | "semana"

  const fetchClima = async (lt, lg) => {
    setLoading(true); setError(false);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lt}&longitude=${lg}`
        + `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature,visibility`
        + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
        + `&timezone=America%2FMexico_City&forecast_days=7`;
      const res  = await fetch(url);
      const data = await res.json();
      setClima(data);
    } catch { setError(true); }
    finally  { setLoading(false); }
  };

  useEffect(() => {
    if (lat && lng) {
      setUbicacion({ lat, lng, ciudad });
      fetchClima(lat, lng);
    } else {
      // Usar geolocalización del turista
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lt = pos.coords.latitude;
            const lg = pos.coords.longitude;
            // Geocoding inverso con Open-Meteo / nominatim
            try {
              const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lt}&lon=${lg}&format=json`);
              const geoData = await geo.json();
              const nombre = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Tu ubicación";
              setUbicacion({ lat: lt, lng: lg, ciudad: nombre });
            } catch {}
            fetchClima(lt, lg);
          },
          () => {
            // Fallback: Veracruz ciudad
            setUbicacion({ lat: 19.18, lng: -96.14, ciudad: "Veracruz" });
            fetchClima(19.18, -96.14);
          }
        );
      } else {
        setUbicacion({ lat: 19.18, lng: -96.14, ciudad: "Veracruz" });
        fetchClima(19.18, -96.14);
      }
    }
  }, [lat, lng, ciudad]);

  if (loading) return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-5 text-white h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-xs">Obteniendo clima...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl p-5 text-white h-48 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-2">🌡️</p>
        <p className="text-white/70 text-sm">No se pudo obtener el clima</p>
        <button onClick={() => fetchClima(ubicacion.lat, ubicacion.lng)}
          className="mt-3 flex items-center gap-1 text-xs text-white/60 hover:text-white mx-auto">
          <RefreshCw className="w-3 h-3" /> Reintentar
        </button>
      </div>
    </div>
  );

  const cur    = clima.current;
  const daily  = clima.daily;
  const wmo    = getWMO(cur.weathercode);
  const temp   = Math.round(cur.temperature_2m);
  const sensacion = Math.round(cur.apparent_temperature);
  const humedad   = cur.relative_humidity_2m;
  const viento    = Math.round(cur.wind_speed_10m);

  // Gradiente según temperatura
  const gradient = temp >= 30
    ? "from-orange-500 via-red-500 to-pink-600"
    : temp >= 22
    ? "from-blue-500 via-cyan-500 to-teal-500"
    : temp >= 15
    ? "from-blue-600 via-blue-700 to-indigo-700"
    : "from-indigo-700 via-blue-800 to-slate-800";

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl overflow-hidden text-white shadow-2xl`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {ubicacion.ciudad}
          </div>
          <div className="flex gap-1">
            {["hoy","semana"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize transition-all ${
                  tab === t ? "bg-white/25 text-white" : "text-white/50 hover:text-white/80"
                }`}>
                {t === "hoy" ? "Hoy" : "Semana"}
              </button>
            ))}
          </div>
        </div>

        {tab === "hoy" ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-7xl font-black leading-none">{temp}°</p>
                <p className="text-white/70 text-sm mt-1">{wmo.desc}</p>
                <p className="text-white/50 text-xs mt-0.5">Sensación {sensacion}°</p>
              </div>
              <div className="text-6xl">{wmo.emoji}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4 bg-black/10 rounded-2xl p-3">
              <div className="flex flex-col items-center gap-1 text-center">
                <Droplets className="w-4 h-4 text-white/60" />
                <p className="text-sm font-bold">{humedad}%</p>
                <p className="text-white/50 text-[10px]">Humedad</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center border-x border-white/10">
                <Wind className="w-4 h-4 text-white/60" />
                <p className="text-sm font-bold">{viento} km/h</p>
                <p className="text-white/50 text-[10px]">Viento</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Eye className="w-4 h-4 text-white/60" />
                <p className="text-sm font-bold">{Math.round((cur.visibility || 10000) / 1000)} km</p>
                <p className="text-white/50 text-[10px]">Visibilidad</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            {daily.time.map((fecha, i) => {
              const d   = new Date(fecha + "T12:00:00");
              const dia = i === 0 ? "Hoy" : DIAS[d.getDay()];
              const w   = getWMO(daily.weathercode[i]);
              return (
                <div key={fecha} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-white/70 text-xs w-8">{dia}</span>
                  <span className="text-lg">{w.emoji}</span>
                  <span className="text-white/50 text-xs flex-1 ml-2 hidden sm:block">{w.desc}</span>
                  <div className="flex items-center gap-1">
                    {daily.precipitation_probability_max[i] > 20 && (
                      <span className="text-blue-300 text-[10px] font-semibold">{daily.precipitation_probability_max[i]}%💧</span>
                    )}
                    <span className="text-xs font-bold">{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="text-white/40 text-xs">/{Math.round(daily.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 pb-3 flex items-center justify-between">
        <p className="text-white/30 text-[10px]">Open-Meteo · actualizado ahora</p>
        <button onClick={() => fetchClima(ubicacion.lat, ubicacion.lng)}
          className="text-white/40 hover:text-white/70 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default WidgetClima;