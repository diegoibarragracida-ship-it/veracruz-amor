"""
Seed script — Atracciones / Lugares de Orizaba
Ejecutar: python seed_orizaba_atracciones.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

def slugify(text):
    import re
    text = text.lower()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text.strip())
    return text

ATRACCIONES_ORIZABA = [

    # ─── 🏔️ NATURALEZA & AVENTURA ──────────────────────────────────────────
    {
        "nombre": "Pico de Orizaba (Citlaltépetl)",
        "tipo": "atraccion",
        "subtipo": "Volcán / montañismo",
        "descripcion": "El volcán más alto de México y tercera montaña más alta de América del Norte con 5,636 msnm.",
        "descripcion_larga": "El Pico de Orizaba, también conocido como Citlaltépetl, es el volcán más alto de México y la tercera montaña más alta de América del Norte, con una altitud aproximada de 5,636 metros sobre el nivel del mar. Se trata de un volcán inactivo cubierto de nieve en su cima durante gran parte del año, lo que lo convierte en un destino emblemático para el montañismo y la exploración de alta montaña. Forma parte de un parque nacional que alberga diversos ecosistemas, desde bosques hasta zonas alpinas. Es visitado tanto por excursionistas como por alpinistas experimentados. El ascenso requiere preparación física, equipo especializado y, en muchos casos, guía certificado. Sin embargo, también existen zonas accesibles en sus alrededores para turismo general y contacto con la naturaleza.",
        "horarios": "Libre acceso",
        "costo": "Variable según guía",
        "costo_min": 0, "costo_max": 3000,
        "lat": 19.0306, "lng": -97.2686,
        "fotos": [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85",
            "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85",
        "tags": ["volcán", "montañismo", "naturaleza", "aventura", "parque nacional"],
        "calificacion": 4.9, "destacado": True, "direccion": "Parque Nacional Pico de Orizaba",
    },
    {
        "nombre": "Teleférico de Orizaba",
        "tipo": "atraccion",
        "subtipo": "Transporte turístico",
        "descripcion": "Uno de los teleféricos urbanos más importantes de México. Conecta el centro con el Cerro del Borrego en 5 minutos con vistas panorámicas.",
        "descripcion_larga": "El Teleférico de Orizaba es uno de los principales atractivos turísticos de la ciudad y uno de los teleféricos urbanos más importantes de México. Tiene una longitud aproximada de 917 metros y conecta la zona centro con el Cerro del Borrego en un recorrido de alrededor de 5 minutos. Opera con cabinas cerradas con capacidad para 6 personas, lo que permite un traslado cómodo y seguro mientras se disfruta de vistas panorámicas del río Orizaba, el centro histórico y, en días despejados, el Pico de Orizaba. Es una experiencia ideal tanto para turistas como para locales, especialmente al atardecer, cuando la iluminación de la ciudad crea un paisaje visual atractivo. También funciona como acceso directo a otras atracciones como el ecoparque del cerro.",
        "horarios": "10:00–18:00",
        "costo": "$50–$100 MXN",
        "costo_min": 50, "costo_max": 100,
        "lat": 18.8534, "lng": -97.1014,
        "fotos": [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
        "tags": ["teleférico", "vistas", "aventura", "familia"],
        "calificacion": 4.7, "destacado": True, "direccion": "Sur 4 #50, Centro, Orizaba",
    },
    {
        "nombre": "Cerro del Borrego",
        "tipo": "atraccion",
        "subtipo": "Ecoparque / sitio histórico",
        "descripcion": "Ecoparque histórico a 1,240 msnm, escenario de la batalla contra la intervención francesa (1862). Senderos, miradores y la Atalaya de Cristal.",
        "descripcion_larga": "El Cerro del Borrego es un espacio natural y sitio histórico emblemático de Orizaba, ubicado a aproximadamente 1,240 metros sobre el nivel del mar. Es conocido por haber sido escenario de una importante batalla durante la intervención francesa en 1862. Actualmente funciona como un ecoparque que combina historia, naturaleza y recreación. Cuenta con senderos bien definidos para caminatas, zonas de descanso y miradores naturales desde donde se puede observar toda la ciudad. Es accesible tanto a pie como por teleférico, lo que lo convierte en un punto clave para el turismo. Además, alberga otras atracciones como la Atalaya de Cristal y el Tobogán de la Montaña.",
        "horarios": "9:00–18:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8620, "lng": -97.0980,
        "fotos": [
            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85",
        "tags": ["naturaleza", "historia", "senderismo", "miradores", "familia"],
        "calificacion": 4.7, "destacado": True, "direccion": "Cerro del Borrego, Centro, Orizaba",
    },
    {
        "nombre": "Atalaya de Cristal",
        "tipo": "actividad",
        "subtipo": "Mirador",
        "descripcion": "Mirador contemporáneo con piso de vidrio en la cima del Cerro del Borrego. Vista de 300 metros hacia la ciudad. Experiencia visual y sensorial única.",
        "descripcion_larga": "La Atalaya de Cristal es un mirador contemporáneo construido en la cima del Cerro del Borrego. Su principal característica es su plataforma con piso de vidrio, que permite observar directamente hacia abajo desde más de 300 metros de altura sobre la ciudad. Está diseñada como una experiencia visual y sensorial, ideal para quienes buscan vistas panorámicas únicas y fotografías impactantes. La estructura es segura y resistente, pero genera una sensación de altura que la convierte en una atracción emocionante. Es uno de los puntos más visitados dentro del cerro y se ha convertido en un referente turístico moderno de Orizaba.",
        "horarios": "10:00–18:00",
        "costo": "Bajo costo",
        "costo_min": 30, "costo_max": 60,
        "lat": 18.8625, "lng": -97.0978,
        "fotos": [
            "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85",
        "tags": ["mirador", "adrenalina", "fotografía", "vistas"],
        "calificacion": 4.8, "destacado": True, "direccion": "Cima del Cerro del Borrego, Orizaba",
    },
    {
        "nombre": "Tobogán de la Montaña",
        "tipo": "actividad",
        "subtipo": "Alpine coaster",
        "descripcion": "Alpine coaster de 650 metros integrado en el Cerro del Borrego. El usuario controla la velocidad. Ideal para familias que buscan adrenalina en la naturaleza.",
        "descripcion_larga": "El Tobogán de la Montaña es una atracción tipo alpine coaster con una longitud aproximada de 650 metros. Se encuentra integrado en el entorno natural del Cerro del Borrego, descendiendo entre árboles y pendientes. Cada usuario controla la velocidad del carrito mediante un sistema de freno manual, lo que permite una experiencia personalizada, desde un recorrido tranquilo hasta uno más rápido y emocionante. Es una actividad segura, ideal para familias y visitantes que buscan combinar naturaleza con adrenalina. Se ha posicionado como una de las atracciones recreativas más populares del cerro.",
        "horarios": "10:00–18:00",
        "costo": "$50–$100 MXN",
        "costo_min": 50, "costo_max": 100,
        "lat": 18.8618, "lng": -97.0982,
        "fotos": [
            "https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1200&q=85",
        "tags": ["adrenalina", "familia", "aventura", "naturaleza"],
        "calificacion": 4.6, "destacado": False, "direccion": "Cerro del Borrego, Orizaba",
    },
    {
        "nombre": "Paseo del Río Orizaba",
        "tipo": "atraccion",
        "subtipo": "Parque lineal",
        "descripcion": "Parque lineal de 5 km a orillas del río. Puentes peatonales, zoológico pequeño, zonas culturales y áreas verdes. El mejor proyecto de recuperación urbana de la ciudad.",
        "descripcion_larga": "El Paseo del Río Orizaba es un parque lineal de aproximadamente 5 kilómetros que sigue el curso del río a través de la ciudad. Representa un proyecto de recuperación urbana que transformó una zona antes descuidada en un espacio recreativo moderno. A lo largo del recorrido se encuentran áreas verdes, puentes peatonales, zonas de descanso, un pequeño zoológico y espacios para actividades culturales. Es ideal para caminar, correr o pasear en familia. Su diseño lo convierte en uno de los espacios públicos más importantes de Orizaba, combinando naturaleza, infraestructura y convivencia social.",
        "horarios": "9:00–20:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8498, "lng": -97.0991,
        "fotos": [
            "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85",
        "tags": ["parque", "familia", "naturaleza", "gratuito", "río"],
        "calificacion": 4.6, "destacado": True, "direccion": "Paseo del Río, Centro, Orizaba",
    },
    {
        "nombre": "Laguna de Ojo de Agua",
        "tipo": "atraccion",
        "subtipo": "Balneario natural",
        "descripcion": "Nacimiento natural de agua cristalina proveniente de manantiales subterráneos. Ideal para nadar y refrescarse. Muy popular en temporada de calor.",
        "descripcion_larga": "La Laguna de Ojo de Agua es un nacimiento natural de agua cristalina que ha sido aprovechado como balneario natural. Su agua es fría y limpia, proveniente directamente de manantiales subterráneos. Es un sitio muy popular para nadar, refrescarse y convivir, especialmente en temporadas de calor. El entorno natural y la claridad del agua la convierten en uno de los espacios recreativos más atractivos de la zona. Además, tiene un valor histórico como fuente natural utilizada desde tiempos antiguos.",
        "horarios": "8:00–18:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8456, "lng": -97.0934,
        "fotos": [
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=85",
        "tags": ["agua", "naturaleza", "gratuito", "balneario", "familia"],
        "calificacion": 4.4, "destacado": False, "direccion": "Col. Ojo de Agua, Orizaba",
    },
    {
        "nombre": "Parque Biori",
        "tipo": "atraccion",
        "subtipo": "Parque ecológico",
        "descripcion": "Espacio ecológico de extensión natural dentro de la ciudad. Áreas de descanso, caminatas y vegetación abundante. Ideal para familias que buscan tranquilidad.",
        "descripcion_larga": "El Parque Biori es un espacio ecológico que funciona como extensión natural dentro de la ciudad. Está diseñado para ofrecer un ambiente tranquilo y familiar, rodeado de vegetación. Cuenta con áreas para descanso, caminatas y convivencia, siendo ideal para quienes buscan un espacio relajado lejos del ruido urbano. Es utilizado principalmente por familias y visitantes que desean disfrutar de un entorno natural sin salir de la ciudad.",
        "horarios": "9:00–18:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8512, "lng": -97.1034,
        "fotos": [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85",
        "tags": ["parque", "ecológico", "familia", "gratuito"],
        "calificacion": 4.3, "destacado": False, "direccion": "Poniente 20, Orizaba",
    },
    {
        "nombre": "Parque Nacional Cerro de Escamela",
        "tipo": "atraccion",
        "subtipo": "Parque nacional",
        "descripcion": "Zona natural protegida con bosque húmedo y cascadas. Senderos naturales poco intervenidos. Ideal para ecoturismo y senderismo auténtico.",
        "descripcion_larga": "El Parque Nacional Cerro de Escamela es una zona natural protegida caracterizada por su bosque húmedo y la presencia de cascadas. Es ideal para actividades como senderismo, exploración y contacto con la naturaleza. Cuenta con senderos naturales y áreas poco intervenidas, lo que permite una experiencia más auténtica. Es recomendable para visitantes que buscan ecoturismo y tranquilidad. Su ecosistema alberga flora y fauna propia de la región montañosa de Veracruz.",
        "horarios": "Libre",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8234, "lng": -97.0534,
        "fotos": [
            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85",
        "tags": ["naturaleza", "senderismo", "cascadas", "ecoturismo", "gratuito"],
        "calificacion": 4.5, "destacado": False, "direccion": "Escamela, Orizaba, Ver.",
    },
    {
        "nombre": "Cañón de la Carbonera",
        "tipo": "actividad",
        "subtipo": "Aventura / rappel",
        "descripcion": "Formación natural en Nogales con paredes rocosas impresionantes. Rappel, senderismo nivel medio. Recomendado con guía. Paisajes naturales únicos.",
        "descripcion_larga": "El Cañón de la Carbonera es una formación natural ubicada en la zona de Nogales, caracterizada por sus paredes rocosas y su entorno natural. Es un sitio ideal para actividades de aventura como rappel y senderismo. Su nivel es considerado medio, por lo que se recomienda cierta experiencia o ir acompañado de guías. Ofrece paisajes naturales impresionantes y es un destino atractivo para turismo de aventura.",
        "horarios": "Libre",
        "costo": "Gratis (guía opcional)",
        "costo_min": 0, "costo_max": 500,
        "lat": 18.8012, "lng": -97.1534,
        "fotos": [
            "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=1200&q=85",
        "tags": ["aventura", "rappel", "senderismo", "naturaleza"],
        "calificacion": 4.4, "destacado": False, "direccion": "Nogales, Ver. (30 min de Orizaba)",
    },

    # ─── 🏛️ CULTURA & PATRIMONIO ───────────────────────────────────────────
    {
        "nombre": "Palacio de Hierro de Orizaba",
        "tipo": "atraccion",
        "subtipo": "Museo / patrimonio arquitectónico",
        "descripcion": "Joya art nouveau construida en Bélgica (1894), atribuida al taller de Gustave Eiffel. Símbolo de Orizaba. Alberga museos, exposiciones y espacios culturales.",
        "descripcion_larga": "El Palacio de Hierro es uno de los edificios más emblemáticos de Orizaba y único en su tipo en México. Fue construido en el siglo XIX con estructura de hierro prefabricado, siguiendo un estilo industrial europeo atribuido a Gustave Eiffel. Actualmente funciona como un complejo cultural que alberga varios museos y espacios de exposición. Su diseño arquitectónico lo convierte en un punto de referencia histórica y turística dentro del centro de la ciudad. Es un sitio ideal para conocer la historia local y disfrutar de actividades culturales en un entorno arquitectónico distintivo.",
        "horarios": "10:00–18:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8534, "lng": -97.1014,
        "fotos": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg",
            "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85",
        ],
        "foto_portada": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg",
        "tags": ["arquitectura", "museo", "historia", "arte", "fotografía", "gratuito"],
        "calificacion": 4.8, "destacado": True, "direccion": "Madero s/n, Centro, Orizaba",
    },
    {
        "nombre": "Catedral de San Miguel Arcángel",
        "tipo": "atraccion",
        "subtipo": "Templo religioso",
        "descripcion": "Principal templo religioso de Orizaba. Construido en el siglo XVIII con estilo neoclásico. Centro del recorrido cultural del centro histórico.",
        "descripcion_larga": "La Catedral de San Miguel Arcángel es el principal templo religioso de Orizaba. Construida en el siglo XVIII, presenta un estilo neoclásico sobrio con elementos tradicionales. Se ubica en el corazón del centro histórico, lo que la convierte en un punto de encuentro tanto religioso como turístico. En su interior alberga imágenes religiosas de gran valor y es sede de las principales celebraciones litúrgicas de la ciudad. Su entorno la hace ideal para recorridos culturales y visitas al centro.",
        "horarios": "7:00–20:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8531, "lng": -97.1010,
        "fotos": [
            "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85",
        "tags": ["religión", "historia", "arquitectura", "gratuito"],
        "calificacion": 4.6, "destacado": False, "direccion": "Centro Histórico, Orizaba",
    },
    {
        "nombre": "Museo de Arte del Estado de Veracruz",
        "tipo": "atraccion",
        "subtipo": "Museo",
        "descripcion": "Ubicado en un antiguo convento. Colección de arte novohispano, exposiciones permanentes y temporales. Uno de los recintos culturales más importantes del estado.",
        "descripcion_larga": "Ubicado en un antiguo convento, este museo alberga una importante colección de arte novohispano, así como exposiciones permanentes y temporales. Es uno de los recintos culturales más importantes del estado, ideal para conocer la historia artística de la región.",
        "horarios": "10:00–18:00",
        "costo": "$20–$50 MXN",
        "costo_min": 20, "costo_max": 50,
        "lat": 18.8545, "lng": -97.1003,
        "fotos": [
            "https://images.unsplash.com/photo-1578926288207-a90a5e3d682e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1578926288207-a90a5e3d682e?w=1200&q=85",
        "tags": ["museo", "arte", "historia", "cultura"],
        "calificacion": 4.5, "destacado": False, "direccion": "Norte 4 #27, Centro, Orizaba",
    },
    {
        "nombre": "Poliforum Mier y Pesado",
        "tipo": "atraccion",
        "subtipo": "Centro cultural",
        "descripcion": "Complejo cultural con jardines de estilo europeo. Sede de eventos, exposiciones, conciertos y actividades culturales. Arquitectura y jardines únicos.",
        "descripcion_larga": "El Poliforum Mier y Pesado es un complejo cultural con jardines de estilo europeo, originalmente ligado a obras de beneficencia. Actualmente se utiliza como espacio para eventos culturales, exposiciones, conciertos y actividades sociales. Su arquitectura y jardines lo convierten en un lugar atractivo para visitas y recorridos.",
        "horarios": "9:00–18:00",
        "costo": "Bajo costo",
        "costo_min": 20, "costo_max": 50,
        "lat": 18.8528, "lng": -97.1005,
        "fotos": [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=85",
        "tags": ["cultura", "jardines", "eventos", "arquitectura"],
        "calificacion": 4.4, "destacado": False, "direccion": "Oriente 6 #500, Orizaba",
    },
    {
        "nombre": "Museo de la Cerveza",
        "tipo": "atraccion",
        "subtipo": "Museo interactivo",
        "descripcion": "Museo interactivo sobre la tradición cervecera de Orizaba. Historia de la industria, procesos de producción y cultura de la cerveza veracruzana.",
        "descripcion_larga": "Museo interactivo que muestra la historia de la industria cervecera en Orizaba, ciudad con tradición en este sector. Incluye exhibiciones sobre procesos de producción, historia y cultura de la cerveza, siendo una experiencia educativa y recreativa.",
        "horarios": "10:00–18:00",
        "costo": "$30–$60 MXN",
        "costo_min": 30, "costo_max": 60,
        "lat": 18.8534, "lng": -97.1014,
        "fotos": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85",
        "tags": ["museo", "cerveza", "historia", "interactivo"],
        "calificacion": 4.3, "destacado": False, "direccion": "Palacio de Hierro, Orizaba",
    },
    {
        "nombre": "Museo Cri-Cri",
        "tipo": "atraccion",
        "subtipo": "Museo temático",
        "descripcion": "Museo dedicado a Francisco Gabilondo Soler 'Cri-Cri', el Grillito Cantor, nacido en Orizaba. Contenido educativo, música y experiencias interactivas para niños.",
        "descripcion_larga": "Museo dedicado a Francisco Gabilondo Soler 'Cri-Cri', con enfoque infantil y cultural. Presenta contenido educativo, música y elementos interactivos que lo hacen ideal para familias y niños.",
        "horarios": "10:00–18:00",
        "costo": "$30 MXN",
        "costo_min": 30, "costo_max": 30,
        "lat": 18.8522, "lng": -97.1008,
        "fotos": [
            "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&q=85",
        "tags": ["museo", "familia", "niños", "cultura", "Cri-Cri"],
        "calificacion": 4.5, "destacado": False, "direccion": "Alameda, Orizaba",
    },
    {
        "nombre": "Museo Casa de las Leyendas",
        "tipo": "atraccion",
        "subtipo": "Museo temático",
        "descripcion": "Museo temático de leyendas y tradiciones orales de la región. Experiencias narrativas que recrean historias locales misteriosas. Atracción diferente y original.",
        "descripcion_larga": "Museo temático enfocado en las leyendas y tradiciones orales de la región. Ofrece experiencias narrativas que recrean historias locales, convirtiéndolo en una atracción diferente dentro de la oferta cultural.",
        "horarios": "10:00–18:00",
        "costo": "$40 MXN",
        "costo_min": 40, "costo_max": 40,
        "lat": 18.8529, "lng": -97.1011,
        "fotos": [
            "https://images.unsplash.com/photo-1518818419601-72c8673f5852?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1518818419601-72c8673f5852?w=1200&q=85",
        "tags": ["museo", "leyendas", "misterio", "cultura"],
        "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Museo del Fútbol",
        "tipo": "atraccion",
        "subtipo": "Museo deportivo",
        "descripcion": "Espacio interactivo dedicado al fútbol mexicano. Exhibiciones de equipos, jugadores históricos y momentos clave del deporte nacional.",
        "descripcion_larga": "Espacio dedicado al fútbol mexicano, con exhibiciones interactivas y contenido histórico sobre equipos, jugadores y momentos importantes del deporte. Es una opción atractiva para aficionados y visitantes interesados en la cultura deportiva.",
        "horarios": "10:00–18:00",
        "costo": "$30 MXN",
        "costo_min": 30, "costo_max": 30,
        "lat": 18.8526, "lng": -97.1009,
        "fotos": [
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=85",
        "tags": ["museo", "fútbol", "deportes", "interactivo"],
        "calificacion": 4.2, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Museo del Traje",
        "tipo": "atraccion",
        "subtipo": "Museo",
        "descripcion": "Exhibición permanente de vestimenta histórica y tradicional. Evolución de la moda y la cultura textil de diferentes épocas y regiones de México.",
        "descripcion_larga": "Museo con exhibición permanente de vestimenta histórica y tradicional, que muestra la evolución de la moda y la cultura textil. Es un espacio cultural que permite entender las costumbres y estilos de diferentes épocas.",
        "horarios": "10:00–18:00",
        "costo": "$30 MXN",
        "costo_min": 30, "costo_max": 30,
        "lat": 18.8530, "lng": -97.1013,
        "fotos": [
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=85",
        "tags": ["museo", "historia", "moda", "textiles", "cultura"],
        "calificacion": 4.1, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Iglesia del Carmen",
        "tipo": "atraccion",
        "subtipo": "Templo religioso",
        "descripcion": "Templo carmelita de estilo barroco sencillo. Patrimonio colonial de Orizaba, visitada por fieles y turistas interesados en arquitectura religiosa histórica.",
        "descripcion_larga": "Templo de origen carmelita con características de estilo barroco sencillo. Es una de las iglesias tradicionales de la ciudad, destacando por su valor histórico y su función religiosa activa. Forma parte del patrimonio colonial de Orizaba y es visitada tanto por fieles como por turistas interesados en arquitectura religiosa.",
        "horarios": "7:00–19:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8537, "lng": -97.1018,
        "fotos": [
            "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85",
        "tags": ["iglesia", "colonial", "patrimonio", "gratuito"],
        "calificacion": 4.3, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Palacio Municipal de Orizaba",
        "tipo": "atraccion",
        "subtipo": "Edificio histórico",
        "descripcion": "Sede del gobierno local y uno de los edificios más representativos del centro histórico. Arquitectura tradicional veracruzana con acceso parcial al público.",
        "descripcion_larga": "El Palacio Municipal es la sede del gobierno local y uno de los edificios más representativos del centro histórico. Su arquitectura forma parte del conjunto urbano tradicional de Orizaba, y aunque su función principal es administrativa, permite acceso parcial al público. Es un punto clave para entender la organización política de la ciudad y su desarrollo urbano.",
        "horarios": "9:00–17:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8533, "lng": -97.1012,
        "fotos": [
            "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85",
        "tags": ["historia", "arquitectura", "gobierno", "gratuito"],
        "calificacion": 4.2, "destacado": False, "direccion": "Centro, Orizaba",
    },

    # ─── 🌳 PLAZAS & ESPACIOS PÚBLICOS ─────────────────────────────────────
    {
        "nombre": "Parque Castillo",
        "tipo": "atraccion",
        "subtipo": "Plaza histórica",
        "descripcion": "Plaza central emblemática, punto de reunión social rodeado de edificios históricos. Los domingos hay presentaciones de son jarocho. Corazón de la vida pública de Orizaba.",
        "descripcion_larga": "Plaza central que funciona como punto de reunión social. Es uno de los espacios más representativos del centro, rodeado de edificios históricos y actividad comercial.",
        "horarios": "Libre",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8538, "lng": -97.1010,
        "fotos": [
            "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=1200&q=85",
        "tags": ["plaza", "historia", "gratuito", "centro"],
        "calificacion": 4.5, "destacado": False, "direccion": "Centro Histórico, Orizaba",
    },
    {
        "nombre": "Alameda Francisco Gabilondo Soler",
        "tipo": "atraccion",
        "subtipo": "Parque urbano",
        "descripcion": "Parque urbano emblemático de Orizaba dedicado a Cri-Cri. Áreas verdes, espacios de convivencia familiar. Ideal para descansar en el centro histórico.",
        "descripcion_larga": "Parque urbano emblemático de Orizaba, ideal para recreación familiar y descanso. Cuenta con áreas verdes, espacios de convivencia y está vinculado culturalmente con la figura de Cri-Cri.",
        "horarios": "Libre",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8522, "lng": -97.1008,
        "fotos": [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85",
        "tags": ["parque", "familia", "gratuito", "Cri-Cri"],
        "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Plaza Bicentenario",
        "tipo": "atraccion",
        "subtipo": "Plaza moderna",
        "descripcion": "Espacio moderno construido para el bicentenario (2010). Sede de eventos públicos, actividades culturales y recreación urbana en el centro de la ciudad.",
        "descripcion_larga": "Espacio moderno construido para conmemorar el bicentenario. Se utiliza para eventos públicos, actividades culturales y recreación urbana.",
        "horarios": "Libre",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8520, "lng": -97.1006,
        "fotos": [
            "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=85",
        "tags": ["plaza", "eventos", "gratuito", "moderno"],
        "calificacion": 4.2, "destacado": False, "direccion": "Centro, Orizaba",
    },

    # ─── 🛍️ MERCADOS & COMERCIO ────────────────────────────────────────────
    {
        "nombre": "Mercado de Artesanías de Orizaba",
        "tipo": "atraccion",
        "subtipo": "Mercado artesanal",
        "descripcion": "Espacio dedicado a artesanos locales. Textiles nahuas de Zongolica, recuerdos, figuras y productos típicos veracruzanos. Comercio justo directo.",
        "descripcion_larga": "El Mercado de Artesanías de Orizaba es un espacio turístico dedicado a la venta de productos elaborados por artesanos locales. Aquí se pueden encontrar textiles, recuerdos, figuras, productos típicos y artículos representativos de la cultura veracruzana. Es un punto clave para adquirir souvenirs y apoyar la economía local, además de ofrecer una experiencia cultural auténtica.",
        "horarios": "9:00–20:00",
        "costo": "Libre",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8527, "lng": -97.1009,
        "fotos": [
            "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85",
        "tags": ["artesanías", "compras", "cultura", "souvenirs"],
        "calificacion": 4.4, "destacado": False, "direccion": "Centro, Orizaba",
    },
    {
        "nombre": "Mercado Melchor Ocampo",
        "tipo": "atraccion",
        "subtipo": "Mercado tradicional",
        "descripcion": "Mercado tradicional más importante de Orizaba. Alimentos frescos, comida típica preparada y gastronomía local auténtica. Experiencia de la vida cotidiana de la ciudad.",
        "descripcion_larga": "El Mercado Melchor Ocampo es uno de los mercados tradicionales más importantes de Orizaba. Ofrece una gran variedad de productos, desde alimentos frescos hasta comida típica preparada, siendo un excelente lugar para conocer la gastronomía local. Es frecuentado tanto por habitantes como por visitantes, y representa una parte esencial de la vida cotidiana de la ciudad.",
        "horarios": "7:00–18:00",
        "costo": "Libre",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8521, "lng": -97.1011,
        "fotos": [
            "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1555529771-122e5d9f2341?w=1200&q=85",
        "tags": ["mercado", "gastronomía", "cultura", "tradición"],
        "calificacion": 4.5, "destacado": False, "direccion": "Poniente 7, Orizaba",
    },

    # ─── 🪦 SITIOS ESPECIALES ──────────────────────────────────────────────
    {
        "nombre": "Panteón Municipal de Orizaba",
        "tipo": "atraccion",
        "subtipo": "Patrimonio cultural",
        "descripcion": "Cementerio histórico con mausoleos y esculturas de diferentes épocas. Patrimonio arquitectónico funerario. Especialmente visitado en Día de Muertos.",
        "descripcion_larga": "El Panteón Municipal de Orizaba es un espacio histórico que forma parte del patrimonio cultural de la ciudad. Además de su función como cementerio, destaca por su valor arquitectónico y simbólico, ya que alberga tumbas antiguas, mausoleos y esculturas que reflejan diferentes épocas y estilos. Es visitado por personas interesadas en la historia local, la arquitectura funeraria y las tradiciones culturales relacionadas con el Día de Muertos. Ofrece un ambiente tranquilo y reflexivo, ideal para recorridos culturales.",
        "horarios": "8:00–18:00",
        "costo": "Gratis",
        "costo_min": 0, "costo_max": 0,
        "lat": 18.8489, "lng": -97.1023,
        "fotos": [
            "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=85",
        ],
        "foto_portada": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=85",
        "tags": ["historia", "patrimonio", "Día de Muertos", "gratuito"],
        "calificacion": 4.1, "destacado": False, "direccion": "Sur 11, Orizaba",
    },
]


async def main():
    print("🔍 Buscando municipio de Orizaba...")
    municipio = await db.municipios.find_one(
        {"nombre": {"$regex": "^Orizaba$", "$options": "i"}},
        {"_id": 0, "id": 1, "nombre": 1}
    )

    if not municipio:
        print("❌ No se encontró el municipio de Orizaba en la BD.")
        return

    municipio_id = municipio["id"]
    print(f"✅ Municipio: {municipio['nombre']} (ID: {municipio_id})")

    # Borrar atracciones anteriores de Orizaba para evitar duplicados
    deleted = await db.lugares.delete_many({"municipio_id": municipio_id})
    print(f"🗑️  Eliminadas {deleted.deleted_count} atracciones anteriores de Orizaba")

    docs = []
    for a in ATRACCIONES_ORIZABA:
        doc = {
            **a,
            "id": str(uuid.uuid4()),
            "municipio_id": municipio_id,
            "municipio": municipio["nombre"],
            "region": "centro",
            "slug": slugify(a["nombre"]),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        docs.append(doc)

    await db.lugares.insert_many(docs)
    print(f"\n🎉 ¡Insertadas {len(docs)} atracciones para Orizaba!")

    # Resumen por tipo
    tipos = {}
    for a in ATRACCIONES_ORIZABA:
        tipos[a["tipo"]] = tipos.get(a["tipo"], 0) + 1
    print("\n📊 Resumen:")
    for tipo, count in sorted(tipos.items()):
        print(f"  • {tipo}: {count}")

    destacados = sum(1 for a in ATRACCIONES_ORIZABA if a.get("destacado"))
    gratuitos = sum(1 for a in ATRACCIONES_ORIZABA if a.get("costo_min", 0) == 0)
    print(f"\n  ⭐ Destacados: {destacados}")
    print(f"  🆓 Gratuitos: {gratuitos}")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())