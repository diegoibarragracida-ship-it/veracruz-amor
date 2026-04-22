import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import {
  LayoutDashboard, MapPin, Camera, Calendar, Users, LogOut,
  Save, Eye, Loader2, Plus, Trash2, Upload, BarChart3,
  Phone, Clock, Star, X, Building2, UtensilsCrossed,
  Compass, Car, Zap, ShoppingBag, Music, Waves, TreePine,
  Stethoscope, GraduationCap, Wrench, Hotel, Check,
  Newspaper, Shield, Tag, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

// ─── Catálogo de tipos de prestadores ────────────────────────────────────────
const TIPOS_PRESTADOR = [
  { grupo: "🏨 Hospedaje", tipo: "hospedaje", icon: Hotel, color: "bg-blue-50 border-blue-200 text-blue-700", subtipos: ["Hotel","Hostal","Cabaña","B&B","Casa de huéspedes","Glamping","Hacienda","Villa","Departamento turístico","Camping"] },
  { grupo: "🍽️ Gastronomía", tipo: "gastronomia", icon: UtensilsCrossed, color: "bg-orange-50 border-orange-200 text-orange-700", subtipos: ["Restaurante","Marisquería","Taquería","Cafetería","Panadería","Heladería","Bar & Grill","Fonda","Lonchería","Food truck","Mezcalería","Coctelería"] },
  { grupo: "🧭 Guías Turísticos", tipo: "guia", icon: Compass, color: "bg-green-50 border-green-200 text-green-700", subtipos: ["Guía de naturaleza","Guía histórico-cultural","Guía de aventura","Guía gastronómico","Guía bilingüe","Guía certificado SECTUR"] },
  { grupo: "🚗 Transporte", tipo: "transporte", icon: Car, color: "bg-slate-50 border-slate-200 text-slate-700", subtipos: ["Taxi turístico","Renta de autos","Transfer aeropuerto","Autobús turístico","Lancha / bote","Renta de bicicletas","Renta de ATVs"] },
  { grupo: "⚡ Actividades & Tours", tipo: "actividad", icon: Zap, color: "bg-yellow-50 border-yellow-200 text-yellow-700", subtipos: ["Tour de café","Tour de aventura","Rapel / tirolesa","Kayak / rafting","Senderismo","Pesca deportiva","Avistamiento de aves","Parapente","Buceo / snorkel"] },
  { grupo: "🏪 Comercio Turístico", tipo: "comercio", icon: ShoppingBag, color: "bg-pink-50 border-pink-200 text-pink-700", subtipos: ["Artesanías","Joyería regional","Textiles","Galería de arte","Tienda de productos locales","Bodega de café / cacao"] },
  { grupo: "🎭 Cultura & Entretenimiento", tipo: "cultura", icon: Music, color: "bg-purple-50 border-purple-200 text-purple-700", subtipos: ["Museo","Galería","Teatro","Centro cultural","Zona arqueológica","Festival / evento recurrente"] },
  { grupo: "🌿 Ecoturismo", tipo: "ecoturismo", icon: TreePine, color: "bg-emerald-50 border-emerald-200 text-emerald-700", subtipos: ["Reserva natural","Jardín botánico","Granja agroturística","Rancho ecoturístico","Observatorio astronómico"] },
  { grupo: "💆 Bienestar & Salud", tipo: "bienestar", icon: Stethoscope, color: "bg-rose-50 border-rose-200 text-rose-700", subtipos: ["Spa & masajes","Temazcal","Retiro de yoga","Termas / aguas termales","Centro holístico"] },
  { grupo: "🔧 Servicios de Apoyo", tipo: "servicio", icon: Wrench, color: "bg-gray-50 border-gray-200 text-gray-700", subtipos: ["Agencia de viajes local","Casa de cambio","Renta de equipo outdoor","Lavandería turística","Farmacia","Clínica / urgencias"] },
];

const CATEGORIAS_EVENTO = ["Festival","Cultural","Deportivo","Concierto","Feria","Gastronómico","Religioso","Artesanal","Otro"];
const CATEGORIAS_ATRACCION = ["Natural","Cultural","Histórico","Familiar","Aventura","Gastronomía","Religioso","Arqueológico"];
const CATEGORIAS_NOTICIA = ["Aviso","Seguridad","Cultura","Obras","Turismo","Salud","Otro"];
const TIPOS_SERVICIO_MUNICIPAL = ["Hospital","Clínica","Policía","Protección Civil","Bomberos","Cruz Roja","Farmacia","Otro"];

// ─── Componentes base ─────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>{children}</div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    {action}
  </div>
);

const EmptyState = ({ icon: Icon, title, sub, onAdd, label }) => (
  <div className="text-center py-16 text-gray-400">
    <Icon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
    <p className="font-medium text-gray-500">{title}</p>
    <p className="text-sm mt-1">{sub}</p>
    {onAdd && <Button onClick={onAdd} className="mt-4 bg-[#1B5E20] hover:bg-[#145218]" size="sm"><Plus className="w-4 h-4 mr-2" />{label}</Button>}
  </div>
);

// ─── Upload helper ────────────────────────────────────────────────────────────
const uploadFile = async (file) => {
  const fd = new FormData(); fd.append("file", file);
  const { data } = await axios.post(`${API}/public/upload`, fd);
  return data.url;
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: EVENTOS
// ══════════════════════════════════════════════════════════════════════════════
const EventosTab = ({ municipioId, municipioNombre }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { nombre: "", descripcion: "", fecha_inicio: "", fecha_fin: "", lugar: "", tipo: "Festival", precio_min: 0, precio_max: 0, es_gratis: true, foto_url: "", publicado: false };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchEventos(); }, [municipioId]);

  const fetchEventos = async () => {
    try {
      const { data } = await axios.get(`${API}/eventos`, { params: { municipio_id: municipioId, limit: 100 } });
      setEventos(data.eventos || []);
    } finally { setLoading(false); }
  };

  const handleUploadFoto = async (file) => {
    setUploading(true);
    try { setForm(f => ({ ...f, foto_url: "" })); const url = await uploadFile(file); setForm(f => ({ ...f, foto_url: url })); }
    catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.fecha_inicio) return toast.error("Nombre y fecha requeridos");
    setSaving(true);
    try {
      const payload = { ...form, municipio_id: municipioId, precio_min: form.es_gratis ? 0 : parseFloat(form.precio_min || 0), precio_max: form.es_gratis ? 0 : parseFloat(form.precio_max || 0) };
      if (editId) await axios.put(`${API}/eventos/${editId}`, payload);
      else await axios.post(`${API}/eventos`, payload);
      toast.success(editId ? "Evento actualizado" : "Evento creado");
      setShowDialog(false); setForm(emptyForm); setEditId(null); fetchEventos();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este evento?")) return;
    await axios.delete(`${API}/eventos/${id}`);
    setEventos(prev => prev.filter(e => e.id !== id));
    toast.success("Evento eliminado");
  };

  const handlePublish = async (id, publicado) => {
    await axios.put(`${API}/eventos/${id}`, { publicado });
    setEventos(prev => prev.map(e => e.id === id ? { ...e, publicado } : e));
    toast.success(publicado ? "Evento publicado" : "Evento despublicado");
  };

  const hoy = new Date().toISOString().split("T")[0];
  const eventosHoy = eventos.filter(e => e.fecha_inicio === hoy || (e.fecha_inicio <= hoy && e.fecha_fin >= hoy));

  return (
    <div className="space-y-5">
      <SectionHeader
        title={`Eventos de ${municipioNombre}`}
        action={<Button onClick={() => { setForm(emptyForm); setEditId(null); setShowDialog(true); }} className="bg-[#1B5E20] hover:bg-[#145218]"><Plus className="w-4 h-4 mr-2" />Nuevo evento</Button>}
      />

      {eventosHoy.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-semibold text-green-800 mb-2">🎉 Eventos hoy ({eventosHoy.length})</p>
          {eventosHoy.map(e => <p key={e.id} className="text-sm text-green-700">• {e.nombre}</p>)}
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
        : eventos.length === 0 ? <EmptyState icon={Calendar} title="No hay eventos" sub="Crea eventos para promocionar tu municipio" onAdd={() => setShowDialog(true)} label="Crear primer evento" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos.map(e => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {e.foto_url ? <img src={e.foto_url} alt={e.nombre} className="w-full h-40 object-cover" />
                  : <div className="w-full h-40 bg-gradient-to-br from-[#1B5E20]/10 to-[#1B5E20]/5 flex items-center justify-center text-5xl">🎉</div>}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{e.nombre}</h3>
                      <Badge className={e.publicado ? "bg-green-100 text-green-800 text-xs mt-1" : "bg-gray-100 text-gray-600 text-xs mt-1"}>{e.publicado ? "Publicado" : "Borrador"}</Badge>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">{e.tipo}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">📅 {e.fecha_inicio}{e.fecha_fin && e.fecha_fin !== e.fecha_inicio ? ` → ${e.fecha_fin}` : ""}</p>
                  {e.lugar && <p className="text-xs text-gray-500 mb-2">📍 {e.lugar}</p>}
                  <p className="text-xs font-medium text-[#1B5E20]">{e.es_gratis ? "🆓 Gratis" : `$${e.precio_min}${e.precio_max > e.precio_min ? ` – $${e.precio_max}` : ""}`}</p>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handlePublish(e.id, !e.publicado)}>
                      {e.publicado ? "Despublicar" : "Publicar"}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setForm({ ...e, es_gratis: e.es_gratis ?? e.precio_min === 0 }); setEditId(e.id); setShowDialog(true); }}>✏️</Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar evento" : "Nuevo evento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre del evento *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Festival de la Cerveza, Feria de Artesanías..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoría</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_EVENTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lugar / Dirección</Label><Input value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })} placeholder="Plaza principal..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha inicio *</Label><Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
              <div><Label>Fecha fin</Label><Input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
            </div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Describe el evento..." /></div>
            <div>
              <Label>Precio</Label>
              <div className="flex items-center gap-3 mt-1">
                <button type="button" onClick={() => setForm({ ...form, es_gratis: !form.es_gratis })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.es_gratis ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {form.es_gratis ? "✓ Gratis" : "Gratis"}
                </button>
                {!form.es_gratis && (
                  <div className="flex gap-2 flex-1">
                    <Input type="number" value={form.precio_min} onChange={e => setForm({ ...form, precio_min: e.target.value })} placeholder="Precio mín" />
                    <Input type="number" value={form.precio_max} onChange={e => setForm({ ...form, precio_max: e.target.value })} placeholder="Precio máx" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Imagen / Banner</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.foto_url && <img src={form.foto_url} className="w-16 h-16 rounded-lg object-cover" alt="" />}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Subiendo..." : "Subir imagen"}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadFoto(e.target.files[0])} disabled={uploading} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm({ ...form, publicado: !form.publicado })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.publicado ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {form.publicado ? "✓ Publicar al guardar" : "Guardar como borrador"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Actualizar" : "Crear evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ATRACCIONES
// ══════════════════════════════════════════════════════════════════════════════
const AtraccionesTab = ({ municipioId, municipioNombre }) => {
  const [atracciones, setAtracciones] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showDialog,  setShowDialog]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [geoLoading,  setGeoLoading]  = useState(false);

  const empty = {
    nombre: "", descripcion: "", tipo: "Natural", horarios: "",
    costo: "Gratis", costo_min: 0, costo_max: 0,
    direccion: "", lat: "", lng: "",
    foto_portada: "", fotos: [], video_url: "",
    telefono: "", whatsapp: "", website: "",
    recomendaciones: "", destacado: false,
  };
  const [form, setForm] = useState(empty);

  useEffect(() => { fetchAtracciones(); }, [municipioId]);

  const fetchAtracciones = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/lugares`, { params: { municipio_id: municipioId, limit: 200 } });
      setAtracciones(data.lugares || data.atracciones || data.data || (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error("Error cargando atracciones:", e);
      setAtracciones([]);
    } finally { setLoading(false); }
  };

  const handleUploadPortada = async (file) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm(f => ({ ...f, foto_portada: url, fotos: [url, ...f.fotos.filter(u => u !== f.foto_portada)] }));
      toast.success("Foto principal subida");
    } catch { toast.error("Error subiendo foto"); }
    finally { setUploading(false); }
  };

  const handleUploadExtra = async (files) => {
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadFile(f)));
      setForm(f => ({ ...f, fotos: [...f.fotos, ...urls] }));
      toast.success(`${urls.length} foto(s) agregada(s)`);
    } catch { toast.error("Error subiendo fotos"); }
    finally { setUploading(false); }
  };

  const removePhoto = (url) => setForm(f => ({
    ...f,
    fotos: f.fotos.filter(u => u !== url),
    foto_portada: f.foto_portada === url ? (f.fotos.find(u => u !== url) || "") : f.foto_portada,
  }));

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) return toast.error("Geolocalización no disponible");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        toast.success("Ubicación obtenida");
        setGeoLoading(false);
      },
      () => { toast.error("No se pudo obtener ubicación"); setGeoLoading(false); }
    );
  };

  const handleSave = async () => {
    if (!form.nombre) return toast.error("Nombre requerido");
    setSaving(true);
    try {
      const payload = {
        ...form,
        municipio_id: municipioId,
        municipio: municipioNombre,
        region: "centro",
        slug: form.nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        costo_min: parseFloat(form.costo_min || 0),
        costo_max: parseFloat(form.costo_max || 0),
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        fotos: form.fotos.length > 0 ? form.fotos : (form.foto_portada ? [form.foto_portada] : []),
      };
      if (editId) await axios.put(`${API}/lugares/${editId}`, payload);
      else await axios.post(`${API}/lugares`, payload);
      toast.success(editId ? "Atracción actualizada" : "Atracción creada");
      setShowDialog(false); setForm(empty); setEditId(null);
      fetchAtracciones();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error guardando");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await axios.delete(`${API}/lugares/${id}`);
      setAtracciones(prev => prev.filter(a => a.id !== id));
      toast.success("Atracción eliminada");
    } catch { toast.error("Error al eliminar"); }
  };

  const ICONOS = {
    Natural: "🌿", Cultural: "🎭", Histórico: "🏛️", Familiar: "👨‍👩‍👧",
    Aventura: "🧗", Gastronomía: "🍽️", Religioso: "⛪", Arqueológico: "🏺"
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Atracciones Turísticas"
        action={
          <Button onClick={() => { setForm(empty); setEditId(null); setShowDialog(true); }}
            className="bg-[#1B5E20] hover:bg-[#145218]">
            <Plus className="w-4 h-4 mr-2" />Nueva atracción
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
      ) : atracciones.length === 0 ? (
        <EmptyState icon={MapPin} title="No hay atracciones registradas"
          sub="Agrega los lugares más importantes de tu municipio"
          onAdd={() => setShowDialog(true)} label="Agregar primera atracción" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {atracciones.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-40 overflow-hidden">
                {a.video_url ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    {a.foto_portada && <img src={a.foto_portada} alt="" className="w-full h-full object-cover opacity-60 absolute inset-0" />}
                    <div className="relative z-10 flex flex-col items-center gap-1 text-white">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-2xl">▶</span>
                      </div>
                      <span className="text-xs font-semibold">Ver video</span>
                    </div>
                  </div>
                ) : a.foto_portada ? (
                  <img src={a.foto_portada} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-5xl">{ICONOS[a.tipo] || "📍"}</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-0.5 rounded-full text-gray-700">{ICONOS[a.tipo]} {a.tipo}</span>
                </div>
                {a.fotos?.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">📷 {a.fotos.length}</div>
                )}
                {a.destacado && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">⭐ Destacado</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{a.nombre}</h3>
                {a.descripcion && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{a.descripcion}</p>}
                <div className="space-y-0.5 text-xs text-gray-400 mb-3">
                  {a.horarios  && <p className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.horarios}</p>}
                  {a.costo     && <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{a.costo}</p>}
                  {a.telefono  && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.telefono}</p>}
                  {a.lat && a.lng && (
                    <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline">
                      <MapPin className="w-3 h-3" />Ver en mapa
                    </a>
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7"
                    onClick={() => { setForm({ ...empty, ...a, lat: a.lat || "", lng: a.lng || "", fotos: a.fotos || [] }); setEditId(a.id); setShowDialog(true); }}>
                    ✏️ Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(a.id, a.nombre)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar atracción" : "Nueva atracción turística"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Cascada El Salto, Zona arqueológica..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoría</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_ATRACCION.map(c => <SelectItem key={c} value={c}>{ICONOS[c]} {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Horarios</Label>
                <Input value={form.horarios} onChange={e => setForm(f => ({ ...f, horarios: e.target.value }))} placeholder="8:00–18:00 / Lun–Dom" />
              </div>
            </div>
            <div><Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3}
                placeholder="Describe la atracción, qué ofrece, por qué visitar..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><Label>Costo (texto)</Label>
                <Input value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} placeholder="Gratis / $50 MXN" />
              </div>
              <div><Label>Precio mín ($)</Label><Input type="number" value={form.costo_min} onChange={e => setForm(f => ({ ...f, costo_min: e.target.value }))} /></div>
              <div><Label>Precio máx ($)</Label><Input type="number" value={form.costo_max} onChange={e => setForm(f => ({ ...f, costo_max: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="272 123 4567" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="52272..." /></div>
              <div><Label>Sitio web</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <div>
              <Label className="mb-2 block">Ubicación precisa</Label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2"><Input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="Latitud: 19.18..." /></div>
                <div className="col-span-2"><Input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="Longitud: -96.14..." /></div>
                <Button type="button" variant="outline" onClick={obtenerUbicacion} disabled={geoLoading} title="Usar mi ubicación actual">
                  {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                </Button>
              </div>
              <Input className="mt-2" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Dirección o referencias para llegar..." />
            </div>
            <div>
              <Label className="mb-2 block">Fotos <span className="text-gray-400 font-normal">(puedes subir varias)</span></Label>
              <div className="flex items-start gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  {form.foto_portada
                    ? <img src={form.foto_portada} className="w-20 h-20 rounded-xl object-cover border-2 border-[#1B5E20]" alt="Portada" />
                    : <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl border-2 border-dashed border-gray-200">{ICONOS[form.tipo] || "📍"}</div>
                  }
                  <span className="absolute -bottom-1 -right-1 bg-[#1B5E20] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">PORTADA</span>
                </div>
                <label className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Subiendo..." : "Subir foto principal"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUploadPortada(e.target.files[0])} />
                </label>
              </div>
              {form.fotos.filter(u => u !== form.foto_portada).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.fotos.filter(u => u !== form.foto_portada).map(url => (
                    <div key={url} className="relative">
                      <img src={url} className="w-16 h-16 rounded-lg object-cover border border-gray-200" alt="" />
                      <button onClick={() => removePhoto(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />Agregar más fotos
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files.length > 0 && handleUploadExtra(e.target.files)} />
              </label>
            </div>
            <div>
              <Label>Video <span className="text-gray-400 font-normal">(URL de YouTube o enlace directo)</span></Label>
              <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div><Label>Recomendaciones para visitantes</Label>
              <Textarea value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} rows={2}
                placeholder="Llevar repelente, mejor época, calzado recomendado..." />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, destacado: !f.destacado }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.destacado ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {form.destacado ? "⭐ Destacado" : "Marcar como destacado"}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Actualizar atracción" : "Crear atracción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: NOTICIAS
// ══════════════════════════════════════════════════════════════════════════════
const NoticiasTab = ({ municipioId, municipioNombre }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const empty = { titulo: "", contenido: "", imagen_url: "", categoria: "Aviso", publicado: false };
  const [form, setForm] = useState(empty);

  useEffect(() => { fetchNoticias(); }, [municipioId]);

  const fetchNoticias = async () => {
    try {
      const { data } = await axios.get(`${API}/noticias`, { params: { municipio_id: municipioId } });
      setNoticias(data.noticias || data || []);
    } catch { setNoticias([]); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.contenido) return toast.error("Título y contenido requeridos");
    setSaving(true);
    try {
      const payload = { ...form, municipio_id: municipioId };
      if (editId) await axios.put(`${API}/noticias/${editId}`, payload);
      else await axios.post(`${API}/noticias`, payload);
      toast.success(editId ? "Noticia actualizada" : "Noticia publicada");
      setShowDialog(false); setForm(empty); setEditId(null); fetchNoticias();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const COLORES = { Aviso: "bg-blue-100 text-blue-800", Seguridad: "bg-red-100 text-red-800", Cultura: "bg-purple-100 text-purple-800", Obras: "bg-orange-100 text-orange-800", Turismo: "bg-green-100 text-green-800", Salud: "bg-pink-100 text-pink-800", Otro: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Noticias y Avisos"
        action={<Button onClick={() => { setForm(empty); setEditId(null); setShowDialog(true); }} className="bg-[#1B5E20] hover:bg-[#145218]"><Plus className="w-4 h-4 mr-2" />Nueva noticia</Button>}
      />

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
        : noticias.length === 0 ? <EmptyState icon={Newspaper} title="Sin noticias" sub="Publica avisos y noticias de tu municipio" onAdd={() => setShowDialog(true)} label="Publicar primera noticia" />
        : (
          <div className="space-y-3">
            {noticias.map(n => (
              <Card key={n.id} className="!p-4">
                <div className="flex items-start gap-4">
                  {n.imagen_url && <img src={n.imagen_url} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${COLORES[n.categoria] || COLORES.Otro}`}>{n.categoria}</Badge>
                      {!n.publicado && <Badge className="text-xs bg-gray-100 text-gray-600">Borrador</Badge>}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{n.titulo}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{n.contenido}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.fecha || n.created_at).toLocaleDateString("es-MX")}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setForm(n); setEditId(n.id); setShowDialog(true); }}>✏️</Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={async () => { if (!confirm("¿Eliminar?")) return; await axios.delete(`${API}/noticias/${n.id}`); fetchNoticias(); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar noticia" : "Nueva noticia"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Aviso importante para visitantes..." /></div>
            <div><Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS_NOTICIA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Contenido *</Label><Textarea value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} rows={5} placeholder="Escribe el contenido de la noticia..." /></div>
            <div>
              <Label>Imagen</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.imagen_url && <img src={form.imagen_url} className="w-16 h-16 rounded-lg object-cover" alt="" />}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Subiendo..." : "Subir imagen"}
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { setUploading(true); try { const url = await uploadFile(e.target.files[0]); setForm(f => ({ ...f, imagen_url: url })); } finally { setUploading(false); } }} disabled={uploading} />
                </label>
              </div>
            </div>
            <button type="button" onClick={() => setForm({ ...form, publicado: !form.publicado })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.publicado ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {form.publicado ? "✓ Publicar al guardar" : "Guardar como borrador"}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Actualizar" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: SERVICIOS MUNICIPALES
// ══════════════════════════════════════════════════════════════════════════════
const ServiciosMunicipalesTab = ({ municipioId }) => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const empty = { nombre: "", tipo: "Hospital", telefono: "", telefono_emergencia: "", direccion: "", lat: "", lng: "", descripcion: "", activo: true };
  const [form, setForm] = useState(empty);

  useEffect(() => { fetchServicios(); }, [municipioId]);

  const fetchServicios = async () => {
    try {
      const { data } = await axios.get(`${API}/servicios-municipales`, { params: { municipio_id: municipioId } });
      setServicios(data.servicios || data || []);
    } catch { setServicios([]); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.tipo) return toast.error("Nombre y tipo requeridos");
    setSaving(true);
    try {
      const payload = { ...form, municipio_id: municipioId, lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null };
      if (editId) await axios.put(`${API}/servicios-municipales/${editId}`, payload);
      else await axios.post(`${API}/servicios-municipales`, payload);
      toast.success("Guardado");
      setShowDialog(false); setForm(empty); setEditId(null); fetchServicios();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const ICONOS_SERVICIO = { Hospital: "🏥", Clínica: "🏨", Policía: "👮", "Protección Civil": "🚨", Bomberos: "🚒", "Cruz Roja": "🔴", Farmacia: "💊", Otro: "🏢" };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Servicios Municipales de Emergencia"
        action={<Button onClick={() => { setForm(empty); setEditId(null); setShowDialog(true); }} className="bg-[#1B5E20] hover:bg-[#145218]"><Plus className="w-4 h-4 mr-2" />Agregar servicio</Button>}
      />

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
        : servicios.length === 0 ? <EmptyState icon={Shield} title="Sin servicios registrados" sub="Agrega hospitales, policía, protección civil y más" onAdd={() => setShowDialog(true)} label="Agregar primer servicio" />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicios.map(s => (
              <Card key={s.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{ICONOS_SERVICIO[s.tipo] || "🏢"}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">{s.nombre}</h3>
                    <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">{s.tipo}</Badge>
                    {s.telefono && <p className="text-xs text-gray-600 mt-2">📞 {s.telefono}</p>}
                    {s.telefono_emergencia && <p className="text-xs text-red-600 font-semibold">🚨 {s.telefono_emergencia}</p>}
                    {s.direccion && <p className="text-xs text-gray-500 mt-1">📍 {s.direccion}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => { setForm({ ...s, lat: s.lat || "", lng: s.lng || "" }); setEditId(s.id); setShowDialog(true); }}>✏️ Editar</Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={async () => { if (!confirm("¿Eliminar?")) return; await axios.delete(`${API}/servicios-municipales/${s.id}`); fetchServicios(); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "Editar servicio" : "Nuevo servicio municipal"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Hospital General de Orizaba" /></div>
              <div><Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_SERVICIO_MUNICIPAL.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Teléfono general</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="272 000 0000" /></div>
              <div><Label>Teléfono emergencias 🚨</Label><Input value={form.telefono_emergencia} onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} placeholder="911 / 066" /></div>
            </div>
            <div><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitud</Label><Input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></div>
              <div><Label>Longitud</Label><Input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></div>
            </div>
            <div><Label>Descripción / Servicios</Label><Textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB: PRESTADORES — igual que Admin pero solo del municipio del encargado
// ══════════════════════════════════════════════════════════════════════════════
const FORM_VACIO = {
  nombre: "", tipo: "", subtipo: "", descripcion: "", telefono: "",
  whatsapp: "", horarios: "", direccion: "", foto_url: "",
  lat: "", lng: "", website: "", instagram: "", facebook: "",
  precio_min: "", precio_max: "",
};

const PrestadoresTab = ({ municipioId, municipioNombre }) => {
  const [prestadores, setPrestadores]   = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [showDialog,  setShowDialog]    = useState(false);
  const [editando,    setEditando]      = useState(null); // prestador completo
  const [saving,      setSaving]        = useState(false);
  const [uploading,   setUploading]     = useState(false);
  const [filtroTipo,  setFiltroTipo]    = useState("todos");
  const [filtroBusq,  setFiltroBusq]    = useState("");
  const [vistaGrid,   setVistaGrid]     = useState(true);
  const [form,        setForm]          = useState(FORM_VACIO);

  useEffect(() => { fetchPrestadores(); }, [municipioId]);

  const fetchPrestadores = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/prestadores`, { params: { municipio_id: municipioId, limit: 200 } });
      setPrestadores(res.data.prestadores || []);
    } finally { setLoading(false); }
  };

  const [credenciales, setCredenciales] = useState(null); // Modal de credenciales

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setShowDialog(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      nombre: p.nombre || "", tipo: p.tipo || "", subtipo: p.subtipo || "",
      descripcion: p.descripcion || "", telefono: p.telefono || "",
      whatsapp: p.whatsapp || "", horarios: p.horarios || "",
      direccion: p.direccion || "", foto_url: p.foto_url || "",
      lat: p.lat || "", lng: p.lng || "",
      website: p.website || "", instagram: p.instagram || "",
      facebook: p.facebook || "", precio_min: p.precio_min || "",
      precio_max: p.precio_max || "",
    });
    setShowDialog(true);
  };

  const handleVerificar = async (id, verificar) => {
    try {
      await axios.post(`${API}/prestadores/${id}/${verificar ? "verificar" : "desverificar"}`);
      setPrestadores(prev => prev.map(p => p.id === id ? { ...p, verificado: verificar } : p));
      toast.success(verificar ? "✅ Prestador verificado" : "Verificación removida");
    } catch { toast.error("Error al actualizar"); }
  };

  const handleDestacado = async (id, destacado) => {
    try {
      await axios.put(`${API}/prestadores/${id}`, { destacado });
      setPrestadores(prev => prev.map(p => p.id === id ? { ...p, destacado } : p));
      toast.success(destacado ? "🔥 Marcado como destacado" : "Destacado removido");
    } catch { toast.error("Error al actualizar"); }
  };

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm(f => ({ ...f, foto_url: url }));
      toast.success("Foto subida");
    } catch { toast.error("Error subiendo foto"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo) { toast.error("Nombre y tipo son obligatorios"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        municipio_id: municipioId,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        precio_min: form.precio_min ? parseFloat(form.precio_min) : undefined,
        precio_max: form.precio_max ? parseFloat(form.precio_max) : undefined,
      };
      if (editando) {
        await axios.put(`${API}/prestadores/${editando.id}`, payload);
        toast.success("✅ Prestador actualizado");
        setShowDialog(false);
      } else {
        const { data } = await axios.post(`${API}/prestadores`, payload);
        setShowDialog(false);
        // Mostrar credenciales si el backend las devuelve
        if (data.credenciales) {
          setCredenciales({ nombre: data.nombre, ...data.credenciales });
        } else {
          toast.success("✅ Prestador creado");
        }
      }
      fetchPrestadores();
    } catch (e) { toast.error(e.response?.data?.detail || "Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API}/prestadores/${id}`);
      setPrestadores(prev => prev.filter(p => p.id !== id));
      toast.success("Prestador eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  const tipoActual  = TIPOS_PRESTADOR.find(t => t.tipo === form.tipo);
  const pendientes  = prestadores.filter(p => !p.verificado);
  const verificados = prestadores.filter(p => p.verificado);

  const filtrados = prestadores
    .filter(p => filtroTipo === "todos" || p.tipo === filtroTipo)
    .filter(p => !filtroBusq || p.nombre.toLowerCase().includes(filtroBusq.toLowerCase()));

  return (
    <div className="space-y-6">

      {/* ── Header con stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prestadores de Servicios</h2>
          <p className="text-sm text-gray-500 mt-0.5">{municipioNombre}</p>
        </div>
        <Button onClick={abrirCrear} className="bg-[#1B5E20] hover:bg-[#145218] self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-2" />Agregar prestador
        </Button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: prestadores.length,  color: "bg-blue-50 text-blue-700",   emoji: "🏢" },
          { label: "Verificados", value: verificados.length,  color: "bg-green-50 text-green-700", emoji: "✅" },
          { label: "Pendientes",  value: pendientes.length,   color: pendientes.length > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500", emoji: "⏳" },
          { label: "Destacados",  value: prestadores.filter(p => p.destacado).length, color: "bg-orange-50 text-orange-700", emoji: "🔥" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color} border border-current/10`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-70">{s.emoji} {s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Pendientes de verificación ── */}
      {pendientes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-amber-900">
              {pendientes.length} prestador{pendientes.length !== 1 ? "es" : ""} pendiente{pendientes.length !== 1 ? "s" : ""} de verificación
            </h3>
          </div>
          <div className="space-y-2">
            {pendientes.map(p => {
              const cat = TIPOS_PRESTADOR.find(t => t.tipo === p.tipo);
              return (
                <div key={p.id} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    {p.foto_url
                      ? <img src={p.foto_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-amber-100" />
                      : <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${cat?.color || "bg-gray-50"}`}>{cat?.grupo.split(" ")[0] || "🏢"}</div>
                    }
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.subtipo || p.tipo}{p.telefono && ` · ${p.telefono}`}</p>
                      {p.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => abrirEditar(p)}>
                      ✏️ Editar
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => handleVerificar(p.id, true)}>
                      <Check className="w-3.5 h-3.5 mr-1" />Verificar
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => handleDelete(p.id, p.nombre)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" />Rechazar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filtros + búsqueda ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="🔍 Buscar prestador..."
            value={filtroBusq}
            onChange={e => setFiltroBusq(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={() => setVistaGrid(v => !v)} title="Cambiar vista">
            {vistaGrid ? "☰" : "⊞"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltroTipo("todos")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filtroTipo === "todos" ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            🗂️ Todos ({prestadores.length})
          </button>
          {TIPOS_PRESTADOR.map(cat => {
            const count = prestadores.filter(p => p.tipo === cat.tipo).length;
            if (count === 0) return null;
            return (
              <button key={cat.tipo} onClick={() => setFiltroTipo(cat.tipo)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  filtroTipo === cat.tipo ? "bg-[#1B5E20] text-white border-[#1B5E20]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {cat.grupo.split(" ")[0]} {cat.grupo.slice(3)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista de prestadores ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>
      ) : filtrados.length === 0 ? (
        <EmptyState icon={Users} title="No hay prestadores" sub='Haz clic en "Agregar prestador" para comenzar' onAdd={abrirCrear} label="Agregar prestador" />
      ) : vistaGrid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => {
            const cat = TIPOS_PRESTADOR.find(t => t.tipo === p.tipo);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                {/* Imagen */}
                <div className="relative h-40">
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className={`w-full h-full flex items-center justify-center text-5xl ${cat?.color || "bg-gray-50"}`}>{cat?.grupo.split(" ")[0] || "🏢"}</div>
                  }
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {p.verificado && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Verificado</span>}
                    {p.destacado  && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">🔥 Destacado</span>}
                  </div>
                  {/* Rating */}
                  {p.calificacion_promedio > 0 && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold">{p.calificacion_promedio.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{p.nombre}</h3>
                      <p className="text-xs text-gray-400">{p.subtipo || p.tipo}</p>
                    </div>
                  </div>
                  {p.descripcion && <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">{p.descripcion}</p>}
                  {(p.telefono || p.precio_min) && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      {p.telefono  && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.telefono}</span>}
                      {p.precio_min && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Desde ${p.precio_min}</span>}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-1.5 pt-3 border-t border-gray-100 flex-wrap">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 flex-1" onClick={() => abrirEditar(p)}>
                      ✏️ Editar
                    </Button>
                    <Button size="sm" variant="outline"
                      className={`text-xs h-7 px-2.5 ${p.verificado ? "text-green-600 border-green-200 bg-green-50" : "text-gray-600"}`}
                      onClick={() => handleVerificar(p.id, !p.verificado)}>
                      {p.verificado ? "✅" : "Verificar"}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2" title="Destacar"
                      onClick={() => handleDestacado(p.id, !p.destacado)}>
                      {p.destacado ? "🔥" : "⭐"}
                    </Button>
                    <a href={`/prestador/${p.id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2" title="Ver perfil público">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2"
                      onClick={() => handleDelete(p.id, p.nombre)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista lista */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {filtrados.map(p => {
            const cat = TIPOS_PRESTADOR.find(t => t.tipo === p.tipo);
            return (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  {p.foto_url
                    ? <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                    : <div className={`w-full h-full flex items-center justify-center text-xl ${cat?.color || "bg-gray-50"}`}>{cat?.grupo.split(" ")[0] || "🏢"}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.nombre}</p>
                    {p.verificado && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">✓</span>}
                    {p.destacado  && <span className="text-sm flex-shrink-0">🔥</span>}
                  </div>
                  <p className="text-xs text-gray-400">{p.subtipo || p.tipo}{p.telefono && ` · ${p.telefono}`}</p>
                </div>
                {p.calificacion_promedio > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-bold flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{p.calificacion_promedio.toFixed(1)}
                  </div>
                )}
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2.5" onClick={() => abrirEditar(p)}>✏️</Button>
                  <Button size="sm" variant="outline" className={`text-xs h-7 px-2.5 ${p.verificado ? "text-green-600 border-green-200" : ""}`}
                    onClick={() => handleVerificar(p.id, !p.verificado)}>
                    {p.verificado ? "✅" : "Verificar"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => handleDestacado(p.id, !p.destacado)}>
                    {p.destacado ? "🔥" : "⭐"}
                  </Button>
                  <a href={`/prestador/${p.id}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2"><Eye className="w-3.5 h-3.5" /></Button>
                  </a>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 px-2" onClick={() => handleDelete(p.id, p.nombre)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog crear / editar ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar: ${editando.nombre}` : "Agregar Prestador de Servicio"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Categoría */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Categoría *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIPOS_PRESTADOR.map(cat => (
                  <button key={cat.tipo} type="button" onClick={() => setForm(f => ({ ...f, tipo: cat.tipo, subtipo: "" }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.tipo === cat.tipo ? "border-[#1B5E20] bg-[#1B5E20]/5" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <span className="text-2xl">{cat.grupo.split(" ")[0]}</span>
                    <p className="text-xs font-medium text-gray-700 mt-1 leading-tight">{cat.grupo.slice(3)}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.tipo && (
              <div>
                <Label>Tipo específico *</Label>
                <Select value={form.subtipo} onValueChange={v => setForm(f => ({ ...f, subtipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona el tipo exacto..." /></SelectTrigger>
                  <SelectContent>{tipoActual?.subtipos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div><Label>Nombre del negocio *</Label><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del prestador..." /></div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="Describe brevemente el servicio..." /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="272 123 4567" /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="52272 123 4567" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Precio mínimo (MXN)</Label><Input type="number" value={form.precio_min} onChange={e => setForm(f => ({ ...f, precio_min: e.target.value }))} placeholder="0" /></div>
              <div><Label>Precio máximo (MXN)</Label><Input type="number" value={form.precio_max} onChange={e => setForm(f => ({ ...f, precio_max: e.target.value }))} placeholder="0" /></div>
            </div>

            <div><Label>Horarios</Label><Input value={form.horarios} onChange={e => setForm(f => ({ ...f, horarios: e.target.value }))} placeholder="Lun–Dom 9:00–20:00" /></div>
            <div><Label>Dirección</Label><Textarea value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} rows={2} placeholder="Calle, colonia, municipio..." /></div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitud</Label><Input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="19.1813" /></div>
              <div><Label>Longitud</Label><Input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="-96.1429" /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1"><Label>Sitio web</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>Instagram</Label><Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" /></div>
              <div><Label>Facebook</Label><Input value={form.facebook} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))} placeholder="página" /></div>
            </div>

            {/* Foto */}
            <div>
              <Label className="mb-2 block">Foto del negocio</Label>
              <div className="flex gap-3 items-start">
                {form.foto_url && (
                  <img src={form.foto_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" className="w-full" disabled={uploading} asChild>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        {uploading ? "Subiendo..." : "Subir foto"}
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                  </label>
                  <Input value={form.foto_url} onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))} placeholder="O pega una URL de imagen..." />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editando ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editando ? "Guardar cambios" : "Crear prestador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de credenciales ── */}
      <Dialog open={!!credenciales} onOpenChange={() => setCredenciales(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              ✅ Prestador creado exitosamente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800 font-semibold mb-1">
                🏢 {credenciales?.nombre}
              </p>
              <p className="text-xs text-green-700">
                Se creó la cuenta de acceso al panel del prestador.
                <strong> Comparte estas credenciales</strong> con el propietario del negocio.
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Email de acceso</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-gray-900 break-all">{credenciales?.email}</p>
                  <button onClick={() => { navigator.clipboard.writeText(credenciales?.email || ""); toast.success("Email copiado"); }}
                    className="text-xs text-blue-600 hover:underline flex-shrink-0">Copiar</button>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Contraseña temporal</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-lg font-black text-gray-900 tracking-widest">{credenciales?.password}</p>
                  <button onClick={() => { navigator.clipboard.writeText(credenciales?.password || ""); toast.success("Contraseña copiada"); }}
                    className="text-xs text-blue-600 hover:underline flex-shrink-0">Copiar</button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800">
                ⚠️ <strong>Guarda estas credenciales ahora.</strong> No se volverán a mostrar. El prestador puede cambiar su contraseña desde su panel.
              </p>
            </div>

            <button
              onClick={() => {
                const texto = `Credenciales de acceso a Veracruz Contigo:\n\nNegocio: ${credenciales?.nombre}\nEmail: ${credenciales?.email}\nContraseña: ${credenciales?.password}\n\nInicia sesión en: https://veracruz-amor.vercel.app/login`;
                navigator.clipboard.writeText(texto);
                toast.success("Credenciales copiadas al portapapeles");
              }}
              className="w-full py-3 rounded-xl bg-[#1B5E20] text-white font-bold text-sm hover:bg-[#145218] transition-colors">
              📋 Copiar todo para compartir por WhatsApp
            </button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredenciales(null)} className="bg-[#1B5E20] hover:bg-[#145218] w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchMunicipio();
  }, [user?.municipio_id]);

  const handleSave = async (publish = false) => {
    if (!municipio) return;
    setSaving(true);
    try {
      await axios.put(`${API}/municipios/${municipio.slug}`, {
        descripcion: municipio.descripcion, historia: municipio.historia,
        que_hacer: municipio.que_hacer, como_llegar: municipio.como_llegar,
        clima: municipio.clima, altitud: municipio.altitud,
        tags: municipio.tags, estado: publish ? "publicado" : "borrador",
      });
      toast.success(publish ? "Municipio publicado" : "Borrador guardado");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" /></div>;

  if (!municipio) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8" data-testid="encargado-no-municipio">
      <MapPin className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin municipio asignado</h1>
      <p className="text-gray-500 text-center max-w-md mb-6">Tu cuenta no tiene un municipio asignado. Contacta al Super Administrador.</p>
      <Button onClick={handleLogout} variant="outline"><LogOut className="w-4 h-4 mr-2" />Cerrar sesión</Button>
    </div>
  );

  const allTags = ["Pueblo Mágico","Playa","Sierra","Ciudad","Gastronomía","Naturaleza","Cultura","Aventura"];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="encargado-dashboard">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1B5E20] rounded-lg flex items-center justify-center"><MapPin className="w-4 h-4 text-white" /></div>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{municipio.nombre}</h1>
              <p className="text-xs text-gray-500">Panel de Encargado Municipal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/municipio/${municipio.slug}`} target="_blank"><Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" />Ver público</Button></Link>
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" size="sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Borrador</Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-[#1B5E20] hover:bg-[#145218]" size="sm">Publicar</Button>
            <Button onClick={handleLogout} variant="ghost" size="sm"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm flex-wrap h-auto gap-1">
            <TabsTrigger value="info" className="rounded-lg"><LayoutDashboard className="w-4 h-4 mr-2" />Información</TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-lg"><Camera className="w-4 h-4 mr-2" />Galería</TabsTrigger>
            <TabsTrigger value="eventos" className="rounded-lg"><Calendar className="w-4 h-4 mr-2" />Eventos</TabsTrigger>
            <TabsTrigger value="atracciones" className="rounded-lg"><MapPin className="w-4 h-4 mr-2" />Atracciones</TabsTrigger>
            <TabsTrigger value="prestadores" className="rounded-lg"><Users className="w-4 h-4 mr-2" />Prestadores</TabsTrigger>
            <TabsTrigger value="noticias" className="rounded-lg"><Newspaper className="w-4 h-4 mr-2" />Noticias</TabsTrigger>
            <TabsTrigger value="servicios" className="rounded-lg"><Shield className="w-4 h-4 mr-2" />Servicios</TabsTrigger>
            <TabsTrigger value="estadisticas" className="rounded-lg"><BarChart3 className="w-4 h-4 mr-2" />Estadísticas</TabsTrigger>
          </TabsList>

          {/* INFO */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Descripción Turística</h2>
                  <Textarea value={municipio.descripcion || ""} onChange={e => setMunicipio({ ...municipio, descripcion: e.target.value })} rows={6} placeholder="Describe los atractivos turísticos de tu municipio..." />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Historia</h2>
                  <Textarea value={municipio.historia || ""} onChange={e => setMunicipio({ ...municipio, historia: e.target.value })} rows={4} placeholder="Breve historia del municipio..." />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Qué hacer aquí</h2>
                  <div className="space-y-2">
                    {(municipio.que_hacer || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={item} onChange={e => { const u = [...municipio.que_hacer]; u[index] = e.target.value; setMunicipio({ ...municipio, que_hacer: u }); }} placeholder="Actividad..." />
                        <Button variant="ghost" size="icon" onClick={() => setMunicipio({ ...municipio, que_hacer: municipio.que_hacer.filter((_, i) => i !== index) })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setMunicipio({ ...municipio, que_hacer: [...(municipio.que_hacer || []), ""] })}><Plus className="w-4 h-4 mr-2" />Agregar actividad</Button>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Cómo llegar</h2>
                  <Textarea value={municipio.como_llegar || ""} onChange={e => setMunicipio({ ...municipio, como_llegar: e.target.value })} rows={3} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Información básica</h2>
                  <div className="space-y-4">
                    <div><Label>Clima</Label><Input value={municipio.clima || ""} onChange={e => setMunicipio({ ...municipio, clima: e.target.value })} placeholder="Templado húmedo" /></div>
                    <div><Label>Altitud</Label><Input value={municipio.altitud || ""} onChange={e => setMunicipio({ ...municipio, altitud: e.target.value })} placeholder="1,427 msnm" /></div>
                    <div><Label>Región</Label><Input value={municipio.region} disabled /></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => { const c = municipio.tags || []; setMunicipio({ ...municipio, tags: c.includes(tag) ? c.filter(t => t !== tag) : [...c, tag] }); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${(municipio.tags || []).includes(tag) ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{tag}
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

          {/* GALERÍA */}
          <TabsContent value="galeria">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Galería de Fotos</h2>
                <label className="cursor-pointer">
                  <Button className="bg-[#1B5E20] hover:bg-[#145218]" asChild><span><Upload className="w-4 h-4 mr-2" />Subir fotos</span></Button>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                    for (const file of Array.from(e.target.files)) {
                      try { const url = await uploadFile(file); setMunicipio(m => ({ ...m, fotos: [...(m.fotos || []), { url }] })); toast.success(`${file.name} subida`); }
                      catch { toast.error(`Error subiendo ${file.name}`); }
                    }
                  }} />
                </label>
              </div>
              {(municipio.fotos || []).length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">Sube fotos de tu municipio</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP — máx 10MB</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {municipio.fotos.map((foto, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                      <img src={foto.url || foto} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setMunicipio(m => ({ ...m, fotos: m.fotos.filter((_, idx) => idx !== i) }))}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* EVENTOS */}
          <TabsContent value="eventos">
            <EventosTab municipioId={municipio.id} municipioNombre={municipio.nombre} />
          </TabsContent>

          {/* ATRACCIONES */}
          <TabsContent value="atracciones">
            <AtraccionesTab municipioId={municipio.id} municipioNombre={municipio.nombre} />
          </TabsContent>

          {/* PRESTADORES */}
          <TabsContent value="prestadores">
            <PrestadoresTab municipioId={municipio.id} municipioNombre={municipio.nombre} />
          </TabsContent>

          {/* NOTICIAS */}
          <TabsContent value="noticias">
            <NoticiasTab municipioId={municipio.id} municipioNombre={municipio.nombre} />
          </TabsContent>

          {/* SERVICIOS MUNICIPALES */}
          <TabsContent value="servicios">
            <ServiciosMunicipalesTab municipioId={municipio.id} />
          </TabsContent>

          {/* ESTADÍSTICAS */}
          <TabsContent value="estadisticas">
            <AnalyticsDashboard municipioId={municipio.id} isGlobal={false} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EncargadoDashboard;