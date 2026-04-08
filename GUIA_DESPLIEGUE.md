# Guía de despliegue — Veracruz Contigo
## De Emergent → GitHub + Railway + Vercel

---

## Estructura final de tu repositorio

```
veracruz-contigo/          ← carpeta raíz del repo
├── backend/
│   ├── server.py          ← ya modificado (sin Emergent)
│   ├── requirements.txt   ← ya actualizado
│   ├── railway.json       ← config para Railway
│   ├── Procfile           ← comando de arranque
│   ├── .env.example       ← plantilla de variables (SÍ sube esto)
│   └── .env               ← NO subir (está en .gitignore)
├── frontend/
│   ├── src/               ← tu código React
│   ├── package.json
│   ├── craco.config.js    ← limpio (sin visual-edits de Emergent)
│   ├── vercel.json        ← config para Vercel
│   ├── .env.example       ← plantilla (SÍ sube)
│   └── .env               ← NO subir (está en .gitignore)
├── .gitignore             ← ya configurado
└── README.md
```

---

## PASO 1 — Crear cuentas gratuitas (10 min)

### MongoDB Atlas (base de datos)
1. Ve a https://mongodb.com/atlas → "Try Free"
2. Crea un cluster **M0 Free**
3. Crea un usuario de base de datos (guarda user y password)
4. En "Network Access" → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
5. Copia el **Connection String**: `mongodb+srv://user:pass@cluster.mongodb.net/veracruz`

### Cloudinary (imágenes)
1. Ve a https://cloudinary.com → "Sign Up Free"
2. En el Dashboard copia:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Google Cloud Console (login con Google)
1. Ve a https://console.cloud.google.com
2. Crea un proyecto nuevo → "APIs & Services" → "Credentials"
3. "Create Credentials" → "OAuth 2.0 Client ID" → Web application
4. En "Authorized JavaScript origins" agrega:
   - `http://localhost:3000`
   - `https://tu-app.vercel.app`
5. Copia el **Client ID** (termina en `.apps.googleusercontent.com`)

### Anthropic (chatbot VeraCruz AI)
1. Ve a https://console.anthropic.com
2. "API Keys" → "Create Key"
3. Copia la key (empieza con `sk-ant-...`)

---

## PASO 2 — Subir a GitHub (5 min)

```bash
# En tu computadora, dentro de la carpeta del proyecto:
git init
git add .
git commit -m "Veracruz Contigo - migrado de Emergent a producción"

# Crea un repo en github.com (botón "+") luego:
git remote add origin https://github.com/TU_USUARIO/veracruz-contigo.git
git branch -M main
git push -u origin main
```

---

## PASO 3 — Desplegar el Backend en Railway (5 min)

1. Ve a https://railway.app → "Start a New Project"
2. "Deploy from GitHub repo" → selecciona `veracruz-contigo`
3. Railway detecta la carpeta `/backend` → configura el **Root Directory** como `backend`
4. En la pestaña **Variables**, agrega estas variables de entorno:

```
MONGO_URL           = mongodb+srv://user:pass@cluster.mongodb.net/veracruz
DB_NAME             = veracruz_contigo
JWT_SECRET          = (genera una cadena aleatoria larga)
CORS_ORIGINS        = https://tu-app.vercel.app
ADMIN_EMAIL         = admin@tudominio.com
ADMIN_PASSWORD      = (contraseña segura)
ANTHROPIC_API_KEY   = sk-ant-...
CLOUDINARY_CLOUD_NAME = tu_cloud_name
CLOUDINARY_API_KEY  = tu_api_key
CLOUDINARY_API_SECRET = tu_api_secret
GOOGLE_CLIENT_ID    = xxxx.apps.googleusercontent.com
```

5. Railway te da una URL tipo: `https://veracruz-contigo-production.up.railway.app`
6. Verifica que funciona: abre `https://TU-URL.up.railway.app/api/health`
   Debes ver: `{"status":"healthy"}`

---

## PASO 4 — Desplegar el Frontend en Vercel (5 min)

1. Ve a https://vercel.com → "Add New Project"
2. Importa tu repo de GitHub `veracruz-contigo`
3. Configura:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. En **Environment Variables** agrega:

```
REACT_APP_BACKEND_URL       = https://TU-URL.up.railway.app
REACT_APP_GOOGLE_CLIENT_ID  = xxxx.apps.googleusercontent.com
```

5. Click "Deploy" — en 2-3 minutos tienes tu URL: `https://veracruz-contigo.vercel.app`

---

## PASO 5 — Actualizar CORS en Railway

Cuando tengas la URL de Vercel, vuelve a Railway y actualiza:
```
CORS_ORIGINS = https://veracruz-contigo.vercel.app
```

También regresa a Google Cloud Console y agrega la URL de Vercel a los "Authorized JavaScript origins".

---

## Verificación final

- [ ] `https://TU-BACKEND.up.railway.app/api/health` → `{"status":"healthy"}`
- [ ] `https://TU-FRONTEND.vercel.app` → carga la app
- [ ] Login con Google funciona
- [ ] El chatbot VeraCruz AI responde
- [ ] Se pueden subir imágenes

---

## Costos mensuales (todo en tier gratuito)

| Servicio | Plan | Límite gratis |
|---|---|---|
| Vercel | Hobby | 100GB bandwidth |
| Railway | Starter | $5 crédito/mes |
| MongoDB Atlas | M0 | 512MB |
| Cloudinary | Free | 25GB storage |
| Anthropic | Pay-per-use | ~$0.001 por mensaje |

**Total fijo: $0/mes** (solo pagas lo que uses en Anthropic)
