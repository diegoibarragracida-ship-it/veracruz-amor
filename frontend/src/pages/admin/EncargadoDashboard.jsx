import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { 
  LayoutDashboard, MapPin, Camera, Calendar, Users, LogOut, 
  Save, Eye, Loader2, Plus, Trash2, Upload, BarChart3,
  Phone, Clock, Star, X, ChevronDown, Building2, UtensilsCrossed,
  Compass, Car, Zap, ShoppingBag, Music, Waves, TreePine, 
  Stethoscope, GraduationCap, Wrench, Coffee, Hotel, Bike,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

// ─── Catálogo completo de tipos de prestadores ───────────────────────────────
const TIPOS_PRESTADOR = [
  {
    grupo: "🏨 Hospedaje",
    tipo: "hospedaje",
    icon: Hotel,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    subtipos: ["Hotel", "Hostal", "Cabaña", "B&B", "Casa de huéspedes", "Glamping", "Hacienda", "Villa", "Departamento turístico", "Camping"],
  },
  {
    grupo: "🍽️ Gastronomía",
    tipo: "restaurante",
    icon: UtensilsCrossed,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    subtipos: ["Restaurante", "Marisquería", "Taquería", "Cafetería", "Panadería", "Heladería", "Bar & Grill", "Fonda", "Lonchería", "Food truck", "Mezcalería", "Coctelería"],
  },
  {
    grupo: "🧭 Guías Turísticos",
    tipo: "guia",
    icon: Compass,
    color: "bg-green-50 border-green-200 text-green-700",
    subtipos: ["Guía de naturaleza", "Guía histórico-cultural", "Guía de aventura", "Guía gastronómico", "Guía bilingüe", "Guía certificado SECTUR", "Guía de fotografía"],
  },
  {
    grupo: "🚗 Transporte",
    tipo: "transporte",
    icon: Car,
    color: "bg-slate-50 border-slate-200 text-slate-700",
    subtipos: ["Taxi turístico", "Renta de autos", "Transfer aeropuerto", "Autobús turístico", "Lancha / bote", "Moto-taxi", "Renta de bicicletas", "Renta de ATVs", "Servicio de chofer"],
  },
  {
    grupo: "⚡ Actividades & Tours",
    tipo: "actividad",
    icon: Zap,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    subtipos: ["Tour de café", "Tour de aventura", "Rapel / tirolesa", "Kayak / rafting", "Senderismo", "Pesca deportiva", "Avistamiento de aves", "Tour en bicicleta", "Parapente", "Buceo / snorkel", "Tour nocturno", "Taller artesanal"],
  },
  {
    grupo: "🏪 Comercio Turístico",
    tipo: "comercio",
    icon: ShoppingBag,
    color: "bg-pink-50 border-pink-200 text-pink-700",
    subtipos: ["Artesanías", "Joyería regional", "Textiles", "Galería de arte", "Tienda de productos locales", "Mercado de productores", "Bodega de café / cacao", "Tienda de mezcal / licores"],
  },
  {
    grupo: "🎭 Cultura & Entretenimiento",
    tipo: "cultura",
    icon: Music,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    subtipos: ["Museo", "Galería", "Teatro", "Centro cultural", "Zona arqueológica", "Hacienda histórica", "Festival / evento recurrente", "Espectáculo de danza", "Mariachi / son jarocho"],
  },
  {
    grupo: "🏖️ Playa & Agua",
    tipo: "playa",
    icon: Waves,
    color: "bg-cyan-50 border-cyan-200 text-cyan-700",
    subtipos: ["Club de playa", "Renta de equipo acuático", "Buceo", "Surf / kitesurf", "Pesca deportiva costera", "Paseo en lancha", "Restaurante de playa"],
  },
  {
    grupo: "🌿 Ecoturismo & Naturaleza",
    tipo: "ecoturismo",
    icon: TreePine,
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    subtipos: ["Reserva natural privada", "Jardín botánico", "Criadero de fauna", "Granja agroturística", "Rancho ecoturístico", "Centro de educación ambiental", "Observatorio astronómico"],
  },
  {
    grupo: "💆 Bienestar & Salud",
    tipo: "bienestar",
    icon: Stethoscope,
    color: "bg-rose-50 border-rose-200 text-rose-700",
    subtipos: ["Spa & masajes", "Temazcal", "Retiro de yoga", "Meditación", "Medicina tradicional", "Termas / aguas termales", "Centro holístico"],
  },
  {
    grupo: "📚 Educación & Talleres",
    tipo: "educacion",
    icon: GraduationCap,
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    subtipos: ["Taller de cocina", "Taller de cerámica", "Clases de salsa / danza", "Taller de fotografía", "Curso de idiomas", "Escuela de surf", "Taller de chocolate / café"],
  },
  {
    grupo: "🔧 Servicios de Apoyo",
    tipo: "servicio",
    icon: Wrench,
    color: "bg-gray-50 border-gray-200 text-gray-700",
    subtipos: ["Agencia de viajes local", "Casa de cambio", "Renta de equipo outdoor", "Lavandería turística", "Farmacia", "Clínica / urgencias", "Internet / coworking"],
  },
];

const EncargadoDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [municipio, setMunicipio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMunicipio = async () => {
      if (!user?.municipio_id) { setLoading(false); return; }
      try {
        const response = await axios.get(`${API}/municipios`);
        const found = response.data.municipios?.find(m => m.id === user.municipio_id);
        if (found) setMunicipio(found);
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
      await axios.put(`${API}/municipios/${municipio.slug}`, {
        descripcion: municipio.descripcion,
        historia: municipio.historia,
        que_hacer: municipio.que_hacer,
        como_llegar: municipio.como_llegar,
        clima: municipio.clima,
        altitud: municipio.altitud,
        tags: municipio.tags,
        estado: publish ? "publicado" : "borrador",
      });
      toast.success(publish ? "Municipio publicado" : "Borrador guardado");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" />
    </div>
  );

  if (!municipio) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8" data-testid="encargado-no-municipio">
      <MapPin className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin municipio asignado</h1>
      <p className="text-gray-500 text-center max-w-md mb-6">Tu cuenta no tiene un municipio asignado. Contacta al Super Administrador.</p>
      <Button onClick={handleLogout} variant="outline"><LogOut className="w-4 h-4 mr-2" />Cerrar sesión</Button>
    </div>
  );

  const allTags = ["Pueblo Mágico", "Playa", "Sierra", "Ciudad", "Gastronomía", "Naturaleza", "Cultura", "Aventura"];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="encargado-dashboard">
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
              <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" />Ver público</Button>
            </Link>
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar borrador
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]" size="sm">Publicar</Button>
            <Button onClick={handleLogout} variant="ghost" size="sm"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="info" className="rounded-lg"><LayoutDashboard className="w-4 h-4 mr-2" />Información</TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-lg"><Camera className="w-4 h-4 mr-2" />Galería</TabsTrigger>
            <TabsTrigger value="eventos" className="rounded-lg"><Calendar className="w-4 h-4 mr-2" />Eventos</TabsTrigger>
            <TabsTrigger value="prestadores" className="rounded-lg"><Users className="w-4 h-4 mr-2" />Prestadores</TabsTrigger>
            <TabsTrigger value="estadisticas" className="rounded-lg"><BarChart3 className="w-4 h-4 mr-2" />Estadísticas</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Descripción Turística</h2>
                  <Textarea value={municipio.descripcion || ""} onChange={(e) => setMunicipio({ ...municipio, descripcion: e.target.value })} placeholder="Describe los atractivos turísticos de tu municipio..." rows={6} />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Historia</h2>
                  <Textarea value={municipio.historia || ""} onChange={(e) => setMunicipio({ ...municipio, historia: e.target.value })} placeholder="Breve historia del municipio..." rows={4} />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Qué hacer aquí</h2>
                  <div className="space-y-2">
                    {(municipio.que_hacer || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={item} onChange={(e) => { const u = [...municipio.que_hacer]; u[index] = e.target.value; setMunicipio({ ...municipio, que_hacer: u }); }} placeholder="Actividad..." />
                        <Button variant="ghost" size="icon" onClick={() => setMunicipio({ ...municipio, que_hacer: municipio.que_hacer.filter((_, i) => i !== index) })}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setMunicipio({ ...municipio, que_hacer: [...(municipio.que_hacer || []), ""] })}>
                      <Plus className="w-4 h-4 mr-2" />Agregar actividad
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Cómo llegar</h2>
                  <Textarea value={municipio.como_llegar || ""} onChange={(e) => setMunicipio({ ...municipio, como_llegar: e.target.value })} placeholder="Indicaciones para llegar..." rows={3} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Información básica</h2>
                  <div className="space-y-4">
                    <div><Label>Clima</Label><Input value={municipio.clima || ""} onChange={(e) => setMunicipio({ ...municipio, clima: e.target.value })} placeholder="Ej: Templado húmedo" /></div>
                    <div><Label>Altitud</Label><Input value={municipio.altitud || ""} onChange={(e) => setMunicipio({ ...municipio, altitud: e.target.value })} placeholder="Ej: 1,427 msnm" /></div>
                    <div><Label>Región</Label><Input value={municipio.region} disabled /></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button key={tag} onClick={() => {
                        const current = municipio.tags || [];
                        setMunicipio({ ...municipio, tags: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag] });
                      }} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${(municipio.tags || []).includes(tag) ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Estado</h2>
                  <div className={`px-4 py-3 rounded-lg ${municipio.estado === "publicado" ? "bg-green-100 text-green-800" : municipio.estado === "borrador" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                    {municipio.estado === "publicado" ? "✓ Publicado" : municipio.estado === "borrador" ? "📝 Borrador" : "⚪ Sin configurar"}
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
                <Button className="bg-[#1B5E20] hover:bg-[#145218]"><Upload className="w-4 h-4 mr-2" />Subir fotos</Button>
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
                <Button className="bg-[#1B5E20] hover:bg-[#145218]"><Plus className="w-4 h-4 mr-2" />Nuevo evento</Button>
              </div>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay eventos creados</p>
                <p className="text-sm text-gray-400 mt-1">Crea eventos para promocionar tu municipio</p>
              </div>
            </div>
          </TabsContent>

          {/* ── PRESTADORES TAB ─────────────────────────────────────── */}
          <TabsContent value="prestadores">
            <PrestadoresTab municipioId={municipio.id} municipioNombre={municipio.nombre} />
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

// ─── PrestadoresTab ───────────────────────────────────────────────────────────
const PrestadoresTab = ({ municipioId, municipioNombre }) => {
  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [form, setForm] = useState({
    nombre: "", tipo: "", subtipo: "", descripcion: "",
    telefono: "", whatsapp: "", horarios: "", direccion: "",
    foto_url: "", lat: "", lng: "",
  });

  useEffect(() => {
    fetchPrestadores();
  }, [municipioId]);

  const fetchPrestadores = async () => {
    try {
      const res = await axios.get(`${API}/prestadores`, { params: { municipio_id: municipioId, limit: 100 } });
      setPrestadores(res.data.prestadores || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (id, verificar) => {
    try {
      const endpoint = verificar ? "verificar" : "desverificar";
      await axios.post(`${API}/prestadores/${id}/${endpoint}`);
      setPrestadores(prev => prev.map(p => p.id === id ? { ...p, verificado: verificar } : p));
      toast.success(verificar ? "✅ Prestador verificado — ya aparece en la página pública" : "Prestador desverificado");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo) { toast.error("Nombre y tipo son obligatorios"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/prestadores`, {
        ...form,
        municipio_id: municipioId,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      });
      toast.success("Prestador agregado exitosamente");
      setShowDialog(false);
      setForm({ nombre: "", tipo: "", subtipo: "", descripcion: "", telefono: "", whatsapp: "", horarios: "", direccion: "", foto_url: "", lat: "", lng: "" });
      fetchPrestadores();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este prestador?")) return;
    try {
      await axios.delete(`${API}/prestadores/${id}`);
      setPrestadores(prestadores.filter(p => p.id !== id));
      toast.success("Prestador eliminado");
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const tipoActual = TIPOS_PRESTADOR.find(t => t.tipo === form.tipo);
  const pendientes = prestadores.filter(p => !p.verificado);
  const verificados = prestadores.filter(p => p.verificado);
  const prestadoresFiltrados = (filtroTipo === "todos" ? verificados : verificados.filter(p => p.tipo === filtroTipo));
  const conteo = (tipo) => verificados.filter(p => p.tipo === tipo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prestadores de Servicios</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {municipioNombre} · <span className="text-green-600 font-medium">{verificados.length} verificados</span>
            {pendientes.length > 0 && <span className="text-amber-600 font-medium"> · {pendientes.length} pendientes</span>}
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#1B5E20] hover:bg-[#145218]">
          <Plus className="w-4 h-4 mr-2" />Agregar prestador
        </Button>
      </div>

      {/* Pendientes de verificación */}
      {pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-amber-800">Pendientes de verificación ({pendientes.length})</h3>
            <span className="text-xs text-amber-600">— Solo aparecen en la página pública al verificarlos</span>
          </div>
          <div className="space-y-3">
            {pendientes.map((p) => {
              const cat = TIPOS_PRESTADOR.find(t => t.tipo === p.tipo);
              return (
                <div key={p.id} className="bg-white rounded-lg p-4 flex items-center justify-between gap-4 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat?.grupo.split(" ")[0] || "🏢"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.subtipo || p.tipo} {p.telefono && `· ${p.telefono}`}</p>
                      {p.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => handleVerificar(p.id, true)}>
                      <Check className="w-3.5 h-3.5 mr-1" />Verificar
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" />Rechazar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorías resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <button
          onClick={() => setFiltroTipo("todos")}
          className={`p-3 rounded-xl border-2 text-left transition-all ${filtroTipo === "todos" ? "border-[#1B5E20] bg-[#1B5E20]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
        >
          <span className="text-xl">🗂️</span>
          <p className="text-xs font-semibold text-gray-700 mt-1">Todos</p>
          <p className="text-lg font-bold text-gray-900">{prestadores.length}</p>
        </button>
        {TIPOS_PRESTADOR.map((cat) => (
          <button
            key={cat.tipo}
            onClick={() => setFiltroTipo(cat.tipo)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${filtroTipo === cat.tipo ? "border-[#1B5E20] bg-[#1B5E20]/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <span className="text-xl">{cat.grupo.split(" ")[0]}</span>
            <p className="text-xs font-semibold text-gray-700 mt-1 truncate">{cat.grupo.slice(3)}</p>
            <p className="text-lg font-bold text-gray-900">{conteo(cat.tipo)}</p>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
      ) : prestadoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-200">
          <Users className="w-14 h-14 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">No hay prestadores en esta categoría</p>
          <p className="text-sm text-gray-400 mt-1">Haz clic en "Agregar prestador" para comenzar</p>
          <Button onClick={() => setShowDialog(true)} className="mt-4 bg-[#1B5E20] hover:bg-[#145218]" size="sm">
            <Plus className="w-4 h-4 mr-2" />Agregar primero
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prestadoresFiltrados.map((p) => {
            const cat = TIPOS_PRESTADOR.find(t => t.tipo === p.tipo);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nombre} className="w-full h-36 object-cover" />
                ) : (
                  <div className={`w-full h-36 flex items-center justify-center text-5xl ${cat?.color || "bg-gray-50"}`}>
                    {cat?.grupo.split(" ")[0] || "🏢"}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{p.nombre}</h3>
                      <span className="text-xs text-gray-500">{p.subtipo || p.tipo}</span>
                    </div>
                    {p.verificado && (
                      <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </span>
                    )}
                  </div>
                  {p.descripcion && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.descripcion}</p>}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {p.telefono && <span>📞 {p.telefono}</span>}
                    {p.calificacion_promedio > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{p.calificacion_promedio}</span>}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleVerificar(p.id, false)} title="Quitar verificación">
                      ✅ Verificado
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog agregar prestador */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Agregar Prestador de Servicio</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Selector de tipo visual */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Categoría del servicio *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIPOS_PRESTADOR.map((cat) => (
                  <button
                    key={cat.tipo}
                    type="button"
                    onClick={() => setForm({ ...form, tipo: cat.tipo, subtipo: "" })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.tipo === cat.tipo ? "border-[#1B5E20] bg-[#1B5E20]/5" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <span className="text-2xl">{cat.grupo.split(" ")[0]}</span>
                    <p className="text-xs font-medium text-gray-700 mt-1 leading-tight">{cat.grupo.slice(3)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtipo */}
            {form.tipo && (
              <div>
                <Label>Tipo específico *</Label>
                <Select value={form.subtipo} onValueChange={(v) => setForm({ ...form, subtipo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona el tipo exacto..." /></SelectTrigger>
                  <SelectContent>
                    {tipoActual?.subtipos.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Nombre */}
            <div>
              <Label>Nombre del negocio *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Hotel Paraíso Verde, Marisquería El Puerto..." />
            </div>

            {/* Descripción */}
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe brevemente el servicio, especialidad, propuesta de valor..." rows={3} />
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="272-123-4567" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="522721234567" />
              </div>
            </div>

            {/* Horarios y dirección */}
            <div>
              <Label>Horarios de atención</Label>
              <Input value={form.horarios} onChange={(e) => setForm({ ...form, horarios: e.target.value })} placeholder="Lun–Dom 9:00–20:00" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, colonia, referencias..." rows={2} />
            </div>

            {/* Foto y coordenadas */}
            <div>
              <Label>URL de foto principal</Label>
              <Input value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitud (opcional)</Label>
                <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="18.8534" />
              </div>
              <div>
                <Label>Longitud (opcional)</Label>
                <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="-97.1014" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Agregar prestador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EncargadoDashboard;