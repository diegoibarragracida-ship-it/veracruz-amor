import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { 
  LayoutDashboard, MapPin, Camera, Calendar, Users, LogOut, 
  Save, Eye, Loader2, Plus, Trash2, Upload, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const EncargadoDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [municipio, setMunicipio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMunicipio = async () => {
      if (!user?.municipio_id) {
        setLoading(false);
        return;
      }
      try {
        // Find municipio by ID
        const response = await axios.get(`${API}/municipios`);
        const found = response.data.municipios?.find(m => m.id === user.municipio_id);
        if (found) {
          setMunicipio(found);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMunicipio();
  }, [user?.municipio_id]);

  const handleSave = async (publish = false) => {
    if (!municipio) return;
    setSaving(true);
    try {
      const updateData = {
        descripcion: municipio.descripcion,
        historia: municipio.historia,
        que_hacer: municipio.que_hacer,
        como_llegar: municipio.como_llegar,
        clima: municipio.clima,
        altitud: municipio.altitud,
        tags: municipio.tags,
        estado: publish ? "publicado" : "borrador",
      };
      
      await axios.put(`${API}/municipios/${municipio.slug}`, updateData);
      toast.success(publish ? "Municipio publicado" : "Borrador guardado");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" />
      </div>
    );
  }

  if (!municipio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8" data-testid="encargado-no-municipio">
        <MapPin className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin municipio asignado</h1>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Tu cuenta no tiene un municipio asignado. Contacta al Super Administrador.
        </p>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    );
  }

  const allTags = ["Pueblo Mágico", "Playa", "Sierra", "Ciudad", "Gastronomía", "Naturaleza", "Cultura", "Aventura"];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="encargado-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1B5E20] rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{municipio.nombre}</h1>
              <p className="text-xs text-gray-500">Panel de Encargado Municipal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to={`/municipio/${municipio.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Ver público
              </Button>
            </Link>
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar borrador
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]" size="sm">
              Publicar
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="info" className="rounded-lg">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-lg">
              <Camera className="w-4 h-4 mr-2" />
              Galería
            </TabsTrigger>
            <TabsTrigger value="eventos" className="rounded-lg">
              <Calendar className="w-4 h-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="prestadores" className="rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Prestadores
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Descripción Turística</h2>
                  <Textarea
                    value={municipio.descripcion || ""}
                    onChange={(e) => setMunicipio({ ...municipio, descripcion: e.target.value })}
                    placeholder="Describe los atractivos turísticos de tu municipio..."
                    rows={6}
                  />
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Historia</h2>
                  <Textarea
                    value={municipio.historia || ""}
                    onChange={(e) => setMunicipio({ ...municipio, historia: e.target.value })}
                    placeholder="Breve historia del municipio..."
                    rows={4}
                  />
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Qué hacer aquí</h2>
                  <div className="space-y-2">
                    {(municipio.que_hacer || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updated = [...municipio.que_hacer];
                            updated[index] = e.target.value;
                            setMunicipio({ ...municipio, que_hacer: updated });
                          }}
                          placeholder="Actividad..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = municipio.que_hacer.filter((_, i) => i !== index);
                            setMunicipio({ ...municipio, que_hacer: updated });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMunicipio({ ...municipio, que_hacer: [...(municipio.que_hacer || []), ""] })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar actividad
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Cómo llegar</h2>
                  <Textarea
                    value={municipio.como_llegar || ""}
                    onChange={(e) => setMunicipio({ ...municipio, como_llegar: e.target.value })}
                    placeholder="Indicaciones para llegar..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Información básica</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Clima</Label>
                      <Input
                        value={municipio.clima || ""}
                        onChange={(e) => setMunicipio({ ...municipio, clima: e.target.value })}
                        placeholder="Ej: Templado húmedo"
                      />
                    </div>
                    <div>
                      <Label>Altitud</Label>
                      <Input
                        value={municipio.altitud || ""}
                        onChange={(e) => setMunicipio({ ...municipio, altitud: e.target.value })}
                        placeholder="Ej: 1,427 msnm"
                      />
                    </div>
                    <div>
                      <Label>Región</Label>
                      <Input value={municipio.region} disabled />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          const currentTags = municipio.tags || [];
                          if (currentTags.includes(tag)) {
                            setMunicipio({ ...municipio, tags: currentTags.filter(t => t !== tag) });
                          } else {
                            setMunicipio({ ...municipio, tags: [...currentTags, tag] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          (municipio.tags || []).includes(tag)
                            ? "bg-[#1B5E20] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Estado</h2>
                  <div className={`px-4 py-3 rounded-lg ${
                    municipio.estado === "publicado" 
                      ? "bg-green-100 text-green-800" 
                      : municipio.estado === "borrador"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {municipio.estado === "publicado" ? "✓ Publicado" : 
                     municipio.estado === "borrador" ? "📝 Borrador" : 
                     "⚪ Sin configurar"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Galería Tab */}
          <TabsContent value="galeria">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Galería de Fotos</h2>
                <Button className="bg-[#1B5E20] hover:bg-[#145218]">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir fotos
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">Arrastra fotos aquí o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400">Máximo 20 fotos, 5MB cada una. JPG, PNG, WebP</p>
              </div>
              
              {(municipio.fotos || []).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {municipio.fotos.map((foto, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                      <img src={foto.url || foto} alt="" className="w-full h-full object-cover" />
                      <button className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Eventos Tab */}
          <TabsContent value="eventos">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Eventos de {municipio.nombre}</h2>
                <Button className="bg-[#1B5E20] hover:bg-[#145218]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo evento
                </Button>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay eventos creados</p>
                <p className="text-sm text-gray-400 mt-1">Crea eventos para promocionar tu municipio</p>
              </div>
            </div>
          </TabsContent>

          {/* Prestadores Tab */}
          <TabsContent value="prestadores">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Proponer Prestador</h2>
                <Button className="bg-[#1B5E20] hover:bg-[#145218]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva propuesta
                </Button>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No has propuesto prestadores</p>
                <p className="text-sm text-gray-400 mt-1">Propón prestadores de servicios de tu zona</p>
              </div>
            </div>
          </TabsContent>

          {/* Estadísticas Tab */}
          <TabsContent value="estadisticas">
            <AnalyticsDashboard municipioId={municipio.id} isGlobal={false} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EncargadoDashboard;
