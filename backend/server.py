from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Header, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import jwt
import requests
import re

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_change_me')
JWT_ALGORITHM = "HS256"

# Object Storage Config
APP_NAME = "veracruz-contigo"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Veracruz Contigo API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== PYDANTIC MODELS ==============

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    nombre: str
    foto_url: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    nombre: str
    rol: str = "turista"
    municipio_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    nombre: str
    foto_url: Optional[str] = None
    rol: str
    municipio_id: Optional[str] = None
    activo: bool = True
    fecha_registro: Optional[str] = None

class MunicipioBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    slug: str
    region: str
    descripcion: Optional[str] = None
    historia: Optional[str] = None
    que_hacer: List[str] = []
    como_llegar: Optional[str] = None
    clima: Optional[str] = None
    altitud: Optional[str] = None
    tags: List[str] = []
    foto_portada_url: Optional[str] = None
    fotos: List[Dict[str, Any]] = []
    videos: List[str] = []
    pueblo_magico: bool = False
    encargado_id: Optional[str] = None
    estado: str = "sin_configurar"
    lat: float
    lng: float
    visitas_total: int = 0

class MunicipioUpdate(BaseModel):
    descripcion: Optional[str] = None
    historia: Optional[str] = None
    que_hacer: Optional[List[str]] = None
    como_llegar: Optional[str] = None
    clima: Optional[str] = None
    altitud: Optional[str] = None
    tags: Optional[List[str]] = None
    foto_portada_url: Optional[str] = None
    fotos: Optional[List[Dict[str, Any]]] = None
    videos: Optional[List[str]] = None
    estado: Optional[str] = None

class PrestadorBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    tipo: str
    subtipo: Optional[str] = None
    municipio_id: str
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    horarios: Optional[str] = None
    direccion: Optional[str] = None
    calificacion_promedio: float = 0.0
    total_resenas: int = 0
    verificado: bool = False
    activo: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None
    propuesto_por_id: Optional[str] = None
    aprobado_por_id: Optional[str] = None
    user_id: Optional[str] = None

class PrestadorCreate(BaseModel):
    nombre: str
    tipo: str
    subtipo: Optional[str] = None
    municipio_id: str
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    horarios: Optional[str] = None
    direccion: Optional[str] = None

class EventoBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    municipio_id: str
    fecha_inicio: str
    fecha_fin: Optional[str] = None
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None
    tipo: str
    lugar: Optional[str] = None
    link_externo: Optional[str] = None
    publicado: bool = False
    created_by: Optional[str] = None

class EventoCreate(BaseModel):
    nombre: str
    municipio_id: str
    fecha_inicio: str
    fecha_fin: Optional[str] = None
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None
    tipo: str
    lugar: Optional[str] = None
    link_externo: Optional[str] = None
    publicado: bool = False

class AlertaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    titulo: str
    descripcion: str
    tipo: str
    municipios_afectados: List[str] = []
    activa: bool = True
    fecha_inicio: str
    fecha_fin: Optional[str] = None
    creada_por: Optional[str] = None

class AlertaCreate(BaseModel):
    titulo: str
    descripcion: str
    tipo: str
    municipios_afectados: List[str] = []
    fecha_fin: Optional[str] = None

class EmergenciaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    nombre_turista: str
    email_turista: Optional[str] = None
    lat: float
    lng: float
    timestamp: str
    estado: str = "activa"
    resuelta_por: Optional[str] = None
    notas_resolucion: Optional[str] = None

class EmergenciaCreate(BaseModel):
    lat: float
    lng: float

class ResenaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    turista_id: str
    prestador_id: str
    calificacion: int
    texto: Optional[str] = None
    fecha: str
    editada: bool = False

class ResenaCreate(BaseModel):
    prestador_id: str
    calificacion: int
    texto: Optional[str] = None

class FavoritoBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    tipo: str
    referencia_id: str
    fecha: str

class SolicitudPrestadorBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    datos_prestador: Dict[str, Any]
    municipio_id: str
    encargado_id: str
    estado: str = "pendiente"
    comentario_admin: Optional[str] = None
    fecha_solicitud: str
    fecha_resolucion: Optional[str] = None


class LugarBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    slug: str
    region: str
    municipio: str
    tipo: str
    descripcion: str
    descripcion_larga: Optional[str] = None
    historia: Optional[str] = None
    horarios: Optional[str] = None
    costo: Optional[str] = None
    costo_min: Optional[int] = None
    costo_max: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    fotos: List[str] = []
    foto_portada: Optional[str] = None
    tags: List[str] = []
    calificacion: Optional[float] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    web: Optional[str] = None
    destacado: bool = False

class RutaTuristicaBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    slug: str
    region: str
    descripcion: str
    descripcion_larga: Optional[str] = None
    dias_recomendados: int
    distancia_km: Optional[int] = None
    dificultad: str
    costo_estimado_min: int
    costo_estimado_max: int
    mejor_epoca: Optional[str] = None
    como_llegar: Optional[str] = None
    foto_portada: Optional[str] = None
    paradas: List[str] = []
    tags: List[str] = []
    activa: bool = True

class PaqueteRegionalBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    region: str
    descripcion: str
    dias: int
    precio_min: int
    precio_max: int
    incluye: List[str] = []
    no_incluye: List[str] = []
    hoteles: List[Dict[str, Any]] = []
    restaurantes: List[Dict[str, Any]] = []
    actividades: List[str] = []
    lugar_ids: List[str] = []
    foto_portada: Optional[str] = None
    activo: bool = True

class ItinerarioRequest(BaseModel):
    region: str
    dias: int
    presupuesto: str
    intereses: List[str] = []
    num_personas: int = 2

# ============== MODELOS PRESTADOR COMPLETO ==============

class PrestadorImagenCreate(BaseModel):
    url: str
    categoria: Optional[str] = "general"   # general|habitaciones|comida|tours|vehiculos
    es_portada: bool = False

class ServicioPrestadorCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    precio_promocional: Optional[float] = None
    duracion: Optional[str] = None          # "2h", "1 día"
    capacidad: Optional[int] = None
    fotos: List[str] = []
    disponible: bool = True
    tipo_prestador: Optional[str] = None   # tour|transporte|hospedaje|restaurante

class ReservaCreate(BaseModel):
    prestador_id: str
    servicio_id: Optional[str] = None
    fecha_reserva: str                     # ISO date
    num_personas: int = 1
    nota_turista: Optional[str] = None

class MenuCategoriaCreate(BaseModel):
    nombre: str                            # Desayunos | Comidas | Bebidas | Postres
    orden: int = 0

class MenuItemCreate(BaseModel):
    categoria_id: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    foto_url: Optional[str] = None
    disponible: bool = True

class HabitacionCreate(BaseModel):
    nombre: str                            # Sencilla | Doble | Suite
    descripcion: Optional[str] = None
    precio_noche: float
    capacidad: int = 2
    amenidades: List[str] = []
    fotos: List[str] = []
    disponible: bool = True

class FlotaCreate(BaseModel):
    nombre: str                            # Van 12 pasajeros
    descripcion: Optional[str] = None
    capacidad: int
    precio_viaje: float
    fotos: List[str] = []
    disponible: bool = True

class PromocionCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    descuento_pct: int                     # 10, 20, 50
    fecha_inicio: str
    fecha_fin: str
    activa: bool = True

class PrestadorPerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    descripcion_larga: Optional[str] = None
    direccion: Optional[str] = None
    horarios: Optional[str] = None
    # Horarios detallados por día (Lun-Dom)
    horarios_detallados: Optional[dict] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    logo_url: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    tiktok: Optional[str] = None
    website: Optional[str] = None
    # Precio
    precio_min: Optional[float] = None
    precio_max: Optional[float] = None
    # Estado en tiempo real
    esta_abierto: Optional[bool] = None
    # Menú digital (URL externa o QR)
    menu_url: Optional[str] = None
    # Perfil gastronómico (solo alimentos y bebidas)
    categoria_gastronomica: Optional[str] = None
    subcategoria_gastronomica: Optional[str] = None
    etiquetas: Optional[List[str]] = None
    momentos: Optional[List[str]] = None
    # Reservas de mesa
    reservas_mesa_activas: Optional[bool] = None
    reservas_mesa_capacidad: Optional[int] = None
    reservas_mesa_notas: Optional[str] = None
    # Pedidos por WhatsApp
    pedidos_whatsapp_activo: Optional[bool] = None
    pedidos_whatsapp_mensaje: Optional[str] = None
    # Turismo
    categoria_turismo: Optional[str] = None
    subcategoria_turismo: Optional[str] = None
    etiquetas_turismo: Optional[List[str]] = None
    amenidades_tour: Optional[List[str]] = None
    duracion_tour: Optional[str] = None
    punto_salida: Optional[str] = None
    incluye_transporte: Optional[bool] = None
    incluye_alimentacion: Optional[bool] = None
    incluye_equipo: Optional[bool] = None
    incluye_guia: Optional[bool] = None
    min_personas: Optional[int] = None
    max_personas: Optional[int] = None
    idiomas_guia: Optional[List[str]] = None
    # Transporte
    categoria_transporte: Optional[str] = None
    subcategoria_transporte: Optional[str] = None
    etiquetas_transporte: Optional[List[str]] = None
    amenidades_vehiculo: Optional[List[str]] = None
    capacidad_vehiculo: Optional[int] = None
    marca_vehiculo: Optional[str] = None
    modelo_vehiculo: Optional[str] = None
    anio_vehiculo: Optional[int] = None
    servicio_24h: Optional[bool] = None
    cobertura_zonas: Optional[str] = None
    tarifa_base: Optional[float] = None
    tarifa_por_km: Optional[float] = None
    # Servicios generales
    categoria_servicio: Optional[str] = None
    subcategoria_servicio: Optional[str] = None
    etiquetas_servicio: Optional[List[str]] = None
    modalidad_servicio: Optional[str] = None
    duracion_sesion: Optional[str] = None
    precio_sesion: Optional[float] = None
    precio_paquete: Optional[float] = None
    atiende_domicilio: Optional[bool] = None
    requiere_cita: Optional[bool] = None
    certificaciones: Optional[str] = None
    # Hospedaje
    num_habitaciones: Optional[int] = None
    num_pisos: Optional[int] = None
    anio_construccion: Optional[int] = None
    anio_renovacion: Optional[int] = None
    checkin_desde: Optional[str] = None
    checkout_hasta: Optional[str] = None
    checkin_notas: Optional[str] = None
    precio_noche_desde: Optional[float] = None
    precio_noche_hasta: Optional[float] = None
    amenidades_hotel: Optional[List[str]] = None
    etiquetas_hospedaje: Optional[List[str]] = None
    politica_cancelacion: Optional[str] = None
    politica_mascotas: Optional[bool] = None
    politica_menores: Optional[str] = None
    reservas_activas: Optional[bool] = None
    reservas_anticipacion_dias: Optional[str] = None
    reservas_notas: Optional[str] = None
    desayuno_incluido: Optional[bool] = None
    desayuno_precio: Optional[float] = None
    # Gastronomía extra
    tipo_bebidas: Optional[List[str]] = None
    etiquetas_bebidas: Optional[List[str]] = None
    metodos_pago: Optional[List[str]] = None
    precio_familia: Optional[float] = None
    capacidad_personas: Optional[int] = None
    # General
    foto_url: Optional[str] = None
    destacado: Optional[bool] = None
    featured: Optional[bool] = None

# Modelos para itinerarios (Diario del Viajero)
class LugarEnItinerario(BaseModel):
    lugar_id: str
    nombre: str
    tipo: str
    municipio: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    foto_portada: Optional[str] = None
    hora_visita: Optional[str] = None
    duracion_min: int = 120
    costo_estimado: int = 0
    estado: str = "pendiente"
    nota: Optional[str] = None
    fotos_usuario: List[str] = []
    incluido: bool = True

class ServicioExtra(BaseModel):
    tipo: str
    nombre: str
    descripcion: Optional[str] = None
    precio_estimado: int = 0
    incluido: bool = False

class DiarioDelDia(BaseModel):
    dia_num: int
    fecha: Optional[str] = None
    titulo: Optional[str] = None
    lugares: List[LugarEnItinerario] = []

class ItinerarioCreate(BaseModel):
    nombre: str
    region: str
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    num_personas: int = 2
    dias: List[DiarioDelDia] = []
    servicios_extra: List[ServicioExtra] = []
    costo_total_estimado: int = 0
    notas_generales: Optional[str] = None

class LugarEstadoUpdate(BaseModel):
    dia_num: int
    lugar_id: str
    estado: str
    nota: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, rol: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "rol": rol,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
        user = await db.usuarios.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

def require_role(*roles):
    async def role_checker(request: Request):
        user = await get_current_user(request)
        if user["rol"] not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta acción")
        return user
    return role_checker

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

# Object Storage Functions (Cloudinary)
import cloudinary
import cloudinary.uploader

def init_cloudinary():
    # Intenta con CLOUDINARY_URL primero
    cloudinary_url = os.environ.get("CLOUDINARY_URL", "")
    if cloudinary_url and cloudinary_url.startswith("cloudinary://"):
        # Parsear manualmente: cloudinary://api_key:api_secret@cloud_name
        rest = cloudinary_url[len("cloudinary://"):]
        credentials, cloud = rest.rsplit("@", 1)
        api_key, api_secret = credentials.split(":", 1)
        cloudinary.config(cloud_name=cloud, api_key=api_key, api_secret=api_secret)
        logger.info(f"Cloudinary configured via CLOUDINARY_URL: cloud={cloud}")
        return True
    # Fallback con variables separadas
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.environ.get("CLOUDINARY_API_KEY", "")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    logger.info(f"Cloudinary init: cloud_name='{cloud_name}' key='{api_key[:6] if api_key else ''}'")
    if not cloud_name:
        logger.warning("Cloudinary not configured")
        return False
    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
    return True

def put_object(path: str, data: bytes, content_type: str) -> dict:
    if not init_cloudinary():
        raise HTTPException(status_code=500, detail="Storage not available")
    import io
    folder = "/".join(path.split("/")[:-1])
    public_id = path.replace("/", "_").rsplit(".", 1)[0]
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=f"{APP_NAME}/{public_id}",
        resource_type="auto"
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}

def get_object_url(path: str) -> str:
    """Returns the Cloudinary URL for a given path (used for serving images)"""
    public_id = f"{APP_NAME}/{path.replace('/', '_').rsplit('.', 1)[0]}"
    return cloudinary.CloudinaryImage(public_id).build_url()

# ============== SEED DATA - 232 MUNICIPIOS DE VERACRUZ ==============

MUNICIPIOS_VERACRUZ = [
    {"nombre": "Veracruz", "region": "Centro", "lat": 19.1738, "lng": -96.1342, "pueblo_magico": False},
    {"nombre": "Xalapa", "region": "Centro", "lat": 19.5438, "lng": -96.9102, "pueblo_magico": False},
    {"nombre": "Coatepec", "region": "Centro", "lat": 19.4524, "lng": -96.9614, "pueblo_magico": True},
    {"nombre": "Xico", "region": "Centro", "lat": 19.4180, "lng": -97.0080, "pueblo_magico": True},
    {"nombre": "Papantla", "region": "Norte", "lat": 20.4547, "lng": -97.3222, "pueblo_magico": True},
    {"nombre": "Tlacotalpan", "region": "Sur", "lat": 18.6167, "lng": -95.6667, "pueblo_magico": True},
    {"nombre": "Orizaba", "region": "Centro", "lat": 18.8500, "lng": -97.1000, "pueblo_magico": True},
    {"nombre": "Córdoba", "region": "Centro", "lat": 18.8833, "lng": -96.9333, "pueblo_magico": False},
    {"nombre": "Boca del Río", "region": "Centro", "lat": 19.1000, "lng": -96.1167, "pueblo_magico": False},
    {"nombre": "Poza Rica", "region": "Norte", "lat": 20.5333, "lng": -97.4500, "pueblo_magico": False},
    {"nombre": "Tuxpan", "region": "Norte", "lat": 20.9500, "lng": -97.4000, "pueblo_magico": False},
    {"nombre": "Coscomatepec", "region": "Centro", "lat": 19.0667, "lng": -97.0500, "pueblo_magico": True},
    {"nombre": "Naolinco", "region": "Centro", "lat": 19.6500, "lng": -96.8667, "pueblo_magico": True},
    {"nombre": "Zozocolco de Hidalgo", "region": "Norte", "lat": 20.1333, "lng": -97.5833, "pueblo_magico": True},
    {"nombre": "Los Tuxtlas", "region": "Sur", "lat": 18.4833, "lng": -95.1167, "pueblo_magico": True},
    {"nombre": "Coatzacoalcos", "region": "Sur", "lat": 18.1333, "lng": -94.4500, "pueblo_magico": False},
    {"nombre": "Minatitlán", "region": "Sur", "lat": 17.9833, "lng": -94.5500, "pueblo_magico": False},
    {"nombre": "San Andrés Tuxtla", "region": "Sur", "lat": 18.4500, "lng": -95.2167, "pueblo_magico": False},
    {"nombre": "Catemaco", "region": "Sur", "lat": 18.4167, "lng": -95.1167, "pueblo_magico": False},
    {"nombre": "Fortín de las Flores", "region": "Centro", "lat": 18.9000, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Alvarado", "region": "Centro", "lat": 18.7667, "lng": -95.7667, "pueblo_magico": False},
    {"nombre": "Misantla", "region": "Norte", "lat": 19.9333, "lng": -96.8500, "pueblo_magico": False},
    {"nombre": "Martínez de la Torre", "region": "Norte", "lat": 20.0667, "lng": -97.0500, "pueblo_magico": False},
    {"nombre": "Perote", "region": "Centro", "lat": 19.5667, "lng": -97.2500, "pueblo_magico": False},
    {"nombre": "Huatusco", "region": "Centro", "lat": 19.1500, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "Acayucan", "region": "Sur", "lat": 17.9500, "lng": -94.9167, "pueblo_magico": False},
    {"nombre": "Tierra Blanca", "region": "Centro", "lat": 18.4500, "lng": -96.3500, "pueblo_magico": False},
    {"nombre": "Tantoyuca", "region": "Norte", "lat": 21.3500, "lng": -98.2333, "pueblo_magico": False},
    {"nombre": "Álamo Temapache", "region": "Norte", "lat": 20.9167, "lng": -97.6833, "pueblo_magico": False},
    {"nombre": "Naranjos Amatlán", "region": "Norte", "lat": 21.3500, "lng": -97.6833, "pueblo_magico": False},
    {"nombre": "Pánuco", "region": "Norte", "lat": 22.0500, "lng": -98.1833, "pueblo_magico": False},
    {"nombre": "Tecolutla", "region": "Norte", "lat": 20.4833, "lng": -97.0167, "pueblo_magico": False},
    {"nombre": "Nautla", "region": "Norte", "lat": 20.2167, "lng": -96.7833, "pueblo_magico": False},
    {"nombre": "Vega de Alatorre", "region": "Norte", "lat": 20.0333, "lng": -96.6500, "pueblo_magico": False},
    {"nombre": "Cazones de Herrera", "region": "Norte", "lat": 20.7000, "lng": -97.3000, "pueblo_magico": False},
    {"nombre": "Gutiérrez Zamora", "region": "Norte", "lat": 20.4500, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Espinal", "region": "Norte", "lat": 20.2667, "lng": -97.4000, "pueblo_magico": False},
    {"nombre": "Coyutla", "region": "Norte", "lat": 20.2500, "lng": -97.6500, "pueblo_magico": False},
    {"nombre": "Filomeno Mata", "region": "Norte", "lat": 20.2000, "lng": -97.7000, "pueblo_magico": False},
    {"nombre": "Mecatlán", "region": "Norte", "lat": 20.2167, "lng": -97.6667, "pueblo_magico": False},
    {"nombre": "Coahuitlán", "region": "Norte", "lat": 20.2833, "lng": -97.7167, "pueblo_magico": False},
    {"nombre": "Chumatlán", "region": "Norte", "lat": 20.1500, "lng": -97.6833, "pueblo_magico": False},
    {"nombre": "Coatzintla", "region": "Norte", "lat": 20.4833, "lng": -97.4667, "pueblo_magico": False},
    {"nombre": "Tihuatlán", "region": "Norte", "lat": 20.7167, "lng": -97.5333, "pueblo_magico": False},
    {"nombre": "Castillo de Teayo", "region": "Norte", "lat": 20.7500, "lng": -97.6333, "pueblo_magico": False},
    {"nombre": "Tepetzintla", "region": "Norte", "lat": 20.8500, "lng": -97.8333, "pueblo_magico": False},
    {"nombre": "Tlapacoyan", "region": "Norte", "lat": 19.9667, "lng": -97.2167, "pueblo_magico": False},
    {"nombre": "Jalacingo", "region": "Norte", "lat": 19.8167, "lng": -97.3000, "pueblo_magico": False},
    {"nombre": "Altotonga", "region": "Centro", "lat": 19.7667, "lng": -97.2333, "pueblo_magico": False},
    {"nombre": "Las Minas", "region": "Centro", "lat": 19.6833, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Villa Aldama", "region": "Centro", "lat": 19.6500, "lng": -97.2333, "pueblo_magico": False},
    {"nombre": "Atzalan", "region": "Norte", "lat": 19.8000, "lng": -97.2500, "pueblo_magico": False},
    {"nombre": "Tenochtitlán", "region": "Norte", "lat": 20.2333, "lng": -97.3333, "pueblo_magico": False},
    {"nombre": "Juchique de Ferrer", "region": "Norte", "lat": 19.8333, "lng": -96.7000, "pueblo_magico": False},
    {"nombre": "Yecuatla", "region": "Norte", "lat": 19.8667, "lng": -96.7833, "pueblo_magico": False},
    {"nombre": "Colipa", "region": "Norte", "lat": 19.9167, "lng": -96.7333, "pueblo_magico": False},
    {"nombre": "Chiconquiaco", "region": "Centro", "lat": 19.7500, "lng": -96.8167, "pueblo_magico": False},
    {"nombre": "Miahuatlán", "region": "Centro", "lat": 19.7000, "lng": -96.8667, "pueblo_magico": False},
    {"nombre": "Landero y Coss", "region": "Centro", "lat": 19.7167, "lng": -96.9333, "pueblo_magico": False},
    {"nombre": "Acatlán", "region": "Centro", "lat": 19.6833, "lng": -96.8500, "pueblo_magico": False},
    {"nombre": "Tonayán", "region": "Centro", "lat": 19.7167, "lng": -96.7667, "pueblo_magico": False},
    {"nombre": "Alto Lucero de Gutiérrez Barrios", "region": "Centro", "lat": 19.6167, "lng": -96.7333, "pueblo_magico": False},
    {"nombre": "Actopan", "region": "Centro", "lat": 19.5000, "lng": -96.6167, "pueblo_magico": False},
    {"nombre": "Úrsulo Galván", "region": "Centro", "lat": 19.4167, "lng": -96.3667, "pueblo_magico": False},
    {"nombre": "La Antigua", "region": "Centro", "lat": 19.3333, "lng": -96.3333, "pueblo_magico": False},
    {"nombre": "Puente Nacional", "region": "Centro", "lat": 19.3333, "lng": -96.4833, "pueblo_magico": False},
    {"nombre": "Emiliano Zapata", "region": "Centro", "lat": 19.4500, "lng": -96.7667, "pueblo_magico": False},
    {"nombre": "Apazapan", "region": "Centro", "lat": 19.3333, "lng": -96.7167, "pueblo_magico": False},
    {"nombre": "Jalcomulco", "region": "Centro", "lat": 19.3333, "lng": -96.7667, "pueblo_magico": False},
    {"nombre": "Tlaltetela", "region": "Centro", "lat": 19.3167, "lng": -96.9000, "pueblo_magico": False},
    {"nombre": "Teocelo", "region": "Centro", "lat": 19.3833, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "Cosautlán de Carvajal", "region": "Centro", "lat": 19.3500, "lng": -96.9833, "pueblo_magico": False},
    {"nombre": "Ixhuacán de los Reyes", "region": "Centro", "lat": 19.3500, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Ayahualulco", "region": "Centro", "lat": 19.3333, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Calcahualco", "region": "Centro", "lat": 19.1333, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Alpatláhuac", "region": "Centro", "lat": 19.0833, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "La Perla", "region": "Centro", "lat": 18.9500, "lng": -97.1833, "pueblo_magico": False},
    {"nombre": "Mariano Escobedo", "region": "Centro", "lat": 18.9167, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "Ixhuatlancillo", "region": "Centro", "lat": 18.9000, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "Rafael Delgado", "region": "Centro", "lat": 18.8167, "lng": -97.0667, "pueblo_magico": False},
    {"nombre": "Tlilapan", "region": "Centro", "lat": 18.8000, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "San Andrés Tenejapan", "region": "Centro", "lat": 18.7833, "lng": -97.1000, "pueblo_magico": False},
    {"nombre": "Magdalena", "region": "Centro", "lat": 18.8333, "lng": -97.1167, "pueblo_magico": False},
    {"nombre": "Nogales", "region": "Centro", "lat": 18.8167, "lng": -97.1667, "pueblo_magico": False},
    {"nombre": "Río Blanco", "region": "Centro", "lat": 18.8333, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "Camerino Z. Mendoza", "region": "Centro", "lat": 18.8167, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Huiloapan de Cuauhtémoc", "region": "Centro", "lat": 18.8000, "lng": -97.1833, "pueblo_magico": False},
    {"nombre": "Aquila", "region": "Centro", "lat": 18.7833, "lng": -97.2333, "pueblo_magico": False},
    {"nombre": "Maltrata", "region": "Centro", "lat": 18.8167, "lng": -97.2667, "pueblo_magico": False},
    {"nombre": "Acultzingo", "region": "Centro", "lat": 18.7167, "lng": -97.3167, "pueblo_magico": False},
    {"nombre": "Soledad Atzompa", "region": "Centro", "lat": 18.7500, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "Atlahuilco", "region": "Centro", "lat": 18.7500, "lng": -97.1000, "pueblo_magico": False},
    {"nombre": "Texhuacán", "region": "Centro", "lat": 18.6333, "lng": -97.0500, "pueblo_magico": False},
    {"nombre": "Reyes", "region": "Centro", "lat": 18.6500, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Xoxocotla", "region": "Centro", "lat": 18.7000, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Astacinga", "region": "Centro", "lat": 18.6333, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Tehuipango", "region": "Centro", "lat": 18.5167, "lng": -97.0333, "pueblo_magico": False},
    {"nombre": "Mixtla de Altamirano", "region": "Centro", "lat": 18.6000, "lng": -97.0500, "pueblo_magico": False},
    {"nombre": "Los Reyes", "region": "Centro", "lat": 18.5833, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Zongolica", "region": "Centro", "lat": 18.6667, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Tequila", "region": "Centro", "lat": 18.7333, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Omealca", "region": "Centro", "lat": 18.7667, "lng": -96.7667, "pueblo_magico": False},
    {"nombre": "Cuichapa", "region": "Centro", "lat": 18.7833, "lng": -96.8500, "pueblo_magico": False},
    {"nombre": "Yanga", "region": "Centro", "lat": 18.8333, "lng": -96.8000, "pueblo_magico": False},
    {"nombre": "Cuitláhuac", "region": "Centro", "lat": 18.7833, "lng": -96.7000, "pueblo_magico": False},
    {"nombre": "Carrillo Puerto", "region": "Centro", "lat": 18.8667, "lng": -96.8000, "pueblo_magico": False},
    {"nombre": "Amatlán de los Reyes", "region": "Centro", "lat": 18.8333, "lng": -96.9167, "pueblo_magico": False},
    {"nombre": "Atoyac", "region": "Centro", "lat": 18.9167, "lng": -96.7833, "pueblo_magico": False},
    {"nombre": "Paso del Macho", "region": "Centro", "lat": 18.9667, "lng": -96.7167, "pueblo_magico": False},
    {"nombre": "Camarón de Tejeda", "region": "Centro", "lat": 18.9333, "lng": -96.5500, "pueblo_magico": False},
    {"nombre": "Manlio Fabio Altamirano", "region": "Centro", "lat": 19.0333, "lng": -96.3333, "pueblo_magico": False},
    {"nombre": "Cotaxtla", "region": "Centro", "lat": 18.8500, "lng": -96.3833, "pueblo_magico": False},
    {"nombre": "Medellín de Bravo", "region": "Centro", "lat": 19.0500, "lng": -96.1500, "pueblo_magico": False},
    {"nombre": "Jamapa", "region": "Centro", "lat": 19.0333, "lng": -96.2333, "pueblo_magico": False},
    {"nombre": "Soledad de Doblado", "region": "Centro", "lat": 19.0500, "lng": -96.4167, "pueblo_magico": False},
    {"nombre": "Tepetlán", "region": "Centro", "lat": 19.2500, "lng": -96.8500, "pueblo_magico": False},
    {"nombre": "Tlacolulan", "region": "Centro", "lat": 19.6667, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Rafael Lucio", "region": "Centro", "lat": 19.5833, "lng": -97.0167, "pueblo_magico": False},
    {"nombre": "Acajete", "region": "Centro", "lat": 19.5833, "lng": -97.0333, "pueblo_magico": False},
    {"nombre": "Banderilla", "region": "Centro", "lat": 19.5833, "lng": -96.9333, "pueblo_magico": False},
    {"nombre": "Jilotepec", "region": "Centro", "lat": 19.6000, "lng": -96.9500, "pueblo_magico": False},
    {"nombre": "Coacoatzintla", "region": "Centro", "lat": 19.6500, "lng": -96.9333, "pueblo_magico": False},
    {"nombre": "Tlalnelhuayocan", "region": "Centro", "lat": 19.5667, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "San Andrés Tlalnelhuayocan", "region": "Centro", "lat": 19.5667, "lng": -96.9833, "pueblo_magico": False},
    {"nombre": "Ixhuacán de los Reyes", "region": "Centro", "lat": 19.3500, "lng": -97.1333, "pueblo_magico": False},
    {"nombre": "Totutla", "region": "Centro", "lat": 19.2167, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "Sochiapa", "region": "Centro", "lat": 19.2000, "lng": -96.9500, "pueblo_magico": False},
    {"nombre": "Comapa", "region": "Centro", "lat": 19.1500, "lng": -96.8667, "pueblo_magico": False},
    {"nombre": "Zentla", "region": "Centro", "lat": 19.0833, "lng": -96.7667, "pueblo_magico": False},
    {"nombre": "Chocamán", "region": "Centro", "lat": 19.0167, "lng": -97.0333, "pueblo_magico": False},
    {"nombre": "Tomatlán", "region": "Centro", "lat": 19.0000, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Tenampa", "region": "Centro", "lat": 19.1333, "lng": -96.8833, "pueblo_magico": False},
    {"nombre": "Tlalixcoyan", "region": "Centro", "lat": 18.9000, "lng": -96.0833, "pueblo_magico": False},
    {"nombre": "Ignacio de la Llave", "region": "Centro", "lat": 18.8167, "lng": -96.0000, "pueblo_magico": False},
    {"nombre": "Acula", "region": "Centro", "lat": 18.7833, "lng": -95.8833, "pueblo_magico": False},
    {"nombre": "Tlacojalpan", "region": "Sur", "lat": 18.6500, "lng": -95.7000, "pueblo_magico": False},
    {"nombre": "Ixmatlahuacan", "region": "Sur", "lat": 18.5833, "lng": -95.8167, "pueblo_magico": False},
    {"nombre": "José Azueta", "region": "Sur", "lat": 18.5667, "lng": -95.9833, "pueblo_magico": False},
    {"nombre": "Lerdo de Tejada", "region": "Sur", "lat": 18.6333, "lng": -95.5167, "pueblo_magico": False},
    {"nombre": "Saltabarranca", "region": "Sur", "lat": 18.6000, "lng": -95.6000, "pueblo_magico": False},
    {"nombre": "Ángel R. Cabada", "region": "Sur", "lat": 18.6000, "lng": -95.4500, "pueblo_magico": False},
    {"nombre": "Santiago Tuxtla", "region": "Sur", "lat": 18.4667, "lng": -95.3000, "pueblo_magico": False},
    {"nombre": "Hueyapan de Ocampo", "region": "Sur", "lat": 18.1667, "lng": -95.1500, "pueblo_magico": False},
    {"nombre": "Mecayapan", "region": "Sur", "lat": 18.2167, "lng": -94.8333, "pueblo_magico": False},
    {"nombre": "Soteapan", "region": "Sur", "lat": 18.2333, "lng": -94.8667, "pueblo_magico": False},
    {"nombre": "Pajapan", "region": "Sur", "lat": 18.2667, "lng": -94.7000, "pueblo_magico": False},
    {"nombre": "Tatahuicapan de Juárez", "region": "Sur", "lat": 18.2667, "lng": -94.7667, "pueblo_magico": False},
    {"nombre": "Chinameca", "region": "Sur", "lat": 17.9833, "lng": -94.6667, "pueblo_magico": False},
    {"nombre": "Jáltipan", "region": "Sur", "lat": 17.9667, "lng": -94.7167, "pueblo_magico": False},
    {"nombre": "Oteapan", "region": "Sur", "lat": 17.9833, "lng": -94.6833, "pueblo_magico": False},
    {"nombre": "Zaragoza", "region": "Sur", "lat": 17.9500, "lng": -94.7833, "pueblo_magico": False},
    {"nombre": "Cosoleacaque", "region": "Sur", "lat": 18.0000, "lng": -94.6167, "pueblo_magico": False},
    {"nombre": "Nanchital de Lázaro Cárdenas del Río", "region": "Sur", "lat": 18.0667, "lng": -94.4167, "pueblo_magico": False},
    {"nombre": "Ixhuatlán del Sureste", "region": "Sur", "lat": 18.0167, "lng": -94.3833, "pueblo_magico": False},
    {"nombre": "Moloacán", "region": "Sur", "lat": 17.9833, "lng": -94.3500, "pueblo_magico": False},
    {"nombre": "Agua Dulce", "region": "Sur", "lat": 18.1500, "lng": -94.1333, "pueblo_magico": False},
    {"nombre": "Las Choapas", "region": "Sur", "lat": 17.9167, "lng": -94.1000, "pueblo_magico": False},
    {"nombre": "Uxpanapa", "region": "Sur", "lat": 17.2167, "lng": -94.2167, "pueblo_magico": False},
    {"nombre": "Jesús Carranza", "region": "Sur", "lat": 17.4333, "lng": -95.0333, "pueblo_magico": False},
    {"nombre": "Playa Vicente", "region": "Sur", "lat": 17.8333, "lng": -95.8167, "pueblo_magico": False},
    {"nombre": "Juan Rodríguez Clara", "region": "Sur", "lat": 18.0000, "lng": -95.4000, "pueblo_magico": False},
    {"nombre": "Isla", "region": "Sur", "lat": 18.0333, "lng": -95.5333, "pueblo_magico": False},
    {"nombre": "Santiago Sochiapan", "region": "Sur", "lat": 17.9500, "lng": -95.6833, "pueblo_magico": False},
    {"nombre": "San Juan Evangelista", "region": "Sur", "lat": 17.8833, "lng": -95.1333, "pueblo_magico": False},
    {"nombre": "Sayula de Alemán", "region": "Sur", "lat": 17.8833, "lng": -94.9500, "pueblo_magico": False},
    {"nombre": "Oluta", "region": "Sur", "lat": 17.9333, "lng": -94.8833, "pueblo_magico": False},
    {"nombre": "Texistepec", "region": "Sur", "lat": 17.9000, "lng": -94.8167, "pueblo_magico": False},
    {"nombre": "Soconusco", "region": "Sur", "lat": 17.9667, "lng": -94.8500, "pueblo_magico": False},
    {"nombre": "Hidalgotitlán", "region": "Sur", "lat": 17.7667, "lng": -94.6500, "pueblo_magico": False},
    {"nombre": "Tres Valles", "region": "Centro", "lat": 18.2333, "lng": -96.1333, "pueblo_magico": False},
    {"nombre": "Carlos A. Carrillo", "region": "Centro", "lat": 18.3667, "lng": -96.0000, "pueblo_magico": False},
    {"nombre": "Cosamaloapan de Carpio", "region": "Sur", "lat": 18.3667, "lng": -95.8000, "pueblo_magico": False},
    {"nombre": "Chacaltianguis", "region": "Sur", "lat": 18.3333, "lng": -95.8500, "pueblo_magico": False},
    {"nombre": "Tuxtilla", "region": "Sur", "lat": 18.3000, "lng": -95.8833, "pueblo_magico": False},
    {"nombre": "Amatitlán", "region": "Sur", "lat": 18.3833, "lng": -95.5000, "pueblo_magico": False},
    {"nombre": "Otatitlán", "region": "Sur", "lat": 18.1833, "lng": -96.0333, "pueblo_magico": False},
    {"nombre": "Tlacotalpan", "region": "Sur", "lat": 18.6167, "lng": -95.6667, "pueblo_magico": True},
    {"nombre": "Tezonapa", "region": "Centro", "lat": 18.6167, "lng": -96.6833, "pueblo_magico": False},
    {"nombre": "Zongolica", "region": "Centro", "lat": 18.6667, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Ixtaczoquitlán", "region": "Centro", "lat": 18.8500, "lng": -97.0667, "pueblo_magico": False},
    {"nombre": "Orizaba", "region": "Centro", "lat": 18.8500, "lng": -97.1000, "pueblo_magico": True},
    {"nombre": "Atzacan", "region": "Centro", "lat": 18.9500, "lng": -97.0667, "pueblo_magico": False},
    {"nombre": "Chichimilac", "region": "Centro", "lat": 18.9667, "lng": -97.1000, "pueblo_magico": False},
    {"nombre": "Naranjal", "region": "Centro", "lat": 18.9833, "lng": -97.0833, "pueblo_magico": False},
    {"nombre": "Huatusco", "region": "Centro", "lat": 19.1500, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "Sochiapa", "region": "Centro", "lat": 19.2000, "lng": -96.9500, "pueblo_magico": False},
    {"nombre": "Coscomatepec", "region": "Centro", "lat": 19.0667, "lng": -97.0500, "pueblo_magico": True},
    {"nombre": "Alpatláhuac", "region": "Centro", "lat": 19.0833, "lng": -97.1500, "pueblo_magico": False},
    {"nombre": "Ixhuatlán del Café", "region": "Centro", "lat": 19.0667, "lng": -97.0000, "pueblo_magico": False},
    {"nombre": "Tepatlaxco", "region": "Centro", "lat": 19.0500, "lng": -97.0167, "pueblo_magico": False},
    {"nombre": "Teocelo", "region": "Centro", "lat": 19.3833, "lng": -96.9667, "pueblo_magico": False},
    {"nombre": "Xico", "region": "Centro", "lat": 19.4180, "lng": -97.0080, "pueblo_magico": True},
    {"nombre": "Coatepec", "region": "Centro", "lat": 19.4524, "lng": -96.9614, "pueblo_magico": True},
    {"nombre": "Xalapa", "region": "Centro", "lat": 19.5438, "lng": -96.9102, "pueblo_magico": False},
    {"nombre": "Juchique de Ferrer", "region": "Norte", "lat": 19.8333, "lng": -96.7000, "pueblo_magico": False},
    {"nombre": "Misantla", "region": "Norte", "lat": 19.9333, "lng": -96.8500, "pueblo_magico": False},
    {"nombre": "Tenochtitlán", "region": "Norte", "lat": 20.2333, "lng": -97.3333, "pueblo_magico": False},
    {"nombre": "Papantla", "region": "Norte", "lat": 20.4547, "lng": -97.3222, "pueblo_magico": True},
    {"nombre": "Poza Rica de Hidalgo", "region": "Norte", "lat": 20.5333, "lng": -97.4500, "pueblo_magico": False},
    {"nombre": "Tuxpan de Rodríguez Cano", "region": "Norte", "lat": 20.9500, "lng": -97.4000, "pueblo_magico": False},
    {"nombre": "Tamiahua", "region": "Norte", "lat": 21.2833, "lng": -97.4500, "pueblo_magico": False},
    {"nombre": "Ozuluama de Mascareñas", "region": "Norte", "lat": 21.6667, "lng": -97.8500, "pueblo_magico": False},
    {"nombre": "Pánuco", "region": "Norte", "lat": 22.0500, "lng": -98.1833, "pueblo_magico": False},
    {"nombre": "El Higo", "region": "Norte", "lat": 21.7667, "lng": -98.3833, "pueblo_magico": False},
    {"nombre": "Tempoal", "region": "Norte", "lat": 21.5167, "lng": -98.3833, "pueblo_magico": False},
    {"nombre": "Platón Sánchez", "region": "Norte", "lat": 21.2833, "lng": -98.3667, "pueblo_magico": False},
    {"nombre": "Chalma", "region": "Norte", "lat": 21.2167, "lng": -98.3000, "pueblo_magico": False},
    {"nombre": "Chicontepec", "region": "Norte", "lat": 21.0000, "lng": -98.1667, "pueblo_magico": False},
    {"nombre": "Ixhuatlán de Madero", "region": "Norte", "lat": 20.6833, "lng": -98.0167, "pueblo_magico": False},
    {"nombre": "Benito Juárez", "region": "Norte", "lat": 20.8167, "lng": -98.0833, "pueblo_magico": False},
    {"nombre": "Zontecomatlán de López y Fuentes", "region": "Norte", "lat": 20.7333, "lng": -98.3500, "pueblo_magico": False},
    {"nombre": "Tlachichilco", "region": "Norte", "lat": 20.6333, "lng": -98.1833, "pueblo_magico": False},
    {"nombre": "Texcatepec", "region": "Norte", "lat": 20.5833, "lng": -98.3500, "pueblo_magico": False},
    {"nombre": "Ilamatlán", "region": "Norte", "lat": 20.7833, "lng": -98.4500, "pueblo_magico": False},
    {"nombre": "Huayacocotla", "region": "Norte", "lat": 20.5333, "lng": -98.4833, "pueblo_magico": False},
    {"nombre": "Zacualpan", "region": "Norte", "lat": 20.4333, "lng": -98.3500, "pueblo_magico": False},
    {"nombre": "Naolinco", "region": "Centro", "lat": 19.6500, "lng": -96.8667, "pueblo_magico": True},
    {"nombre": "Zozocolco de Hidalgo", "region": "Norte", "lat": 20.1333, "lng": -97.5833, "pueblo_magico": True},
    {"nombre": "Los Tuxtlas", "region": "Sur", "lat": 18.4833, "lng": -95.1167, "pueblo_magico": True},
]

async def seed_orizaba_completo():
    """
    Vincula las 10 atracciones reales de Orizaba al municipio real en la BD.
    Busca el ID del municipio Orizaba y lo agrega a cada lugar.
    """
    # Buscar el municipio real de Orizaba en la BD
    mun = await db.municipios.find_one({"nombre": "Orizaba"}, {"_id": 0, "id": 1, "nombre": 1})
    if not mun:
        logger.warning("Municipio Orizaba no encontrado en BD, saltando seed_orizaba_completo")
        return

    municipio_id = mun["id"]

    ORIZABA_LUGARES = [
        {"nombre": "Palacio de Hierro de Orizaba", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Joya art nouveau construida en Bélgica (1894). Diseñada por el taller de Gustave Eiffel. Hoy es el Museo de Arte del Estado.",
         "descripcion_larga": "El Palacio de Hierro fue fabricado en Bélgica y ensamblado en Orizaba en 1894. Su fachada de hierro verde y azul es el símbolo de la ciudad. Alberga exposiciones temporales y permanentes de arte mexicano e internacional.",
         "horarios": "Mar–Dom 10:00–18:00", "costo": "$30 MXN", "costo_min": 30, "costo_max": 30,
         "lat": 18.8534, "lng": -97.1014,
         "fotos": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg"],
         "tags": ["arquitectura","museo","arte","historia","fotografia"], "calificacion": 4.8, "destacado": True,
         "direccion": "Av. Colón s/n, Centro, Orizaba, Ver."},
        {"nombre": "Teleférico de Orizaba", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "actividad",
         "descripcion": "Uno de los teleféricos más largos de México. Vistas al Pico de Orizaba (Citlaltépetl, 5,636m).",
         "horarios": "Mar–Dom 10:00–19:00", "costo": "$50 MXN ida y vuelta", "costo_min": 50, "costo_max": 50,
         "lat": 18.8480, "lng": -97.1050, "fotos": [],
         "tags": ["aventura","vistas","naturaleza","teleférico"], "calificacion": 4.6, "destacado": True,
         "direccion": "Cerro del Borrego s/n, Orizaba, Ver."},
        {"nombre": "Cerro del Borrego", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Mirador natural con vistas panorámicas de la ciudad y el Pico de Orizaba. Accesible por teleférico o a pie.",
         "horarios": "Amanecer–anochecer", "costo": "Libre (teleférico $50 MXN)", "costo_min": 0, "costo_max": 50,
         "lat": 18.8465, "lng": -97.1063, "fotos": [],
         "tags": ["naturaleza","mirador","senderismo","vistas"], "calificacion": 4.7, "destacado": True},
        {"nombre": "Cascada de Elefante", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Cascada de 40 metros. Su nombre viene de una roca con forma de elefante. Ideal para senderismo.",
         "horarios": "8:00–17:00", "costo": "$30 MXN", "costo_min": 30, "costo_max": 30,
         "lat": 18.8600, "lng": -97.0800, "fotos": [],
         "tags": ["naturaleza","cascada","senderismo","aventura"], "calificacion": 4.5, "destacado": False},
        {"nombre": "Parque Castillo", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Parque emblemático de Orizaba con jardines, fuentes y quiosco histórico. Corazón de la vida social.",
         "horarios": "6:00–22:00", "costo": "Libre", "costo_min": 0, "costo_max": 0,
         "lat": 18.8527, "lng": -97.1003, "fotos": [],
         "tags": ["parque","historia","familia"], "calificacion": 4.5, "destacado": False,
         "direccion": "Centro Histórico, Orizaba, Ver."},
        {"nombre": "Paseo del Río Orizaba", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Hermoso paseo a orillas del Río Orizaba con jardines, esculturas y puentes históricos.",
         "horarios": "Todos los días", "costo": "Libre", "costo_min": 0, "costo_max": 0,
         "lat": 18.8510, "lng": -97.1020, "fotos": [],
         "tags": ["parque","río","familia","fotografía"], "calificacion": 4.6, "destacado": True},
        {"nombre": "Catedral de San Miguel Arcángel", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Imponente catedral barroca del siglo XVIII. Una de las más hermosas del estado.",
         "horarios": "7:00–20:00", "costo": "Libre", "costo_min": 0, "costo_max": 0,
         "lat": 18.8530, "lng": -97.1005, "fotos": [],
         "tags": ["iglesia","arquitectura","historia","barroco"], "calificacion": 4.7, "destacado": True,
         "direccion": "Colón y Madero, Centro, Orizaba, Ver."},
        {"nombre": "Museo del Diorama", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Museo único con dioramas que recrean la historia de Orizaba desde época prehispánica.",
         "horarios": "Mar–Dom 10:00–18:00", "costo": "$20 MXN", "costo_min": 20, "costo_max": 20,
         "lat": 18.8525, "lng": -97.1010, "fotos": [],
         "tags": ["museo","historia","cultura"], "calificacion": 4.3, "destacado": False},
        {"nombre": "Ex-Fábrica de San Lorenzo", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "atraccion",
         "descripcion": "Fábrica textil del siglo XIX, escenario de la huelga de Río Blanco (1907). Patrimonio industrial.",
         "descripcion_larga": "Escenario de la huelga de Río Blanco en 1907, uno de los eventos más importantes de la historia obrera de México previo a la Revolución.",
         "horarios": "Visitas con guía", "costo": "$50 MXN", "costo_min": 50, "costo_max": 50,
         "lat": 18.8490, "lng": -97.0930, "fotos": [],
         "tags": ["historia","patrimonio","arquitectura"], "calificacion": 4.4, "destacado": False},
        {"nombre": "Cerro de San Juan", "region": "orizaba", "municipio": "Orizaba",
         "municipio_id": municipio_id, "tipo": "actividad",
         "descripcion": "Senderismo y escalada con vistas espectaculares del Pico de Orizaba y el valle.",
         "horarios": "Amanecer–anochecer", "costo": "Libre", "costo_min": 0, "costo_max": 0,
         "lat": 18.8700, "lng": -97.0900, "fotos": [],
         "tags": ["senderismo","escalada","naturaleza","aventura"], "calificacion": 4.4, "destacado": False},
    ]

    inserted = 0
    updated = 0
    for l in ORIZABA_LUGARES:
        existing = await db.lugares.find_one({"nombre": l["nombre"], "municipio": "Orizaba"})
        if existing:
            await db.lugares.update_one({"_id": existing["_id"]}, {"$set": {**l, "municipio_id": municipio_id}})
            updated += 1
        else:
            doc = {**l, "id": str(uuid.uuid4()), "slug": slugify(l["nombre"])}
            await db.lugares.insert_one(doc)
            inserted += 1

    logger.info(f"Orizaba lugares: {inserted} insertados, {updated} actualizados, municipio_id={municipio_id}")



async def seed_municipios():
    """Seed the 232 municipalities of Veracruz"""
    existing = await db.municipios.count_documents({})
    if existing > 0:
        logger.info(f"Municipios already seeded ({existing} found)")
        return
    
    # Remove duplicates based on nombre
    seen = set()
    unique_municipios = []
    for m in MUNICIPIOS_VERACRUZ:
        if m["nombre"] not in seen:
            seen.add(m["nombre"])
            unique_municipios.append(m)
    
    municipios_to_insert = []
    for m in unique_municipios:
        municipio = {
            "id": str(uuid.uuid4()),
            "nombre": m["nombre"],
            "slug": slugify(m["nombre"]),
            "region": m["region"],
            "descripcion": None,
            "historia": None,
            "que_hacer": [],
            "como_llegar": None,
            "clima": None,
            "altitud": None,
            "tags": ["Pueblo Mágico"] if m.get("pueblo_magico") else [],
            "foto_portada_url": None,
            "fotos": [],
            "videos": [],
            "pueblo_magico": m.get("pueblo_magico", False),
            "encargado_id": None,
            "estado": "sin_configurar",
            "lat": m["lat"],
            "lng": m["lng"],
            "visitas_total": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        municipios_to_insert.append(municipio)
    
    if municipios_to_insert:
        await db.municipios.insert_many(municipios_to_insert)
        logger.info(f"Seeded {len(municipios_to_insert)} municipios")

async def seed_admin():
    """Seed the super admin user"""
    admin_email = os.environ.get("ADMIN_EMAIL", "superadmin@veracruzcontigo.gob.mx")
    admin_password = os.environ.get("ADMIN_PASSWORD", "VeracruzAdmin2024!")
    
    existing = await db.usuarios.find_one({"email": admin_email.lower()})
    if existing:
        # Update password if changed
        if not verify_password(admin_password, existing.get("password_hash", "")):
            await db.usuarios.update_one(
                {"email": admin_email.lower()},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )
            logger.info("Admin password updated")
        return
    
    admin = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": admin_email.lower(),
        "password_hash": hash_password(admin_password),
        "nombre": "Super Administrador",
        "foto_url": None,
        "rol": "superadmin",
        "municipio_id": None,
        "activo": True,
        "fecha_registro": datetime.now(timezone.utc).isoformat(),
        "ultimo_acceso": None
    }
    await db.usuarios.insert_one(admin)
    logger.info(f"Admin user created: {admin_email}")

async def seed_sample_events():
    """Seed sample events"""
    existing = await db.eventos.count_documents({})
    if existing > 0:
        return
    
    # Get some municipio IDs
    veracruz = await db.municipios.find_one({"nombre": "Veracruz"}, {"_id": 0, "id": 1})
    papantla = await db.municipios.find_one({"nombre": "Papantla"}, {"_id": 0, "id": 1})
    xalapa = await db.municipios.find_one({"nombre": "Xalapa"}, {"_id": 0, "id": 1})
    tlacotalpan = await db.municipios.find_one({"nombre": "Tlacotalpan"}, {"_id": 0, "id": 1})
    coatepec = await db.municipios.find_one({"nombre": "Coatepec"}, {"_id": 0, "id": 1})
    
    events = [
        {
            "id": str(uuid.uuid4()),
            "nombre": "Carnaval de Veracruz 2026",
            "municipio_id": veracruz["id"] if veracruz else "",
            "fecha_inicio": "2026-02-14",
            "fecha_fin": "2026-02-22",
            "descripcion": "El carnaval más alegre del mundo. Desfiles, comparsas, música y alegría durante 9 días.",
            "foto_url": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
            "tipo": "Cultural",
            "lugar": "Malecón y Centro Histórico",
            "link_externo": None,
            "publicado": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Cumbre Tajín 2026",
            "municipio_id": papantla["id"] if papantla else "",
            "fecha_inicio": "2026-03-15",
            "fecha_fin": "2026-03-22",
            "descripcion": "Festival de identidad que celebra la cultura totonaca con música, arte y ceremonias ancestrales.",
            "foto_url": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800",
            "tipo": "Cultural",
            "lugar": "Parque Takilhsukut",
            "link_externo": None,
            "publicado": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Festival Internacional del Jazz",
            "municipio_id": xalapa["id"] if xalapa else "",
            "fecha_inicio": "2026-10-10",
            "fecha_fin": "2026-10-15",
            "descripcion": "El encuentro jazzístico más importante de México con artistas nacionales e internacionales.",
            "foto_url": "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800",
            "tipo": "Musical",
            "lugar": "Teatro del Estado y diversos foros",
            "link_externo": None,
            "publicado": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Feria de la Candelaria",
            "municipio_id": tlacotalpan["id"] if tlacotalpan else "",
            "fecha_inicio": "2026-01-31",
            "fecha_fin": "2026-02-09",
            "descripcion": "Fiesta tradicional con el emblemático paseo de la Virgen por el río Papaloapan.",
            "foto_url": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800",
            "tipo": "Religioso",
            "lugar": "Centro Histórico",
            "link_externo": None,
            "publicado": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Festival del Café",
            "municipio_id": coatepec["id"] if coatepec else "",
            "fecha_inicio": "2026-11-01",
            "fecha_fin": "2026-11-15",
            "descripcion": "Celebración del aromático café veracruzano con catas, tours a fincas y gastronomía local.",
            "foto_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800",
            "tipo": "Gastronómico",
            "lugar": "Fincas cafetaleras y centro",
            "link_externo": None,
            "publicado": True,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.eventos.insert_many(events)
    logger.info(f"Seeded {len(events)} sample events")

async def seed_sample_prestadores():
    """Seed sample service providers"""
    existing = await db.prestadores.count_documents({})
    if existing > 0:
        return
    
    veracruz = await db.municipios.find_one({"nombre": "Veracruz"}, {"_id": 0, "id": 1})
    xalapa = await db.municipios.find_one({"nombre": "Xalapa"}, {"_id": 0, "id": 1})
    
    prestadores = [
        {
            "id": str(uuid.uuid4()),
            "nombre": "Hotel Gran Diligencias",
            "tipo": "HOSPEDAJE",
            "subtipo": "Hotel",
            "municipio_id": veracruz["id"] if veracruz else "",
            "descripcion": "Hotel histórico de 5 estrellas frente al malecón con vistas espectaculares al Golfo de México.",
            "foto_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "telefono": "229-931-2233",
            "whatsapp": "522299312233",
            "horarios": "24 horas",
            "direccion": "Independencia 1115, Centro",
            "calificacion_promedio": 4.8,
            "total_resenas": 156,
            "verificado": True,
            "activo": True,
            "lat": 19.1908,
            "lng": -96.1331,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "La Parroquia de Veracruz",
            "tipo": "GASTRONOMÍA",
            "subtipo": "Restaurante",
            "municipio_id": veracruz["id"] if veracruz else "",
            "descripcion": "El café más emblemático de Veracruz. Tradición desde 1808 con el famoso café lechero.",
            "foto_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
            "telefono": "229-932-2584",
            "whatsapp": "522299322584",
            "horarios": "7:00 AM - 12:00 AM",
            "direccion": "Gómez Farías 34, Centro",
            "calificacion_promedio": 4.9,
            "total_resenas": 342,
            "verificado": True,
            "activo": True,
            "lat": 19.1925,
            "lng": -96.1335,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Tours Veracruz Ancestral",
            "tipo": "TURISMO",
            "subtipo": "Tour operador",
            "municipio_id": veracruz["id"] if veracruz else "",
            "descripcion": "Tours a zonas arqueológicas, ecoturismo y experiencias culturales auténticas.",
            "foto_url": "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800",
            "telefono": "229-123-4567",
            "whatsapp": "522291234567",
            "horarios": "8:00 AM - 6:00 PM",
            "direccion": "Malecón s/n",
            "calificacion_promedio": 4.7,
            "total_resenas": 89,
            "verificado": True,
            "activo": True,
            "lat": 19.1890,
            "lng": -96.1340,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Café Colón",
            "tipo": "GASTRONOMÍA",
            "subtipo": "Cafetería",
            "municipio_id": xalapa["id"] if xalapa else "",
            "descripcion": "El mejor café de altura de Xalapa. Granos orgánicos de la región.",
            "foto_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
            "telefono": "228-817-8390",
            "whatsapp": "522288178390",
            "horarios": "7:00 AM - 10:00 PM",
            "direccion": "Primo Verdad 15, Centro",
            "calificacion_promedio": 4.8,
            "total_resenas": 215,
            "verificado": True,
            "activo": True,
            "lat": 19.5295,
            "lng": -96.9225,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.prestadores.insert_many(prestadores)
    logger.info(f"Seeded {len(prestadores)} sample prestadores")

async def seed_municipio_photos_and_content():
    """Add photos and content to main municipalities"""
    
    # Photos for Pueblos Mágicos and main municipalities
    municipio_data = {
        "Orizaba": {
            "foto_portada_url": "https://images.unsplash.com/photo-1772551481564-78b4e46c5964?w=1200&q=85",
            "descripcion": """Orizaba, conocida como la "Ciudad de las Aguas Alegres", es uno de los destinos más encantadores del estado de Veracruz. Ubicada en las faldas del majestuoso Pico de Orizaba (Citlaltépetl), la montaña más alta de México con 5,636 metros de altura, esta ciudad ofrece un clima templado ideal durante todo el año.

Su centro histórico alberga joyas arquitectónicas como el Palacio de Hierro, diseñado por Gustave Eiffel, y la majestuosa Catedral de San Miguel Arcángel. El Paseo del Río Orizaba es perfecto para caminar entre jardines, fuentes y monumentos mientras disfrutas del paisaje montañoso.

La ciudad es famosa por su teleférico que conecta el centro con el Cerro del Borrego, ofreciendo vistas panorámicas espectaculares. Su gastronomía incluye el famoso pan de Orizaba, los tamales de masa colada y el café de la región.""",
            "historia": """Orizaba tiene una rica historia que se remonta a la época prehispánica, cuando era conocida como Ahauializapan, que significa "lugar de aguas alegres" en náhuatl. Fue un importante centro comercial durante la Colonia y jugó un papel crucial durante la Independencia y la Revolución Mexicana.

El Palacio de Hierro, símbolo de la ciudad, fue originalmente diseñado para Bélgica pero adquirido por México en 1891. Durante el Porfiriato, Orizaba fue una de las ciudades más industrializadas del país, especialmente en la industria textil y cervecera.""",
            "que_hacer": [
                "Subir al teleférico y disfrutar vistas del Pico de Orizaba",
                "Visitar el Palacio de Hierro y su museo",
                "Recorrer el Paseo del Río Orizaba",
                "Explorar el Museo de Arte del Estado",
                "Caminar por el centro histórico colonial",
                "Probar el famoso pan de Orizaba",
                "Visitar la Cascada de Elefante",
                "Hacer senderismo en las montañas cercanas",
                "Conocer la Ex-Fábrica de San Lorenzo"
            ],
            "como_llegar": "Desde la Ciudad de México: 4 horas por la autopista México-Puebla-Orizaba. Desde Veracruz puerto: 2 horas por la autopista Veracruz-Córdoba. También hay servicio de autobuses ADO desde las principales ciudades.",
            "clima": "Templado húmedo con lluvias en verano. Temperatura promedio: 18°C",
            "altitud": "1,236 metros sobre el nivel del mar",
            "tags": ["Pueblo Mágico", "Montaña", "Cultura", "Naturaleza", "Aventura", "Gastronomía"],
            "fotos": [
                {"url": "https://images.unsplash.com/photo-1772551481564-78b4e46c5964?w=800", "etiqueta": "Teleférico"},
                {"url": "https://images.unsplash.com/photo-1759350414036-6e51a526d405?w=800", "etiqueta": "Pico de Orizaba"},
                {"url": "https://images.unsplash.com/photo-1626024367563-c6357a1754f5?w=800", "etiqueta": "Montañas"},
                {"url": "https://images.unsplash.com/photo-1728932828842-7839cdf57ced?w=800", "etiqueta": "Cascada"},
                {"url": "https://images.unsplash.com/photo-1762850424391-542c52f0c64b?w=800", "etiqueta": "Vista panorámica"}
            ],
            "videos": ["https://www.youtube.com/watch?v=orizaba_turismo"],
            "estado": "publicado"
        },
        "Coatepec": {
            "foto_portada_url": "https://images.unsplash.com/photo-1652015496419-58606c1b5d1c?w=1200&q=85",
            "descripcion": "Capital del café en México, Coatepec es un encantador Pueblo Mágico rodeado de fincas cafetaleras, cascadas y bosque de niebla. Sus calles empedradas, casas coloridas y el aroma a café tostado crean una experiencia única.",
            "que_hacer": ["Tour a fincas cafetaleras", "Visitar cascadas", "Recorrer el centro histórico", "Degustar café de altura"],
            "clima": "Templado húmedo, ideal para el café",
            "altitud": "1,200 msnm",
            "tags": ["Pueblo Mágico", "Café", "Naturaleza", "Gastronomía"],
            "estado": "publicado"
        },
        "Papantla": {
            "foto_portada_url": "https://images.unsplash.com/photo-1666808982367-b9180dac5948?w=1200&q=85",
            "descripcion": "Cuna de la vainilla y de los famosos Voladores de Papantla, Patrimonio Cultural de la Humanidad. Hogar de la zona arqueológica de El Tajín, una de las más importantes de Mesoamérica.",
            "que_hacer": ["Visitar El Tajín", "Ver la Danza de los Voladores", "Tour de vainilla", "Conocer la cultura totonaca"],
            "clima": "Cálido húmedo",
            "tags": ["Pueblo Mágico", "Arqueología", "Cultura", "Tradiciones"],
            "estado": "publicado"
        },
        "Tlacotalpan": {
            "foto_portada_url": "https://images.unsplash.com/photo-1759054716857-881c10aa4941?w=1200&q=85",
            "descripcion": "Patrimonio de la Humanidad por la UNESCO. Ciudad colonial a orillas del río Papaloapan con casas de colores vibrantes, portales y arquitectura única. Cuna del son jarocho.",
            "que_hacer": ["Paseo en lancha por el río", "Recorrer el centro histórico", "Escuchar son jarocho", "Visitar la Feria de la Candelaria"],
            "clima": "Cálido",
            "tags": ["Pueblo Mágico", "UNESCO", "Río", "Música", "Cultura"],
            "estado": "publicado"
        },
        "Xico": {
            "foto_portada_url": "https://images.unsplash.com/photo-1728932827634-361dfdcd925e?w=1200&q=85",
            "descripcion": "Pueblo Mágico famoso por sus cascadas, el mole xiqueño y sus fiestas patronales de Santa María Magdalena donde adornan las calles con tapetes de aserrín.",
            "que_hacer": ["Visitar la Cascada de Texolo", "Probar el mole xiqueño", "Ver los tapetes de aserrín", "Senderismo"],
            "clima": "Templado con neblina frecuente",
            "tags": ["Pueblo Mágico", "Cascadas", "Gastronomía", "Naturaleza"],
            "estado": "publicado"
        },
        "Veracruz": {
            "foto_portada_url": "https://images.unsplash.com/photo-1639222188528-3498adec4f40?w=1200&q=85",
            "descripcion": "El puerto más importante de México, ciudad de historia, música y el carnaval más alegre del mundo. Su malecón, el acuario y el centro histórico son imperdibles.",
            "que_hacer": ["Caminar por el malecón", "Visitar San Juan de Ulúa", "Ver el Carnaval", "Probar mariscos frescos"],
            "clima": "Tropical cálido",
            "tags": ["Playa", "Puerto", "Carnaval", "Gastronomía", "Historia"],
            "estado": "publicado"
        },
        "Xalapa": {
            "foto_portada_url": "https://images.unsplash.com/photo-1652015496419-58606c1b5d1c?w=1200&q=85",
            "descripcion": "Capital del estado, conocida como la 'Atenas Veracruzana' por su rica vida cultural. Ciudad universitaria con el Museo de Antropología más importante después del de la CDMX.",
            "que_hacer": ["Visitar el Museo de Antropología", "Recorrer los Lagos del Dique", "Disfrutar cafés locales", "Asistir a eventos culturales"],
            "clima": "Templado húmedo con niebla frecuente",
            "tags": ["Ciudad", "Cultura", "Café", "Museos"],
            "estado": "publicado"
        },
        "Catemaco": {
            "foto_portada_url": "https://images.unsplash.com/photo-1629221198624-825cee95962a?w=1200&q=85",
            "descripcion": "Famoso por su laguna, la magia y los brujos. Rodeado de selva tropical, cascadas y la Reserva de la Biosfera de Los Tuxtlas.",
            "que_hacer": ["Paseo en lancha por la laguna", "Visitar Nanciyaga", "Conocer a los brujos", "Explorar la selva"],
            "clima": "Tropical húmedo",
            "tags": ["Laguna", "Naturaleza", "Mística", "Ecoturismo"],
            "estado": "publicado"
        },
        "Los Tuxtlas": {
            "foto_portada_url": "https://images.unsplash.com/photo-1648485716909-2636f8abb2cd?w=1200&q=85",
            "descripcion": "Reserva de la Biosfera con selva tropical, volcanes, cascadas y playas. Uno de los últimos reductos de selva alta en México.",
            "que_hacer": ["Senderismo en la reserva", "Visitar el volcán San Martín", "Conocer Sontecomapan", "Observar aves"],
            "clima": "Tropical muy húmedo",
            "tags": ["Pueblo Mágico", "Naturaleza", "Ecoturismo", "Selva", "Aventura"],
            "estado": "publicado"
        }
    }
    
    for nombre, data in municipio_data.items():
        result = await db.municipios.update_one(
            {"nombre": nombre},
            {"$set": data}
        )
        if result.modified_count > 0:
            logger.info(f"Updated municipio: {nombre}")
    
    # Create encargado for Orizaba
    orizaba = await db.municipios.find_one({"nombre": "Orizaba"}, {"_id": 0, "id": 1})
    if orizaba:
        existing_encargado = await db.usuarios.find_one({"email": "encargado.orizaba@veracruzcontigo.gob.mx"})
        if not existing_encargado:
            encargado_id = f"user_{uuid.uuid4().hex[:12]}"
            encargado = {
                "user_id": encargado_id,
                "email": "encargado.orizaba@veracruzcontigo.gob.mx",
                "password_hash": hash_password("Orizaba2024!"),
                "nombre": "María González Hernández",
                "foto_url": None,
                "rol": "encargado",
                "municipio_id": orizaba["id"],
                "activo": True,
                "fecha_registro": datetime.now(timezone.utc).isoformat(),
                "ultimo_acceso": datetime.now(timezone.utc).isoformat()
            }
            await db.usuarios.insert_one(encargado)
            await db.municipios.update_one({"id": orizaba["id"]}, {"$set": {"encargado_id": encargado_id}})
            logger.info("Created encargado for Orizaba")
        
        # Add prestadores for Orizaba
        existing_orizaba_prestadores = await db.prestadores.count_documents({"municipio_id": orizaba["id"]})
        if existing_orizaba_prestadores == 0:
            orizaba_prestadores = [
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Hotel Fiesta Cascada",
                    "tipo": "HOSPEDAJE",
                    "subtipo": "Hotel",
                    "municipio_id": orizaba["id"],
                    "descripcion": "Hotel de 4 estrellas con vista al Pico de Orizaba. Alberca, spa y restaurante gourmet.",
                    "foto_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                    "telefono": "272-724-3500",
                    "whatsapp": "522727243500",
                    "horarios": "24 horas",
                    "direccion": "Oriente 6 No. 265, Centro",
                    "calificacion_promedio": 4.6,
                    "total_resenas": 89,
                    "verificado": True,
                    "activo": True,
                    "vistas_total": 245,
                    "contactos_total": 67,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Panadería La Fama de Orizaba",
                    "tipo": "GASTRONOMÍA",
                    "subtipo": "Panadería",
                    "municipio_id": orizaba["id"],
                    "descripcion": "La panadería más tradicional de Orizaba. Famosa por su pan de yema, conchas y el tradicional pan de muerto.",
                    "foto_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
                    "telefono": "272-725-1234",
                    "whatsapp": "522727251234",
                    "horarios": "6:00 AM - 9:00 PM",
                    "direccion": "Sur 5 No. 89, Centro",
                    "calificacion_promedio": 4.9,
                    "total_resenas": 234,
                    "verificado": True,
                    "activo": True,
                    "vistas_total": 567,
                    "contactos_total": 123,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Teleférico de Orizaba Tours",
                    "tipo": "TURISMO",
                    "subtipo": "Tour operador",
                    "municipio_id": orizaba["id"],
                    "descripcion": "Tours guiados al teleférico, Cerro del Borrego y expediciones al Pico de Orizaba.",
                    "foto_url": "https://images.unsplash.com/photo-1772551481564-78b4e46c5964?w=800",
                    "telefono": "272-726-7890",
                    "whatsapp": "522727267890",
                    "horarios": "8:00 AM - 6:00 PM",
                    "direccion": "Estación del Teleférico",
                    "calificacion_promedio": 4.8,
                    "total_resenas": 156,
                    "verificado": True,
                    "activo": True,
                    "vistas_total": 890,
                    "contactos_total": 234,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Restaurante Gran Café de la Parroquia",
                    "tipo": "GASTRONOMÍA",
                    "subtipo": "Restaurante",
                    "municipio_id": orizaba["id"],
                    "descripcion": "Café tradicional estilo veracruzano. Especialidad en desayunos y el famoso café lechero.",
                    "foto_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
                    "telefono": "272-725-5678",
                    "whatsapp": "522727255678",
                    "horarios": "7:00 AM - 11:00 PM",
                    "direccion": "Palacio de Hierro, Centro",
                    "calificacion_promedio": 4.7,
                    "total_resenas": 312,
                    "verificado": True,
                    "activo": True,
                    "vistas_total": 456,
                    "contactos_total": 178,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            await db.prestadores.insert_many(orizaba_prestadores)
            logger.info("Created prestadores for Orizaba")
        
        # Add events for Orizaba
        existing_orizaba_eventos = await db.eventos.count_documents({"municipio_id": orizaba["id"]})
        if existing_orizaba_eventos == 0:
            orizaba_eventos = [
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Festival de la Primavera Orizaba",
                    "municipio_id": orizaba["id"],
                    "fecha_inicio": "2026-03-21",
                    "fecha_fin": "2026-03-30",
                    "descripcion": "Celebración de la primavera con desfiles florales, música en vivo, exposiciones de arte y gastronomía local.",
                    "foto_url": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
                    "tipo": "Cultural",
                    "lugar": "Centro Histórico y Parque Castillo",
                    "publicado": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": str(uuid.uuid4()),
                    "nombre": "Feria del Pan de Orizaba",
                    "municipio_id": orizaba["id"],
                    "fecha_inicio": "2026-08-15",
                    "fecha_fin": "2026-08-20",
                    "descripcion": "Celebración del famoso pan orizabeño con concursos, degustaciones y talleres de panadería tradicional.",
                    "foto_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
                    "tipo": "Gastronómico",
                    "lugar": "Plaza del Palacio de Hierro",
                    "publicado": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            await db.eventos.insert_many(orizaba_eventos)
            logger.info("Created eventos for Orizaba")

# ============== NOTIFICATIONS SYSTEM ==============

async def check_interest_spikes():
    """Check for interest spikes and create notifications"""
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=1)
    prev_start = start_date - timedelta(days=1)
    
    # Get today's views by municipio
    today_pipeline = [
        {
            "$match": {
                "target_type": "municipio",
                "event_type": "view",
                "timestamp": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$target_id",
                "count": {"$sum": 1}
            }
        }
    ]
    
    today_views = {item["_id"]: item["count"] for item in await db.analytics.aggregate(today_pipeline).to_list(500)}
    
    # Get previous day's views
    prev_pipeline = [
        {
            "$match": {
                "target_type": "municipio",
                "event_type": "view",
                "timestamp": {"$gte": prev_start.isoformat(), "$lt": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$target_id",
                "count": {"$sum": 1}
            }
        }
    ]
    
    prev_views = {item["_id"]: item["count"] for item in await db.analytics.aggregate(prev_pipeline).to_list(500)}
    
    # Find spikes (more than 50% increase with at least 10 views)
    spikes = []
    for municipio_id, today_count in today_views.items():
        prev_count = prev_views.get(municipio_id, 0)
        if today_count >= 10 and (prev_count == 0 or today_count > prev_count * 1.5):
            spikes.append({
                "municipio_id": municipio_id,
                "today_views": today_count,
                "prev_views": prev_count,
                "increase_pct": ((today_count - prev_count) / max(prev_count, 1)) * 100
            })
    
    # Create notifications for spikes
    for spike in spikes:
        municipio = await db.municipios.find_one({"id": spike["municipio_id"]}, {"_id": 0, "nombre": 1, "encargado_id": 1})
        if municipio and municipio.get("encargado_id"):
            existing_notif = await db.notificaciones.find_one({
                "municipio_id": spike["municipio_id"],
                "tipo": "spike",
                "fecha": {"$gte": start_date.isoformat()}
            })
            
            if not existing_notif:
                notification = {
                    "id": str(uuid.uuid4()),
                    "user_id": municipio["encargado_id"],
                    "municipio_id": spike["municipio_id"],
                    "tipo": "spike",
                    "titulo": f"¡{municipio['nombre']} está en tendencia!",
                    "mensaje": f"Tu municipio tuvo {spike['today_views']} visitas hoy, un aumento del {spike['increase_pct']:.0f}% respecto a ayer.",
                    "leida": False,
                    "fecha": datetime.now(timezone.utc).isoformat()
                }
                await db.notificaciones.insert_one(notification)
                logger.info(f"[NOTIFICATION] Spike detected for {municipio['nombre']}")
    
    return spikes

@api_router.get("/notifications")
async def get_notifications(request: Request):
    """Get notifications for current user"""
    user = await get_current_user(request)
    
    notifications = await db.notificaciones.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("fecha", -1).limit(50).to_list(50)
    
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark notification as read"""
    user = await get_current_user(request)
    
    await db.notificaciones.update_one(
        {"id": notification_id, "user_id": user["user_id"]},
        {"$set": {"leida": True}}
    )
    
    return {"status": "ok"}

@api_router.post("/admin/check-spikes")
async def trigger_spike_check(request: Request):
    """Manually trigger spike detection (admin only)"""
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    
    spikes = await check_interest_spikes()
    return {"spikes_detected": len(spikes), "spikes": spikes}

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower().strip()
    existing = await db.usuarios.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "nombre": user_data.nombre,
        "foto_url": None,
        "rol": user_data.rol if user_data.rol in ["encargado", "prestador"] else "turista",
        "municipio_id": user_data.municipio_id,
        "activo": True,
        "fecha_registro": datetime.now(timezone.utc).isoformat(),
        "ultimo_acceso": None
    }
    await db.usuarios.insert_one(user)
    
    access_token = create_access_token(user_id, email, user["rol"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user.pop("password_hash")
    user.pop("_id", None)
    return user

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower().strip()
    user = await db.usuarios.find_one({"email": email}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not user.get("activo", True):
        raise HTTPException(status_code=403, detail="Cuenta desactivada")
    
    # Update last access
    await db.usuarios.update_one(
        {"email": email},
        {"$set": {"ultimo_acceso": datetime.now(timezone.utc).isoformat()}}
    )
    
    access_token = create_access_token(user["user_id"], email, user["rol"])
    refresh_token = create_refresh_token(user["user_id"])
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user.pop("password_hash", None)
    return {**user, "access_token": access_token}

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    body = await request.json()
    code = body.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="Code requerido")
    
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    REDIRECT_URI = os.environ.get("FRONTEND_URL", "") + "/auth/callback"
    
    try:
        # Intercambiar code por tokens
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        token_response.raise_for_status()
        tokens = token_response.json()
        id_token_str = tokens.get("id_token")
        
        # Verificar el ID token
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        id_info = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        email = id_info.get("email", "").lower()
        name = id_info.get("name", "Turista")
        picture = id_info.get("picture", "")
        
        # Buscar o crear usuario
        user = await db.usuarios.find_one({"email": email}, {"_id": 0})
        if not user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_data = {
                "user_id": user_id,
                "email": email,
                "nombre": name,
                "foto_url": picture,
                "rol": "turista",
                "municipio_id": None,
                "activo": True,
                "fecha_registro": datetime.now(timezone.utc).isoformat(),
                "ultimo_acceso": datetime.now(timezone.utc).isoformat()
            }
            await db.usuarios.insert_one(user_data)
            user = user_data
        else:
            user_id = user["user_id"]
            await db.usuarios.update_one(
                {"email": email},
                {"$set": {"ultimo_acceso": datetime.now(timezone.utc).isoformat()}}
            )
        
        # Generar JWT y cookie de sesión
        access_token = create_access_token(user["user_id"], email, user.get("rol", "turista"))
        refresh_token = create_refresh_token(user["user_id"])
        
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "nombre": user.get("nombre", name),
            "rol": user.get("rol", "turista"),
            "foto_url": user.get("foto_url", picture),
            "activo": user.get("activo", True),
            "access_token": access_token,
        }
        
    except Exception as e:
        logger.error(f"Google callback error: {e}")
        raise HTTPException(status_code=401, detail="Error en autenticación con Google")

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesión cerrada"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process Emergent OAuth session_id and create local session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")
    
    # Verify Google ID token directly
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        id_info = id_token.verify_oauth2_token(
            session_id,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        oauth_data = {
            "email": id_info.get("email", ""),
            "name": id_info.get("name", "Turista"),
            "picture": id_info.get("picture", "")
        }
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Token de Google inválido")
    
    email = oauth_data.get("email", "").lower()
    name = oauth_data.get("name", "Turista")
    picture = oauth_data.get("picture", "")
    
    # Find or create user
    user = await db.usuarios.find_one({"email": email}, {"_id": 0})
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "password_hash": None,
            "nombre": name,
            "foto_url": picture,
            "rol": "turista",
            "municipio_id": None,
            "activo": True,
            "fecha_registro": datetime.now(timezone.utc).isoformat(),
            "ultimo_acceso": datetime.now(timezone.utc).isoformat()
        }
        await db.usuarios.insert_one(user)
    else:
        user_id = user["user_id"]
        await db.usuarios.update_one(
            {"email": email},
            {"$set": {
                "nombre": name,
                "foto_url": picture,
                "ultimo_acceso": datetime.now(timezone.utc).isoformat()
            }}
        )
        user["nombre"] = name
        user["foto_url"] = picture
    
    access_token = create_access_token(user_id, email, user["rol"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user

# ============== MUNICIPIOS ENDPOINTS ==============

@api_router.get("/municipios")
async def get_municipios(
    region: Optional[str] = None,
    pueblo_magico: Optional[bool] = None,
    estado: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    query = {}
    if region:
        query["region"] = region
    if pueblo_magico is not None:
        query["pueblo_magico"] = pueblo_magico
    if estado:
        query["estado"] = estado
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    municipios = await db.municipios.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.municipios.count_documents(query)
    
    return {"municipios": municipios, "total": total}

@api_router.get("/municipios/{slug}")
async def get_municipio(slug: str, request: Request):
    municipio = await db.municipios.find_one({"slug": slug}, {"_id": 0})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    # Increment visit counter
    await db.municipios.update_one({"slug": slug}, {"$inc": {"visitas_total": 1}})
    
    return municipio

@api_router.put("/municipios/{slug}")
async def update_municipio(slug: str, data: MunicipioUpdate, request: Request):
    user = await get_current_user(request)
    municipio = await db.municipios.find_one({"slug": slug}, {"_id": 0})
    
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    # Check permissions
    if user["rol"] == "encargado" and municipio.get("encargado_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este municipio")
    elif user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para esta acción")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.municipios.update_one({"slug": slug}, {"$set": update_data})
    
    return await db.municipios.find_one({"slug": slug}, {"_id": 0})

# ============== PRESTADORES ENDPOINTS ==============

@api_router.get("/prestadores")
async def get_prestadores(
    tipo: Optional[str] = None,
    municipio_id: Optional[str] = None,
    verificado: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"activo": True}
    if tipo:
        query["tipo"] = tipo
    if municipio_id:
        query["municipio_id"] = municipio_id
    if verificado is not None:
        query["verificado"] = verificado
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"descripcion": {"$regex": search, "$options": "i"}}
        ]
    
    prestadores = await db.prestadores.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.prestadores.count_documents(query)
    
    return {"prestadores": prestadores, "total": total}

# ============== REGISTRO DE PRESTADOR ==============

class PrestadorRegisterCreate(BaseModel):
    model_config = ConfigDict(extra="allow")
    nombre_negocio: str
    tipo: str
    subtipo: Optional[str] = None
    municipio_id: str
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    horarios: Optional[str] = None
    direccion: Optional[str] = None
    nombre_contacto: Optional[str] = None
    email_contacto: Optional[str] = None
    documentos: List[Any] = []

@api_router.post("/prestadores/register")
async def register_prestador(data: PrestadorRegisterCreate, request: Request):
    user = await get_optional_user(request)
    docs_normalizados = []
    for d in data.documentos:
        if isinstance(d, str):
            docs_normalizados.append(d)
        elif isinstance(d, dict):
            docs_normalizados.append(d.get("url") or d.get("path") or str(d))
    solicitud = {
        "id": str(uuid.uuid4()),
        "nombre": data.nombre_negocio,
        "tipo": data.tipo,
        "subtipo": data.subtipo,
        "municipio_id": data.municipio_id,
        "descripcion": data.descripcion,
        "telefono": data.telefono,
        "whatsapp": data.whatsapp,
        "horarios": data.horarios,
        "direccion": data.direccion,
        "responsable": data.nombre_contacto,
        "email": data.email_contacto,
        "documentos": docs_normalizados,
        "estado": "pendiente",
        "user_id": user["user_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.solicitudes_prestador.insert_one(solicitud)
    solicitud.pop("_id", None)
    return {"ok": True, "id": solicitud["id"], "mensaje": "Solicitud enviada, será revisada por el equipo."}


@api_router.get("/prestadores/register/solicitudes")
async def get_solicitudes_registro(
    estado: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    query: Dict[str, Any] = {}
    if estado:
        query["estado"] = estado
    solicitudes = await db.solicitudes_prestador.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"solicitudes": solicitudes, "total": len(solicitudes)}


@api_router.get("/prestadores/mapa")
async def get_prestadores_mapa(
    region: Optional[str] = None,
    municipio_id: Optional[str] = None,
    tipo: Optional[str] = None,
):
    query: Dict[str, Any] = {
        "verificado": True,
        "activo": True,
        "lat": {"$exists": True, "$ne": None},
        "lng": {"$exists": True, "$ne": None},
    }
    if region:
        municipios_region = await db.municipios.find(
            {"region": region.capitalize()}, {"_id": 0, "id": 1}
        ).to_list(100)
        ids = [m["id"] for m in municipios_region]
        query["municipio_id"] = {"$in": ids}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if tipo:
        query["tipo"] = tipo
    cursor = db.prestadores.find(query, {
        "_id": 0, "id": 1, "nombre": 1, "tipo": 1, "subtipo": 1,
        "municipio_id": 1, "lat": 1, "lng": 1,
        "descripcion": 1, "foto_url": 1, "calificacion_promedio": 1,
        "horarios": 1, "direccion": 1, "telefono": 1, "whatsapp": 1,
    }).limit(200)
    prestadores = await cursor.to_list(200)
    return {"prestadores": prestadores, "total": len(prestadores)}


@api_router.get("/prestadores/me")
async def get_my_prestador(current_user: dict = Depends(get_current_user)):
    prestador = await db.prestadores.find_one(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    )
    if not prestador:
        prestador = await db.prestadores.find_one(
            {"municipio_id": current_user.get("municipio_id")}, {"_id": 0}
        )
    if not prestador:
        raise HTTPException(status_code=404, detail="No tienes un perfil de prestador")
    return prestador


@api_router.get("/prestadores/{prestador_id}")
async def get_prestador(prestador_id: str):
    prestador = await db.prestadores.find_one({"id": prestador_id}, {"_id": 0})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    return prestador

@api_router.post("/prestadores")
async def create_prestador(data: PrestadorCreate, request: Request):
    user = await get_current_user(request)
    
    prestador = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "calificacion_promedio": 0.0,
        "total_resenas": 0,
        "verificado": user["rol"] == "superadmin",
        "activo": True,
        "propuesto_por_id": user["user_id"] if user["rol"] == "encargado" else None,
        "aprobado_por_id": user["user_id"] if user["rol"] == "superadmin" else None,
        "user_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.prestadores.insert_one(prestador)
    prestador.pop("_id", None)
    return prestador

@api_router.put("/prestadores/{prestador_id}")
async def update_prestador(prestador_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    prestador = await db.prestadores.find_one({"id": prestador_id}, {"_id": 0})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    
    # Check permissions
    if user["rol"] == "prestador" and prestador.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    elif user["rol"] not in ["superadmin", "encargado", "prestador"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    allowed_fields = ["nombre", "descripcion", "foto_url", "telefono", "whatsapp", "horarios", "direccion", "destacado", "featured"]
    if user["rol"] in ["superadmin", "encargado"]:
        allowed_fields.extend(["verificado", "activo", "tipo", "subtipo", "municipio_id", "lat", "lng", "logo_url", "instagram", "facebook", "tiktok", "website"])
    
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.prestadores.update_one({"id": prestador_id}, {"$set": update_data})
    return await db.prestadores.find_one({"id": prestador_id}, {"_id": 0})

@api_router.post("/prestadores/{prestador_id}/verificar")
async def verificar_prestador(prestador_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el Super Admin puede verificar")
    
    await db.prestadores.update_one(
        {"id": prestador_id},
        {"$set": {"verificado": True, "aprobado_por_id": user["user_id"]}}
    )
    return {"message": "Prestador verificado"}

# ============== EVENTOS ENDPOINTS ==============

@api_router.get("/eventos")
async def get_eventos(
    municipio_id: Optional[str] = None,
    tipo: Optional[str] = None,
    publicado: Optional[bool] = None,
    desde: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if tipo:
        query["tipo"] = tipo
    if publicado is not None:
        query["publicado"] = publicado
    if desde:
        query["fecha_inicio"] = {"$gte": desde}
    
    eventos = await db.eventos.find(query, {"_id": 0}).sort("fecha_inicio", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.eventos.count_documents(query)
    
    return {"eventos": eventos, "total": total}

@api_router.get("/eventos/{evento_id}")
async def get_evento(evento_id: str):
    evento = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento

@api_router.post("/eventos")
async def create_evento(data: EventoCreate, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    evento = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.eventos.insert_one(evento)
    evento.pop("_id", None)
    return evento

@api_router.put("/eventos/{evento_id}")
async def update_evento(evento_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    evento = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if user["rol"] == "encargado" and evento.get("created_by") != user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    elif user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    allowed_fields = ["nombre", "descripcion", "foto_url", "fecha_inicio", "fecha_fin", "tipo", "lugar", "link_externo", "publicado"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.eventos.update_one({"id": evento_id}, {"$set": update_data})
    return await db.eventos.find_one({"id": evento_id}, {"_id": 0})

@api_router.delete("/eventos/{evento_id}")
async def delete_evento(evento_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    await db.eventos.delete_one({"id": evento_id})
    return {"message": "Evento eliminado"}

# ============== ALERTAS ENDPOINTS ==============

@api_router.get("/alertas")
async def get_alertas(activa: Optional[bool] = True):
    query = {}
    if activa is not None:
        query["activa"] = activa
    alertas = await db.alertas.find(query, {"_id": 0}).to_list(100)
    return alertas

@api_router.post("/alertas")
async def create_alerta(data: AlertaCreate, request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el Super Admin puede crear alertas")
    
    alerta = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "activa": True,
        "fecha_inicio": datetime.now(timezone.utc).isoformat(),
        "creada_por": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.alertas.insert_one(alerta)
    alerta.pop("_id", None)
    return alerta

@api_router.put("/alertas/{alerta_id}")
async def update_alerta(alerta_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo el Super Admin puede modificar alertas")
    
    body = await request.json()
    allowed_fields = ["titulo", "descripcion", "tipo", "municipios_afectados", "activa", "fecha_fin"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.alertas.update_one({"id": alerta_id}, {"$set": update_data})
    return await db.alertas.find_one({"id": alerta_id}, {"_id": 0})

# ============== EMERGENCIAS ENDPOINTS ==============

@api_router.get("/emergencias")
async def get_emergencias(estado: Optional[str] = None, request: Request = None):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    query = {}
    if estado:
        query["estado"] = estado
    
    emergencias = await db.emergencias.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return emergencias

@api_router.post("/emergencias")
async def create_emergencia(data: EmergenciaCreate, request: Request):
    user = await get_current_user(request)
    
    emergencia = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "nombre_turista": user["nombre"],
        "email_turista": user["email"],
        "lat": data.lat,
        "lng": data.lng,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "estado": "activa",
        "resuelta_por": None,
        "notas_resolucion": None
    }
    
    await db.emergencias.insert_one(emergencia)
    emergencia.pop("_id", None)
    
    # Log for email notification (MOCKED)
    logger.info(f"[MOCKED EMAIL] Emergencia registrada: {user['nombre']} en ({data.lat}, {data.lng})")
    
    return emergencia

@api_router.put("/emergencias/{emergencia_id}/resolver")
async def resolver_emergencia(emergencia_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    body = await request.json()
    notas = body.get("notas", "")
    
    await db.emergencias.update_one(
        {"id": emergencia_id},
        {"$set": {
            "estado": "resuelta",
            "resuelta_por": user["user_id"],
            "notas_resolucion": notas
        }}
    )
    return {"message": "Emergencia resuelta"}

# ============== RESENAS ENDPOINTS ==============

@api_router.get("/resenas")
async def get_resenas(prestador_id: str):
    resenas = await db.resenas.find({"prestador_id": prestador_id}, {"_id": 0}).to_list(100)
    return resenas

@api_router.post("/resenas")
async def create_resena(data: ResenaCreate, request: Request):
    user = await get_current_user(request)
    if user["rol"] != "turista":
        raise HTTPException(status_code=403, detail="Solo turistas pueden reseñar")
    
    # Check if already reviewed
    existing = await db.resenas.find_one({
        "turista_id": user["user_id"],
        "prestador_id": data.prestador_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya has reseñado este prestador")
    
    resena = {
        "id": str(uuid.uuid4()),
        "turista_id": user["user_id"],
        "prestador_id": data.prestador_id,
        "calificacion": min(5, max(1, data.calificacion)),
        "texto": data.texto[:300] if data.texto else None,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "editada": False
    }
    
    await db.resenas.insert_one(resena)
    
    # Update prestador rating
    all_resenas = await db.resenas.find({"prestador_id": data.prestador_id}, {"calificacion": 1}).to_list(1000)
    avg = sum(r["calificacion"] for r in all_resenas) / len(all_resenas) if all_resenas else 0
    await db.prestadores.update_one(
        {"id": data.prestador_id},
        {"$set": {"calificacion_promedio": round(avg, 1), "total_resenas": len(all_resenas)}}
    )
    
    resena.pop("_id", None)
    return resena

# ============== FAVORITOS ENDPOINTS ==============

@api_router.get("/favoritos")
async def get_favoritos(request: Request):
    user = await get_current_user(request)
    favoritos = await db.favoritos.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return favoritos

@api_router.post("/favoritos")
async def add_favorito(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    tipo = body.get("tipo")
    referencia_id = body.get("referencia_id")
    
    if tipo not in ["municipio", "evento", "prestador"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")
    
    existing = await db.favoritos.find_one({
        "user_id": user["user_id"],
        "tipo": tipo,
        "referencia_id": referencia_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya está en favoritos")
    
    favorito = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "tipo": tipo,
        "referencia_id": referencia_id,
        "fecha": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favoritos.insert_one(favorito)
    favorito.pop("_id", None)
    return favorito

@api_router.delete("/favoritos/{favorito_id}")
async def remove_favorito(favorito_id: str, request: Request):
    user = await get_current_user(request)
    await db.favoritos.delete_one({"id": favorito_id, "user_id": user["user_id"]})
    return {"message": "Eliminado de favoritos"}

# ============== SOLICITUDES PRESTADORES ENDPOINTS ==============

@api_router.get("/solicitudes-prestadores")
async def get_solicitudes(estado: Optional[str] = None, request: Request = None):
    user = await get_current_user(request)
    
    query = {}
    if user["rol"] == "encargado":
        query["encargado_id"] = user["user_id"]
    elif user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    if estado:
        query["estado"] = estado
    
    solicitudes = await db.solicitudes_prestador.find(query, {"_id": 0}).to_list(100)
    return solicitudes

@api_router.post("/solicitudes-prestadores")
async def create_solicitud(request: Request):
    user = await get_current_user(request)
    if user["rol"] != "encargado":
        raise HTTPException(status_code=403, detail="Solo encargados pueden proponer")
    
    body = await request.json()
    
    solicitud = {
        "id": str(uuid.uuid4()),
        "datos_prestador": body.get("datos_prestador", {}),
        "municipio_id": user.get("municipio_id", ""),
        "encargado_id": user["user_id"],
        "estado": "pendiente",
        "comentario_admin": None,
        "fecha_solicitud": datetime.now(timezone.utc).isoformat(),
        "fecha_resolucion": None
    }
    
    await db.solicitudes_prestador.insert_one(solicitud)
    solicitud.pop("_id", None)
    return solicitud

@api_router.put("/solicitudes-prestadores/{solicitud_id}")
async def update_solicitud(solicitud_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin puede aprobar/rechazar")
    
    body = await request.json()
    estado = body.get("estado")
    comentario = body.get("comentario", "")
    
    if estado not in ["aprobado", "rechazado"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    solicitud = await db.solicitudes_prestador.find_one({"id": solicitud_id}, {"_id": 0})
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    await db.solicitudes_prestador.update_one(
        {"id": solicitud_id},
        {"$set": {
            "estado": estado,
            "comentario_admin": comentario,
            "fecha_resolucion": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If approved, create the prestador
    if estado == "aprobado":
        datos = solicitud["datos_prestador"]
        prestador = {
            "id": str(uuid.uuid4()),
            "nombre": datos.get("nombre", ""),
            "tipo": datos.get("tipo", "OTROS"),
            "subtipo": datos.get("subtipo"),
            "municipio_id": solicitud["municipio_id"],
            "descripcion": datos.get("descripcion"),
            "foto_url": datos.get("foto_url"),
            "telefono": datos.get("telefono"),
            "whatsapp": datos.get("whatsapp"),
            "horarios": datos.get("horarios"),
            "direccion": datos.get("direccion"),
            "calificacion_promedio": 0.0,
            "total_resenas": 0,
            "verificado": True,
            "activo": True,
            "propuesto_por_id": solicitud["encargado_id"],
            "aprobado_por_id": user["user_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.prestadores.insert_one(prestador)
    
    # Log notification (MOCKED)
    logger.info(f"[MOCKED EMAIL] Solicitud {estado}: notificar a encargado {solicitud['encargado_id']}")
    
    return {"message": f"Solicitud {estado}"}

# ============== ADMIN ENDPOINTS ==============

@api_router.get("/admin/registros-prestadores")
async def get_registros_prestadores(
    estado: Optional[str] = "pendiente",
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    query: Dict[str, Any] = {}
    if estado:
        query["estado"] = estado
    docs = await db.solicitudes_prestador.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Enriquecer con nombre del municipio
    for d in docs:
        if d.get("municipio_id"):
            mun = await db.municipios.find_one({"id": d["municipio_id"]}, {"nombre": 1})
            d["municipio_nombre"] = mun["nombre"] if mun else d.get("municipio_id", "")
        # Normalizar campos para el frontend
        d.setdefault("nombre_negocio", d.get("nombre", ""))
        d.setdefault("nombre_contacto", d.get("responsable", ""))
        d.setdefault("email_contacto", d.get("email", ""))
        d.setdefault("fecha_registro", d.get("created_at", ""))
    return docs


@api_router.put("/admin/registros-prestadores/{registro_id}")
async def update_registro_prestador(
    registro_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    body = await request.json()
    estado = body.get("estado")

    if estado == "aprobado":
        # Obtener la solicitud
        solicitud = await db.solicitudes_prestador.find_one({"id": registro_id})
        if not solicitud:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")

        # Crear usuario prestador
        import secrets, string
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
        email = solicitud.get("email", "").lower().strip()
        nombre = solicitud.get("responsable") or solicitud.get("nombre", "Prestador")

        existing = await db.usuarios.find_one({"email": email})
        if not existing:
            user_id = str(uuid.uuid4())
            await db.usuarios.insert_one({
                "user_id": user_id,
                "email": email,
                "nombre": nombre,
                "password_hash": hash_password(password),
                "rol": "prestador",
                "activo": True,
                "fecha_registro": datetime.now(timezone.utc).isoformat(),
            })
        else:
            user_id = existing["user_id"]
            password = "(ya tenía cuenta)"

        # Crear el prestador
        prestador_id = str(uuid.uuid4())
        await db.prestadores.insert_one({
            "id": prestador_id,
            "nombre": solicitud.get("nombre", ""),
            "tipo": solicitud.get("tipo", ""),
            "subtipo": solicitud.get("subtipo"),
            "municipio_id": solicitud.get("municipio_id", ""),
            "descripcion": solicitud.get("descripcion"),
            "telefono": solicitud.get("telefono"),
            "whatsapp": solicitud.get("whatsapp"),
            "horarios": solicitud.get("horarios"),
            "direccion": solicitud.get("direccion"),
            "verificado": True,
            "activo": True,
            "user_id": user_id,
            "calificacion_promedio": 0.0,
            "total_resenas": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        await db.solicitudes_prestador.update_one(
            {"id": registro_id},
            {"$set": {"estado": "aprobado", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {
            "ok": True,
            "credentials": {"email": email, "password": password}
        }

    # Rechazado u otro estado
    await db.solicitudes_prestador.update_one(
        {"id": registro_id},
        {"$set": {"estado": estado, "comentario": body.get("comentario", ""), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True}


@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    
    municipios_publicados = await db.municipios.count_documents({"estado": "publicado"})
    municipios_borrador = await db.municipios.count_documents({"estado": "borrador"})
    municipios_sin_configurar = await db.municipios.count_documents({"estado": "sin_configurar"})
    
    prestadores_verificados = await db.prestadores.count_documents({"verificado": True, "activo": True})
    turistas_total = await db.usuarios.count_documents({"rol": "turista"})
    emergencias_activas = await db.emergencias.count_documents({"estado": "activa"})
    emergencias_resueltas = await db.emergencias.count_documents({"estado": "resuelta"})
    eventos_proximos = await db.eventos.count_documents({"publicado": True})
    solicitudes_pendientes = await db.solicitudes_prestador.count_documents({"estado": "pendiente"})
    
    return {
        "municipios": {
            "publicados": municipios_publicados,
            "borrador": municipios_borrador,
            "sin_configurar": municipios_sin_configurar,
            "total": municipios_publicados + municipios_borrador + municipios_sin_configurar
        },
        "prestadores_verificados": prestadores_verificados,
        "turistas_total": turistas_total,
        "emergencias": {
            "activas": emergencias_activas,
            "resueltas": emergencias_resueltas
        },
        "eventos_proximos": eventos_proximos,
        "solicitudes_pendientes": solicitudes_pendientes
    }

@api_router.post("/admin/usuarios")
async def create_usuario(request: Request):
    """Create encargado or prestador user (Super Admin only)"""
    admin = await get_current_user(request)
    if admin["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    
    body = await request.json()
    email = body.get("email", "").lower().strip()
    nombre = body.get("nombre", "")
    rol = body.get("rol", "encargado")
    municipio_id = body.get("municipio_id")
    password = body.get("password", f"Veracruz{uuid.uuid4().hex[:8]}!")

    if rol not in ["encargado", "prestador"]:
        raise HTTPException(status_code=400, detail="Rol inválido")

    existing = await db.usuarios.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "nombre": nombre,
        "foto_url": None,
        "rol": rol,
        "municipio_id": municipio_id,
        "activo": True,
        "fecha_registro": datetime.now(timezone.utc).isoformat(),
        "ultimo_acceso": None
    }
    await db.usuarios.insert_one(user)

    # Si es encargado, asignar al municipio
    if rol == "encargado" and municipio_id:
        await db.municipios.update_one(
            {"id": municipio_id},
            {"$set": {"encargado_id": user_id}}
        )

    # ✅ Si es prestador, crear documento en db.prestadores
    if rol == "prestador":
        prestador_id = str(uuid.uuid4())
        await db.prestadores.insert_one({
            "id": prestador_id,
            "nombre": nombre,
            "tipo": "SERVICIOS",
            "subtipo": None,
            "municipio_id": municipio_id,
            "descripcion": None,
            "telefono": None,
            "whatsapp": None,
            "verificado": True,
            "activo": True,
            "user_id": user_id,
            "calificacion_promedio": 0.0,
            "total_resenas": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    logger.info(f"[MOCKED EMAIL] Nuevo usuario creado: {email} con contraseña: {password}")
    return {
        "user_id": user_id,
        "email": email,
        "nombre": nombre,
        "rol": rol,
        "password": password,
        "message": "Usuario creado. Email enviado con credenciales."
    }
    # Log email notification (MOCKED)
    logger.info(f"[MOCKED EMAIL] Nuevo usuario creado: {email} con contraseña: {password}")
    
    return {
        "user_id": user_id,
        "email": email,
        "nombre": nombre,
        "rol": rol,
        "password": password,  # Return password only on creation
        "message": "Usuario creado. Email enviado con credenciales."
    }

@api_router.get("/admin/usuarios")
async def get_usuarios(rol: Optional[str] = None, request: Request = None):
    admin = await get_current_user(request)
    if admin["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    
    query = {}
    if rol:
        query["rol"] = rol
    
    usuarios = await db.usuarios.find(query, {"_id": 0, "password_hash": 0}).to_list(500)
    return usuarios

# ============== FILE UPLOAD ENDPOINTS ==============

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(request)
    
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo muy grande (máx 5MB)")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    
    try:
        result = put_object(path, content, file.content_type)
        
        # Store reference in DB
        file_record = {
            "id": str(uuid.uuid4()),
            "storage_path": result["public_id"],
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": result.get("size", len(content)),
            "user_id": user["user_id"],
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
       await db.files.insert_one(file_record)
        
        return {
            "path": result["public_id"],
            "url": result["url"],
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Error al subir archivo")

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: Optional[str] = Query(None)):
    try:
        record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
        if not record:
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail="Error al descargar archivo")

# ============== SEARCH ENDPOINT ==============

@api_router.get("/search")
async def global_search(q: str, limit: int = 10):
    if not q or len(q) < 2:
        return {"municipios": [], "eventos": [], "prestadores": []}
    
    regex = {"$regex": q, "$options": "i"}
    
    municipios = await db.municipios.find(
        {"$or": [{"nombre": regex}, {"tags": regex}, {"region": regex}]},
        {"_id": 0, "id": 1, "nombre": 1, "slug": 1, "foto_portada_url": 1, "pueblo_magico": 1, "region": 1}
    ).limit(limit).to_list(limit)
    
    eventos = await db.eventos.find(
        {"$or": [{"nombre": regex}, {"descripcion": regex}], "publicado": True},
        {"_id": 0, "id": 1, "nombre": 1, "foto_url": 1, "fecha_inicio": 1, "tipo": 1}
    ).limit(limit).to_list(limit)
    
    prestadores = await db.prestadores.find(
        {"$or": [{"nombre": regex}, {"descripcion": regex}, {"tipo": regex}], "activo": True, "verificado": True},
        {"_id": 0, "id": 1, "nombre": 1, "foto_url": 1, "tipo": 1, "calificacion_promedio": 1}
    ).limit(limit).to_list(limit)
    
    return {"municipios": municipios, "eventos": eventos, "prestadores": prestadores}

# ============== ANALYTICS ENDPOINTS ==============

@api_router.post("/analytics/track")
async def track_event(request: Request):
    """Track user interactions for analytics"""
    body = await request.json()
    event_type = body.get("event_type")  # view, click, search, contact
    target_type = body.get("target_type")  # municipio, prestador, evento
    target_id = body.get("target_id")
    
    if not all([event_type, target_type, target_id]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Get optional user info
    user = await get_optional_user(request)
    
    analytics_event = {
        "id": str(uuid.uuid4()),
        "event_type": event_type,
        "target_type": target_type,
        "target_id": target_id,
        "user_id": user["user_id"] if user else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    
    await db.analytics.insert_one(analytics_event)
    
    # Update counters based on event type
    if event_type == "view":
        if target_type == "municipio":
            await db.municipios.update_one({"id": target_id}, {"$inc": {"visitas_total": 1}})
        elif target_type == "prestador":
            await db.prestadores.update_one({"id": target_id}, {"$inc": {"vistas_total": 1}})
    elif event_type == "contact" and target_type == "prestador":
        await db.prestadores.update_one({"id": target_id}, {"$inc": {"contactos_total": 1}})
    
    return {"status": "tracked"}

@api_router.get("/analytics/municipio/{municipio_id}")
async def get_municipio_analytics(municipio_id: str, request: Request, days: int = 30):
    """Get analytics for a specific municipio"""
    user = await get_current_user(request)
    
    # Check permissions
    municipio = await db.municipios.find_one({"id": municipio_id}, {"_id": 0})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    if user["rol"] == "encargado" and municipio.get("encargado_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    elif user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get view stats
    views_pipeline = [
        {
            "$match": {
                "target_type": "municipio",
                "target_id": municipio_id,
                "event_type": "view",
                "timestamp": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$date",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    views_by_day = await db.analytics.aggregate(views_pipeline).to_list(100)
    
    # Get prestador stats for this municipio
    prestadores = await db.prestadores.find(
        {"municipio_id": municipio_id, "verificado": True},
        {"_id": 0, "id": 1, "nombre": 1, "tipo": 1, "vistas_total": 1, "contactos_total": 1}
    ).to_list(100)
    
    # Get event stats
    eventos = await db.eventos.find(
        {"municipio_id": municipio_id},
        {"_id": 0, "id": 1, "nombre": 1, "tipo": 1}
    ).to_list(100)
    
    # Get total counts
    total_views = await db.analytics.count_documents({
        "target_type": "municipio",
        "target_id": municipio_id,
        "event_type": "view",
        "timestamp": {"$gte": start_date.isoformat()}
    })
    
    # Get search terms that found this municipio
    search_events = await db.analytics.find(
        {
            "target_type": "municipio",
            "target_id": municipio_id,
            "event_type": "search"
        },
        {"_id": 0}
    ).limit(50).to_list(50)
    
    return {
        "municipio_id": municipio_id,
        "municipio_nombre": municipio["nombre"],
        "period_days": days,
        "total_views": total_views,
        "views_by_day": views_by_day,
        "prestadores": sorted(prestadores, key=lambda x: x.get("contactos_total", 0), reverse=True),
        "eventos_count": len(eventos),
        "top_prestadores": sorted(prestadores, key=lambda x: x.get("vistas_total", 0), reverse=True)[:5]
    }

@api_router.get("/analytics/global")
async def get_global_analytics(request: Request, days: int = 30):
    """Get global platform analytics (Super Admin only)"""
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo Super Admin")
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Top municipios by views
    top_municipios_pipeline = [
        {
            "$match": {
                "target_type": "municipio",
                "event_type": "view",
                "timestamp": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$target_id",
                "views": {"$sum": 1}
            }
        },
        {"$sort": {"views": -1}},
        {"$limit": 10}
    ]
    
    top_municipios_raw = await db.analytics.aggregate(top_municipios_pipeline).to_list(10)
    
    # Enrich with municipio names
    top_municipios = []
    for item in top_municipios_raw:
        mun = await db.municipios.find_one({"id": item["_id"]}, {"_id": 0, "nombre": 1, "slug": 1, "pueblo_magico": 1})
        if mun:
            top_municipios.append({
                "id": item["_id"],
                "nombre": mun["nombre"],
                "slug": mun["slug"],
                "pueblo_magico": mun.get("pueblo_magico", False),
                "views": item["views"]
            })
    
    # Top prestadores by contacts
    top_prestadores = await db.prestadores.find(
        {"verificado": True, "activo": True},
        {"_id": 0, "id": 1, "nombre": 1, "tipo": 1, "contactos_total": 1, "vistas_total": 1}
    ).sort("contactos_total", -1).limit(10).to_list(10)
    
    # Views over time
    views_pipeline = [
        {
            "$match": {
                "event_type": "view",
                "timestamp": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$date",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    views_by_day = await db.analytics.aggregate(views_pipeline).to_list(100)
    
    # Search terms
    search_pipeline = [
        {
            "$match": {
                "event_type": "search",
                "timestamp": {"$gte": start_date.isoformat()}
            }
        },
        {
            "$group": {
                "_id": "$search_term",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    
    top_searches = await db.analytics.aggregate(search_pipeline).to_list(20)
    
    # Total counts
    total_views = await db.analytics.count_documents({
        "event_type": "view",
        "timestamp": {"$gte": start_date.isoformat()}
    })
    
    total_contacts = await db.analytics.count_documents({
        "event_type": "contact",
        "timestamp": {"$gte": start_date.isoformat()}
    })
    
    total_searches = await db.analytics.count_documents({
        "event_type": "search",
        "timestamp": {"$gte": start_date.isoformat()}
    })
    
    return {
        "period_days": days,
        "totals": {
            "views": total_views,
            "contacts": total_contacts,
            "searches": total_searches
        },
        "top_municipios": top_municipios,
        "top_prestadores": top_prestadores,
        "views_by_day": views_by_day,
        "top_searches": top_searches
    }

@api_router.post("/analytics/search")
async def track_search(request: Request):
    """Track search queries"""
    body = await request.json()
    search_term = body.get("term", "").strip()
    
    if not search_term or len(search_term) < 2:
        return {"status": "ignored"}
    
    user = await get_optional_user(request)
    
    analytics_event = {
        "id": str(uuid.uuid4()),
        "event_type": "search",
        "search_term": search_term.lower(),
        "target_type": "search",
        "target_id": None,
        "user_id": user["user_id"] if user else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    
    await db.analytics.insert_one(analytics_event)
    return {"status": "tracked"}

# ============== CHATBOT ENDPOINT ==============
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

async def get_platform_context():
    """Fetch real data from DB to give the AI context"""
    try:
        municipios_cursor = db.municipios.find(
            {"estado": "publicado"},
            {"_id": 0, "nombre": 1, "slug": 1, "region": 1, "pueblo_magico": 1, "descripcion": 1, "clima": 1, "altitud": 1, "que_hacer": 1}
        ).limit(20)
        municipios = await municipios_cursor.to_list(20)

        eventos_cursor = db.eventos.find(
            {"publicado": True},
            {"_id": 0, "nombre": 1, "tipo": 1, "municipio_nombre": 1, "fecha_inicio": 1, "fecha_fin": 1, "descripcion": 1}
        ).limit(10)
        eventos = await eventos_cursor.to_list(10)

        prestadores_cursor = db.prestadores.find(
            {"verificado": True},
            {"_id": 0, "nombre": 1, "tipo": 1, "municipio_nombre": 1, "descripcion": 1, "calificacion_promedio": 1}
        ).limit(10)
        prestadores = await prestadores_cursor.to_list(10)

        context = "DATOS REALES DE LA PLATAFORMA:\n\n"
        context += "MUNICIPIOS DESTACADOS:\n"
        for m in municipios:
            pm = " (Pueblo Mágico)" if m.get("pueblo_magico") else ""
            desc = (m.get("descripcion") or "")[:150]
            que = ", ".join(m.get("que_hacer", [])[:3]) if m.get("que_hacer") else ""
            context += f"- {m['nombre']}{pm} | Región: {m.get('region','')} | Clima: {m.get('clima','')} | Altitud: {m.get('altitud','')} | {desc} | Qué hacer: {que}\n"

        context += "\nEVENTOS PRÓXIMOS:\n"
        for e in eventos:
            context += f"- {e['nombre']} en {e.get('municipio_nombre','')} | Tipo: {e.get('tipo','')} | Fecha: {e.get('fecha_inicio','')}\n"

        context += "\nPRESTADORES VERIFICADOS:\n"
        for p in prestadores:
            context += f"- {p['nombre']} ({p.get('tipo','')}) en {p.get('municipio_nombre','')} | Rating: {p.get('calificacion_promedio','N/A')}\n"

        return context
    except Exception as e:
        logger.error(f"Error getting platform context: {e}")
        return ""

SYSTEM_MESSAGES = {
    "es": """Eres el asistente turístico oficial de "Veracruz Contigo", la plataforma de turismo del Gobierno del Estado de Veracruz, México. Tu nombre es VeraCruz AI.

REGLAS:
- Responde SIEMPRE en español
- Sé amable, entusiasta y conocedor de Veracruz
- Usa los datos reales de la plataforma que se te proporcionan como contexto
- Recomienda rutas de viaje: Escapada Express (3 días: Xalapa→Coatepec→Xico), Ruta Mágica (5 días por Pueblos Mágicos), Aventura Completa (7 días), Ruta Cultural (4 días)
- Si preguntan sobre emergencias, menciona el botón de pánico con GPS disponible en la app
- Respuestas cortas y útiles (máximo 3 párrafos)
- No inventes información que no esté en el contexto
- Si no sabes algo, sugiere visitar la sección correspondiente de la plataforma""",

    "en": """You are the official tourism assistant of "Veracruz Contigo", the tourism platform of the Government of the State of Veracruz, Mexico. Your name is VeraCruz AI.

RULES:
- ALWAYS respond in English
- Be friendly, enthusiastic and knowledgeable about Veracruz
- Use the real platform data provided as context
- Recommend travel routes: Express Getaway (3 days: Xalapa→Coatepec→Xico), Magic Route (5 days through Pueblos Mágicos), Complete Adventure (7 days), Cultural Route (4 days)
- If asked about emergencies, mention the GPS panic button available in the app
- Short and useful responses (maximum 3 paragraphs)
- Don't invent information not in the context
- If unsure, suggest visiting the corresponding section of the platform""",

    "fr": """Vous êtes l'assistant touristique officiel de "Veracruz Contigo", la plateforme touristique du Gouvernement de l'État de Veracruz, Mexique. Votre nom est VeraCruz AI.

RÈGLES:
- Répondez TOUJOURS en français
- Soyez aimable, enthousiaste et connaisseur de Veracruz
- Utilisez les données réelles de la plateforme fournies comme contexte
- Recommandez des itinéraires: Escapade Express (3 jours: Xalapa→Coatepec→Xico), Route Magique (5 jours), Aventure Complète (7 jours), Route Culturelle (4 jours)
- Si on vous demande les urgences, mentionnez le bouton de panique GPS disponible dans l'app
- Réponses courtes et utiles (maximum 3 paragraphes)
- N'inventez pas d'informations absentes du contexte
- En cas de doute, suggérez de visiter la section correspondante de la plateforme"""
}

@api_router.post("/chat")
async def chat_endpoint(request: Request):
    try:
        body = await request.json()
        message = body.get("message", "").strip()
        session_id = body.get("session_id", "default")
        lang = body.get("lang", "es")

        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="LLM key not configured")

        # Store user message in DB
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "role": "user",
            "content": message,
            "lang": lang,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Get platform context
        platform_context = await get_platform_context()

        # Get chat history for this session (last 10 messages)
        history_cursor = db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0, "role": 1, "content": 1}
        ).sort("timestamp", -1).limit(10)
        history = await history_cursor.to_list(10)
        history.reverse()

        system_msg = SYSTEM_MESSAGES.get(lang, SYSTEM_MESSAGES["es"])
        full_system = f"{system_msg}\n\n{platform_context}"

        # Build messages list for Anthropic
        messages_for_api = []
        for h in history[:-1]:
            if h["role"] in ("user", "assistant"):
                messages_for_api.append({"role": h["role"], "content": h["content"]})
        messages_for_api.append({"role": "user", "content": message})

        import asyncio
        from groq import Groq

        def call_gemini():
            client = Groq(api_key=GROQ_API_KEY)
            messages_groq = [{"role": "system", "content": full_system}]
            for msg in messages_for_api:
                messages_groq.append({"role": msg["role"], "content": msg["content"]})
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages_groq,
                max_tokens=1000,
            )
            return completion.choices[0].message.content

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, call_gemini)

        # Store assistant response in DB
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "role": "assistant",
            "content": response,
            "lang": lang,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        return {"response": response, "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Error processing chat message")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    cursor = db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1, "timestamp": 1}
    ).sort("timestamp", 1).limit(50)
    messages = await cursor.to_list(50)
    return {"messages": messages}

# ============== SEED DATA — RUTAS, LUGARES Y PAQUETES ==============

LUGARES_DATA = [
    {"nombre": "Palacio de Hierro de Orizaba", "region": "orizaba", "municipio": "Orizaba", "tipo": "atraccion",
     "descripcion": "Joya arquitectónica art nouveau construida en Bélgica y ensamblada en México. Alberga el Museo de Arte del Estado.",
     "descripcion_larga": "El Palacio de Hierro fue fabricado en Bélgica y ensamblado en Orizaba en 1894. Su fachada de hierro pintada de verde y azul es icónica. Hoy funciona como Museo de Arte con exposiciones temporales y permanentes.",
     "horarios": "Mar–Dom 10:00–18:00", "costo": "$30 MXN", "costo_min": 30, "costo_max": 30,
     "lat": 18.8534, "lng": -97.1014,
     "fotos": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg"],
     "tags": ["arquitectura","museo","arte","historia"], "calificacion": 4.8, "destacado": True,
     "direccion": "Av. Colón s/n, Centro, Orizaba, Ver."},
    {"nombre": "Teleférico de Orizaba", "region": "orizaba", "municipio": "Orizaba", "tipo": "actividad",
     "descripcion": "Uno de los teleféricos más largos de México. Vistas panorámicas del Pico de Orizaba.",
     "horarios": "Mar–Dom 10:00–19:00", "costo": "$50 MXN", "costo_min": 50, "costo_max": 50,
     "lat": 18.8480, "lng": -97.1050, "fotos": [], "tags": ["aventura","vistas","naturaleza"], "calificacion": 4.6, "destacado": True,
     "direccion": "Cerro del Borrego, Orizaba, Ver."},
    {"nombre": "Fortín de las Flores", "region": "orizaba", "municipio": "Fortín de las Flores", "tipo": "atraccion",
     "descripcion": "Ciudad de las Flores, famosa por magnolias y gardenias. Parque Botánico y cafetales imperdibles.",
     "horarios": "Parque Botánico: 9:00–17:00", "costo": "Entrada libre", "costo_min": 0, "costo_max": 100,
     "lat": 18.9078, "lng": -96.9942, "fotos": [], "tags": ["flores","naturaleza","café"], "calificacion": 4.7, "destacado": True},
    {"nombre": "Xico — Pueblo Mágico", "region": "orizaba", "municipio": "Xico", "tipo": "atraccion",
     "descripcion": "Pueblo Mágico famoso por la Cascada de Texolo, sarapes y la Feria de María Magdalena.",
     "horarios": "Todo el año", "costo": "Libre · Cascada $30 MXN", "costo_min": 0, "costo_max": 200,
     "lat": 19.4180, "lng": -97.0080, "fotos": [], "tags": ["pueblo magico","cascada","artesanias"], "calificacion": 4.9, "destacado": True},
    {"nombre": "Cascada de Elefante", "region": "orizaba", "municipio": "Orizaba", "tipo": "atraccion",
     "descripcion": "Cascada de 40 metros ideal para senderismo.", "horarios": "8:00–17:00", "costo": "$30 MXN",
     "costo_min": 30, "costo_max": 30, "lat": 18.8600, "lng": -97.0800, "fotos": [],
     "tags": ["naturaleza","cascada","senderismo"], "calificacion": 4.5, "destacado": False},
    {"nombre": "Museo de Antropología de Xalapa", "region": "xalapa", "municipio": "Xalapa", "tipo": "atraccion",
     "descripcion": "Segundo museo de antropología más importante de México. Mayor colección de cabezas olmecas del mundo.",
     "horarios": "Mar–Dom 9:00–17:00", "costo": "$80 MXN", "costo_min": 0, "costo_max": 80,
     "lat": 19.5347, "lng": -96.9266, "fotos": [], "tags": ["cultura","museo","arqueologia","olmecas"],
     "calificacion": 4.9, "destacado": True, "direccion": "Av. Xalapa s/n, Xalapa, Ver.", "telefono": "228 815 4952"},
    {"nombre": "Coatepec — Ciudad del Café", "region": "xalapa", "municipio": "Coatepec", "tipo": "atraccion",
     "descripcion": "Pueblo Mágico y capital mundial del café de altura. Calles coloniales y aroma a café.",
     "horarios": "Todo el año", "costo": "Libre · Tours $150–300 MXN", "costo_min": 0, "costo_max": 300,
     "lat": 19.4524, "lng": -96.9614, "fotos": [], "tags": ["cafe","pueblo magico","gastronomia"], "calificacion": 4.8, "destacado": True},
    {"nombre": "Naolinco — Pueblo Mágico", "region": "xalapa", "municipio": "Naolinco", "tipo": "atraccion",
     "descripcion": "Pueblo Mágico famoso por zapatos artesanales, cascadas y puente colgante.",
     "horarios": "Todo el año", "costo": "Libre", "costo_min": 0, "costo_max": 200,
     "lat": 19.6500, "lng": -96.8667, "fotos": [], "tags": ["pueblo magico","artesanias","calzado"], "calificacion": 4.6, "destacado": True},
    {"nombre": "Lagos del Dique — Xalapa", "region": "xalapa", "municipio": "Xalapa", "tipo": "atraccion",
     "descripcion": "Parque lacustre en el corazón de Xalapa para paseos en lancha y ciclismo.",
     "horarios": "6:00–21:00", "costo": "Libre", "costo_min": 0, "costo_max": 100,
     "lat": 19.5250, "lng": -96.9300, "fotos": [], "tags": ["naturaleza","parque","familia"], "calificacion": 4.4, "destacado": False},
    {"nombre": "Laguna de Catemaco", "region": "tuxtlas", "municipio": "Catemaco", "tipo": "atraccion",
     "descripcion": "Laguna más grande de Veracruz. Famosa por brujos, monos y selva tropical.",
     "horarios": "Lanchas 8:00–18:00", "costo": "$200–350 MXN por lancha", "costo_min": 200, "costo_max": 350,
     "lat": 18.4220, "lng": -95.1140, "fotos": [], "tags": ["laguna","naturaleza","ecoturismo","brujos"], "calificacion": 4.7, "destacado": True},
    {"nombre": "Reserva Nanciyaga", "region": "tuxtlas", "municipio": "Catemaco", "tipo": "actividad",
     "descripcion": "Reserva ecológica con temazcal, lodazales y senderos en selva primaria.",
     "horarios": "8:00–17:00", "costo": "$150 MXN · Temazcal $300", "costo_min": 150, "costo_max": 500,
     "lat": 18.3800, "lng": -95.0900, "fotos": [], "tags": ["ecoturismo","temazcal","selva"],
     "calificacion": 4.8, "destacado": True, "web": "https://nanciyaga.com"},
    {"nombre": "San Andrés Tuxtla", "region": "tuxtlas", "municipio": "San Andrés Tuxtla", "tipo": "atraccion",
     "descripcion": "Capital regional con puros artesanales. Puerta de entrada a Los Tuxtlas.",
     "horarios": "Todo el año", "costo": "Libre", "costo_min": 0, "costo_max": 200,
     "lat": 18.4500, "lng": -95.2150, "fotos": [], "tags": ["puros","artesanias","gastronomia"], "calificacion": 4.3, "destacado": False},
    {"nombre": "Zona Arqueológica El Tajín", "region": "norte", "municipio": "Papantla", "tipo": "atraccion",
     "descripcion": "Patrimonio UNESCO. Ciudad totonaca con la Pirámide de los Nichos.",
     "horarios": "9:00–17:00", "costo": "$85 MXN", "costo_min": 0, "costo_max": 85,
     "lat": 20.4472, "lng": -97.3778, "fotos": [],
     "tags": ["arqueologia","UNESCO","totonaca","historia"], "calificacion": 4.9, "destacado": True,
     "direccion": "Zona Arqueológica El Tajín, Papantla, Ver."},
    {"nombre": "Voladores de Papantla", "region": "norte", "municipio": "Papantla", "tipo": "atraccion",
     "descripcion": "Ritual Patrimonio Cultural Inmaterial UNESCO. Cinco hombres giran desde 30 metros de altura.",
     "horarios": "Diario en El Tajín 11:00, 13:00, 15:00", "costo": "Donativo $50–100 MXN", "costo_min": 50, "costo_max": 100,
     "lat": 20.4547, "lng": -97.3222, "fotos": [], "tags": ["cultura","UNESCO","totonaca","ritual"], "calificacion": 4.9, "destacado": True},
    {"nombre": "Playas de Tuxpan", "region": "norte", "municipio": "Tuxpan de Rodríguez Cano", "tipo": "atraccion",
     "descripcion": "Las playas más cercanas a la CDMX. Arena fina y malecón animado.",
     "horarios": "Todo el año", "costo": "Libre", "costo_min": 0, "costo_max": 300,
     "lat": 20.9500, "lng": -97.4000, "fotos": [], "tags": ["playa","mar","familia"], "calificacion": 4.3, "destacado": False},
    {"nombre": "San Juan de Ulúa", "region": "costa", "municipio": "Veracruz", "tipo": "atraccion",
     "descripcion": "Fortaleza colonial del siglo XVI, primer edificio colonial de América.",
     "horarios": "Mar–Dom 9:00–16:30", "costo": "$75 MXN", "costo_min": 0, "costo_max": 75,
     "lat": 19.2030, "lng": -96.1350, "fotos": [], "tags": ["historia","colonial","fortaleza"],
     "calificacion": 4.7, "destacado": True, "direccion": "Isla de San Juan de Ulúa, Veracruz"},
    {"nombre": "Malecón de Veracruz", "region": "costa", "municipio": "Veracruz", "tipo": "atraccion",
     "descripcion": "El malecón más famoso de México con Acuario, Baluarte y restaurantes de mariscos.",
     "horarios": "Todo el año · Acuario 10:00–18:00", "costo": "Libre · Acuario $150 MXN", "costo_min": 0, "costo_max": 150,
     "lat": 19.1934, "lng": -96.1370, "fotos": [], "tags": ["malecon","acuario","gastronomia","carnaval"], "calificacion": 4.6, "destacado": True},
    {"nombre": "Boca del Río", "region": "costa", "municipio": "Boca del Río", "tipo": "atraccion",
     "descripcion": "Zona gastronómica top de Veracruz. Mariscos frescos y restaurantes de playa.",
     "horarios": "Todo el año", "costo": "Libre · Comida $150–500/persona", "costo_min": 0, "costo_max": 500,
     "lat": 19.1070, "lng": -96.1150, "fotos": [], "tags": ["gastronomia","mariscos","playa"], "calificacion": 4.7, "destacado": True},
    {"nombre": "Alvarado — Puerto Pesquero", "region": "costa", "municipio": "Alvarado", "tipo": "atraccion",
     "descripcion": "Puerto pesquero auténtico con mariscos ultra frescos y laguna de Camaronera.",
     "horarios": "Todo el año", "costo": "Libre · Lanchas $150/persona", "costo_min": 0, "costo_max": 200,
     "lat": 18.7700, "lng": -95.7630, "fotos": [], "tags": ["pesca","mariscos","laguna"], "calificacion": 4.5, "destacado": False},
]

RUTAS_DATA = [
    {"nombre": "Ruta Orizaba — Entre Cumbres y Flores", "slug": "orizaba", "region": "orizaba",
     "descripcion": "Del Pico de Orizaba a los cafetales de Xico: arquitectura única y naturaleza exuberante.",
     "descripcion_larga": "La región de Orizaba combina lo mejor de Veracruz. A 2,000 metros, el clima es fresco. El Palacio de Hierro, el Teleférico, Fortín de las Flores y Xico te esperan.",
     "dias_recomendados": 3, "distancia_km": 45, "dificultad": "facil",
     "costo_estimado_min": 1200, "costo_estimado_max": 3500,
     "mejor_epoca": "Todo el año · Mejor: octubre a mayo",
     "como_llegar": "Desde CDMX: 4h por autopista México-Orizaba. Desde Xalapa: 2h.",
     "foto_portada": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg",
     "tags": ["cafe","naturaleza","arquitectura","familia"]},
    {"nombre": "Ruta Xalapa — La Capital de la Cultura", "slug": "xalapa", "region": "xalapa",
     "descripcion": "La ciudad de las flores, el café y la niebla. Museos de clase mundial y Pueblos Mágicos.",
     "descripcion_larga": "Xalapa a 1,400m: el MAX, Coatepec capital del café y Naolinco con sus zapatos artesanales.",
     "dias_recomendados": 3, "distancia_km": 60, "dificultad": "facil",
     "costo_estimado_min": 1500, "costo_estimado_max": 4000,
     "mejor_epoca": "Todo el año · Mejor: noviembre a abril",
     "como_llegar": "Desde CDMX: 4.5h en autopista.", "foto_portada": "",
     "tags": ["cultura","museos","cafe","gastronomia"]},
    {"nombre": "Ruta Los Tuxtlas — Selva, Magia y Laguna", "slug": "tuxtlas", "region": "tuxtlas",
     "descripcion": "La región más biodiversa de México. Selva tropical, laguna mágica y brujos.",
     "descripcion_larga": "La última gran selva de México. Catemaco, Nanciyaga y San Andrés Tuxtla te esperan.",
     "dias_recomendados": 4, "distancia_km": 80, "dificultad": "moderada",
     "costo_estimado_min": 2000, "costo_estimado_max": 5000,
     "mejor_epoca": "Noviembre a mayo",
     "como_llegar": "Desde Veracruz: 2.5h. Desde CDMX: 7h.", "foto_portada": "",
     "tags": ["ecoturismo","selva","laguna","aventura"]},
    {"nombre": "Ruta Norte — El Tajín y los Totonacas", "slug": "norte", "region": "norte",
     "descripcion": "Patrimonio UNESCO y cultura viva. El Tajín, Voladores de Papantla y playas de Tuxpan.",
     "descripcion_larga": "El Tajín Patrimonio UNESCO, Papantla con su vainilla y Tuxpan con sus playas.",
     "dias_recomendados": 3, "distancia_km": 100, "dificultad": "facil",
     "costo_estimado_min": 1500, "costo_estimado_max": 4500,
     "mejor_epoca": "Todo el año · Cumbre Tajín: marzo",
     "como_llegar": "Desde CDMX: 4h a Poza Rica, 30min a Papantla.", "foto_portada": "",
     "tags": ["arqueologia","UNESCO","cultura","playa"]},
    {"nombre": "Ruta Costa — Veracruz Puerto", "slug": "costa", "region": "costa",
     "descripcion": "El puerto más antiguo de América. Fortalezas coloniales, carnaval y mariscos frescos.",
     "descripcion_larga": "San Juan de Ulúa, el Malecón, Boca del Río y Alvarado forman el circuito costero.",
     "dias_recomendados": 3, "distancia_km": 120, "dificultad": "facil",
     "costo_estimado_min": 1800, "costo_estimado_max": 5000,
     "mejor_epoca": "Todo el año · Carnaval: febrero",
     "como_llegar": "Desde CDMX: 5h en autopista o vuelo de 1h.", "foto_portada": "",
     "tags": ["historia","gastronomia","playa","carnaval"]},
]

PAQUETES_DATA = [
    {"nombre": "Paquete Orizaba Express", "region": "orizaba",
     "descripcion": "3 días entre el Pico de Orizaba, cafetales y flores de Fortín.",
     "dias": 3, "precio_min": 3500, "precio_max": 7000,
     "incluye": ["2 noches hospedaje boutique","Desayunos","Tour Palacio de Hierro + Teleférico","Tour cafetero Fortín","Visita Xico con guía"],
     "no_incluye": ["Transporte de origen","Comidas y cenas","Gastos personales"],
     "hoteles": [{"nombre": "Hotel Fiesta Inn Orizaba","estrellas": 4,"precio_noche": 1200,"descripcion": "Céntrico con alberca"},
                 {"nombre": "Gran Hotel de Orizaba","estrellas": 3,"precio_noche": 750,"descripcion": "Hotel histórico en el centro"}],
     "restaurantes": [{"nombre": "La Casona de las Flores","especialidad": "Cocina veracruzana","precio_promedio": 250},
                      {"nombre": "Café de Altura La Esquina","especialidad": "Café de especialidad","precio_promedio": 80}],
     "actividades": ["Teleférico","Cascada de Elefante","Tour café Fortín","Cascada Texolo Xico"]},
    {"nombre": "Paquete Xalapa Cultural", "region": "xalapa",
     "descripcion": "Museos, café de especialidad y Pueblos Mágicos en 3 días.",
     "dias": 3, "precio_min": 3800, "precio_max": 7500,
     "incluye": ["2 noches hotel boutique Xalapa","Desayunos","Entrada MAX","Tour cafetero Coatepec","Guía Naolinco"],
     "no_incluye": ["Transporte de origen","Comidas","Compras"],
     "hoteles": [{"nombre": "Mesón del Alférez","estrellas": 4,"precio_noche": 1400,"descripcion": "Boutique colonial"},
                 {"nombre": "Hotel Xalapa","estrellas": 4,"precio_noche": 1100,"descripcion": "Clásico con jardines"}],
     "restaurantes": [{"nombre": "La Sopa","especialidad": "Cocina veracruzana","precio_promedio": 180},
                      {"nombre": "Café Tierra Luna","especialidad": "Café Coatepec","precio_promedio": 100}],
     "actividades": ["Museo Antropología","Lagos del Dique","Tour café Coatepec","Naolinco"]},
    {"nombre": "Paquete Veracruz Puerto & Costa", "region": "costa",
     "descripcion": "Historia colonial, mariscos y playas del Golfo en 3 días.",
     "dias": 3, "precio_min": 4200, "precio_max": 8500,
     "incluye": ["2 noches hotel frente al mar","Desayunos buffet","Tour San Juan de Ulúa","Recorrido Centro Histórico","Acuario"],
     "no_incluye": ["Transporte de origen","Comidas","Actividades extra"],
     "hoteles": [{"nombre": "Hotel Emporio Veracruz","estrellas": 5,"precio_noche": 2200,"descripcion": "Lujo frente al malecón"},
                 {"nombre": "Holiday Inn Veracruz Centro","estrellas": 4,"precio_noche": 1400,"descripcion": "Cómodo cerca del Zócalo"}],
     "restaurantes": [{"nombre": "Mariscos Villa Rica","especialidad": "Mariscos frescos","precio_promedio": 300},
                      {"nombre": "Los Portales del Parque","especialidad": "Antojitos jarochos","precio_promedio": 120}],
     "actividades": ["San Juan de Ulúa","Malecón y Acuario","Gastronomía Boca del Río","Lanchas Alvarado"]},
]


async def seed_rutas_y_lugares():
    """Puebla la BD con rutas turísticas, lugares y paquetes si no existen."""
    existing_lugares = await db.lugares.count_documents({})
    if existing_lugares == 0:
        lugares_to_insert = []
        for l in LUGARES_DATA:
            doc = {**l, "id": str(uuid.uuid4()), "slug": slugify(l["nombre"])}
            lugares_to_insert.append(doc)
        if lugares_to_insert:
            await db.lugares.insert_many(lugares_to_insert)
            logger.info(f"Seeded {len(lugares_to_insert)} lugares")

    existing_rutas = await db.rutas.count_documents({})
    if existing_rutas == 0:
        rutas_to_insert = []
        for r in RUTAS_DATA:
            paradas_cursor = db.lugares.find({"region": r["region"]}, {"_id": 0, "id": 1}).sort("destacado", -1)
            paradas = await paradas_cursor.to_list(10)
            doc = {**r, "id": str(uuid.uuid4()), "paradas": [p["id"] for p in paradas], "activa": True}
            rutas_to_insert.append(doc)
        if rutas_to_insert:
            await db.rutas.insert_many(rutas_to_insert)
            logger.info(f"Seeded {len(rutas_to_insert)} rutas")

    existing_paquetes = await db.paquetes.count_documents({})
    if existing_paquetes == 0:
        paquetes_to_insert = []
        for p in PAQUETES_DATA:
            lugar_ids_cursor = db.lugares.find({"region": p["region"]}, {"_id": 0, "id": 1})
            lugar_ids = await lugar_ids_cursor.to_list(10)
            doc = {**p, "id": str(uuid.uuid4()), "lugar_ids": [l["id"] for l in lugar_ids], "activo": True}
            paquetes_to_insert.append(doc)
        if paquetes_to_insert:
            await db.paquetes.insert_many(paquetes_to_insert)
            logger.info(f"Seeded {len(paquetes_to_insert)} paquetes")


# ─── ENDPOINTS RUTAS, LUGARES, PAQUETES E ITINERARIO ───

@api_router.get("/rutas")
async def get_rutas(region: Optional[str] = None):
    query = {"activa": True}
    if region:
        query["region"] = region.lower()
    cursor = db.rutas.find(query, {"_id": 0}).sort("region", 1)
    rutas = await cursor.to_list(20)
    return {"rutas": rutas}


@api_router.get("/rutas/{region_slug}")
async def get_ruta_by_region(region_slug: str):
    ruta = await db.rutas.find_one({"slug": region_slug, "activa": True}, {"_id": 0})
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    lugares_cursor = db.lugares.find({"region": ruta["region"]}, {"_id": 0}).sort("destacado", -1)
    lugares = await lugares_cursor.to_list(20)
    return {"ruta": ruta, "lugares": lugares}


@api_router.get("/lugares")
async def get_lugares(
    region: Optional[str] = None,
    municipio: Optional[str] = None,
    municipio_id: Optional[str] = None,
    tipo: Optional[str] = None,
    destacado: Optional[bool] = None,
    limit: int = 20,
):
    query: Dict[str, Any] = {}
    if region:
        query["region"] = region.lower()
    if municipio_id:
        query["municipio_id"] = municipio_id
    elif municipio:
        query["municipio"] = {"$regex": municipio, "$options": "i"}
    if tipo:
        query["tipo"] = tipo
    if destacado is not None:
        query["destacado"] = destacado
    cursor = db.lugares.find(query, {"_id": 0}).sort("calificacion", -1).limit(limit)
    lugares = await cursor.to_list(limit)
    return {"lugares": lugares, "total": len(lugares)}


@api_router.get("/lugares/municipio/{municipio_id}")
async def get_lugares_por_municipio(municipio_id: str, tipo: Optional[str] = None):
    query: Dict[str, Any] = {
        "$or": [
            {"municipio_id": municipio_id},
            {"municipio": {"$regex": f"^{municipio_id}$", "$options": "i"}}
        ]
    }
    if tipo:
        query["tipo"] = tipo
    cursor = db.lugares.find(query, {"_id": 0}).sort("calificacion", -1)
    lugares = await cursor.to_list(30)
    return {"lugares": lugares, "municipio": municipio_id, "total": len(lugares)}


@api_router.get("/lugares/{lugar_id}")
async def get_lugar(lugar_id: str):
    lugar = await db.lugares.find_one({"$or": [{"id": lugar_id}, {"slug": lugar_id}]}, {"_id": 0})
    if not lugar:
        raise HTTPException(status_code=404, detail="Lugar no encontrado")
    return lugar


@api_router.get("/paquetes")
async def get_paquetes(region: Optional[str] = None):
    query = {"activo": True}
    if region:
        query["region"] = region.lower()
    cursor = db.paquetes.find(query, {"_id": 0})
    paquetes = await cursor.to_list(10)
    return {"paquetes": paquetes}


@api_router.get("/paquetes/{region}")
async def get_paquete_by_region(region: str):
    paquete = await db.paquetes.find_one({"region": region.lower(), "activo": True}, {"_id": 0})
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    lugares_cursor = db.lugares.find({"region": region.lower()}, {"_id": 0}).sort("destacado", -1)
    lugares = await lugares_cursor.to_list(20)
    return {"paquete": paquete, "lugares": lugares}


@api_router.post("/itinerario/generar")
async def generar_itinerario(req: ItinerarioRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="AI key no configurada")

    ruta = await db.rutas.find_one({"region": req.region}, {"_id": 0})
    lugares = await db.lugares.find(
        {"region": req.region},
        {"_id": 0, "nombre": 1, "tipo": 1, "descripcion": 1, "costo_min": 1, "costo_max": 1, "calificacion": 1}
    ).to_list(20)
    paquete = await db.paquetes.find_one({"region": req.region}, {"_id": 0})

    presupuesto_texto = {"bajo": "menos de $1,500 MXN por día", "medio": "$1,500–3,000 MXN por día",
                         "alto": "más de $3,000 MXN por día"}.get(req.presupuesto, "moderado")
    intereses_texto = ", ".join(req.intereses) if req.intereses else "general"
    lugares_texto = "\n".join([
        f"- {l['nombre']} ({l['tipo']}) · ${l.get('costo_min',0)}–${l.get('costo_max',0)} MXN · Rating: {l.get('calificacion','N/A')}"
        for l in lugares
    ])

    prompt = f"""Crea un itinerario turístico detallado para la región de {req.region.upper()} en Veracruz, México.

PARÁMETROS DEL VIAJERO:
- Días disponibles: {req.dias}
- Número de personas: {req.num_personas}
- Presupuesto: {presupuesto_texto}
- Intereses: {intereses_texto}

LUGARES DISPONIBLES EN LA REGIÓN:
{lugares_texto}

INSTRUCCIONES:
- Organiza el itinerario día por día (Día 1, Día 2, etc.)
- Para cada día incluye: mañana, tarde y noche
- Incluye estimados de costo por persona
- Sugiere dónde comer en cada día con precio aproximado
- Incluye tips de transporte entre lugares
- Calcula el costo total aproximado del viaje
- Sé específico con horarios (ej: "9:00 AM: Llegar al Palacio de Hierro")
- Responde en español, con un tono amigable y entusiasta
- Formato: usa emojis para hacer más visual el itinerario"""

    import asyncio
    from groq import Groq

    def call_gemini_itinerario():
        client = Groq(api_key=GROQ_API_KEY)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Eres un experto guía turístico de Veracruz, México. Creas itinerarios detallados, prácticos y emocionantes."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
        )
        return completion.choices[0].message.content

    loop = asyncio.get_event_loop()
    itinerario_text = await loop.run_in_executor(None, call_gemini_itinerario)

    return {
        "itinerario": itinerario_text,
        "region": req.region,
        "dias": req.dias,
        "num_personas": req.num_personas,
        "presupuesto": req.presupuesto,
        "ruta_info": ruta,
        "paquete_info": paquete,
    }



# ============== SEED ENDPOINTS (uso único, borrar después) ==============

@api_router.post("/admin/seed-orizaba-atracciones")
async def seed_orizaba_atracciones_endpoint(request: Request):
    user = await get_current_user(request)
    if user["rol"] != "superadmin":
        raise HTTPException(status_code=403, detail="Solo superadmin")

    municipio = await db.municipios.find_one(
        {"nombre": {"$regex": "^Orizaba$", "$options": "i"}},
        {"_id": 0, "id": 1, "nombre": 1}
    )
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio Orizaba no encontrado")

    municipio_id = municipio["id"]

    ATRACCIONES = [
        {"nombre": "Pico de Orizaba (Citlaltépetl)", "tipo": "atraccion", "subtipo": "Volcán / montañismo", "descripcion": "El volcán más alto de México y tercera montaña más alta de América del Norte con 5,636 msnm.", "descripcion_larga": "El Pico de Orizaba, también conocido como Citlaltépetl, es el volcán más alto de México y la tercera montaña más alta de América del Norte, con una altitud aproximada de 5,636 metros sobre el nivel del mar. Se trata de un volcán inactivo cubierto de nieve en su cima durante gran parte del año, lo que lo convierte en un destino emblemático para el montañismo y la exploración de alta montaña.", "horarios": "Libre acceso", "costo": "Variable", "costo_min": 0, "costo_max": 3000, "lat": 19.0306, "lng": -97.2686, "foto_portada": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"], "tags": ["volcán", "montañismo", "naturaleza", "aventura"], "calificacion": 4.9, "destacado": True, "direccion": "Parque Nacional Pico de Orizaba"},
        {"nombre": "Teleférico de Orizaba", "tipo": "atraccion", "subtipo": "Transporte turístico", "descripcion": "Uno de los teleféricos urbanos más importantes de México. Conecta el centro con el Cerro del Borrego en 5 minutos con vistas panorámicas.", "descripcion_larga": "El Teleférico de Orizaba tiene una longitud aproximada de 917 metros y conecta la zona centro con el Cerro del Borrego. Opera con cabinas cerradas con capacidad para 6 personas mientras se disfruta de vistas panorámicas del río, el centro histórico y el Pico de Orizaba.", "horarios": "10:00–18:00", "costo": "$50–$100 MXN", "costo_min": 50, "costo_max": 100, "lat": 18.8534, "lng": -97.1014, "foto_portada": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85"], "tags": ["teleférico", "vistas", "aventura", "familia"], "calificacion": 4.7, "destacado": True, "direccion": "Sur 4 #50, Centro, Orizaba"},
        {"nombre": "Cerro del Borrego", "tipo": "atraccion", "subtipo": "Ecoparque / sitio histórico", "descripcion": "Ecoparque histórico a 1,240 msnm, escenario de la batalla contra la intervención francesa (1862). Senderos, miradores y Atalaya de Cristal.", "descripcion_larga": "El Cerro del Borrego es un espacio natural y sitio histórico emblemático de Orizaba. Fue escenario de una importante batalla durante la intervención francesa en 1862. Cuenta con senderos, miradores naturales y es accesible a pie o por teleférico.", "horarios": "9:00–18:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8620, "lng": -97.0980, "foto_portada": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85"], "tags": ["naturaleza", "historia", "senderismo", "miradores"], "calificacion": 4.7, "destacado": True, "direccion": "Cerro del Borrego, Centro, Orizaba"},
        {"nombre": "Atalaya de Cristal", "tipo": "actividad", "subtipo": "Mirador", "descripcion": "Mirador con piso de vidrio en la cima del Cerro del Borrego. Vista de 300 metros hacia la ciudad. Experiencia visual única.", "descripcion_larga": "La Atalaya de Cristal es un mirador contemporáneo con plataforma de piso de vidrio que permite observar directamente hacia abajo desde más de 300 metros de altura sobre la ciudad. Ideal para fotografías impactantes.", "horarios": "10:00–18:00", "costo": "Bajo costo", "costo_min": 30, "costo_max": 60, "lat": 18.8625, "lng": -97.0978, "foto_portada": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85"], "tags": ["mirador", "adrenalina", "fotografía", "vistas"], "calificacion": 4.8, "destacado": True, "direccion": "Cima del Cerro del Borrego, Orizaba"},
        {"nombre": "Tobogán de la Montaña", "tipo": "actividad", "subtipo": "Alpine coaster", "descripcion": "Alpine coaster de 650 metros en el Cerro del Borrego. El usuario controla la velocidad. Naturaleza y adrenalina en familia.", "descripcion_larga": "El Tobogán de la Montaña es una atracción tipo alpine coaster de 650 metros integrado en el entorno natural del Cerro del Borrego. Cada usuario controla la velocidad mediante un sistema de freno manual.", "horarios": "10:00–18:00", "costo": "$50–$100 MXN", "costo_min": 50, "costo_max": 100, "lat": 18.8618, "lng": -97.0982, "foto_portada": "https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1200&q=85"], "tags": ["adrenalina", "familia", "aventura"], "calificacion": 4.6, "destacado": False, "direccion": "Cerro del Borrego, Orizaba"},
        {"nombre": "Paseo del Río Orizaba", "tipo": "atraccion", "subtipo": "Parque lineal", "descripcion": "Parque lineal de 5 km a orillas del río con puentes peatonales, zoológico, zonas culturales y áreas verdes. El mejor proyecto de recuperación urbana.", "descripcion_larga": "El Paseo del Río Orizaba es un parque lineal de aproximadamente 5 kilómetros que sigue el curso del río. Cuenta con áreas verdes, puentes peatonales, zonas de descanso, un pequeño zoológico y espacios culturales.", "horarios": "9:00–20:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8498, "lng": -97.0991, "foto_portada": "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85"], "tags": ["parque", "familia", "naturaleza", "gratuito", "río"], "calificacion": 4.6, "destacado": True, "direccion": "Paseo del Río, Centro, Orizaba"},
        {"nombre": "Laguna de Ojo de Agua", "tipo": "atraccion", "subtipo": "Balneario natural", "descripcion": "Nacimiento natural de agua cristalina de manantiales subterráneos. Popular para nadar y refrescarse en temporada de calor.", "descripcion_larga": "La Laguna de Ojo de Agua es un nacimiento natural de agua cristalina proveniente de manantiales subterráneos. Es muy popular para nadar y convivir, especialmente en temporadas de calor.", "horarios": "8:00–18:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8456, "lng": -97.0934, "foto_portada": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=85"], "tags": ["agua", "naturaleza", "gratuito", "balneario"], "calificacion": 4.4, "destacado": False, "direccion": "Col. Ojo de Agua, Orizaba"},
        {"nombre": "Parque Nacional Cerro de Escamela", "tipo": "atraccion", "subtipo": "Parque nacional", "descripcion": "Zona natural protegida con bosque húmedo y cascadas. Senderos naturales para ecoturismo y senderismo auténtico.", "descripcion_larga": "El Parque Nacional Cerro de Escamela es una zona natural protegida con bosque húmedo y cascadas. Cuenta con senderos naturales poco intervenidos, ideal para ecoturismo y tranquilidad.", "horarios": "Libre", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8234, "lng": -97.0534, "foto_portada": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85"], "tags": ["naturaleza", "senderismo", "cascadas", "ecoturismo", "gratuito"], "calificacion": 4.5, "destacado": False, "direccion": "Escamela, Orizaba, Ver."},
        {"nombre": "Cañón de la Carbonera", "tipo": "actividad", "subtipo": "Aventura / rappel", "descripcion": "Formación natural en Nogales con paredes rocosas. Rappel y senderismo nivel medio. Paisajes naturales únicos de aventura.", "descripcion_larga": "El Cañón de la Carbonera en Nogales tiene paredes rocosas ideales para rappel y senderismo de nivel medio. Se recomienda ir con guía.", "horarios": "Libre", "costo": "Gratis (guía opcional)", "costo_min": 0, "costo_max": 500, "lat": 18.8012, "lng": -97.1534, "foto_portada": "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=1200&q=85"], "tags": ["aventura", "rappel", "senderismo", "naturaleza"], "calificacion": 4.4, "destacado": False, "direccion": "Nogales, Ver."},
        {"nombre": "Palacio de Hierro de Orizaba", "tipo": "atraccion", "subtipo": "Museo / patrimonio", "descripcion": "Joya art nouveau construida en Bélgica (1894), atribuida al taller de Gustave Eiffel. Complejo cultural con museos y exposiciones.", "descripcion_larga": "El Palacio de Hierro fue construido en el siglo XIX con estructura de hierro prefabricado de estilo europeo atribuido a Gustave Eiffel. Actualmente es un complejo cultural con museos y espacios de exposición.", "horarios": "10:00–18:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8534, "lng": -97.1014, "foto_portada": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg", "fotos": ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg"], "tags": ["arquitectura", "museo", "historia", "arte", "gratuito"], "calificacion": 4.8, "destacado": True, "direccion": "Madero s/n, Centro, Orizaba"},
        {"nombre": "Catedral de San Miguel Arcángel", "tipo": "atraccion", "subtipo": "Templo religioso", "descripcion": "Principal templo religioso de Orizaba. Siglo XVIII, estilo neoclásico. Centro del recorrido cultural del centro histórico.", "descripcion_larga": "La Catedral de San Miguel Arcángel es el principal templo religioso de Orizaba, construida en el siglo XVIII con estilo neoclásico. Sede de las principales celebraciones litúrgicas.", "horarios": "7:00–20:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8531, "lng": -97.1010, "foto_portada": "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85"], "tags": ["religión", "historia", "arquitectura", "gratuito"], "calificacion": 4.6, "destacado": False, "direccion": "Centro Histórico, Orizaba"},
        {"nombre": "Museo de Arte del Estado de Veracruz", "tipo": "atraccion", "subtipo": "Museo", "descripcion": "Antiguo convento convertido en museo. Arte novohispano, exposiciones permanentes y temporales. Uno de los recintos más importantes del estado.", "descripcion_larga": "Ubicado en un antiguo convento, alberga colección de arte novohispano y exposiciones temporales. Uno de los recintos culturales más importantes del estado.", "horarios": "10:00–18:00", "costo": "$20–$50 MXN", "costo_min": 20, "costo_max": 50, "lat": 18.8545, "lng": -97.1003, "foto_portada": "https://images.unsplash.com/photo-1578926288207-a90a5e3d682e?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1578926288207-a90a5e3d682e?w=1200&q=85"], "tags": ["museo", "arte", "historia", "cultura"], "calificacion": 4.5, "destacado": False, "direccion": "Norte 4 #27, Centro, Orizaba"},
        {"nombre": "Museo de la Cerveza", "tipo": "atraccion", "subtipo": "Museo interactivo", "descripcion": "Museo interactivo sobre la tradición cervecera de Orizaba. Historia de la industria y procesos de producción de la cerveza veracruzana.", "descripcion_larga": "Museo interactivo que muestra la historia de la industria cervecera en Orizaba. Incluye exhibiciones sobre procesos de producción e historia de la cerveza.", "horarios": "10:00–18:00", "costo": "$30–$60 MXN", "costo_min": 30, "costo_max": 60, "lat": 18.8534, "lng": -97.1014, "foto_portada": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"], "tags": ["museo", "cerveza", "historia", "interactivo"], "calificacion": 4.3, "destacado": False, "direccion": "Palacio de Hierro, Orizaba"},
        {"nombre": "Museo Cri-Cri", "tipo": "atraccion", "subtipo": "Museo temático", "descripcion": "Museo dedicado a Francisco Gabilondo Soler 'Cri-Cri', nacido en Orizaba. Contenido infantil, música y experiencias interactivas para familias.", "descripcion_larga": "Museo dedicado a Cri-Cri con enfoque infantil y cultural. Presenta contenido educativo, música y elementos interactivos para familias.", "horarios": "10:00–18:00", "costo": "$30 MXN", "costo_min": 30, "costo_max": 30, "lat": 18.8522, "lng": -97.1008, "foto_portada": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=85"], "tags": ["museo", "familia", "niños", "Cri-Cri"], "calificacion": 4.5, "destacado": False, "direccion": "Alameda, Orizaba"},
        {"nombre": "Museo Casa de las Leyendas", "tipo": "atraccion", "subtipo": "Museo temático", "descripcion": "Museo de leyendas y tradiciones orales de la región. Experiencias narrativas que recrean historias locales misteriosas.", "descripcion_larga": "Museo temático enfocado en leyendas y tradiciones orales de la región. Ofrece experiencias narrativas que recrean historias locales.", "horarios": "10:00–18:00", "costo": "$40 MXN", "costo_min": 40, "costo_max": 40, "lat": 18.8529, "lng": -97.1011, "foto_portada": "https://images.unsplash.com/photo-1518818419601-72c8673f5852?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1518818419601-72c8673f5852?w=1200&q=85"], "tags": ["museo", "leyendas", "misterio", "cultura"], "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba"},
        {"nombre": "Poliforum Mier y Pesado", "tipo": "atraccion", "subtipo": "Centro cultural", "descripcion": "Complejo cultural con jardines de estilo europeo. Sede de eventos, exposiciones y conciertos. Arquitectura y jardines únicos en Orizaba.", "descripcion_larga": "El Poliforum Mier y Pesado es un complejo cultural con jardines de estilo europeo usado para eventos culturales, exposiciones y conciertos.", "horarios": "9:00–18:00", "costo": "$20–$50 MXN", "costo_min": 20, "costo_max": 50, "lat": 18.8528, "lng": -97.1005, "foto_portada": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85"], "tags": ["cultura", "jardines", "eventos", "arquitectura"], "calificacion": 4.4, "destacado": False, "direccion": "Oriente 6 #500, Orizaba"},
        {"nombre": "Parque Castillo", "tipo": "atraccion", "subtipo": "Plaza histórica", "descripcion": "Plaza central emblemática rodeada de edificios históricos. Los domingos hay son jarocho. Corazón de la vida pública de Orizaba.", "descripcion_larga": "Plaza central que funciona como punto de reunión social, rodeada de edificios históricos y actividad comercial. Los domingos se presentan grupos de son jarocho.", "horarios": "Libre", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8538, "lng": -97.1010, "foto_portada": "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85"], "tags": ["plaza", "historia", "gratuito", "centro"], "calificacion": 4.5, "destacado": False, "direccion": "Centro Histórico, Orizaba"},
        {"nombre": "Alameda Francisco Gabilondo Soler", "tipo": "atraccion", "subtipo": "Parque urbano", "descripcion": "Parque urbano emblemático dedicado a Cri-Cri. Áreas verdes y espacios de convivencia familiar en el centro histórico.", "descripcion_larga": "Parque urbano emblemático de Orizaba, ideal para recreación familiar. Vinculado culturalmente con la figura de Cri-Cri.", "horarios": "Libre", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8522, "lng": -97.1008, "foto_portada": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85"], "tags": ["parque", "familia", "gratuito", "Cri-Cri"], "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba"},
        {"nombre": "Mercado Melchor Ocampo", "tipo": "atraccion", "subtipo": "Mercado tradicional", "descripcion": "Mercado tradicional más importante de Orizaba. Alimentos frescos, comida típica y gastronomía local auténtica. Experiencia cotidiana imperdible.", "descripcion_larga": "Mercado tradicional con gran variedad de productos, desde alimentos frescos hasta comida típica preparada. Un excelente lugar para conocer la gastronomía local.", "horarios": "7:00–18:00", "costo": "Libre", "costo_min": 0, "costo_max": 0, "lat": 18.8521, "lng": -97.1011, "foto_portada": "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85"], "tags": ["mercado", "gastronomía", "cultura", "tradición"], "calificacion": 4.5, "destacado": False, "direccion": "Poniente 7, Orizaba"},
        {"nombre": "Mercado de Artesanías de Orizaba", "tipo": "atraccion", "subtipo": "Mercado artesanal", "descripcion": "Espacio dedicado a artesanos locales. Textiles nahuas, souvenirs y productos típicos veracruzanos. Comercio justo directo con artesanos.", "descripcion_larga": "Mercado turístico con productos elaborados por artesanos locales: textiles, recuerdos, figuras y artículos representativos de la cultura veracruzana.", "horarios": "9:00–20:00", "costo": "Libre", "costo_min": 0, "costo_max": 0, "lat": 18.8527, "lng": -97.1009, "foto_portada": "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85"], "tags": ["artesanías", "compras", "cultura", "souvenirs"], "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba"},
        {"nombre": "Panteón Municipal de Orizaba", "tipo": "atraccion", "subtipo": "Patrimonio cultural", "descripcion": "Cementerio histórico con mausoleos y esculturas de distintas épocas. Patrimonio funerario. Muy visitado en Día de Muertos.", "descripcion_larga": "El Panteón Municipal alberga tumbas antiguas, mausoleos y esculturas de diferentes épocas. Visitado por interesados en historia local y arquitectura funeraria, especialmente en Día de Muertos.", "horarios": "8:00–18:00", "costo": "Gratis", "costo_min": 0, "costo_max": 0, "lat": 18.8489, "lng": -97.1023, "foto_portada": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=85", "fotos": ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=85"], "tags": ["historia", "patrimonio", "Día de Muertos", "gratuito"], "calificacion": 4.1, "destacado": False, "direccion": "Sur 11, Orizaba"},
    ]

    import re as re_mod
    def slugify_local(text):
        text = text.lower()
        for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ñ","n")]:
            text = text.replace(a, b)
        text = re_mod.sub(r"[^a-z0-9\s-]", "", text)
        text = re_mod.sub(r"[\s]+", "-", text.strip())
        return text

    deleted = await db.lugares.delete_many({"municipio_id": municipio_id})
    docs = []
    for a in ATRACCIONES:
        doc = {**a, "id": str(uuid.uuid4()), "municipio_id": municipio_id, "municipio": municipio["nombre"], "region": "centro", "slug": slugify_local(a["nombre"]), "created_at": datetime.now(timezone.utc).isoformat()}
        docs.append(doc)
    await db.lugares.insert_many(docs)

    return {"ok": True, "insertados": len(docs), "eliminados_anteriores": deleted.deleted_count, "municipio": municipio["nombre"]}

# ============== PRESTADOR: PERFIL PROPIO ==============

@api_router.put("/prestadores/me/perfil")
async def update_my_perfil(
    data: PrestadorPerfilUpdate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"user_id": current_user["user_id"]})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.prestadores.update_one(
        {"user_id": current_user["user_id"]}, {"$set": update}
    )
    return await db.prestadores.find_one({"user_id": current_user["user_id"]}, {"_id": 0})


# ============== GALERÍA DE IMÁGENES ==============


# ============== GALERÍA DE IMÁGENES ==============

@api_router.get("/prestadores/{prestador_id}/imagenes")
async def get_prestador_imagenes(prestador_id: str):
    imagenes = await db.prestador_imagenes.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"imagenes": imagenes}


@api_router.post("/prestadores/{prestador_id}/imagenes")
async def add_prestador_imagen(
    prestador_id: str,
    data: PrestadorImagenCreate,
    current_user: dict = Depends(get_current_user)
):
    if data.es_portada:
        await db.prestador_imagenes.update_many(
            {"prestador_id": prestador_id}, {"$set": {"es_portada": False}}
        )
        await db.prestadores.update_one(
            {"id": prestador_id}, {"$set": {"foto_url": data.url}}
        )
    imagen = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        "url": data.url,
        "categoria": data.categoria,
        "es_portada": data.es_portada,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.prestador_imagenes.insert_one(imagen)
    imagen.pop("_id", None)
    return imagen


@api_router.delete("/prestadores/imagenes/{imagen_id}")
async def delete_prestador_imagen(
    imagen_id: str,
    current_user: dict = Depends(get_current_user)
):
    await db.prestador_imagenes.delete_one({"id": imagen_id})
    return {"message": "Imagen eliminada"}


@api_router.put("/prestadores/imagenes/{imagen_id}/portada")
async def set_imagen_portada(
    imagen_id: str,
    current_user: dict = Depends(get_current_user)
):
    img = await db.prestador_imagenes.find_one({"id": imagen_id})
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    await db.prestador_imagenes.update_many(
        {"prestador_id": img["prestador_id"]}, {"$set": {"es_portada": False}}
    )
    await db.prestador_imagenes.update_one(
        {"id": imagen_id}, {"$set": {"es_portada": True}}
    )
    await db.prestadores.update_one(
        {"id": img["prestador_id"]}, {"$set": {"foto_url": img["url"]}}
    )
    return {"message": "Portada actualizada"}


# ============== SERVICIOS Y PRECIOS ==============

@api_router.get("/prestadores/{prestador_id}/servicios")
async def get_servicios(prestador_id: str):
    servicios = await db.prestador_servicios.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return {"servicios": servicios}


@api_router.post("/prestadores/{prestador_id}/servicios")
async def create_servicio(
    prestador_id: str,
    data: ServicioPrestadorCreate,
    current_user: dict = Depends(get_current_user)
):
    servicio = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.prestador_servicios.insert_one(servicio)
    servicio.pop("_id", None)
    return servicio


@api_router.put("/prestadores/servicios/{servicio_id}")
async def update_servicio(
    servicio_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    body = await request.json()
    body.pop("id", None)
    body.pop("prestador_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.prestador_servicios.update_one({"id": servicio_id}, {"$set": body})
    return await db.prestador_servicios.find_one({"id": servicio_id}, {"_id": 0})


@api_router.delete("/prestadores/servicios/{servicio_id}")
async def delete_servicio(servicio_id: str, current_user: dict = Depends(get_current_user)):
    await db.prestador_servicios.delete_one({"id": servicio_id})
    return {"message": "Servicio eliminado"}


# ============== RESERVAS ==============

@api_router.get("/prestadores/{prestador_id}/reservas")
async def get_reservas_prestador(
    prestador_id: str,
    estado: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {"prestador_id": prestador_id}
    if estado:
        query["estado"] = estado
    reservas = await db.reservas.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"reservas": reservas}


@api_router.post("/reservas")
async def create_reserva(data: ReservaCreate, current_user: dict = Depends(get_current_user)):
    reserva = {
        "id": str(uuid.uuid4()),
        "turista_id": current_user["user_id"],
        "turista_nombre": current_user["nombre"],
        "turista_email": current_user["email"],
        **data.model_dump(),
        "estado": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reservas.insert_one(reserva)
    reserva.pop("_id", None)
    return reserva


@api_router.put("/reservas/{reserva_id}/estado")
async def update_reserva_estado(
    reserva_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    body = await request.json()
    estado = body.get("estado")
    if estado not in ["aceptada", "cancelada", "completada", "pendiente"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    await db.reservas.update_one(
        {"id": reserva_id},
        {"$set": {"estado": estado, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"Reserva {estado}"}


# ============== MENÚ (restaurantes/cafés/bares) ==============

@api_router.get("/prestadores/{prestador_id}/menu")
async def get_menu(prestador_id: str):
    categorias = await db.menu_categorias.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).sort("orden", 1).to_list(20)
    for cat in categorias:
        cat["items"] = await db.menu_items.find(
            {"categoria_id": cat["id"]}, {"_id": 0}
        ).to_list(100)
    return {"categorias": categorias}


@api_router.post("/prestadores/{prestador_id}/menu/categorias")
async def create_categoria(
    prestador_id: str,
    data: MenuCategoriaCreate,
    current_user: dict = Depends(get_current_user)
):
    cat = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.menu_categorias.insert_one(cat)
    cat.pop("_id", None)
    return cat


@api_router.post("/menu/items")
async def create_menu_item(data: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    item = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.menu_items.insert_one(item)
    item.pop("_id", None)
    return item


@api_router.put("/menu/items/{item_id}")
async def update_menu_item(
    item_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    body = await request.json()
    body.pop("id", None)
    await db.menu_items.update_one({"id": item_id}, {"$set": body})
    return await db.menu_items.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/menu/items/{item_id}")
async def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Item eliminado"}


@api_router.delete("/menu/categorias/{cat_id}")
async def delete_categoria(cat_id: str, current_user: dict = Depends(get_current_user)):
    await db.menu_categorias.delete_one({"id": cat_id})
    await db.menu_items.delete_many({"categoria_id": cat_id})
    return {"message": "Categoría eliminada"}


# ============== HABITACIONES (hoteles) ==============

@api_router.get("/prestadores/{prestador_id}/habitaciones")
async def get_habitaciones(prestador_id: str):
    habs = await db.habitaciones.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).to_list(50)
    return {"habitaciones": habs}


@api_router.post("/prestadores/{prestador_id}/habitaciones")
async def create_habitacion(
    prestador_id: str,
    data: HabitacionCreate,
    current_user: dict = Depends(get_current_user)
):
    hab = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.habitaciones.insert_one(hab)
    hab.pop("_id", None)
    return hab


@api_router.put("/habitaciones/{hab_id}")
async def update_habitacion(
    hab_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    body = await request.json()
    body.pop("id", None)
    await db.habitaciones.update_one({"id": hab_id}, {"$set": body})
    return await db.habitaciones.find_one({"id": hab_id}, {"_id": 0})


@api_router.delete("/habitaciones/{hab_id}")
async def delete_habitacion(hab_id: str, current_user: dict = Depends(get_current_user)):
    await db.habitaciones.delete_one({"id": hab_id})
    return {"message": "Habitación eliminada"}


# ============== FLOTAS / EQUIPO (transporte/tours) ==============

@api_router.get("/prestadores/{prestador_id}/flota")
async def get_flota(prestador_id: str):
    flota = await db.flota.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).to_list(50)
    return {"flota": flota}


@api_router.post("/prestadores/{prestador_id}/flota")
async def create_vehiculo(
    prestador_id: str,
    data: FlotaCreate,
    current_user: dict = Depends(get_current_user)
):
    vehiculo = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.flota.insert_one(vehiculo)
    vehiculo.pop("_id", None)
    return vehiculo


@api_router.delete("/flota/{vehiculo_id}")
async def delete_vehiculo(vehiculo_id: str, current_user: dict = Depends(get_current_user)):
    await db.flota.delete_one({"id": vehiculo_id})
    return {"message": "Vehículo eliminado"}


# ============== PROMOCIONES ==============

@api_router.get("/prestadores/{prestador_id}/promociones")
async def get_promociones(prestador_id: str):
    promos = await db.promociones.find(
        {"prestador_id": prestador_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return {"promociones": promos}


@api_router.post("/prestadores/{prestador_id}/promociones")
async def create_promocion(
    prestador_id: str,
    data: PromocionCreate,
    current_user: dict = Depends(get_current_user)
):
    promo = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.promociones.insert_one(promo)
    promo.pop("_id", None)
    return promo


@api_router.delete("/promociones/{promo_id}")
async def delete_promocion(promo_id: str, current_user: dict = Depends(get_current_user)):
    await db.promociones.delete_one({"id": promo_id})
    return {"message": "Promoción eliminada"}


# ============== ANALÍTICAS DEL PRESTADOR ==============

@api_router.get("/prestadores/{prestador_id}/analiticas")
async def get_analiticas_prestador(
    prestador_id: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    start = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    views = await db.analytics.count_documents({
        "target_id": prestador_id, "event_type": "view", "timestamp": {"$gte": start}
    })
    contacts = await db.analytics.count_documents({
        "target_id": prestador_id, "event_type": "contact", "timestamp": {"$gte": start}
    })
    reservas_total = await db.reservas.count_documents({"prestador_id": prestador_id})
    reservas_pendientes = await db.reservas.count_documents(
        {"prestador_id": prestador_id, "estado": "pendiente"}
    )
    reservas_completadas = await db.reservas.count_documents(
        {"prestador_id": prestador_id, "estado": "completada"}
    )
    views_pipeline = [
        {"$match": {"target_id": prestador_id, "event_type": "view", "timestamp": {"$gte": start}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    views_by_day = await db.analytics.aggregate(views_pipeline).to_list(100)
    resenas = await db.resenas.find(
        {"prestador_id": prestador_id}, {"_id": 0, "calificacion": 1, "texto": 1, "fecha": 1}
    ).sort("fecha", -1).limit(5).to_list(5)
    return {
        "periodo_dias": days,
        "visitas": views,
        "contactos": contacts,
        "reservas": {
            "total": reservas_total,
            "pendientes": reservas_pendientes,
            "completadas": reservas_completadas,
        },
        "visitas_por_dia": views_by_day,
        "ultimas_resenas": resenas,
    }


# ============== DIARIO DEL VIAJERO / ITINERARIOS GUARDADOS ==============

@api_router.post("/itinerarios")
async def crear_itinerario(
    datos: ItinerarioCreate,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "nombre": datos.nombre,
        "region": datos.region,
        "fecha_inicio": datos.fecha_inicio,
        "fecha_fin": datos.fecha_fin,
        "num_personas": datos.num_personas,
        "dias": [d.model_dump() for d in datos.dias],
        "servicios_extra": [s.model_dump() for s in datos.servicios_extra],
        "costo_total_estimado": datos.costo_total_estimado,
        "notas_generales": datos.notas_generales,
        "estado": "planificado",
        "creado_en": now,
        "actualizado_en": now,
    }
    await db.itinerarios.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/itinerarios")
async def mis_itinerarios(current_user: dict = Depends(get_current_user)):
    cursor = db.itinerarios.find(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    ).sort("creado_en", -1)
    items = await cursor.to_list(50)
    return {"itinerarios": items, "total": len(items)}


@api_router.get("/itinerarios/{itinerario_id}")
async def get_itinerario(itinerario_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.itinerarios.find_one(
        {"id": itinerario_id, "user_id": current_user["user_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")
    return doc


@api_router.delete("/itinerarios/{itinerario_id}")
async def eliminar_itinerario(itinerario_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.itinerarios.delete_one(
        {"id": itinerario_id, "user_id": current_user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")
    return {"ok": True}


@api_router.put("/itinerarios/{itinerario_id}/lugar")
async def actualizar_lugar(
    itinerario_id: str,
    update: LugarEstadoUpdate,
    current_user: dict = Depends(get_current_user)
):
    doc = await db.itinerarios.find_one(
        {"id": itinerario_id, "user_id": current_user["user_id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")
    dias = doc.get("dias", [])
    updated = False
    for dia in dias:
        if dia["dia_num"] == update.dia_num:
            for lugar in dia.get("lugares", []):
                if lugar["lugar_id"] == update.lugar_id:
                    lugar["estado"] = update.estado
                    if update.nota is not None:
                        lugar["nota"] = update.nota
                    updated = True
                    break
    if not updated:
        raise HTTPException(status_code=404, detail="Lugar no encontrado")
    total = sum(len(d.get("lugares", [])) for d in dias)
    visitados = sum(
        sum(1 for l in d.get("lugares", []) if l.get("estado") == "visitado")
        for d in dias
    )
    estado_general = "planificado"
    if visitados > 0 and visitados < total:
        estado_general = "en_curso"
    elif visitados == total and total > 0:
        estado_general = "completado"
    await db.itinerarios.update_one(
        {"id": itinerario_id},
        {"$set": {
            "dias": dias,
            "estado": estado_general,
            "actualizado_en": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"ok": True, "estado_general": estado_general, "visitados": visitados, "total": total}


@api_router.post("/itinerarios/{itinerario_id}/foto")
async def subir_foto_diario(
    itinerario_id: str,
    dia_num: int,
    lugar_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    doc = await db.itinerarios.find_one(
        {"id": itinerario_id, "user_id": current_user["user_id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")
    content = await file.read()
    path = f"diarios/{itinerario_id}/{dia_num}/{lugar_id}/{uuid.uuid4()}.jpg"
    result = put_object(path, content, file.content_type or "image/jpeg")
    foto_url = result["url"]
    dias = doc.get("dias", [])
    for dia in dias:
        if dia["dia_num"] == dia_num:
            for lugar in dia.get("lugares", []):
                if lugar["lugar_id"] == lugar_id:
                    lugar.setdefault("fotos_usuario", []).append(foto_url)
                    break
    await db.itinerarios.update_one(
        {"id": itinerario_id},
        {"$set": {"dias": dias, "actualizado_en": datetime.now(timezone.utc).isoformat()}}
    )
    return {"url": foto_url}


@api_router.put("/prestadores/register/{solicitud_id}/estado")
async def update_solicitud_estado(
    solicitud_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    estado = body.get("estado")
    if estado not in ["aprobado", "rechazado", "pendiente"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    await db.solicitudes_prestador.update_one(
        {"id": solicitud_id},
        {"$set": {"estado": estado, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True}


# ============== UPLOAD PÚBLICO ==============

@api_router.post("/public/upload")
async def public_upload(file: UploadFile = File(...)):
    try:
        content = await file.read()
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        path = f"uploads/public/{uuid.uuid4()}.{ext}"
        result = put_object(path, content, file.content_type or "image/jpeg")
        return {"url": result["url"]}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/")
async def root():
    return {"message": "Veracruz Contigo API", "version": "1.0.0"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


# ============== LUGARES CRUD ==============

@api_router.post("/lugares")
async def create_lugar(request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    import unicodedata as _ud, re as _re
    nombre = body.get("nombre", "")
    slug_base = _ud.normalize("NFD", nombre).encode("ascii", "ignore").decode().lower()
    slug_base = _re.sub(r"[^a-z0-9\s-]", "", slug_base)
    slug_base = _re.sub(r"\s+", "-", slug_base.strip())
    slug = body.get("slug") or f"{slug_base}-{str(uuid.uuid4())[:6]}"
    lugar = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        **{k: v for k, v in body.items() if k not in ["id", "slug"]},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.lugares.insert_one(lugar)
    lugar.pop("_id", None)
    return lugar


@api_router.put("/lugares/{lugar_id}")
async def update_lugar(lugar_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    body.pop("id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.lugares.update_one({"$or": [{"id": lugar_id}, {"slug": lugar_id}]}, {"$set": body})
    return await db.lugares.find_one({"$or": [{"id": lugar_id}, {"slug": lugar_id}]}, {"_id": 0})


@api_router.delete("/lugares/{lugar_id}")
async def delete_lugar(lugar_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    await db.lugares.delete_one({"$or": [{"id": lugar_id}, {"slug": lugar_id}]})
    return {"ok": True}


# ============== DESVERIFICAR PRESTADOR ==============

@api_router.post("/prestadores/{prestador_id}/desverificar")
async def desverificar_prestador(prestador_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    await db.prestadores.update_one({"id": prestador_id}, {"$set": {"verificado": False}})
    return {"ok": True}


# ============== NOTICIAS ==============

@api_router.get("/noticias")
async def get_noticias(
    municipio_id: Optional[str] = None,
    categoria: Optional[str] = None,
    publicado: Optional[bool] = None,
    limit: int = 50,
):
    query: Dict[str, Any] = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if categoria:
        query["categoria"] = categoria
    if publicado is not None:
        query["publicado"] = publicado
    noticias = await db.noticias.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"noticias": noticias, "total": len(noticias)}


@api_router.post("/noticias")
async def create_noticia(request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    noticia = {
        "id": str(uuid.uuid4()),
        **body,
        "autor_id": user["user_id"],
        "autor_nombre": user.get("nombre", ""),
        "fecha": datetime.now(timezone.utc).date().isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.noticias.insert_one(noticia)
    noticia.pop("_id", None)
    return noticia


@api_router.put("/noticias/{noticia_id}")
async def update_noticia(noticia_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    body.pop("id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.noticias.update_one({"id": noticia_id}, {"$set": body})
    return await db.noticias.find_one({"id": noticia_id}, {"_id": 0})


@api_router.delete("/noticias/{noticia_id}")
async def delete_noticia(noticia_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    await db.noticias.delete_one({"id": noticia_id})
    return {"ok": True}


# ============== SERVICIOS MUNICIPALES ==============

@api_router.get("/servicios-municipales")
async def get_servicios_municipales(
    municipio_id: Optional[str] = None,
    tipo: Optional[str] = None,
):
    query: Dict[str, Any] = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if tipo:
        query["tipo"] = tipo
    servicios = await db.servicios_municipales.find(query, {"_id": 0}).sort("tipo", 1).to_list(100)
    return {"servicios": servicios, "total": len(servicios)}


@api_router.post("/servicios-municipales")
async def create_servicio_municipal(request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    servicio = {
        "id": str(uuid.uuid4()),
        **body,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.servicios_municipales.insert_one(servicio)
    servicio.pop("_id", None)
    return servicio


@api_router.put("/servicios-municipales/{servicio_id}")
async def update_servicio_municipal(servicio_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    body = await request.json()
    body.pop("id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.servicios_municipales.update_one({"id": servicio_id}, {"$set": body})
    return await db.servicios_municipales.find_one({"id": servicio_id}, {"_id": 0})


@api_router.delete("/servicios-municipales/{servicio_id}")
async def delete_servicio_municipal(servicio_id: str, request: Request):
    user = await get_current_user(request)
    if user["rol"] not in ["superadmin", "encargado"]:
        raise HTTPException(status_code=403, detail="Sin permiso")
    await db.servicios_municipales.delete_one({"id": servicio_id})
    return {"ok": True}


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Veracruz Contigo API...")
    try:
        init_cloudinary()
        logger.info("Cloudinary configured")
    except Exception as e:
        logger.warning(f"Cloudinary init skipped: {e}")
    
    await seed_municipios()
    await seed_admin()
    await seed_sample_events()
    await seed_sample_prestadores()
    await seed_municipio_photos_and_content()
    await seed_rutas_y_lugares()
    await seed_orizaba_completo()
    
    # Create indexes
    await db.usuarios.create_index("email", unique=True)
    await db.usuarios.create_index("user_id", unique=True)
    await db.municipios.create_index("slug", unique=True)
    await db.prestadores.create_index("municipio_id")
    await db.eventos.create_index("fecha_inicio")
    await db.emergencias.create_index("timestamp")
    await db.analytics.create_index([("target_type", 1), ("target_id", 1), ("timestamp", -1)])
    await db.analytics.create_index([("event_type", 1), ("date", 1)])
    await db.rutas.create_index("region")
    await db.rutas.create_index("slug", unique=True)
    await db.lugares.create_index("region")
    await db.lugares.create_index("slug")
    await db.lugares.create_index("destacado")
    await db.paquetes.create_index("region")
    await db.itinerarios.create_index("user_id")
    await db.itinerarios.create_index("id", unique=True)
    await db.prestador_imagenes.create_index("prestador_id")
    await db.prestador_servicios.create_index("prestador_id")
    await db.reservas.create_index("prestador_id")
    await db.reservas.create_index("turista_id")
    await db.menu_categorias.create_index("prestador_id")
    await db.menu_items.create_index("categoria_id")
    await db.habitaciones.create_index("prestador_id")
    await db.flota.create_index("prestador_id")
    await db.promociones.create_index("prestador_id")
    await db.noticias.create_index("municipio_id")
    await db.noticias.create_index("publicado")
    await db.servicios_municipales.create_index("municipio_id")
    await db.favoritos.create_index("user_id")
    await db.resenas.create_index("prestador_id")
    
    logger.info("Veracruz Contigo API ready!")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()