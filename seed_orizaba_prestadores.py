"""
Seed script — Prestadores de Orizaba
Ejecutar: python seed_orizaba_prestadores.py
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

PRESTADORES_ORIZABA = [

    # ─── 🏨 HOSPEDAJE ──────────────────────────────────────────────────────
    {
        "nombre": "Hotel Fiesta Cascada",
        "tipo": "hospedaje", "subtipo": "Hotel",
        "descripcion": "Hotel boutique 4 estrellas en el centro histórico de Orizaba. Habitaciones con vista al Pico de Orizaba, desayuno buffet incluido y alberca climatizada.",
        "telefono": "272-724-0100", "whatsapp": "522727240100",
        "horarios": "Recepción 24 hrs",
        "direccion": "Av. Oriente 6 No. 225, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 128,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Cabañas Pico de Nieve",
        "tipo": "hospedaje", "subtipo": "Cabaña",
        "descripcion": "8 cabañas de madera rodeadas de pinos a 2,400 msnm. Chimenea, jacuzzi exterior y desayuno campestre. Ideal para parejas y familias que buscan naturaleza.",
        "telefono": "272-815-3300", "whatsapp": "522728153300",
        "horarios": "Check-in 14:00 / Check-out 12:00",
        "direccion": "Carretera Orizaba–Nogales km 12, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 74,
        "lat": 18.8712, "lng": -97.1234, "verificado": True,
    },
    {
        "nombre": "Glamping Cerro del Borrego",
        "tipo": "hospedaje", "subtipo": "Glamping",
        "descripcion": "Domos geodésicos con cama king, baño privado y techo transparente para observar las estrellas. Vista panorámica de la ciudad y el volcán Citlaltépetl.",
        "telefono": "272-198-4422", "whatsapp": "522721984422",
        "horarios": "Check-in 15:00 / Check-out 11:00",
        "direccion": "Cerro del Borrego s/n, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 45,
        "lat": 18.8620, "lng": -97.0980, "verificado": True,
    },
    {
        "nombre": "Hacienda San Francisco",
        "tipo": "hospedaje", "subtipo": "Hacienda",
        "descripcion": "Hacienda del siglo XIX restaurada. 20 suites con mobiliario de época, jardines históricos, capilla y restaurante de cocina veracruzana de autor.",
        "telefono": "272-724-8800", "whatsapp": "522727248800",
        "horarios": "Recepción 24 hrs",
        "direccion": "Km 5 Carretera Orizaba–Córdoba, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 93,
        "lat": 18.8450, "lng": -97.0820, "verificado": True,
    },

    # ─── 🍽️ GASTRONOMÍA ────────────────────────────────────────────────────
    {
        "nombre": "La Sopa de Orizaba",
        "tipo": "restaurante", "subtipo": "Restaurante",
        "descripcion": "Referente de la cocina veracruzana desde 1974. Especializados en sopa de lima, mole negro, carnitas de res y el famoso arroz a la tumbada. Premio SECTUR 2023.",
        "telefono": "272-724-0055", "whatsapp": "522727240055",
        "horarios": "Mar–Dom 13:00–21:00",
        "direccion": "Calle Sur 11 No. 180, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 312,
        "lat": 18.8528, "lng": -97.1008, "verificado": True,
    },
    {
        "nombre": "Mezcalería El Agave Azul",
        "tipo": "restaurante", "subtipo": "Mezcalería",
        "descripcion": "Selección de 80+ mezcales artesanales de Oaxaca y Veracruz. Maridaje con botanas regionales: tlayudas, chapulines y queso Oaxaca. Música en vivo viernes y sábado.",
        "telefono": "272-815-7744", "whatsapp": "522728157744",
        "horarios": "Jue–Sáb 18:00–02:00 / Dom 14:00–22:00",
        "direccion": "Av. Poniente 6 No. 311, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 187,
        "lat": 18.8539, "lng": -97.1021, "verificado": True,
    },
    {
        "nombre": "Café Tierra Luna",
        "tipo": "restaurante", "subtipo": "Cafetería",
        "descripcion": "Café de especialidad con granos 100% del Cofre de Perote y Sierra de Zongolica. Métodos: V60, aeropress, cold brew y espresso. Repostería artesanal hecha en casa.",
        "telefono": "272-198-2211", "whatsapp": "522721982211",
        "horarios": "Lun–Sáb 8:00–20:00 / Dom 9:00–18:00",
        "direccion": "Calle Norte 2 No. 95, Col. Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 256,
        "lat": 18.8541, "lng": -97.1003, "verificado": True,
    },
    {
        "nombre": "Taquería El Portón",
        "tipo": "restaurante", "subtipo": "Taquería",
        "descripcion": "Los mejores tacos de canasta y al pastor de Orizaba. Atendida por la familia Martínez desde 1989. Tortillas hechas a mano, salsas de molcajete y chicharrón prensado.",
        "telefono": "272-724-3311",
        "horarios": "Lun–Dom 7:00–15:00",
        "direccion": "Mercado Melchor Ocampo, Local 14, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
        "calificacion_promedio": 4.5, "total_resenas": 421,
        "lat": 18.8521, "lng": -97.1011, "verificado": True,
    },

    # ─── 🧭 GUÍAS TURÍSTICOS ───────────────────────────────────────────────
    {
        "nombre": "Roberto Castellanos — Guía de Naturaleza",
        "tipo": "guia", "subtipo": "Guía de naturaleza",
        "descripcion": "Biólogo certificado por SECTUR con 15 años guiando expediciones al Pico de Orizaba (Citlaltépetl). Conoce cada rincón de la flora y fauna del volcán más alto de México.",
        "telefono": "272-198-5566", "whatsapp": "522721985566",
        "horarios": "Disponible todos los días, citas previas",
        "direccion": "Orizaba, Ver. (recogida en hotel)",
        "foto_url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
        "calificacion_promedio": 5.0, "total_resenas": 67,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Patricia Ávila — Guía Histórico-Cultural",
        "tipo": "guia", "subtipo": "Guía histórico-cultural",
        "descripcion": "Historiadora por la UV. Tours del centro histórico, Palacio de Hierro, Museo de Arte y murales de Siqueiros. Narrativa apasionante de la historia de Orizaba desde la Colonia.",
        "telefono": "272-724-6688", "whatsapp": "522727246688",
        "horarios": "Lun–Sáb 9:00–18:00",
        "direccion": "Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 89,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Aventura Citlaltépetl",
        "tipo": "guia", "subtipo": "Guía de aventura",
        "descripcion": "Equipo de 6 guías certificados en alta montaña. Ascenso al Pico de Orizaba, senderismo en Zongolica y rappel en cañadas. Equipo de seguridad incluido. Grupos máx. 8 personas.",
        "telefono": "272-815-9900", "whatsapp": "522728159900",
        "horarios": "Expediciones sábados y domingos",
        "direccion": "Tlachichuca (base del volcán) — salida desde Orizaba",
        "foto_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 134,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },

    # ─── 🚗 TRANSPORTE ─────────────────────────────────────────────────────
    {
        "nombre": "Taxi Turístico Orizaba Express",
        "tipo": "transporte", "subtipo": "Taxi turístico",
        "descripcion": "Servicio de taxi turístico con vehículos climatizados. Recorridos por Orizaba, Fortín de las Flores, Córdoba y traslados a aeropuerto de Veracruz. Disponible 24/7.",
        "telefono": "272-724-1122", "whatsapp": "522727241122",
        "horarios": "24 hrs",
        "direccion": "Orizaba, Ver. (servicio a domicilio)",
        "foto_url": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
        "calificacion_promedio": 4.5, "total_resenas": 203,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Renta de Bicicletas Paseo del Río",
        "tipo": "transporte", "subtipo": "Renta de bicicletas",
        "descripcion": "Bicicletas de montaña, city bike y eléctricas. Rutas sugeridas por el Paseo del Río Orizaba y alrededores. Casco y candado incluidos. Mapas de rutas gratis.",
        "telefono": "272-198-3344", "whatsapp": "522721983344",
        "horarios": "Lun–Dom 8:00–19:00",
        "direccion": "Paseo del Río Orizaba, entrada principal",
        "foto_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 91,
        "lat": 18.8498, "lng": -97.0991, "verificado": True,
    },
    {
        "nombre": "Transfer VIP Veracruz–Orizaba",
        "tipo": "transporte", "subtipo": "Transfer aeropuerto",
        "descripcion": "Traslados ejecutivos en suburban y van desde el aeropuerto de Veracruz hasta Orizaba y zona cañera. Choferes bilingües, Wi-Fi a bordo y rastreo GPS en tiempo real.",
        "telefono": "229-198-7766", "whatsapp": "522291987766",
        "horarios": "24 hrs — reserva con 2 hrs de anticipación",
        "direccion": "Orizaba, Ver. (servicio puerta a puerta)",
        "foto_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 56,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },

    # ─── ⚡ ACTIVIDADES & TOURS ────────────────────────────────────────────
    {
        "nombre": "Tour Cafetales de Zongolica",
        "tipo": "actividad", "subtipo": "Tour de café",
        "descripcion": "Recorrido de día completo por los cafetales orgánicos de la Sierra de Zongolica. Incluye proceso de cosecha, beneficio húmedo, tueste artesanal y cata profesional. Transporte incluido.",
        "telefono": "272-724-5533", "whatsapp": "522727245533",
        "horarios": "Sáb y Dom 7:00–17:00 (reserva previa)",
        "direccion": "Salida desde Plaza de Orizaba",
        "foto_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 178,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Río Blanco Rafting",
        "tipo": "actividad", "subtipo": "Kayak / rafting",
        "descripcion": "Descenso en balsa por el Río Blanco — niveles II y III de dificultad. Recorrido de 12 km con guías certificados. Equipo completo, almuerzo y fotos incluidos. Niños desde 8 años.",
        "telefono": "272-815-6622", "whatsapp": "522728156622",
        "horarios": "Sáb y Dom 8:00 (punto de encuentro Nogales)",
        "direccion": "Puente Metlac, Nogales, Ver. (30 min de Orizaba)",
        "foto_url": "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 112,
        "lat": 18.8134, "lng": -97.1544, "verificado": True,
    },
    {
        "nombre": "Teleférico & Tirolesa Cerro del Borrego",
        "tipo": "actividad", "subtipo": "Rapel / tirolesa",
        "descripcion": "El teleférico más largo del sureste mexicano. Además: tirolesa de 400m, rappel en roca volcánica y senderismo con vista al Citlaltépetl. Perfecta aventura familiar.",
        "telefono": "272-724-3388", "whatsapp": "522727243388",
        "horarios": "Mar–Dom 9:00–17:00",
        "direccion": "Cerro del Borrego, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 389,
        "lat": 18.8620, "lng": -97.0980, "verificado": True,
    },

    # ─── 🏪 COMERCIO TURÍSTICO ─────────────────────────────────────────────
    {
        "nombre": "Artesanías de Zongolica",
        "tipo": "comercio", "subtipo": "Artesanías",
        "descripcion": "Tienda oficial de artesanías nahuas de la Sierra de Zongolica. Bordados en lana, huipiles, blusas, bolsas y textiles tejidos en telar de cintura. Comercio justo directo con artesanas.",
        "telefono": "272-724-4411",
        "horarios": "Lun–Sáb 9:00–19:00 / Dom 10:00–15:00",
        "direccion": "Av. Colón No. 120, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 143,
        "lat": 18.8527, "lng": -97.1009, "verificado": True,
    },
    {
        "nombre": "Galería de Arte Orizaba Contemporánea",
        "tipo": "comercio", "subtipo": "Galería de arte",
        "descripcion": "Galería con obras de 30 artistas veracruzanos. Pinturas, escultura, fotografía y arte urbano. Exposiciones temporales cada 2 meses. Taller de arte los sábados.",
        "telefono": "272-815-2233", "whatsapp": "522728152233",
        "horarios": "Mar–Dom 10:00–20:00",
        "direccion": "Calle Sur 3 No. 88, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1578926288207-a90a5e3d682e?w=800&q=80",
        "calificacion_promedio": 4.5, "total_resenas": 76,
        "lat": 18.8533, "lng": -97.1016, "verificado": True,
    },
    {
        "nombre": "Bodega Café Citlali",
        "tipo": "comercio", "subtipo": "Bodega de café / cacao",
        "descripcion": "Bodega y tienda de café de especialidad de la región. Granos de Coatepec, Huatusco y Zongolica. Tueste artesanal a la vista del cliente. Venta al detalle y mayoreo. Envíos a toda la república.",
        "telefono": "272-198-8855", "whatsapp": "522721988855",
        "horarios": "Lun–Sáb 8:00–18:00",
        "direccion": "Parque Castillo No. 45, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 201,
        "lat": 18.8536, "lng": -97.1006, "verificado": True,
    },

    # ─── 🎭 CULTURA & ENTRETENIMIENTO ─────────────────────────────────────
    {
        "nombre": "Museo de Arte del Estado — Palacio de Hierro",
        "tipo": "cultura", "subtipo": "Museo",
        "descripcion": "Joya art nouveau diseñada por el taller de Gustave Eiffel (1894). Alberga exposiciones temporales y permanentes de arte mexicano e internacional. Símbolo arquitectónico de Orizaba.",
        "telefono": "272-724-0033",
        "horarios": "Mar–Dom 10:00–18:00",
        "direccion": "Av. Colón s/n, Centro, Orizaba, Ver.",
        "foto_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/PalacioDeHierroOrizaba.jpg/1200px-PalacioDeHierroOrizaba.jpg",
        "calificacion_promedio": 4.8, "total_resenas": 445,
        "lat": 18.8534, "lng": -97.1014, "verificado": True,
    },
    {
        "nombre": "Son Jarocho en el Parque Castillo",
        "tipo": "cultura", "subtipo": "Espectáculo de danza",
        "descripcion": "Grupo de son jarocho tradicional con jarana, arpa y zapateado. Presentaciones los domingos en el Parque Castillo. Talleres de fandango abiertos al público. Patrimonio inmaterial de Veracruz.",
        "telefono": "272-815-1100", "whatsapp": "522728151100",
        "horarios": "Dom 12:00–14:00 (Parque Castillo)",
        "direccion": "Parque Castillo, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1518834107812-67b0b7c58875?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 88,
        "lat": 18.8538, "lng": -97.1010, "verificado": True,
    },
    {
        "nombre": "Centro Cultural Orizaba",
        "tipo": "cultura", "subtipo": "Centro cultural",
        "descripcion": "Espacio cultural con teatro, sala de exposiciones, biblioteca y auditorio para 300 personas. Programación mensual de conciertos, obras de teatro, cine arte y talleres para toda la familia.",
        "telefono": "272-724-6600",
        "horarios": "Lun–Dom 9:00–21:00",
        "direccion": "Calle Norte 4 No. 230, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 167,
        "lat": 18.8545, "lng": -97.1018, "verificado": True,
    },

    # ─── 🏖️ PLAYA & AGUA (adaptado a zona de ríos/cascadas) ──────────────
    {
        "nombre": "Cascadas de Tuxpango — Club de Río",
        "tipo": "playa", "subtipo": "Club de playa",
        "descripcion": "Balneario natural a orillas del Río Blanco con cascadas de 15 metros. Albercas naturales, zona de camping, tirolesa acuática, restaurante y renta de kayaks. Ideal para grupos familiares.",
        "telefono": "272-815-4400", "whatsapp": "522728154400",
        "horarios": "Lun–Dom 9:00–18:00",
        "direccion": "Tuxpango, Mpio. Ixtaczoquitlán (20 min de Orizaba)",
        "foto_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 298,
        "lat": 18.8234, "lng": -97.0654, "verificado": True,
    },
    {
        "nombre": "Laguna del Rodeo Kayak & SUP",
        "tipo": "playa", "subtipo": "Renta de equipo acuático",
        "descripcion": "Renta de kayaks, tablas de SUP y botes de remo en la Laguna del Rodeo. Clases de SUP para principiantes los fines de semana. Instructor certificado. Vistas al Pico de Orizaba.",
        "telefono": "272-198-7711", "whatsapp": "522721987711",
        "horarios": "Sáb y Dom 8:00–17:00",
        "direccion": "Laguna del Rodeo, Nogales, Ver. (25 min de Orizaba)",
        "foto_url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 54,
        "lat": 18.8012, "lng": -97.1321, "verificado": True,
    },
    {
        "nombre": "Pesca Deportiva Río Blanco",
        "tipo": "playa", "subtipo": "Pesca deportiva",
        "descripcion": "Tours de pesca deportiva en el Río Blanco. Especies: trucha arcoíris, carpa y bagre. Equipo completo, carnada y guía experto incluidos. Modalidad catch & release o para llevar.",
        "telefono": "272-724-9988", "whatsapp": "522727249988",
        "horarios": "Sáb y Dom desde las 6:00 (cita previa)",
        "direccion": "Orillas del Río Blanco, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=800&q=80",
        "calificacion_promedio": 4.4, "total_resenas": 39,
        "lat": 18.8498, "lng": -97.0988, "verificado": True,
    },

    # ─── 🌿 ECOTURISMO ─────────────────────────────────────────────────────
    {
        "nombre": "Rancho Ecoturístico Los Pinos",
        "tipo": "ecoturismo", "subtipo": "Rancho ecoturístico",
        "descripcion": "60 hectáreas de bosque de pino-oyamel a 2,600 msnm. Senderismo, observación de aves (más de 120 especies), cabañas rústicas, fogata y cocina de campo. A 40 min de Orizaba.",
        "telefono": "272-815-8877", "whatsapp": "522728158877",
        "horarios": "Lun–Dom 8:00–18:00 (hospedaje 24 hrs)",
        "direccion": "Carretera Orizaba–Ciudad Mendoza km 18",
        "foto_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 87,
        "lat": 18.8912, "lng": -97.1534, "verificado": True,
    },
    {
        "nombre": "Granja Agroturística El Naranjo",
        "tipo": "ecoturismo", "subtipo": "Granja agroturística",
        "descripcion": "Granja orgánica familiar con producción de naranja, mandarina, café y caña. Recorrido guiado, ordeña de vacas, elaboración de quesos y desayuno campestre. Niños bienvenidos.",
        "telefono": "272-198-4433", "whatsapp": "522721984433",
        "horarios": "Sáb y Dom 9:00–14:00 (grupos entre semana con reserva)",
        "direccion": "Camino a La Perla km 7, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 62,
        "lat": 18.8312, "lng": -97.0812, "verificado": True,
    },
    {
        "nombre": "Avistamiento de Aves Sierra de Zongolica",
        "tipo": "ecoturismo", "subtipo": "Centro de educación ambiental",
        "descripcion": "Tours especializados de birdwatching en la Sierra de Zongolica. Más de 200 especies registradas incluyendo el quetzal y el güilota. Ornitólogo certificado. Binoculares incluidos.",
        "telefono": "272-724-1199", "whatsapp": "522727241199",
        "horarios": "Sáb y Dom salida 5:30 AM",
        "direccion": "Sierra de Zongolica (salida desde Orizaba)",
        "foto_url": "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 41,
        "lat": 18.6734, "lng": -97.0234, "verificado": True,
    },

    # ─── 💆 BIENESTAR ──────────────────────────────────────────────────────
    {
        "nombre": "Spa Pico de Orizaba",
        "tipo": "bienestar", "subtipo": "Spa & masajes",
        "descripcion": "Spa de lujo con masajes relajantes, tratamientos faciales, envolturas de barro volcánico del Citlaltépetl y aromaterapia con plantas de la sierra veracruzana. Paquetes para parejas.",
        "telefono": "272-815-3355", "whatsapp": "522728153355",
        "horarios": "Lun–Dom 10:00–20:00 (cita previa recomendada)",
        "direccion": "Av. Oriente 4 No. 178, Col. Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
        "calificacion_promedio": 4.8, "total_resenas": 134,
        "lat": 18.8531, "lng": -97.1007, "verificado": True,
    },
    {
        "nombre": "Temazcal Ancestral Orizaba",
        "tipo": "bienestar", "subtipo": "Temazcal",
        "descripcion": "Ceremonia de temazcal tradicional con sabios nahuas de Zongolica. Ritual de purificación con plantas medicinales, cantos y copal. Máx. 10 personas. Sesiones sábados al atardecer.",
        "telefono": "272-198-6644", "whatsapp": "522721986644",
        "horarios": "Sáb 17:00–20:00 (reserva obligatoria)",
        "direccion": "Barrio de Ixhuatlancillo, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
        "calificacion_promedio": 5.0, "total_resenas": 28,
        "lat": 18.8412, "lng": -97.0834, "verificado": True,
    },
    {
        "nombre": "Retiro de Yoga Citlali",
        "tipo": "bienestar", "subtipo": "Retiro de yoga",
        "descripcion": "Clases de yoga y meditación con vista al Pico de Orizaba. Sesiones al amanecer en terraza panorámica, retiros de fin de semana y clases privadas. Instructora certificada en India.",
        "telefono": "272-724-7722", "whatsapp": "522727247722",
        "horarios": "Lun–Vie 7:00 y 18:00 / Sáb–Dom 7:30",
        "direccion": "Col. Estadio, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 76,
        "lat": 18.8556, "lng": -97.0998, "verificado": True,
    },

    # ─── 📚 EDUCACIÓN & TALLERES ───────────────────────────────────────────
    {
        "nombre": "Taller de Cocina Veracruzana",
        "tipo": "educacion", "subtipo": "Taller de cocina",
        "descripcion": "Aprende a preparar mole negro, arroz a la tumbada, huachinango a la veracruzana y enchiladas orizabeñas con la Chef Martha Ruiz. Clases de 3 hrs, materiales y comida incluidos.",
        "telefono": "272-815-5566", "whatsapp": "522728155566",
        "horarios": "Sáb 10:00–13:00 y Dom 11:00–14:00",
        "direccion": "Calle Sur 7 No. 210, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 93,
        "lat": 18.8523, "lng": -97.1012, "verificado": True,
    },
    {
        "nombre": "Taller de Cerámica Barro Negro",
        "tipo": "educacion", "subtipo": "Taller de cerámica",
        "descripcion": "Taller de cerámica con técnicas de barro negro oaxaqueño y talavera poblana adaptadas al estilo veracruzano. Cursos regulares y talleres express para turistas de 2 hrs.",
        "telefono": "272-198-3322", "whatsapp": "522721983322",
        "horarios": "Lun–Vie 10:00–19:00 / Sáb 10:00–14:00",
        "direccion": "Col. Carrizal No. 45, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 58,
        "lat": 18.8542, "lng": -97.1022, "verificado": True,
    },
    {
        "nombre": "Escuela de Chocolate Cacao Veracruz",
        "tipo": "educacion", "subtipo": "Taller de chocolate / café",
        "descripcion": "Del cacao al chocolate — taller inmersivo con cacao fino de aroma de Veracruz. Aprende a hacer tablillas artesanales, trufas y bebidas prehispánicas de xocolatl. Llevas tus creaciones.",
        "telefono": "272-724-8844", "whatsapp": "522727248844",
        "horarios": "Jue–Dom 11:00 y 15:00 (grupos de 6–15 personas)",
        "direccion": "Av. Poniente 4 No. 88, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80",
        "calificacion_promedio": 4.9, "total_resenas": 117,
        "lat": 18.8529, "lng": -97.1017, "verificado": True,
    },

    # ─── 🔧 SERVICIOS DE APOYO ─────────────────────────────────────────────
    {
        "nombre": "Agencia de Viajes Orizaba Tours",
        "tipo": "servicio", "subtipo": "Agencia de viajes local",
        "descripcion": "Agencia local especializada en turismo regional. Paquetes a Coatepec, Xalapa, Catemaco, Papantla y costa veracruzana. Boletos de avión, autobús y renta de autos. 20 años de experiencia.",
        "telefono": "272-724-2211", "whatsapp": "522727242211",
        "horarios": "Lun–Vie 9:00–18:00 / Sáb 9:00–14:00",
        "direccion": "Av. Colón No. 88, Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
        "calificacion_promedio": 4.5, "total_resenas": 189,
        "lat": 18.8532, "lng": -97.1009, "verificado": True,
    },
    {
        "nombre": "Coworking Hub Orizaba",
        "tipo": "servicio", "subtipo": "Internet / coworking",
        "descripcion": "Espacio de coworking moderno con internet fibra óptica 500 Mbps, salas de reuniones, impresora, café ilimitado y zona de descanso. Membresías diarias, semanales y mensuales.",
        "telefono": "272-198-5533", "whatsapp": "522721985533",
        "horarios": "Lun–Vie 8:00–21:00 / Sáb 9:00–17:00",
        "direccion": "Calle Norte 6 No. 312, Col. Centro, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        "calificacion_promedio": 4.6, "total_resenas": 44,
        "lat": 18.8548, "lng": -97.1003, "verificado": True,
    },
    {
        "nombre": "Renta de Equipo Outdoor Orizaba",
        "tipo": "servicio", "subtipo": "Renta de equipo outdoor",
        "descripcion": "Todo el equipo para tu aventura: tiendas de campaña, sleeping bags, mochilas, crampones, piolets, cascos y arneses. Equipo en perfecto estado. Precio por día o paquetes.",
        "telefono": "272-815-1177", "whatsapp": "522728151177",
        "horarios": "Lun–Dom 9:00–18:00",
        "direccion": "Av. Oriente 8 No. 154, Orizaba, Ver.",
        "foto_url": "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&q=80",
        "calificacion_promedio": 4.7, "total_resenas": 83,
        "lat": 18.8526, "lng": -97.1019, "verificado": True,
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
    print(f"✅ Municipio encontrado: {municipio['nombre']} (ID: {municipio_id})")

    # Evitar duplicados — borrar prestadores previos de Orizaba (seed)
    deleted = await db.prestadores.delete_many({"municipio_id": municipio_id})
    print(f"🗑️  Eliminados {deleted.deleted_count} prestadores anteriores de Orizaba")

    # Insertar todos
    docs = []
    for p in PRESTADORES_ORIZABA:
        doc = {
            **p,
            "id": str(uuid.uuid4()),
            "municipio_id": municipio_id,
            "municipio_nombre": municipio["nombre"],
            "activo": True,
            "user_id": None,
            "propuesto_por_id": None,
            "aprobado_por_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        docs.append(doc)

    await db.prestadores.insert_many(docs)
    print(f"🎉 ¡Insertados {len(docs)} prestadores para Orizaba!")

    # Resumen por tipo
    tipos = {}
    for p in PRESTADORES_ORIZABA:
        tipos[p["tipo"]] = tipos.get(p["tipo"], 0) + 1
    print("\n📊 Resumen por categoría:")
    emojis = {"hospedaje":"🏨","restaurante":"🍽️","guia":"🧭","transporte":"🚗","actividad":"⚡","comercio":"🏪","cultura":"🎭","playa":"🏖️","ecoturismo":"🌿","bienestar":"💆","educacion":"📚","servicio":"🔧"}
    for tipo, count in sorted(tipos.items()):
        print(f"  {emojis.get(tipo,'•')} {tipo}: {count}")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())