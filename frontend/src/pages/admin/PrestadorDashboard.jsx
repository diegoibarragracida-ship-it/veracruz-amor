import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import {
  User, BadgeCheck, Camera, Plus, Trash2, Edit3, Save, X,
  DollarSign, Clock, Users, Star, BarChart2, Calendar,
  CheckCircle, XCircle, AlertCircle, Phone, Globe, MapPin,
  Instagram, Facebook, Utensils, Hotel, Car, Tag, Loader2,
  Image, Settings, ChevronDown, ChevronRight, TrendingUp, Eye,
  MessageCircle, Package
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────
const TIPOS_PRESTADOR = {
  HOSPEDAJE:    { label: "Hospedaje",    tabs: ["perfil","galeria","servicios","habitaciones","reservas","promociones","resenas","analiticas"] },
  GASTRONOMÍA:  { label: "Restaurante",  tabs: ["perfil","galeria","servicios","menu","reservas","promociones","resenas","analiticas"] },
  TURISMO:      { label: "Tour",         tabs: ["perfil","galeria","servicios","flota","reservas","promociones","resenas","analiticas"] },
  TRANSPORTE:   { label: "Transporte",   tabs: ["perfil","galeria","servicios","flota","reservas","promociones","resenas","analiticas"] },
  default:      { label: "Negocio",      tabs: ["perfil","galeria","servicios","reservas","promociones","resenas","analiticas"] },
};

const TAB_LABELS = {
  perfil:       { icon: "🏠", label: "Perfil" },
  galeria:      { icon: "📸", label: "Galería" },
  servicios:    { icon: "💰", label: "Servicios" },
  reservas:     { icon: "🛎️", label: "Reservas" },
  menu:         { icon: "🍽️", label: "Menú" },
  habitaciones: { icon: "🛏️", label: "Habitaciones" },
  flota:        { icon: "🚗", label: "Flota" },
  promociones:  { icon: "🎁", label: "Promociones" },
  resenas:      { icon: "⭐", label: "Reseñas" },
  analiticas:   { icon: "📊", label: "Analíticas" },
};

const ESTADO_COLORS = {
  pendiente:   "bg-amber-100 text-amber-800",
  aceptada:    "bg-blue-100 text-blue-800",
  completada:  "bg-green-100 text-green-800",
  cancelada:   "bg-red-100 text-red-800",
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props}
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] placeholder-gray-400" />
);

const Textarea = ({ ...props }) => (
  <textarea {...props} rows={3}
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1B5E20] resize-none placeholder-gray-400" />
);

// ── MÓDULO PERFIL ─────────────────────────────────────────────
const ModuloPerfil = ({ prestador, onSave, uploading, onUploadFoto }) => {
  const [form, setForm] = useState({
    nombre: prestador?.nombre || "",
    descripcion: prestador?.descripcion || "",
    descripcion_larga: prestador?.descripcion_larga || "",
    direccion: prestador?.direccion || "",
    horarios: prestador?.horarios || "",
    telefono: prestador?.telefono || "",
    whatsapp: prestador?.whatsapp || "",
    instagram: prestador?.instagram || "",
    facebook: prestador?.facebook || "",
    tiktok: prestador?.tiktok || "",
    website: prestador?.website || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/prestadores/me/perfil`, form);
      toast.success("Perfil actualizado");
      onSave();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Foto principal */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Foto del negocio</h3>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
            {prestador?.foto_url
              ? <img src={prestador.foto_url} className="w-full h-full object-cover" alt="Foto" />
              : <div className="w-full h-full flex items-center justify-center text-4xl bg-green-50">🏪</div>
            }
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Foto principal del negocio</p>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-medium hover:bg-[#145218] transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? "Subiendo..." : "Cambiar foto"}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => onUploadFoto(e.target.files[0])} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-5">Información del negocio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del negocio">
            <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="272 000 0000" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="52272 000 0000" />
          </Field>
          <Field label="Horarios">
            <Input value={form.horarios} onChange={e => setForm({...form, horarios: e.target.value})} placeholder="Lun–Dom 8:00–20:00" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dirección">
              <Input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción corta">
              <Textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                placeholder="Describe tu negocio en 2-3 oraciones..." />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Historia / Descripción larga">
              <Textarea rows={5} value={form.descripcion_larga}
                onChange={e => setForm({...form, descripcion_larga: e.target.value})}
                placeholder="Cuenta la historia de tu negocio, lo que te hace especial..." />
            </Field>
          </div>
        </div>
      </div>

      {/* Redes sociales */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-5">Redes sociales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "instagram", label: "Instagram", icon: "📸", ph: "@tunegocio" },
            { key: "facebook",  label: "Facebook",  icon: "📘", ph: "facebook.com/tunegocio" },
            { key: "tiktok",    label: "TikTok",    icon: "🎵", ph: "@tunegocio" },
            { key: "website",   label: "Sitio web", icon: "🌐", ph: "www.tunegocio.com" },
          ].map(({ key, label, icon, ph }) => (
            <Field key={key} label={`${icon} ${label}`}>
              <Input value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={ph} />
            </Field>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3.5 rounded-xl bg-[#1B5E20] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#145218] transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar cambios
      </button>
    </div>
  );
};

// ── MÓDULO GALERÍA ────────────────────────────────────────────
const ModuloGaleria = ({ prestadorId }) => {
  const [imagenes, setImagenes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState("general");
  const CATEGORIAS = ["general", "habitaciones", "comida", "tours", "vehiculos", "instalaciones"];

  useEffect(() => { fetchImagenes(); }, [prestadorId]);

  const fetchImagenes = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/imagenes`);
    setImagenes(data.imagenes || []);
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/upload`, fd);
      await axios.post(`${API}/prestadores/${prestadorId}/imagenes`, { url: up.url, categoria });
      toast.success("Imagen agregada");
      fetchImagenes();
    } catch { toast.error("Error subiendo imagen"); }
    finally { setUploading(false); }
  };

  const setPortada = async (id) => {
    await axios.put(`${API}/prestadores/imagenes/${id}/portada`);
    toast.success("Portada actualizada");
    fetchImagenes();
  };

  const deleteImg = async (id) => {
    await axios.delete(`${API}/prestadores/imagenes/${id}`);
    setImagenes(prev => prev.filter(i => i.id !== id));
    toast.success("Imagen eliminada");
  };

  const filtered = categoria === "general" ? imagenes : imagenes.filter(i => i.categoria === categoria);

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Subir nueva imagen</h3>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={categoria} onChange={e => setCategoria(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold hover:bg-[#145218] transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? "Subiendo..." : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])} disabled={uploading} />
          </label>
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap gap-2">
          {["general", ...CATEGORIAS.slice(1)].map(c => (
            <button key={c} onClick={() => setCategoria(c)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                categoria === c ? "bg-[#1B5E20] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{c} {c === "general" ? `(${imagenes.length})` : `(${imagenes.filter(i => i.categoria === c).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(img => (
          <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {img.es_portada && (
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full">
                Portada
              </span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {!img.es_portada && (
                <button onClick={() => setPortada(img.id)}
                  className="text-xs bg-amber-400 text-amber-900 px-3 py-1.5 rounded-lg font-semibold">
                  ⭐ Portada
                </button>
              )}
              <button onClick={() => deleteImg(img.id)}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 text-center py-16 text-gray-400">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay imágenes en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MÓDULO SERVICIOS ──────────────────────────────────────────
const ModuloServicios = ({ prestadorId }) => {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", precio_promocional: "", duracion: "", capacidad: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchServicios(); }, [prestadorId]);

  const fetchServicios = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/servicios`);
    setServicios(data.servicios || []);
  };

  const save = async () => {
    if (!form.nombre || !form.precio) return toast.error("Nombre y precio requeridos");
    setSaving(true);
    try {
      const payload = {
        ...form,
        precio: parseFloat(form.precio),
        precio_promocional: form.precio_promocional ? parseFloat(form.precio_promocional) : null,
        capacidad: form.capacidad ? parseInt(form.capacidad) : null,
      };
      if (editId) {
        await axios.put(`${API}/prestadores/servicios/${editId}`, payload);
        toast.success("Servicio actualizado");
      } else {
        await axios.post(`${API}/prestadores/${prestadorId}/servicios`, payload);
        toast.success("Servicio creado");
      }
      setForm({ nombre: "", descripcion: "", precio: "", precio_promocional: "", duracion: "", capacidad: "" });
      setShowForm(false); setEditId(null);
      fetchServicios();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    await axios.delete(`${API}/prestadores/servicios/${id}`);
    setServicios(prev => prev.filter(s => s.id !== id));
    toast.success("Eliminado");
  };

  const edit = (s) => {
    setForm({ nombre: s.nombre, descripcion: s.descripcion || "", precio: s.precio.toString(),
      precio_promocional: s.precio_promocional?.toString() || "", duracion: s.duracion || "", capacidad: s.capacidad?.toString() || "" });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Servicios y precios</h3>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold hover:bg-[#145218] transition-colors">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 border-2 border-[#1B5E20]/30">
          <h4 className="font-semibold text-gray-900 mb-4">{editId ? "Editar servicio" : "Nuevo servicio"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <Field label="Nombre del servicio">
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Tour al volcán" />
              </Field>
            </div>
            <Field label="Precio (MXN)">
              <Input type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="800" />
            </Field>
            <Field label="Precio promocional (opcional)">
              <Input type="number" value={form.precio_promocional} onChange={e => setForm({...form, precio_promocional: e.target.value})} placeholder="650" />
            </Field>
            <Field label="Duración">
              <Input value={form.duracion} onChange={e => setForm({...form, duracion: e.target.value})} placeholder="2 horas" />
            </Field>
            <Field label="Capacidad (personas)">
              <Input type="number" value={form.capacidad} onChange={e => setForm({...form, capacidad: e.target.value})} placeholder="10" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción">
                <Textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Describe el servicio..." />
              </Field>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#145218] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? "Actualizar" : "Crear servicio"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {servicios.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">💰</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{s.nombre}</p>
                {!s.disponible && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">No disponible</span>}
              </div>
              {s.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.descripcion}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {s.duracion && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duracion}</span>}
                {s.capacidad && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.capacidad}p</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {s.precio_promocional ? (
                <>
                  <p className="text-xs text-gray-400 line-through">${s.precio}</p>
                  <p className="font-bold text-[#1B5E20]">${s.precio_promocional} MXN</p>
                </>
              ) : (
                <p className="font-bold text-gray-900">${s.precio} MXN</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => edit(s)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => del(s.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {servicios.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aún no tienes servicios. ¡Crea tu primer servicio!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MÓDULO RESERVAS ───────────────────────────────────────────
const ModuloReservas = ({ prestadorId }) => {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReservas(); }, [prestadorId, filtro]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/prestadores/${prestadorId}/reservas`, { params: { estado: filtro } });
      setReservas(data.reservas || []);
    } finally { setLoading(false); }
  };

  const actualizarEstado = async (id, estado) => {
    await axios.put(`${API}/reservas/${id}/estado`, { estado });
    toast.success(`Reserva ${estado}`);
    fetchReservas();
  };

  const ESTADOS = ["pendiente", "aceptada", "completada", "cancelada"];

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              filtro === e ? "bg-[#1B5E20] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>{e}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No hay reservas {filtro === "pendiente" ? "pendientes" : `con estado "${filtro}"`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.turista_nombre}</p>
                  <p className="text-xs text-gray-500">{r.turista_email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.fecha_reserva}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.num_personas} personas</span>
                  </div>
                  {r.nota_turista && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 px-2 py-1 rounded-lg">💬 {r.nota_turista}</p>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${ESTADO_COLORS[r.estado]}`}>
                  {r.estado}
                </span>
              </div>
              {r.estado === "pendiente" && (
                <div className="flex gap-2">
                  <button onClick={() => actualizarEstado(r.id, "aceptada")}
                    className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Aceptar
                  </button>
                  <button onClick={() => actualizarEstado(r.id, "cancelada")}
                    className="flex-1 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              )}
              {r.estado === "aceptada" && (
                <button onClick={() => actualizarEstado(r.id, "completada")}
                  className="w-full py-2 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition-colors">
                  ✓ Marcar completada
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── MÓDULO MENÚ ───────────────────────────────────────────────
const ModuloMenu = ({ prestadorId }) => {
  const [categorias, setCategorias] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [newItem, setNewItem] = useState({ categoria_id: "", nombre: "", descripcion: "", precio: "", disponible: true });
  const [showItemForm, setShowItemForm] = useState(null); // categoria_id activa

  useEffect(() => { fetchMenu(); }, [prestadorId]);

  const fetchMenu = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/menu`);
    setCategorias(data.categorias || []);
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    await axios.post(`${API}/prestadores/${prestadorId}/menu/categorias`, { nombre: newCat, orden: categorias.length });
    setNewCat(""); fetchMenu();
  };

  const addItem = async (catId) => {
    if (!newItem.nombre || !newItem.precio) return toast.error("Nombre y precio requeridos");
    await axios.post(`${API}/menu/items`, { ...newItem, categoria_id: catId, precio: parseFloat(newItem.precio) });
    setNewItem({ categoria_id: "", nombre: "", descripcion: "", precio: "", disponible: true });
    setShowItemForm(null); fetchMenu(); toast.success("Platillo agregado");
  };

  const toggleDisponible = async (itemId, disponible) => {
    await axios.put(`${API}/menu/items/${itemId}`, { disponible: !disponible });
    fetchMenu();
  };

  const delItem = async (itemId) => {
    await axios.delete(`${API}/menu/items/${itemId}`);
    fetchMenu();
  };

  const delCat = async (catId) => {
    if (!confirm("¿Eliminar categoría y todos sus platillos?")) return;
    await axios.delete(`${API}/menu/categorias/${catId}`);
    fetchMenu();
  };

  return (
    <div className="space-y-5">
      {/* Nueva categoría */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3">
        <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nueva categoría (ej: Desayunos)" />
        <button onClick={addCat} className="px-4 py-2.5 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold whitespace-nowrap hover:bg-[#145218] transition-colors">
          + Categoría
        </button>
      </div>

      {categorias.map(cat => (
        <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900">🍽️ {cat.nombre}</h4>
            <div className="flex gap-2">
              <button onClick={() => setShowItemForm(showItemForm === cat.id ? null : cat.id)}
                className="text-xs px-3 py-1.5 bg-[#1B5E20] text-white rounded-lg font-medium hover:bg-[#145218]">
                + Platillo
              </button>
              <button onClick={() => delCat(cat.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                Eliminar
              </button>
            </div>
          </div>

          {showItemForm === cat.id && (
            <div className="p-4 bg-green-50 border-b border-green-100">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <Input value={newItem.nombre} onChange={e => setNewItem({...newItem, nombre: e.target.value})} placeholder="Nombre del platillo" />
                </div>
                <Input type="number" value={newItem.precio} onChange={e => setNewItem({...newItem, precio: e.target.value})} placeholder="Precio MXN" />
                <Input value={newItem.descripcion} onChange={e => setNewItem({...newItem, descripcion: e.target.value})} placeholder="Descripción corta" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addItem(cat.id)} className="flex-1 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-bold hover:bg-[#145218]">Agregar</button>
                <button onClick={() => setShowItemForm(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {cat.items?.map(item => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${!item.disponible ? "opacity-50" : ""}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                  {item.descripcion && <p className="text-xs text-gray-500">{item.descripcion}</p>}
                </div>
                <span className="font-bold text-gray-900 text-sm">${item.precio}</span>
                <button onClick={() => toggleDisponible(item.id, item.disponible)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.disponible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.disponible ? "Disponible" : "Agotado"}
                </button>
                <button onClick={() => delItem(item.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!cat.items || cat.items.length === 0) && (
              <p className="text-center py-4 text-xs text-gray-400">Sin platillos en esta categoría</p>
            )}
          </div>
        </div>
      ))}

      {categorias.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Utensils className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Crea tu primera categoría para empezar tu menú</p>
        </div>
      )}
    </div>
  );
};

// ── MÓDULO HABITACIONES ───────────────────────────────────────
const ModuloHabitaciones = ({ prestadorId }) => {
  const [habs, setHabs] = useState([]);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio_noche: "", capacidad: "2", amenidades: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchHabs(); }, [prestadorId]);

  const fetchHabs = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/habitaciones`);
    setHabs(data.habitaciones || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/prestadores/${prestadorId}/habitaciones`, {
        ...form,
        precio_noche: parseFloat(form.precio_noche),
        capacidad: parseInt(form.capacidad),
        amenidades: form.amenidades ? form.amenidades.split(",").map(a => a.trim()) : [],
      });
      toast.success("Habitación creada");
      setShowForm(false); setForm({ nombre: "", descripcion: "", precio_noche: "", capacidad: "2", amenidades: "" });
      fetchHabs();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Habitaciones</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nueva habitación
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 border-2 border-[#1B5E20]/30">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2"><Field label="Nombre"><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Suite" /></Field></div>
            <Field label="Precio/noche (MXN)"><Input type="number" value={form.precio_noche} onChange={e => setForm({...form, precio_noche: e.target.value})} /></Field>
            <Field label="Capacidad (personas)"><Input type="number" value={form.capacidad} onChange={e => setForm({...form, capacidad: e.target.value})} /></Field>
            <div className="col-span-2"><Field label="Amenidades (separadas por coma)"><Input value={form.amenidades} onChange={e => setForm({...form, amenidades: e.target.value})} placeholder="WiFi, A/C, TV, Jacuzzi" /></Field></div>
            <div className="col-span-2"><Field label="Descripción"><Textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></Field></div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Crear
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {habs.map(h => (
          <div key={h.id} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-gray-900">🛏️ {h.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{h.descripcion}</p>
              </div>
              <button onClick={async () => { await axios.delete(`${API}/habitaciones/${h.id}`); fetchHabs(); }}
                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{h.capacidad} personas</span>
              <span className="font-bold text-gray-900">${h.precio_noche}/noche</span>
            </div>
            {h.amenidades?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {h.amenidades.map(a => <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MÓDULO PROMOCIONES ────────────────────────────────────────
const ModuloPromociones = ({ prestadorId }) => {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ titulo: "", descripcion: "", descuento_pct: "", fecha_inicio: "", fecha_fin: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPromos(); }, [prestadorId]);

  const fetchPromos = async () => {
    const { data } = await axios.get(`${API}/prestadores/${prestadorId}/promociones`);
    setPromos(data.promociones || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/prestadores/${prestadorId}/promociones`, {
        ...form, descuento_pct: parseInt(form.descuento_pct)
      });
      toast.success("Promoción creada"); setShowForm(false);
      setForm({ titulo: "", descripcion: "", descuento_pct: "", fecha_inicio: "", fecha_fin: "" });
      fetchPromos();
    } catch { toast.error("Error guardando"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Promociones y ofertas</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold hover:bg-[#145218]">
          <Plus className="w-4 h-4" /> Nueva promo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 border-2 border-[#1B5E20]/30">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2"><Field label="Título"><Input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="10% descuento fin de semana" /></Field></div>
            <Field label="Descuento (%)"><Input type="number" value={form.descuento_pct} onChange={e => setForm({...form, descuento_pct: e.target.value})} placeholder="10" /></Field>
            <Field label="Descripción"><Input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></Field>
            <Field label="Fecha inicio"><Input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} /></Field>
            <Field label="Fecha fin"><Input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} /></Field>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Crear promoción
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promos.map(p => (
          <div key={p.id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 relative">
            <span className="absolute top-3 right-3 text-2xl font-black text-amber-500">{p.descuento_pct}%</span>
            <p className="font-bold text-gray-900 mb-1">🎁 {p.titulo}</p>
            {p.descripcion && <p className="text-xs text-gray-600 mb-2">{p.descripcion}</p>}
            <p className="text-xs text-gray-500">{p.fecha_inicio} → {p.fecha_fin}</p>
            <button onClick={async () => { await axios.delete(`${API}/promociones/${p.id}`); fetchPromos(); }}
              className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MÓDULO ANALÍTICAS ─────────────────────────────────────────
const ModuloAnaliticas = ({ prestadorId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await axios.get(`${API}/prestadores/${prestadorId}/analiticas`);
        setData(d);
      } finally { setLoading(false); }
    };
    fetch();
  }, [prestadorId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const stats = [
    { label: "Visitas al perfil",   value: data?.visitas || 0,                    icon: Eye,          color: "bg-blue-50 text-blue-700" },
    { label: "Clicks en contacto",  value: data?.contactos || 0,                  icon: Phone,        color: "bg-green-50 text-green-700" },
    { label: "Reservas totales",    value: data?.reservas?.total || 0,            icon: Calendar,     color: "bg-purple-50 text-purple-700" },
    { label: "Reservas pendientes", value: data?.reservas?.pendientes || 0,       icon: AlertCircle,  color: "bg-amber-50 text-amber-700" },
    { label: "Completadas",         value: data?.reservas?.completadas || 0,      icon: CheckCircle,  color: "bg-emerald-50 text-emerald-700" },
    { label: "Período analizado",   value: `${data?.periodo_dias || 30} días`,    icon: TrendingUp,   color: "bg-gray-50 text-gray-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {data?.ultimas_resenas?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Últimas reseñas</h3>
          <div className="space-y-3">
            {data.ultimas_resenas.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex">
                  {[...Array(r.calificacion)].map((_, s) => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-current" />)}
                  {[...Array(5 - r.calificacion)].map((_, s) => <Star key={s} className="w-3.5 h-3.5 text-gray-300" />)}
                </div>
                {r.texto && <p className="text-xs text-gray-600 flex-1">{r.texto}</p>}
                <span className="text-[11px] text-gray-400 flex-shrink-0">{r.fecha?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────
const PrestadorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("perfil");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    fetchPrestador();
  }, [isAuthenticated]);

  const fetchPrestador = async () => {
    try {
      const { data } = await axios.get(`${API}/prestadores/me`);
      setPrestador(data);
    } catch {
      toast.error("No tienes un perfil de prestador");
    } finally { setLoading(false); }
  };

  const uploadFoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data: up } = await axios.post(`${API}/upload`, fd);
      await axios.put(`${API}/prestadores/${prestador.id}`, { foto_url: up.url });
      toast.success("Foto actualizada");
      fetchPrestador();
    } catch { toast.error("Error subiendo foto"); }
    finally { setUploading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <Loader2 className="w-10 h-10 animate-spin text-[#1B5E20]" />
    </div>
  );

  if (!prestador) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] p-8 text-center">
      <div className="text-5xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes un perfil de prestador</h2>
      <p className="text-gray-500 text-sm mb-6">Contacta al administrador para activar tu cuenta de prestador.</p>
    </div>
  );

  const tipoConfig = TIPOS_PRESTADOR[prestador.tipo] || TIPOS_PRESTADOR.default;
  const tabs = tipoConfig.tabs;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
            {prestador.foto_url
              ? <img src={prestador.foto_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center text-2xl bg-green-50">🏪</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-gray-900 text-lg truncate">{prestador.nombre}</h1>
              {prestador.verificado && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 capitalize">{tipoConfig.label} · Panel de gestión</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto scrollbar-hide">
          {tabs.map(t => {
            const { icon, label } = TAB_LABELS[t] || { icon: "•", label: t };
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-3 whitespace-nowrap text-sm border-b-2 transition-all flex-shrink-0 font-medium ${
                  tab === t ? "border-[#1B5E20] text-[#1B5E20] font-semibold" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}>
                <span>{icon}</span> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>

        {tab === "perfil"       && <ModuloPerfil prestador={prestador} onSave={fetchPrestador} uploading={uploading} onUploadFoto={uploadFoto} />}
        {tab === "galeria"      && <ModuloGaleria prestadorId={prestador.id} />}
        {tab === "servicios"    && <ModuloServicios prestadorId={prestador.id} />}
        {tab === "reservas"     && <ModuloReservas prestadorId={prestador.id} />}
        {tab === "menu"         && <ModuloMenu prestadorId={prestador.id} />}
        {tab === "habitaciones" && <ModuloHabitaciones prestadorId={prestador.id} />}
        {tab === "flota"        && <div className="text-center py-16 text-gray-400"><Car className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm">Módulo de flota — próximamente</p></div>}
        {tab === "promociones"  && <ModuloPromociones prestadorId={prestador.id} />}
        {tab === "resenas"      && <div className="text-center py-16 text-gray-400"><Star className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-sm">Reseñas y calificaciones — próximamente</p></div>}
        {tab === "analiticas"   && <ModuloAnaliticas prestadorId={prestador.id} />}
      </main>
    </div>
  );
};

export default PrestadorDashboard;