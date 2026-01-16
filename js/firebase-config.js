// ========================================
// FIREBASE CONFIGURATION (Compat Mode)
// ========================================

// Firebase Configuration
// Nueva API Key sin restricciones - creada 2026-01-16
const firebaseConfig = {
    apiKey: "PEGA_AQUI_TU_NUEVA_API_KEY", // ← CAMBIA ESTO
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
// 1. Esta key NO tiene restricciones (para que funcione YA)
// 2. Después puedes agregar restricciones en Google Cloud Console
// 3. Firestore Rules protegen la base de datos
// 4. Firebase Auth protege la autenticación

// ========================================
// NOTAS ADICIONALES
// ========================================
// ⚠️  La API key de Firebase para apps web NO es secreta
//     (Es normal que esté en el código del cliente)
// 
// 🔒  La VERDADERA seguridad viene de:
//     - Firestore Security Rules (ya implementadas)
//     - Firebase Authentication
//     - API restrictions (opcional, pueden agregarse después)
