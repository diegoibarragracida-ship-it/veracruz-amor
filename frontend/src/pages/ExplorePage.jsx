import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MunicipioCard from "@/components/MunicipioCard";
import PanicButton from "@/components/PanicButton";
import { MapPin, Filter, Grid, Map, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  
  const filter = searchParams.get("filter") || "";
  const region = searchParams.get("region") || "";

  const regions = ["Norte", "Centro", "Sur"];

  useEffect(() => {
    const fetchMunicipios = async () => {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (filter === "pueblo_magico") {
          params.pueblo_magico = true;
        }
        if (region) {
          params.region = region;
        }
        
        const response = await axios.get(`${API}/municipios`, { params });
        setMunicipios(response.data.municipios || []);
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error("Error fetching municipios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipios();
  }, [filter, region]);

  const handleFilterChange = (newFilter) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter) {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }
    setSearchParams(params);
  };

  const handleRegionChange = (newRegion) => {
    const params = new URLSearchParams(searchParams);
    if (newRegion && newRegion !== "all") {
      params.set("region", newRegion);
    } else {
      params.delete("region");
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="explore-page">
      <Header />
      
      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Explora Veracruz
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Descubre los 232 municipios del estado más diverso de México. 
            Desde playas tropicales hasta montañas cubiertas de niebla.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 md:top-20 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Pueblo Mágico Filter */}
              <Button
                variant={filter === "pueblo_magico" ? "default" : "outline"}
                onClick={() => handleFilterChange(filter === "pueblo_magico" ? "" : "pueblo_magico")}
                className={filter === "pueblo_magico" ? "bg-[#F9A825] hover:bg-[#F57F17] text-white" : ""}
                data-testid="filter-pueblo-magico"
              >
                <Star className="w-4 h-4 mr-2" />
                Pueblos Mágicos
              </Button>
              
              {/* Region Filter */}
              <Select value={region || "all"} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-[160px]" data-testid="filter-region">
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las regiones</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{total} municipios</span>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={viewMode === "grid" ? "bg-gray-100" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={viewMode === "map" ? "bg-gray-100" : ""}
                  onClick={() => setViewMode("map")}
                >
                  <Map className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {municipios.map((m) => (
                <MunicipioCard key={m.id} municipio={m} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="h-[600px] flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Mapa interactivo</p>
                  <p className="text-sm text-gray-400 mt-2">Próximamente con Google Maps API</p>
                </div>
              </div>
            </div>
          )}
          
          {municipios.length === 0 && !loading && (
            <div className="text-center py-20">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No se encontraron municipios</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchParams({});
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default ExplorePage;
