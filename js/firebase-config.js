// ========================================
// FIREBASE CONFIGURATION (Compat Mode)
// ========================================
// IMPORTANTE: Este archivo ahora contiene las credenciales directamente
// Para mayor seguridad en el futuro, considera usar variables de entorno

// Firebase Configuration
// API Key original - funcional con todas las APIs habilitadas
const firebaseConfig = {
    apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4",
    authDomain: "pausas-activas-ibero-2026.firebaseapp.com",
    projectId: "pausas-activas-ibero-2026",
    storageBucket: "pausas-activas-ibero-2026.firebasestorage.app",
    messagingSenderId: "358840395060",
    appId: "1:358840395060:web:470d2d4a79db1d8a4f7161",
    measurementId: "G-G8G45P6SSH"
};

// ========================================
// INITIALIZE FIREBASE (Compat)
// ========================================
firebase.initializeApp(firebaseConfig);

// Firestore
const db = firebase.firestore();

// Authentication
const auth = firebase.auth();

// ========================================
// SEGURIDAD: RESTRICCIONES RECOMENDADAS
// ========================================
// 🔒 ANTES DE HACER PÚBLICO ESTE REPOSITORIO:
//
// 1. Ve a Google Cloud Console:
//    https://console.cloud.google.com/
//
// 2. Navega a: APIs y servicios → Credenciales
//
// 3. Selecciona la API key y configura:
//
//    Application restrictions:
//      • HTTP referrers (web sites)
//      • Agregar dominios autorizados:
//        - https://tu-dominio.com/*
//        - http://localhost:*
//        - http://127.0.0.1:*
//
//    API restrictions:
//      • Restrict key
//      • APIs permitidas:
//        ✓ Cloud Firestore API
//        ✓ Identity Toolkit API
//        ✓ Token Service API
//
// 4. Firestore Rules también protegen tu base de datos
//    (Ya actualizadas con control de acceso por roles)
//
// ========================================
// NOTAS ADICIONALES
// ========================================
// ⚠️  La API key de Firebase para apps web NO es secreta
//     (Es normal que esté en el código del cliente)
// 
// 🔒  La VERDADERA seguridad viene de:
//     - Restricciones de dominio en Google Cloud
//     - Firestore Security Rules (ya implementadas)
//     - Firebase Authentication
//
// 📘  Más info:
//     https://firebase.google.com/docs/projects/api-keys
