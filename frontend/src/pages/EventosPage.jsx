import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventoCard from "@/components/EventoCard";
import PanicButton from "@/components/PanicButton";
import { Calendar as CalendarIcon, Grid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

const EventosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [eventos, setEventos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDate, setSelectedDate] = useState(null);
  
  const tipo = searchParams.get("tipo") || "";
  const municipioId = searchParams.get("municipio") || "";

  const tipos = ["Cultural", "Gastronómico", "Deportivo", "Musical", "Religioso", "Feria"];

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
    const fetchEventos = async () => {
      setLoading(true);
      try {
        const params = { publicado: true };
        if (tipo) params.tipo = tipo;
        if (municipioId) params.municipio_id = municipioId;
        
        const response = await axios.get(`${API}/eventos`, { params });
        setEventos(response.data.eventos || []);
      } catch (error) {
        console.error("Error fetching eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [tipo, municipioId]);

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

  const getMunicipioNombre = (municipioId) => {
    const municipio = municipios.find(m => m.id === municipioId);
    return municipio?.nombre || "";
  };

  // Get event dates for calendar highlighting
  const eventDates = eventos.map(e => new Date(e.fecha_inicio));

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="eventos-page">
      <Header />
      
      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#0277BD] to-[#01579B]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Eventos y Festividades
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Carnavales, ferias, festivales gastronómicos y culturales. 
            Descubre la agenda completa de Veracruz.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 md:top-20 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tipo Filter */}
              <Select value={tipo || "all"} onValueChange={handleTipoChange}>
                <SelectTrigger className="w-[180px]" data-testid="filter-tipo">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
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
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{eventos.length} eventos</span>
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
                  className={viewMode === "calendar" ? "bg-gray-100" : ""}
                  onClick={() => setViewMode("calendar")}
                >
                  <CalendarIcon className="w-4 h-4" />
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
              <Loader2 className="w-8 h-8 animate-spin text-[#0277BD]" />
            </div>
          ) : viewMode === "grid" ? (
            eventos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventos.map((evento) => (
                  <EventoCard 
                    key={evento.id} 
                    evento={evento} 
                    municipioNombre={getMunicipioNombre(evento.municipio_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No se encontraron eventos</p>
                <p className="text-sm text-gray-400 mt-2">Intenta con otros filtros</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    hasEvent: eventDates,
                  }}
                  modifiersStyles={{
                    hasEvent: { backgroundColor: '#0277BD20', color: '#0277BD', fontWeight: 'bold' }
                  }}
                  className="rounded-md"
                />
              </div>
              
              {/* Events List */}
              <div className="lg:col-span-2 space-y-4">
                {eventos.length > 0 ? (
                  eventos.map((evento) => (
                    <EventoCard 
                      key={evento.id} 
                      evento={evento}
                      municipioNombre={getMunicipioNombre(evento.municipio_id)}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No hay eventos programados</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default EventosPage;
