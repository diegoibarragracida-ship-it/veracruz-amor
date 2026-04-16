from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Header, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
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
import json

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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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

# Cloudinary Config
import cloudinary
import cloudinary.uploader

def init_cloudinary():
    cloudinary_url = os.environ.get("CLOUDINARY_URL", "")
    if cloudinary_url and cloudinary_url.startswith("cloudinary://"):
        rest = cloudinary_url[len("cloudinary://"):]
        credentials, cloud = rest.rsplit("@", 1)
        api_key, api_secret = credentials.split(":", 1)
        cloudinary.config(cloud_name=cloud, api_key=api_key, api_secret=api_secret)
        logger.info(f"Cloudinary configured via CLOUDINARY_URL: cloud={cloud}")
        return True
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.environ.get("CLOUDINARY_API_KEY", "")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    if not cloud_name:
        logger.warning("Cloudinary not configured")
        return False
    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)
    return True

def upload_to_cloudinary(file_data: bytes, filename: str) -> dict:
    if not init_cloudinary():
        raise HTTPException(status_code=500, detail="Storage not available")
    try:
        import io
        result = cloudinary.uploader.upload(
            io.BytesIO(file_data),
            resource_type="auto",
            public_id=f"{APP_NAME}/{slugify(filename[:30])}_{uuid.uuid4().hex[:8]}"
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Cloudinary upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ============== PYDANTIC MODELS ==============

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

class EventoCreate(BaseModel):
    nombre: str
    municipio_id: str
    fecha_inicio: str
    fecha_fin: Optional[str] = None
    descripcion: Optional[str] = None
    foto_url: Optional[str] = None
    tipo: str
    lugar: Optional[str] = None
    precio_min: Optional[float] = None
    precio_max: Optional[float] = None
    es_gratis: Optional[bool] = True
    publicado: Optional[bool] = False

class LugarCreate(BaseModel):
    nombre: str
    municipio_id: str
    municipio: str
    tipo: str
    descripcion: Optional[str] = None
    horarios: Optional[str] = None
    costo: Optional[str] = None
    costo_min: Optional[int] = None
    costo_max: Optional[int] = None
    direccion: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    foto_portada: Optional[str] = None
    recomendaciones: Optional[str] = None
    destacado: Optional[bool] = False
    slug: Optional[str] = None
    region: Optional[str] = None
    fotos: Optional[List[str]] = None

class NoticiaCreate(BaseModel):
    titulo: str
    contenido: str
    imagen_url: Optional[str] = None
    categoria: str = "Aviso"
    municipio_id: str
    publicado: Optional[bool] = False

class ServicioMunicipalCreate(BaseModel):
    nombre: str
    tipo: str
    telefono: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    direccion: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    descripcion: Optional[str] = None
    municipio_id: str
    activo: Optional[bool] = True

class PrestadorPerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    descripcion_larga: Optional[str] = None
    direccion: Optional[str] = None
    horarios: Optional[str] = None
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
    precio_min: Optional[float] = None
    precio_max: Optional[float] = None
    esta_abierto: Optional[bool] = None
    menu_url: Optional[str] = None
    categoria_gastronomica: Optional[str] = None
    subcategoria_gastronomica: Optional[str] = None
    etiquetas: Optional[List[str]] = None
    momentos: Optional[List[str]] = None
    tipo_bebidas: Optional[List[str]] = None
    etiquetas_bebidas: Optional[List[str]] = None
    metodos_pago: Optional[List[str]] = None
    reservas_mesa_activas: Optional[bool] = None
    reservas_mesa_capacidad: Optional[int] = None
    reservas_mesa_notas: Optional[str] = None
    pedidos_whatsapp_activo: Optional[bool] = None
    pedidos_whatsapp_mensaje: Optional[str] = None
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
    reservas_anticipacion_dias: Optional[int] = None
    reservas_notas: Optional[str] = None
    desayuno_incluido: Optional[bool] = None
    desayuno_precio: Optional[float] = None
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

class ServicioPrestadorCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    precio_promocional: Optional[float] = None
    duracion: Optional[str] = None
    capacidad: Optional[int] = None
    disponible: Optional[bool] = True

class HabitacionCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_noche: float
    capacidad: int = 2
    amenidades: Optional[List[str]] = None
    fotos: Optional[List[str]] = None
    disponible: Optional[bool] = True

class MenuCategoriaCreate(BaseModel):
    nombre: str
    orden: int = 0

class MenuItemCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    disponible: Optional[bool] = True

class PromocionCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    descuento_pct: int
    fecha_inicio: str
    fecha_fin: str

class ReservaCreate(BaseModel):
    prestador_id: str
    servicio_id: Optional[str] = None
    fecha_reserva: str
    num_personas: int = 1
    nota_turista: Optional[str] = None

class ImagenCreate(BaseModel):
    url: str
    categoria: Optional[str] = "general"
    es_portada: Optional[bool] = False

# ============== ROUTES - AUTH ==============

@api_router.post("/auth/register")
async def register(user: UserCreate):
    if await db.usuarios.find_one({"email": user.email.lower()}):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    new_user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": user.email.lower(),
        "password_hash": hash_password(user.password),
        "nombre": user.nombre,
        "foto_url": None,
        "rol": user.rol,
        "municipio_id": user.municipio_id,
        "activo": True,
        "fecha_registro": datetime.now(timezone.utc).isoformat(),
        "ultimo_acceso": None
    }
    await db.usuarios.insert_one(new_user)
    
    token = create_access_token(new_user["user_id"], new_user["email"], new_user["rol"])
    new_user.pop("password_hash", None)
    return {**new_user, "access_token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.usuarios.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrecta")
    
    token = create_access_token(user["user_id"], user["email"], user["rol"])
    user.pop("password_hash", None)
    return {**user, "access_token": token}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Logout successful"}

# ============== ROUTES - MUNICIPIOS ==============

@api_router.get("/municipios")
async def list_municipios(
    estado: Optional[str] = None,
    pueblo_magico: Optional[bool] = None,
    limit: int = 30,
    skip: int = 0
):
    query = {}
    if estado:
        query["estado"] = estado
    if pueblo_magico is not None:
        query["pueblo_magico"] = pueblo_magico
    
    municipios = await db.municipios.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"municipios": municipios}

@api_router.get("/municipios/{slug}")
async def get_municipio(slug: str):
    municipio = await db.municipios.find_one({"slug": slug}, {"_id": 0})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    # Increment visits
    await db.municipios.update_one(
        {"slug": slug},
        {"$inc": {"visitas_total": 1}}
    )
    
    return municipio

@api_router.put("/municipios/{slug}")
async def update_municipio(
    slug: str,
    update: MunicipioUpdate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    municipio = await db.municipios.find_one({"slug": slug})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    if current_user["rol"] == "encargado" and municipio.get("encargado_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar este municipio")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.municipios.update_one({"slug": slug}, {"$set": update_data})
    return {"message": "Municipio actualizado"}

# ============== ROUTES - EVENTOS ==============

@api_router.get("/eventos")
async def list_eventos(
    municipio_id: Optional[str] = None,
    tipo: Optional[str] = None,
    publicado: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0
):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if tipo:
        query["tipo"] = tipo
    if publicado is not None:
        query["publicado"] = publicado
    
    eventos = await db.eventos.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"eventos": eventos}

@api_router.post("/eventos")
async def create_evento(
    evento: EventoCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    municipio = await db.municipios.find_one({"id": evento.municipio_id})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    if current_user["rol"] == "encargado" and municipio.get("encargado_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_evento = {
        "id": str(uuid.uuid4()),
        **evento.dict(),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.eventos.insert_one(new_evento)
    return {"id": new_evento["id"]}

@api_router.put("/eventos/{evento_id}")
async def update_evento(
    evento_id: str,
    evento: EventoCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    existing = await db.eventos.find_one({"id": evento_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if current_user["rol"] == "encargado" and existing.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    await db.eventos.update_one(
        {"id": evento_id},
        {"$set": evento.dict(exclude_unset=True)}
    )
    return {"message": "Evento actualizado"}

@api_router.delete("/eventos/{evento_id}")
async def delete_evento(
    evento_id: str,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    existing = await db.eventos.find_one({"id": evento_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if current_user["rol"] == "encargado" and existing.get("created_by") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    await db.eventos.delete_one({"id": evento_id})
    return {"message": "Evento eliminado"}

# ============== ROUTES - ATRACCIONES ==============

@api_router.get("/lugares")
async def list_lugares(
    municipio_id: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    
    lugares = await db.lugares.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return {"lugares": lugares}

@api_router.post("/lugares")
async def create_lugar(
    lugar: LugarCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    municipio = await db.municipios.find_one({"id": lugar.municipio_id})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    if current_user["rol"] == "encargado" and municipio.get("encargado_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_lugar = {
        "id": str(uuid.uuid4()),
        **lugar.dict(),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.lugares.insert_one(new_lugar)
    return {"id": new_lugar["id"]}

@api_router.put("/lugares/{lugar_id}")
async def update_lugar(
    lugar_id: str,
    lugar: LugarCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    existing = await db.lugares.find_one({"id": lugar_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lugar no encontrado")
    
    await db.lugares.update_one(
        {"id": lugar_id},
        {"$set": lugar.dict(exclude_unset=True)}
    )
    return {"message": "Lugar actualizado"}

@api_router.delete("/lugares/{lugar_id}")
async def delete_lugar(
    lugar_id: str,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    await db.lugares.delete_one({"id": lugar_id})
    return {"message": "Lugar eliminado"}

# ============== ROUTES - NOTICIAS ==============

@api_router.get("/noticias")
async def list_noticias(
    municipio_id: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    
    noticias = await db.noticias.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return {"noticias": noticias}

@api_router.post("/noticias")
async def create_noticia(
    noticia: NoticiaCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    municipio = await db.municipios.find_one({"id": noticia.municipio_id})
    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado")
    
    if current_user["rol"] == "encargado" and municipio.get("encargado_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_noticia = {
        "id": str(uuid.uuid4()),
        **noticia.dict(),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.noticias.insert_one(new_noticia)
    return {"id": new_noticia["id"]}

@api_router.put("/noticias/{noticia_id}")
async def update_noticia(noticia_id: str, noticia: NoticiaCreate):
    await db.noticias.update_one(
        {"id": noticia_id},
        {"$set": noticia.dict(exclude_unset=True)}
    )
    return {"message": "Noticia actualizada"}

@api_router.delete("/noticias/{noticia_id}")
async def delete_noticia(noticia_id: str):
    await db.noticias.delete_one({"id": noticia_id})
    return {"message": "Noticia eliminada"}

# ============== ROUTES - SERVICIOS MUNICIPALES ==============

@api_router.get("/servicios-municipales")
async def list_servicios(municipio_id: Optional[str] = None):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    
    servicios = await db.servicios_municipales.find(query, {"_id": 0}).to_list(100)
    return {"servicios": servicios}

@api_router.post("/servicios-municipales")
async def create_servicio(
    servicio: ServicioMunicipalCreate,
    current_user: dict = Depends(require_role("encargado", "superadmin"))
):
    new_servicio = {
        "id": str(uuid.uuid4()),
        **servicio.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.servicios_municipales.insert_one(new_servicio)
    return {"id": new_servicio["id"]}

@api_router.put("/servicios-municipales/{servicio_id}")
async def update_servicio(servicio_id: str, servicio: ServicioMunicipalCreate):
    await db.servicios_municipales.update_one(
        {"id": servicio_id},
        {"$set": servicio.dict(exclude_unset=True)}
    )
    return {"message": "Servicio actualizado"}

@api_router.delete("/servicios-municipales/{servicio_id}")
async def delete_servicio(servicio_id: str):
    await db.servicios_municipales.delete_one({"id": servicio_id})
    return {"message": "Servicio eliminado"}

# ============== ROUTES - PRESTADORES ==============

@api_router.get("/prestadores")
async def list_prestadores(
    municipio_id: Optional[str] = None,
    verificado: Optional[bool] = None,
    limit: int = 100,
    search: Optional[str] = None
):
    query = {}
    if municipio_id:
        query["municipio_id"] = municipio_id
    if verificado is not None:
        query["verificado"] = verificado
    if search:
        query["$text"] = {"$search": search}
    
    prestadores = await db.prestadores.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return {"prestadores": prestadores}

@api_router.get("/prestadores/me")
async def get_my_prestador(current_user: dict = Depends(get_current_user)):
    prestador = await db.prestadores.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    return prestador

@api_router.get("/prestadores/{prestador_id}")
async def get_prestador(prestador_id: str):
    prestador = await db.prestadores.find_one({"id": prestador_id}, {"_id": 0})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    return prestador

@api_router.put("/prestadores/me/perfil")
async def update_prestador_perfil(
    update: PrestadorPerfilUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] != "prestador":
        raise HTTPException(status_code=403, detail="Solo prestadores pueden actualizar su perfil")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.prestadores.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    return {"message": "Perfil actualizado"}

# ============== ROUTES - GALERÍA PRESTADOR ==============

@api_router.get("/prestadores/{prestador_id}/imagenes")
async def get_imagenes(prestador_id: str):
    imagenes = await db.prestador_imagenes.find(
        {"prestador_id": prestador_id},
        {"_id": 0}
    ).to_list(100)
    return {"imagenes": imagenes}

@api_router.post("/prestadores/{prestador_id}/imagenes")
async def add_imagen(
    prestador_id: str,
    imagen: ImagenCreate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_imagen = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **imagen.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.prestador_imagenes.insert_one(new_imagen)
    return {"id": new_imagen["id"]}

@api_router.put("/prestadores/imagenes/{imagen_id}/portada")
async def set_portada(imagen_id: str):
    imagen = await db.prestador_imagenes.find_one({"id": imagen_id})
    if not imagen:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    # Desmarcar otras como portada
    await db.prestador_imagenes.update_many(
        {"prestador_id": imagen["prestador_id"]},
        {"$set": {"es_portada": False}}
    )
    
    # Marcar esta como portada
    await db.prestador_imagenes.update_one(
        {"id": imagen_id},
        {"$set": {"es_portada": True}}
    )
    return {"message": "Portada actualizada"}

@api_router.delete("/prestadores/imagenes/{imagen_id}")
async def delete_imagen(imagen_id: str):
    await db.prestador_imagenes.delete_one({"id": imagen_id})
    return {"message": "Imagen eliminada"}

# ============== ROUTES - SERVICIOS PRESTADOR ==============

@api_router.get("/prestadores/{prestador_id}/servicios")
async def get_servicios(prestador_id: str):
    servicios = await db.prestador_servicios.find(
        {"prestador_id": prestador_id},
        {"_id": 0}
    ).to_list(100)
    return {"servicios": servicios}

@api_router.post("/prestadores/{prestador_id}/servicios")
async def create_servicio_prestador(
    prestador_id: str,
    servicio: ServicioPrestadorCreate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_servicio = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **servicio.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.prestador_servicios.insert_one(new_servicio)
    return {"id": new_servicio["id"]}

@api_router.put("/prestadores/servicios/{servicio_id}")
async def update_servicio_prestador(
    servicio_id: str,
    servicio: ServicioPrestadorCreate
):
    await db.prestador_servicios.update_one(
        {"id": servicio_id},
        {"$set": servicio.dict(exclude_unset=True)}
    )
    return {"message": "Servicio actualizado"}

@api_router.delete("/prestadores/servicios/{servicio_id}")
async def delete_servicio_prestador(servicio_id: str):
    await db.prestador_servicios.delete_one({"id": servicio_id})
    return {"message": "Servicio eliminado"}

# ============== ROUTES - MENÚ ==============

@api_router.get("/prestadores/{prestador_id}/menu")
async def get_menu(prestador_id: str):
    categorias = await db.menu_categorias.find(
        {"prestador_id": prestador_id},
        {"_id": 0}
    ).to_list(100)
    
    for cat in categorias:
        cat["items"] = await db.menu_items.find(
            {"categoria_id": cat["id"]},
            {"_id": 0}
        ).to_list(100)
    
    return {"categorias": categorias}

@api_router.post("/prestadores/{prestador_id}/menu/categorias")
async def create_menu_categoria(
    prestador_id: str,
    categoria: MenuCategoriaCreate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_cat = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **categoria.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.menu_categorias.insert_one(new_cat)
    return {"id": new_cat["id"]}

@api_router.post("/menu/items")
async def create_menu_item(item: MenuItemCreate):
    new_item = {
        "id": str(uuid.uuid4()),
        **item.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.menu_items.insert_one(new_item)
    return {"id": new_item["id"]}

@api_router.put("/menu/items/{item_id}")
async def update_menu_item(item_id: str, item: MenuItemCreate):
    await db.menu_items.update_one(
        {"id": item_id},
        {"$set": item.dict(exclude_unset=True)}
    )
    return {"message": "Ítem actualizado"}

@api_router.delete("/menu/items/{item_id}")
async def delete_menu_item(item_id: str):
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Ítem eliminado"}

@api_router.delete("/menu/categorias/{categoria_id}")
async def delete_menu_categoria(categoria_id: str):
    await db.menu_items.delete_many({"categoria_id": categoria_id})
    await db.menu_categorias.delete_one({"id": categoria_id})
    return {"message": "Categoría eliminada"}

# ============== ROUTES - HABITACIONES ==============

@api_router.get("/prestadores/{prestador_id}/habitaciones")
async def get_habitaciones(prestador_id: str):
    habitaciones = await db.habitaciones.find(
        {"prestador_id": prestador_id},
        {"_id": 0}
    ).to_list(100)
    return {"habitaciones": habitaciones}

@api_router.post("/prestadores/{prestador_id}/habitaciones")
async def create_habitacion(
    prestador_id: str,
    habitacion: HabitacionCreate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_hab = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **habitacion.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.habitaciones.insert_one(new_hab)
    return {"id": new_hab["id"]}

@api_router.put("/habitaciones/{habitacion_id}")
async def update_habitacion(habitacion_id: str, habitacion: HabitacionCreate):
    await db.habitaciones.update_one(
        {"id": habitacion_id},
        {"$set": habitacion.dict(exclude_unset=True)}
    )
    return {"message": "Habitación actualizada"}

@api_router.delete("/habitaciones/{habitacion_id}")
async def delete_habitacion(habitacion_id: str):
    await db.habitaciones.delete_one({"id": habitacion_id})
    return {"message": "Habitación eliminada"}

# ============== ROUTES - PROMOCIONES ==============

@api_router.get("/prestadores/{prestador_id}/promociones")
async def get_promociones(prestador_id: str):
    promociones = await db.promociones.find(
        {"prestador_id": prestador_id},
        {"_id": 0}
    ).to_list(100)
    return {"promociones": promociones}

@api_router.post("/prestadores/{prestador_id}/promociones")
async def create_promocion(
    prestador_id: str,
    promo: PromocionCreate,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    new_promo = {
        "id": str(uuid.uuid4()),
        "prestador_id": prestador_id,
        **promo.dict(),
        "activa": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.promociones.insert_one(new_promo)
    return {"id": new_promo["id"]}

@api_router.delete("/promociones/{promo_id}")
async def delete_promocion(promo_id: str):
    await db.promociones.delete_one({"id": promo_id})
    return {"message": "Promoción eliminada"}

# ============== ROUTES - RESERVAS ==============

@api_router.get("/prestadores/{prestador_id}/reservas")
async def get_reservas(
    prestador_id: str,
    estado: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador or prestador.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    query = {"prestador_id": prestador_id}
    if estado:
        query["estado"] = estado
    
    reservas = await db.reservas.find(query, {"_id": 0}).to_list(100)
    return {"reservas": reservas}

@api_router.post("/reservas")
async def create_reserva(
    reserva: ReservaCreate,
    current_user: dict = Depends(get_optional_user)
):
    new_reserva = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"] if current_user else None,
        **reserva.dict(),
        "estado": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reservas.insert_one(new_reserva)
    return {"id": new_reserva["id"]}

@api_router.put("/reservas/{reserva_id}/estado")
async def update_reserva_estado(reserva_id: str, data: dict):
    await db.reservas.update_one(
        {"id": reserva_id},
        {"$set": {"estado": data.get("estado")}}
    )
    return {"message": "Reserva actualizada"}

# ============== ROUTES - UPLOAD ==============

@api_router.post("/public/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = upload_to_cloudinary(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== ROUTES - ANALÍTICAS ==============

@api_router.get("/prestadores/{prestador_id}/analiticas")
async def get_analiticas(prestador_id: str):
    prestador = await db.prestadores.find_one({"id": prestador_id})
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador no encontrado")
    
    # Mock data - en producción, usar métricas reales
    return {
        "visitas": 150,
        "contactos": 42,
        "reservas": {
            "total": 12,
            "pendientes": 3,
            "completadas": 9
        },
        "periodo_dias": 30
    }

@api_router.post("/analytics/track")
async def track_event(data: dict, current_user: dict = Depends(get_optional_user)):
    event = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"] if current_user else None,
        **data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics.insert_one(event)
    return {"message": "Evento registrado"}

# ============== INIT ==============

app.include_router(api_router)

@app.on_event("startup")
async def startup():
    logger.info("API iniciada")
    await seed_municipios()
    await seed_admin()
    await seed_sample_events()
    await seed_sample_prestadores()
    await seed_orizaba_completo()

@app.get("/")
async def root():
    return {"message": "Veracruz Contigo API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)