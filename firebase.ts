import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU CONSOLA DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBUAhgZsHMb6dv40-f0Yg-Q6cAEz4ebsUY",                // Ejemplo: "AIzaSyD..."
  authDomain: "pos-restaurant-54706.firebaseapp.com",        // Ejemplo: "mi-pos.firebaseapp.com"
  projectId: "pos-restaurant-54706",          // Ejemplo: "mi-pos"
  storageBucket: "pos-restaurant-54706.firebasestorage.app",  // Ejemplo: "mi-pos.appspot.com"
  messagingSenderId: "275425443678",   // Ejemplo: "123456..."
  appId: "1:275425443678:web:70743ec9f698c3c1ebd9cf"                   // Ejemplo: "1:1234:web:..."
};

// Inicializamos la app con los valores directos para asegurar que no fallen
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);