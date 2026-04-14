import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import {
  MapPin, Upload, FileText, Phone, Mail, Building2, Clock,
  Loader2, CheckCircle, ChevronRight, ChevronLeft, X, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TIPOS_SERVICIO = [
  { value: "HOSPEDAJE", label: "Hospedaje", subtipos: ["Hotel", "Hostal", "Airbnb", "Cabaña", "Campamento"] },
  { value: "GASTRONOMIA", label: "Gastronomia", subtipos: ["Restaurante", "Cafetería", "Bar", "Fonda", "Food Truck"] },
  { value: "TURISMO", label: "Turismo", subtipos: ["Tour operador", "Guía turístico", "Agencia de viajes", "Ecoturismo"] },
  { value: "TRANSPORTE", label: "Transporte", subtipos: ["Taxi", "Renta de autos", "Lancha", "Autobús turístico"] },
  { value: "COMERCIO", label: "Comercio", subtipos: ["Artesanías", "Souvenirs", "Mercado local", "Tienda"] },
  { value: "ENTRETENIMIENTO", label: "Entretenimiento", subtipos: ["Parque temático", "Museo", "Teatro", "Club"] },
  { value: "SALUD", label: "Salud y Bienestar", subtipos: ["Spa", "Clínica", "Farmacia", "Temazcal"] },
  { value: "OTROS", label: "Otros", subtipos: ["Otro"] },
];

const PrestadorRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [form, setForm] = useState({
    nombre_negocio: "",
    tipo: "",
    subtipo: "",
    municipio_id: "",
    descripcion: "",
    telefono: "",
    whatsapp: "",
    horarios: "",
    direccion: "",
    nombre_contacto: "",
    email_contacto: "",
    documentos: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const res = await axios.get(`${API}/municipios`, { params: { limit: 300 } });
        setMunicipios(res.data.municipios || []);
      } catch (err) {
        console.error("Error loading municipios:", err);
      }
    };
    fetchMunicipios();
  }, []);

  const selectedTipo = TIPOS_SERVICIO.find(t => t.value === form.tipo);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.nombre_negocio.trim()) e.nombre_negocio = "Requerido";
    if (!form.tipo) e.tipo = "Selecciona un tipo";
    if (!form.municipio_id) e.municipio_id = "Selecciona un municipio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.nombre_contacto.trim()) e.nombre_contacto = "Requerido";
    if (!form.email_contacto.trim()) e.email_contacto = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_contacto)) e.email_contacto = "Email inválido";
    if (!form.telefono.trim()) e.telefono = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande (max 10MB)`);
        continue;
      }

      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post(`${API}/public/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setForm(prev => ({
          ...prev,
          documentos: [...prev.documentos, {
            path: res.data.path,
            url: res.data.url,
            filename: res.data.filename || file.name,
            content_type: res.data.content_type,
          }],
        }));
        toast.success(`${file.name} subido`);
      } catch (err) {
        toast.error(`Error al subir ${file.name}`);
      } finally {
        setUploadingFile(false);
      }
    }
    e.target.value = "";
  };

  const removeDocument = (index) => {
    setForm(prev => ({
      ...prev,
      documentos: prev.documentos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/prestadores/register`, {
        ...form,
        documentos: form.documentos.map(d => d.url || d.path || d),
      });
      setSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail || "Error al enviar solicitud";
      toast.error(typeof detail === "string" ? detail : "Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6" data-testid="registration-success">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display' }}>
            Solicitud Enviada
          </h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud ha sido recibida. El equipo de Veracruz Contigo revisará tu información
            y documentos. Recibirás un correo electrónico con tus credenciales de acceso
            una vez que tu cuenta sea aprobada.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 font-medium mb-1">Datos de tu solicitud:</p>
            <p className="text-sm text-blue-700">Negocio: {form.nombre_negocio}</p>
            <p className="text-sm text-blue-700">Email: {form.email_contacto}</p>
            <p className="text-sm text-blue-700">Documentos: {form.documentos.length} archivo(s)</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="outline">Volver al inicio</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-[#1B5E20] hover:bg-[#145218]">Iniciar sesión</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="prestador-registration">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1B5E20] rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Veracruz Contigo
            </span>
          </Link>
          <Link to="/login" className="text-sm text-[#0277BD] hover:underline">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display' }}>
            Registro de Prestador de Servicios
          </h1>
          <p className="text-gray-600">
            Registra tu negocio en la plataforma oficial de turismo de Veracruz
          </p>
        </div>

        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                step >= s ? "bg-[#1B5E20] text-white" : "bg-gray-200 text-gray-500"
              }`} data-testid={`step-indicator-${s}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-[#1B5E20]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-6" data-testid="step-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Información del negocio</h2>
                <p className="text-sm text-gray-500">Cuéntanos sobre tu servicio turístico</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nombre del negocio *</Label>
                  <Input value={form.nombre_negocio} onChange={(e) => updateForm("nombre_negocio", e.target.value)} placeholder="Ej: Hotel Vista al Mar" data-testid="input-nombre-negocio" />
                  {errors.nombre_negocio && <p className="text-red-500 text-xs mt-1">{errors.nombre_negocio}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de servicio *</Label>
                    <Select value={form.tipo} onValueChange={(v) => { updateForm("tipo", v); updateForm("subtipo", ""); }}>
                      <SelectTrigger data-testid="select-tipo"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_SERVICIO.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
                  </div>
                  <div>
                    <Label>Subtipo</Label>
                    <Select value={form.subtipo} onValueChange={(v) => updateForm("subtipo", v)} disabled={!selectedTipo}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar subtipo" /></SelectTrigger>
                      <SelectContent>
                        {selectedTipo?.subtipos.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Municipio *</Label>
                  <Select value={form.municipio_id} onValueChange={(v) => updateForm("municipio_id", v)}>
                    <SelectTrigger data-testid="select-municipio"><SelectValue placeholder="Seleccionar municipio" /></SelectTrigger>
                    <SelectContent>
                      {municipios.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.region})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.municipio_id && <p className="text-red-500 text-xs mt-1">{errors.municipio_id}</p>}
                </div>
                <div>
                  <Label>Descripción del servicio</Label>
                  <Textarea value={form.descripcion} onChange={(e) => updateForm("descripcion", e.target.value)} placeholder="Describe tu negocio, servicios ofrecidos, especialidades..." rows={4} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Horarios de atención</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={form.horarios} onChange={(e) => updateForm("horarios", e.target.value)} placeholder="Lun-Vie 9:00-18:00" className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={form.direccion} onChange={(e) => updateForm("direccion", e.target.value)} placeholder="Calle, Número, Colonia" className="pl-10" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => { if (validateStep1()) setStep(2); }} className="bg-[#1B5E20] hover:bg-[#145218]" data-testid="next-step-1">
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6" data-testid="step-2">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Información de contacto</h2>
                <p className="text-sm text-gray-500">Datos del responsable y contacto del negocio</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nombre completo del responsable *</Label>
                  <Input value={form.nombre_contacto} onChange={(e) => updateForm("nombre_contacto", e.target.value)} placeholder="Nombre completo" data-testid="input-nombre-contacto" />
                  {errors.nombre_contacto && <p className="text-red-500 text-xs mt-1">{errors.nombre_contacto}</p>}
                </div>
                <div>
                  <Label>Correo electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="email" value={form.email_contacto} onChange={(e) => updateForm("email_contacto", e.target.value)} placeholder="tu@email.com" className="pl-10" data-testid="input-email-contacto" />
                  </div>
                  {errors.email_contacto && <p className="text-red-500 text-xs mt-1">{errors.email_contacto}</p>}
                  <p className="text-xs text-gray-400 mt-1">Se usará para crear tu cuenta de acceso</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={form.telefono} onChange={(e) => updateForm("telefono", e.target.value)} placeholder="229-123-4567" className="pl-10" data-testid="input-telefono" />
                    </div>
                    {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={(e) => updateForm("whatsapp", e.target.value)} placeholder="522291234567" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
                <Button onClick={() => { if (validateStep2()) setStep(3); }} className="bg-[#1B5E20] hover:bg-[#145218]" data-testid="next-step-2">
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6" data-testid="step-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Documentos y certificados</h2>
                <p className="text-sm text-gray-500">Sube los documentos que acrediten tu negocio (licencias, permisos, certificados, etc.)</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#1B5E20] transition-colors">
                <input type="file" id="file-upload" className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFileUpload} data-testid="file-upload-input" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadingFile ? (
                    <Loader2 className="w-12 h-12 text-[#1B5E20] animate-spin mx-auto mb-3" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  )}
                  <p className="text-gray-700 font-medium">{uploadingFile ? "Subiendo archivo..." : "Haz clic para subir documentos"}</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG, PDF, DOC (max 10MB por archivo)</p>
                </label>
              </div>
              {form.documentos.length > 0 && (
                <div className="space-y-2">
                  <Label>Documentos subidos ({form.documentos.length})</Label>
                  {form.documentos.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#0277BD]" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{doc.filename || doc}</p>
                          <p className="text-xs text-gray-400">{doc.content_type || ""}</p>
                        </div>
                      </div>
                      <button onClick={() => removeDocument(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Documentos recomendados:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                    <li>Licencia de funcionamiento municipal</li>
                    <li>Registro ante SECTUR (si aplica)</li>
                    <li>INE del representante legal</li>
                    <li>Comprobante de domicilio</li>
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Resumen de tu solicitud</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Negocio:</span><span className="font-medium">{form.nombre_negocio}</span>
                  <span className="text-gray-500">Tipo:</span><span className="font-medium">{form.tipo}{form.subtipo ? ` - ${form.subtipo}` : ""}</span>
                  <span className="text-gray-500">Responsable:</span><span className="font-medium">{form.nombre_contacto}</span>
                  <span className="text-gray-500">Email:</span><span className="font-medium">{form.email_contacto}</span>
                  <span className="text-gray-500">Teléfono:</span><span className="font-medium">{form.telefono}</span>
                  <span className="text-gray-500">Documentos:</span><span className="font-medium">{form.documentos.length} archivo(s)</span>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Anterior</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-[#1B5E20] hover:bg-[#145218]" data-testid="submit-registration">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Enviar solicitud
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrestadorRegistration;