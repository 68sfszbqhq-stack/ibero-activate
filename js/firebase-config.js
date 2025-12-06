// Configuración de Firebase
// Usamos la sintaxis de compatibilidad para funcionar sin bundlers (Webpack/Vite)

const firebaseConfig = {
    apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4",
    authDomain: "pausas-activas-ibero-2026.firebaseapp.com",
    projectId: "pausas-activas-ibero-2026",
    storageBucket: "pausas-activas-ibero-2026.firebasestorage.app",
    messagingSenderId: "358840395060",
    appId: "1:358840395060:web:f66f2648af1f69584f7161",
    measurementId: "G-9NTXT0V9PZ"
};

// Inicializar Firebase solo si no se ha inicializado previamente
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportar globalmente para uso en otros scripts
const db = firebase.firestore();
const auth = firebase.auth();

// También asignar a window para asegurar acceso global
window.db = db;
window.auth = auth;

// Habilitar persistencia offline si es posible
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Persistencia fallida: Múltiples pestañas abiertas');
        } else if (err.code == 'unimplemented') {
            console.log('Persistencia no soportada por el navegador');
        }
    });

console.log("Firebase inicializado correctamente: " + firebaseConfig.projectId);
