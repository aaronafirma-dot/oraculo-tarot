// src/firebase/config.js
// ─────────────────────────────────────────────────────────────
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo → "Oráculo Tarot"
// 3. Agrega una app Web
// 4. Copia los valores de firebaseConfig aquí abajo
// 5. En Firebase Console → Authentication → Sign-in method → activa Google
// 6. En Firebase Console → Firestore Database → crea base de datos en modo producción
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJe1ZEBJVFkV4pQ6CnAy04uBnr39uA5gc",
  authDomain: "tarot-app-3b0ed.firebaseapp.com",
  projectId: "tarot-app-3b0ed",
  storageBucket: "tarot-app-3b0ed.firebasestorage.app",
  messagingSenderId: "498054617246",
  appId: "1:498054617246:web:f6014b72381ad0cb2dc38f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
