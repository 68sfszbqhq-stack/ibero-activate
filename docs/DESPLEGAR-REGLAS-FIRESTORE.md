# 🔥 Desplegar Reglas de Firestore Manualmente

## ⚠️ IMPORTANTE: Último Paso Requerido

El código ya está en GitHub, pero necesitas **desplegar las reglas de Firestore** para que el sistema funcione correctamente.

---

## 📋 Opción 1: Desde Firebase Console (Recomendado - 2 minutos)

### Paso 1: Abrir Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **"pausas-activas-ibero-2026"**
3. En el menú lateral, haz clic en **"Firestore Database"**
4. Haz clic en la pestaña **"Reglas"** (Rules)

### Paso 2: Copiar las Nuevas Reglas

Abre el archivo `/firestore.rules` de tu proyecto y copia **TODO el contenido**.

O copia directamente desde aquí:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // FUNCIÓN SIMPLE Y RÁPIDA
    // ========================================
    
    function isAuth() {
      return request.auth != null;
    }

    // ========================================
    // REGLAS OPTIMIZADAS PARA VELOCIDAD
    // ========================================

    // ÁREAS
    match /areas/{areaId} {
      allow read: if true;
      allow write: if isAuth();
    }

    // EMPLEADOS - REGLA SIMPLE Y RÁPIDA
    match /employees/{employeeId} {
      allow read: if true;
      allow create, delete: if isAuth();
      // MODIFICADO: Permitir actualización de puntos para Feedback
      allow update: if true;
    }

    // ASISTENCIAS
    match /attendances/{attendanceId} {
      allow read, write: if true;
    }

    // FEEDBACKS
    match /feedbacks/{feedbackId} {
      allow read: if isAuth();
      allow create, update, delete: if true;
    }

    // WELLNESS TESTS
    match /wellness_tests/{testId} {
      allow read, write: if true;
    }

    // WELLNESS DATA
    match /wellness_data/{docId} {
      allow read, write: if true;
    }

    // CRISIS ALERTS
    match /crisis_alerts/{docId} {
      allow create: if true;
      allow read, update, delete: if isAuth();
    }

    // ACTIVIDADES
    match /activities/{activityId} {
      allow read: if true;
      allow write: if isAuth();
    }

    match /weekly_schedules/{weekId} {
      allow read: if true;
      allow write: if isAuth();
    }

    match /activity_ratings/{ratingId} {
      allow read, write: if true;
    }

    // PERIODIZACIÓN
    match /program_periodization/{document=**} {
      allow read: if isAuth();
      allow write: if isAuth();
    }

    // ========================================
    // SUBCOLLECTIONS - SIMPLIFICADAS
    // ========================================

    match /employees/{employeeId}/attendance/{attendanceId} {
      allow read, write: if true;
    }

    match /employees/{employeeId}/health_surveys/{surveyId} {
      allow read, write: if true;
    }

    match /employees/{employeeId}/feedback/{feedbackId} {
      allow read, write: if true;
    }

    // ANTIGRAVITY WELLNESS MODULE (NUEVO)
    match /employees/{employeeId}/wheel_of_life/{wheelId} {
      allow read, write: if true;
    }

    match /employees/{employeeId}/daily_diary/{diaryId} {
      allow read, write: if true;
    }

    // COLLECTION GROUP QUERIES
    match /{path=**}/attendance/{attendanceId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /{path=**}/feedback/{feedbackId} {
      allow read: if isAuth();
      allow write: if false;
    }

    // ========================================
    // WELLNESS WALKING TRACKER (NUEVO)
    // ========================================
    
    // Estadísticas de caminatas
    match /walking_stats/{statId} {
      // Permitir lectura solo al dueño de los datos
      allow read: if isAuth() && 
                     resource.data.collaboratorEmail == request.auth.token.email;
      
      // Permitir escritura solo al dueño
      allow create: if isAuth() && 
                       request.resource.data.collaboratorEmail == request.auth.token.email;
      
      // Permitir actualización solo al dueño
      allow update: if isAuth() && 
                       resource.data.collaboratorEmail == request.auth.token.email;
      
      // No permitir eliminación (mantener historial)
      allow delete: if false;
    }
    
    // Registros de bienestar (resumen por usuario)
    match /wellness_records/{email} {
      // Permitir lectura solo al dueño
      allow read: if isAuth() && 
                     email == request.auth.token.email;
      
      // Permitir escritura solo al dueño
      allow write: if isAuth() && 
                      email == request.auth.token.email;
    }

  }
}
```

### Paso 3: Pegar y Publicar

1. **Pega** el contenido completo en el editor de reglas de Firebase Console
2. Haz clic en **"Publicar"** (Publish)
3. Confirma la acción

### Paso 4: Verificar

Deberías ver un mensaje: **"✓ Reglas publicadas correctamente"**

---

## 📋 Opción 2: Desde Terminal (Si instalas Firebase CLI)

### Instalar Firebase CLI

```bash
# Con permisos de administrador
sudo npm install -g firebase-tools
```

### Iniciar Sesión

```bash
firebase login
```

### Desplegar Reglas

```bash
cd "/Users/josemendoza/proyecto ibero 2026"
firebase deploy --only firestore:rules
```

---

## ✅ Verificación

Una vez desplegadas las reglas, verifica que todo funcione:

### 1. Probar el Portal

1. Ve a: https://68sfszbqhq-stack.github.io/ibero-activate/
2. Inicia sesión
3. Haz clic en **"Mis Caminatas"**
4. Deberías ver el portal sin errores

### 2. Generar Datos de Prueba

1. Ve a: https://68sfszbqhq-stack.github.io/ibero-activate/scripts/init-walking-data.html
2. Haz clic en **"Generar Datos de Prueba"**
3. Espera a que termine
4. Regresa al portal de caminatas
5. Deberías ver tus datos

### 3. Verificar en Firebase Console

1. Ve a Firestore Database
2. Deberías ver las colecciones:
   - `walking_stats` (con tus sesiones)
   - `wellness_records` (con tu resumen)

---

## ❓ Solución de Problemas

### Error: "Missing or insufficient permissions"

**Causa:** Las reglas no se han desplegado correctamente.

**Solución:**
1. Verifica que copiaste **TODO** el contenido del archivo `firestore.rules`
2. Asegúrate de hacer clic en **"Publicar"**
3. Espera unos segundos y recarga la página

### Error: "Document not found"

**Causa:** No hay datos todavía.

**Solución:**
1. Genera datos de prueba con `scripts/init-walking-data.html`
2. O ingresa pasos manualmente en el portal

### No puedo ver mis datos

**Causa:** Las reglas de seguridad están funcionando correctamente (solo ves tus propios datos).

**Solución:**
1. Verifica que estás autenticado con el mismo email
2. Genera datos de prueba para tu usuario

---

## 🎉 ¡Listo!

Una vez desplegadas las reglas, el sistema estará **100% funcional**.

### Próximos Pasos

1. ✅ Reglas desplegadas
2. ✅ Código en GitHub
3. ⏳ Probar el portal
4. ⏳ Generar datos de prueba
5. ⏳ Comunicar a colaboradores

---

## 📞 Soporte

Si tienes problemas:
- Revisa la consola del navegador (F12)
- Verifica Firebase Console > Firestore Database > Reglas
- Consulta: `WELLNESS-WALKING-SETUP.md`

---

**Última actualización:** 20 de enero de 2026  
**Estado:** ⏳ Pendiente de despliegue de reglas
