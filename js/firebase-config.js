// ========================================
// FIREBASE CONFIGURATION (Compat Mode)
// ========================================

// Firebase Configuration
// TEMPORAL: API Key original (ya tiene APIs habilitadas)
// Mientras configuramos la nueva key con las APIs necesarias
const firebaseConfig = {
    apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4", // Original - funciona
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

// Storage (disponible si se activa Firebase Storage)
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

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
