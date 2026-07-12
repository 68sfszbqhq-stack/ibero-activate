# 🏃 Sistema de Seguimiento de Caminatas - IBERO ACTÍVATE

## 📋 Descripción General

Este módulo implementa un sistema de seguimiento de caminatas basado en **evidencia científica**, diseñado para promover la salud cardiovascular de los colaboradores de la Universidad Iberoamericana.

### 🎯 Objetivos Basados en Investigación

- **Meta Diaria:** 7,000 pasos (reducción óptima de mortalidad del 50-70%)
- **Sesiones Continuas:** 15+ minutos de caminata continua (beneficio cardiovascular adicional)
- **Frecuencia Semanal:** 5 sesiones por semana (recomendación científica)

---

## 🗄️ Estructura de Base de Datos

### Colección: `walking_stats`

Cada documento representa una sesión de caminata:

```javascript
{
  collaboratorEmail: "usuario@ibero.mx",
  date: "2026-01-20",
  timestamp: ServerTimestamp,
  metrics: {
    steps: 7450,
    distance_km: 5.96,
    calories: 210,
    duration_mins: 18,
    intensity: "brisk_walking"
  },
  physiological: {
    avg_heart_rate: 105,
    max_heart_rate: 125
  },
  source: "GoogleFit",  // "GoogleFit", "AppleHealth_Manual", "Manual"
  is_continuous: true,  // true si duration_mins >= 15
  meets_goal: true      // true si steps >= 7000
}
```

### Colección: `wellness_records` (Actualizada)

Resumen agregado por usuario:

```javascript
{
  email: "usuario@ibero.mx",
  last_sync: Timestamp,
  daily_stats: {
    "2026-01-20": {
      steps: 7450,
      continuous_walk_minutes: 18,
      calories: 210,
      distance_km: 5.96,
      heart_rate_avg: 105,
      source: "GoogleFit",
      is_continuous: true,
      meets_goal: true
    }
  },
  badges: ["7k_club", "continuous_walker", "pioneer"]
}
```

---

## 🔧 Configuración de Google Fit API

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "IBERO-Activate-Wellness"

### Paso 2: Habilitar Google Fitness API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Fitness API"
3. Haz clic en **Enable**

### Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Tipo de aplicación: **Web application**
4. Nombre: "IBERO Activate Web Client"
5. **Authorized JavaScript origins:**
   ```
   https://68sfszbqhq-stack.github.io
   http://localhost:5500
   ```
6. **Authorized redirect URIs:**
   ```
   https://68sfszbqhq-stack.github.io/ibero-activate/employee/wellness-walking.html
   http://localhost:5500/employee/wellness-walking.html
   ```
7. Haz clic en **Create**
8. **Copia el Client ID** que se genera

### Paso 4: Configurar en el Código

Edita el archivo `/js/walking-tracker.js`:

```javascript
const GOOGLE_FIT_CONFIG = {
    clientId: 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
};
```

### Paso 5: Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Tipo de usuario: **External**
3. Información de la aplicación:
   - **App name:** IBERO ACTÍVATE
   - **User support email:** tu-email@ibero.mx
   - **Developer contact:** tu-email@ibero.mx
4. Scopes: Agrega `https://www.googleapis.com/auth/fitness.activity.read`
5. Test users: Agrega los emails de los colaboradores que probarán el sistema

---

## 🔒 Reglas de Seguridad de Firestore

Agrega estas reglas a tu archivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Colección de estadísticas de caminatas
    match /walking_stats/{statId} {
      // Permitir lectura solo al dueño de los datos
      allow read: if request.auth != null && 
                     resource.data.collaboratorEmail == request.auth.token.email;
      
      // Permitir escritura solo al dueño
      allow create: if request.auth != null && 
                       request.resource.data.collaboratorEmail == request.auth.token.email;
      
      // Permitir actualización solo al dueño
      allow update: if request.auth != null && 
                       resource.data.collaboratorEmail == request.auth.token.email;
      
      // No permitir eliminación (mantener historial)
      allow delete: if false;
    }
    
    // Colección de registros de bienestar (actualizada)
    match /wellness_records/{email} {
      // Permitir lectura solo al dueño
      allow read: if request.auth != null && 
                     email == request.auth.token.email;
      
      // Permitir escritura solo al dueño
      allow write: if request.auth != null && 
                      email == request.auth.token.email;
    }
  }
}
```

---

## 📱 Uso del Sistema

### Para Usuarios Android (Google Fit)

1. El usuario hace clic en **"Sincronizar"** > **"Google Fit"**
2. Se abre ventana de autorización de Google
3. El usuario acepta los permisos
4. Los pasos se sincronizan automáticamente

### Para Usuarios iOS (Apple Health)

1. El usuario hace clic en **"Sincronizar"** > **"Apple Health (Manual)"**
2. Se muestra un formulario
3. El usuario abre la app "Salud" en su iPhone
4. Copia el número de pasos del día
5. Ingresa los pasos en el formulario
6. Opcionalmente marca si caminó 15+ minutos continuos
7. Guarda los datos

---

## 🎮 Sistema de Gamificación

### Badges Disponibles

| Badge | Icono | Criterio |
|-------|-------|----------|
| **Club 7K** | 🏆 | Alcanzar 7,000 pasos en un día |
| **Caminante Continuo** | ⚡ | Caminar 15+ minutos sin parar |
| **Pionero** | 🌟 | Ser de los primeros en usar el sistema |
| **Guerrero Semanal** | 💪 | Cumplir meta 5 días en una semana |
| **Maestro Mensual** | 👑 | Cumplir meta 20 días en un mes |

---

## 📊 Métricas Calculadas

### Distancia (km)
```javascript
distancia = pasos / 1250
// Promedio: 1 km ≈ 1,250 pasos
```

### Calorías
```javascript
calorías_base = pasos × 0.04
// Si es caminata continua (15+ min):
calorías_total = calorías_base × 1.2
```

### Progreso hacia Meta
```javascript
porcentaje = (pasos_actuales / 7000) × 100
```

---

## 🔄 Sincronización y Persistencia

- **Sincronización automática:** Cada 5 minutos cuando la página está activa
- **Persistencia offline:** Firestore mantiene caché local
- **Actualización en tiempo real:** Cambios se reflejan inmediatamente

---

## 🚀 Despliegue

### Archivos Creados

```
/js/walking-tracker.js          # Lógica principal
/js/wellness-walking-ui.js      # Interacciones de UI
/css/wellness-walking.css       # Estilos
/employee/wellness-walking.html # Interfaz de usuario
```

### Integración con Sidebar

Agrega este enlace al sidebar de empleados:

```html
<a href="wellness-walking.html" class="sidebar-link">
    <i class="fas fa-walking"></i>
    <span>Mis Caminatas</span>
</a>
```

---

## 📚 Referencias Científicas

1. **Meta de 7,000 pasos:**
   - Reducción de mortalidad del 50-70%
   - Óptimo para salud cardiovascular

2. **Caminatas continuas de 15+ minutos:**
   - Beneficio cardiovascular adicional
   - Reducción de mortalidad a <1%

3. **Frecuencia semanal:**
   - 5 sesiones por semana
   - Mejora sostenida de la salud

---

## 🛠️ Mantenimiento

### Monitoreo de Uso

Consulta Firebase Console para ver:
- Número de sesiones registradas
- Usuarios activos
- Promedio de pasos por área

### Actualización de Metas

Para cambiar la meta de pasos, edita en `/js/walking-tracker.js`:

```javascript
const WALKING_GOALS = {
    DAILY_STEPS: 7000,  // Cambiar aquí
    CONTINUOUS_MINUTES: 15,
    WEEKLY_SESSIONS: 5
};
```

---

## ❓ Solución de Problemas

### Google Fit no se conecta

1. Verifica que el Client ID esté correctamente configurado
2. Asegúrate de que la URL esté en "Authorized JavaScript origins"
3. Revisa la consola del navegador para errores

### Los datos no se guardan

1. Verifica las reglas de Firestore
2. Confirma que el usuario esté autenticado
3. Revisa la consola de Firebase para errores

### Los badges no aparecen

1. Verifica que el usuario haya cumplido los criterios
2. Revisa la estructura de datos en `wellness_records`
3. Limpia caché del navegador

---

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo de IBERO ACTÍVATE.

---

**Última actualización:** 20 de enero de 2026
**Versión:** 1.0.0
**Autor:** Equipo IBERO ACTÍVATE
