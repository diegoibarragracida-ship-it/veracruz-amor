import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrestadorCard from "@/components/PrestadorCard";
import PanicButton from "@/components/PanicButton";
import { Users, Filter, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PrestadoresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prestadores, setPrestadores] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const tipo = searchParams.get("tipo") || "";
  const municipioId = searchParams.get("municipio") || "";

  const tipos = [
    { value: "HOSPEDAJE", label: "Hospedaje" },
    { value: "GASTRONOMÍA", label: "Gastronomía" },
    { value: "TRANSPORTE", label: "Transporte" },
    { value: "TURISMO", label: "Turismo" },
    { value: "ENTREGA", label: "Entrega" },
    { value: "OTROS", label: "Otros" },
  ];

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const response = await axios.get(`${API}/municipios`, { params: { limit: 300 } });
        setMunicipios(response.data.municipios || []);
      } catch (error) {
        console.error("Error fetching municipios:", error);
      }
    };
    fetchMunicipios();
  }, []);

  useEffect(() => {
    const fetchPrestadores = async () => {
      setLoading(true);
      try {
        const params = { verificado: true };
        if (tipo) params.tipo = tipo;
        if (municipioId) params.municipio_id = municipioId;
        if (searchQuery) params.search = searchQuery;
        
        const response = await axios.get(`${API}/prestadores`, { params });
        setPrestadores(response.data.prestadores || []);
      } catch (error) {
        console.error("Error fetching prestadores:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPrestadores, 300);
    return () => clearTimeout(debounce);
  }, [tipo, municipioId, searchQuery]);

  const handleTipoChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("tipo", value);
    } else {
      params.delete("tipo");
    }
    setSearchParams(params);
  };

  const handleMunicipioChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("municipio", value);
    } else {
      params.delete("municipio");
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="prestadores-page">
      <Header />
      
      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#F9A825] to-[#F57F17]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Prestadores de Servicios
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Encuentra servicios turísticos verificados: hoteles, restaurantes, guías y transporte.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 md:top-20 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar prestador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-prestadores"
              />
            </div>
            
            {/* Tipo Filter */}
            <Select value={tipo || "all"} onValueChange={handleTipoChange}>
              <SelectTrigger className="w-[180px]" data-testid="filter-tipo">
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tipos.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Municipio Filter */}
            <Select value={municipioId || "all"} onValueChange={handleMunicipioChange}>
              <SelectTrigger className="w-[200px]" data-testid="filter-municipio">
                <SelectValue placeholder="Municipio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los municipios</SelectItem>
                {municipios.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#F9A825]" />
            </div>
          ) : prestadores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {prestadores.map((p) => (
                <PrestadorCard key={p.id} prestador={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No se encontraron prestadores</p>
              <p className="text-sm text-gray-400 mt-2">Intenta con otros filtros</p>
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
