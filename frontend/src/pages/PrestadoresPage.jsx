import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrestadorCard from "@/components/PrestadorCard";
import PanicButton from "@/components/PanicButton";
import { Users, Loader2, Search, Star, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPOS = [
  { value: "hospedaje",   label: "🏨 Hospedaje" },
  { value: "gastronomia", label: "🍽️ Gastronomía" },
  { value: "guia",        label: "🧭 Guías" },
  { value: "transporte",  label: "🚗 Transporte" },
  { value: "actividad",   label: "⚡ Actividades" },
  { value: "comercio",    label: "🏪 Comercio" },
  { value: "ecoturismo",  label: "🌿 Ecoturismo" },
  { value: "bienestar",   label: "💆 Bienestar" },
  { value: "cultura",     label: "🎭 Cultura" },
];

const ORDENAR = [
  { value: "relevancia",   label: "Relevancia" },
  { value: "calificacion", label: "Mejor calificados" },
  { value: "precio_asc",   label: "Precio: menor a mayor" },
  { value: "precio_desc",  label: "Precio: mayor a menor" },
  { value: "nombre",       label: "Nombre A-Z" },
];

const PrestadoresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prestadores,  setPrestadores]  = useState([]);
  const [municipios,   setMunicipios]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [showFiltros,  setShowFiltros]  = useState(false);
  const [precioMin,    setPrecioMin]    = useState("");
  const [precioMax,    setPrecioMax]    = useState("");
  const [soloDestac,   setSoloDestac]   = useState(false);
  const [minRating,    setMinRating]    = useState(0);
  const [ordenar,      setOrdenar]      = useState("relevancia");

  const tipo       = searchParams.get("tipo")      || "";
  const municipioId= searchParams.get("municipio") || "";

  useEffect(() => {
    axios.get(`${API}/municipios`, { params: { limit: 300 } })
      .then(r => setMunicipios(r.data.municipios || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { verificado: true, limit: 200 };
        if (tipo)        params.tipo         = tipo;
        if (municipioId) params.municipio_id = municipioId;
        if (searchQuery) params.search       = searchQuery;
        const { data } = await axios.get(`${API}/prestadores`, { params });
        let lista = data.prestadores || [];

        // Filtros locales
        if (precioMin)   lista = lista.filter(p => !p.precio_min || p.precio_min >= parseFloat(precioMin));
        if (precioMax)   lista = lista.filter(p => !p.precio_max || p.precio_max <= parseFloat(precioMax));
        if (soloDestac)  lista = lista.filter(p => p.destacado);
        if (minRating>0) lista = lista.filter(p => (p.calificacion_promedio || 0) >= minRating);

        // Ordenar
        if (ordenar === "calificacion") lista.sort((a,b) => (b.calificacion_promedio||0)-(a.calificacion_promedio||0));
        else if (ordenar === "precio_asc")  lista.sort((a,b) => (a.precio_min||0)-(b.precio_min||0));
        else if (ordenar === "precio_desc") lista.sort((a,b) => (b.precio_min||0)-(a.precio_min||0));
        else if (ordenar === "nombre")      lista.sort((a,b) => a.nombre.localeCompare(b.nombre));

        setPrestadores(lista);
      } catch { setPrestadores([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [tipo, municipioId, searchQuery, precioMin, precioMax, soloDestac, minRating, ordenar]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value && value !== "all") p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };

  const filtrosActivos = [tipo, municipioId, precioMin, precioMax, soloDestac, minRating > 0].filter(Boolean).length;

  const limpiarFiltros = () => {
    setSearchParams({});
    setPrecioMin(""); setPrecioMax(""); setSoloDestac(false);
    setMinRating(0); setOrdenar("relevancia"); setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="prestadores-page">
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-10 px-4 bg-gradient-to-br from-[#F9A825] to-[#E65100]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3"
            style={{ fontFamily: "Playfair Display, serif" }}>
            Prestadores de Servicios
          </h1>
          <p className="text-white/90 text-base max-w-xl mx-auto">
            Hoteles, restaurantes, guías y actividades verificados en todo Veracruz
          </p>
        </div>
      </section>

      {/* Tipos rápidos */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 min-w-max">
          <button onClick={() => setParam("tipo", "")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${!tipo ? "bg-[#F9A825] text-white border-[#F9A825]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F9A825]"}`}>
            Todos
          </button>
          {TIPOS.map(t => (
            <button key={t.value} onClick={() => setParam("tipo", t.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${tipo === t.value ? "bg-[#F9A825] text-white border-[#F9A825]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F9A825]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar prestador..."
                className="pl-9 h-9 text-sm" />
            </div>

            {/* Municipio */}
            <Select value={municipioId || "all"} onValueChange={v => setParam("municipio", v)}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Municipio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {municipios.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Ordenar */}
            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDENAR.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Más filtros */}
            <button onClick={() => setShowFiltros(f => !f)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${showFiltros || filtrosActivos > 0 ? "bg-[#F9A825] text-white border-[#F9A825]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros {filtrosActivos > 0 && `(${filtrosActivos})`}
            </button>

            {filtrosActivos > 0 && (
              <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>

          {/* Panel filtros avanzados */}
          {showFiltros && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 items-end">
              {/* Precio */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Precio MXN:</span>
                <Input value={precioMin} onChange={e => setPrecioMin(e.target.value)}
                  placeholder="Mín" className="w-20 h-8 text-xs" type="number" />
                <span className="text-gray-300">—</span>
                <Input value={precioMax} onChange={e => setPrecioMax(e.target.value)}
                  placeholder="Máx" className="w-20 h-8 text-xs" type="number" />
              </div>

              {/* Calificación mínima */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Calificación:</span>
                <div className="flex gap-1">
                  {[0,3,4,4.5].map(r => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${minRating === r ? "bg-amber-400 text-white border-amber-400" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"}`}>
                      {r === 0 ? "Todos" : `${r}+ ⭐`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solo destacados */}
              <button onClick={() => setSoloDestac(d => !d)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${soloDestac ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
                🔥 Solo destacados
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Info */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              {loading ? "Buscando..." : `${prestadores.length} prestador${prestadores.length !== 1 ? "es" : ""} encontrado${prestadores.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#F9A825]" />
            </div>
          ) : prestadores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {prestadores.map(p => (
                <Link key={p.id} to={`/prestador/${p.id}`}
                  className="block transition-all duration-200 hover:-translate-y-1 hover:shadow-lg rounded-xl">
                  <PrestadorCard prestador={p} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 text-lg font-semibold">No se encontraron prestadores</p>
              <p className="text-sm text-gray-400 mt-1">Intenta con otros filtros</p>
              {filtrosActivos > 0 && (
                <button onClick={limpiarFiltros} className="mt-4 px-6 py-2.5 rounded-xl bg-[#F9A825] text-white text-sm font-bold hover:bg-[#F57F17]">
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default PrestadoresPage;