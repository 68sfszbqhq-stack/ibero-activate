// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
//
// ℹ️  SOBRE LA API KEY EN CÓDIGO PÚBLICO:
//
//    Para apps web de Firebase, la apiKey es un IDENTIFICADOR
//    PÚBLICO que NO es un secreto. Firebase lo diseñó así.
//    Ver: https://firebase.google.com/docs/projects/api-keys
//
// 🔒  CAPAS DE SEGURIDAD IMPLEMENTADAS:
//
//    1. HTTP Referrer Restrictions (Google Cloud Console)
//       → La key solo funciona desde dominios autorizados
//       → Configuradas en: console.cloud.google.com/apis/credentials
//
//    2. Firestore Security Rules (firestore.rules)
//       → Roles: isAdmin() / isV2Employee() / isOwner()
//       → Empleados V2 solo leen sus propios datos
//       → Solo admins escriben sesiones, fotos y asistencia
//
//    3. Firebase Authentication
//       → Toda operación requiere usuario autenticado
//       → Login admin: email/pass del proyecto Pausas Activas
//       → Login empleado V2: nombre + número del correo
//
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4",
    authDomain: "pausas-activas-ibero-2026.firebaseapp.com",
    projectId: "pausas-activas-ibero-2026",
    storageBucket: "pausas-activas-ibero-2026.firebasestorage.app",
    messagingSenderId: "358840395060",
    appId: "1:358840395060:web:470d2d4a79db1d8a4f7161",
    measurementId: "G-G8G45P6SSH"
};

// ── Inicialización ──────────────────────────────────────────
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
