# 🔮 Oráculo del Tarot

App de tarot con IA, login con Google, contador de preguntas en Firestore y pagos vía PayPal.

---

## 📁 Estructura del proyecto

```
oraculo-tarot/
├── api/
│   ├── tarot.js          ← Proxy Anthropic (resuelve CORS)
│   └── historial.js      ← Guarda en Google Sheets vía n8n
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   └── config.js     ← Configuración Firebase
│   ├── App.js            ← App principal
│   └── index.js
├── package.json
├── vercel.json
└── README.md
```

---

## 🔧 PASO 1 — Configurar Firebase

1. Ve a https://console.firebase.google.com
2. Crea proyecto → **"Oráculo Tarot"**
3. Agrega app **Web** → copia el firebaseConfig
4. Pega los valores en `src/firebase/config.js`
5. En Firebase Console → **Authentication** → Sign-in method → activa **Google**
6. En Firebase Console → **Firestore Database** → crea base de datos en **modo producción**
7. En Firestore → Reglas → pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔧 PASO 2 — Instalar dependencias localmente

```bash
cd oraculo-tarot
npm install
npm start
```

La app abre en http://localhost:3000

---

## 🔧 PASO 3 — Subir a Vercel

1. Ve a https://github.com y crea cuenta
2. Crea repositorio nuevo → **"oraculo-tarot"**
3. Sube los archivos del proyecto
4. Ve a https://vercel.com → Import Project → selecciona el repo
5. En Vercel → Settings → **Environment Variables** → agrega:

```
ANTHROPIC_API_KEY = sk-ant-... (tu API key de Anthropic)
```

6. Deploy → ¡listo!

---

## 🔧 PASO 4 — Obtener API Key de Anthropic

1. Ve a https://console.anthropic.com
2. API Keys → Create Key
3. Copia la key y agrégala en Vercel (paso anterior)

---

## ✅ Cómo funciona el sistema

| Componente | Tecnología | Propósito |
|---|---|---|
| Frontend | React | Interfaz de usuario |
| Login | Firebase Auth + Google | Identificar usuarios |
| Contador | Firestore | Persistir preguntas (no hackeable) |
| IA | Anthropic Claude | Interpretación de cartas |
| Proxy | Vercel Functions | Evitar CORS |
| Historial | n8n → Google Sheets | Registro de consultas |
| Pagos | PayPal | $50 MXN por 5 consultas |

---

## 💰 Modelo de negocio

- **1 consulta gratis** para todos los usuarios nuevos
- **$50 MXN** desbloquea 5 consultas adicionales
- El contador vive en Firestore (servidor) — **no se puede hacer trampa**
- PayPal acepta tarjetas de todo el mundo

---

## 🚀 Variables de entorno necesarias en Vercel

```
ANTHROPIC_API_KEY=sk-ant-TU_KEY_AQUI
```

Firebase va directamente en `src/firebase/config.js` (no necesita variables de entorno).
