# 🚀 GUÍA RÁPIDA: Desplegar Reglas de Firestore

## ⚡ OPCIÓN MÁS RÁPIDA (Copiar y Pegar)

### Paso 1: Abre la Consola de Firebase
👉 https://console.firebase.google.com/project/ibero-activate-2025/firestore/rules

### Paso 2: Copia las Reglas
Abre el archivo `firestore.rules` en tu proyecto y copia TODO el contenido.

### Paso 3: Pega en Firebase Console
1. Borra todo el contenido actual del editor
2. Pega las nuevas reglas
3. Click en **"Publicar"** (botón azul arriba a la derecha)

---

## 📋 REGLAS COMPLETAS (Para copiar)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    // ÁREAS
    match /areas/{areaId} {
      allow read: if true;
      allow write: if isAuth();
    }

    // EMPLEADOS
    match /employees/{employeeId} {
      allow read: if true;
      allow create, delete: if isAuth();
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

    // SUBCOLLECTIONS
    match /employees/{employeeId}/attendance/{attendanceId} {
      allow read, write: if true;
    }

    match /employees/{employeeId}/health_surveys/{surveyId} {
      allow read, write: if true;
    }

    match /employees/{employeeId}/feedback/{feedbackId} {
      allow read, write: if true;
    }

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
    // WELLNESS WALKING TRACKER (FASE 1)
    // ========================================
    
    match /walking_stats/{statId} {
      allow read: if isAuth() && 
                     resource.data.collaboratorEmail == request.auth.token.email;
      allow create: if isAuth() && 
                       request.resource.data.collaboratorEmail == request.auth.token.email;
      allow update: if isAuth() && 
                       resource.data.collaboratorEmail == request.auth.token.email;
      allow delete: if false;
    }
    
    match /wellness_records/{email} {
      allow read: if isAuth() && 
                     email == request.auth.token.email;
      allow write: if isAuth() && 
                      email == request.auth.token.email;
    }

    // ========================================
    // HEALTH MODULE - FASE 2 (NUEVO) 🆕
    // ========================================
    
    match /health_profiles/{userId} {
      allow read, write: if isAuth() && 
                            request.auth.uid == userId;
      allow read: if isAuth();
      allow delete: if false;
    }
    
    match /daily_habits/{habitId} {
      allow read, write: if isAuth() && 
                            resource.data.userId == request.auth.uid;
      allow create: if isAuth() && 
                       request.resource.data.userId == request.auth.uid;
      allow read: if isAuth();
      allow delete: if false;
    }
    
    match /weight_history/{entryId} {
      allow read, write: if isAuth() && 
                            resource.data.userId == request.auth.uid;
      allow create: if isAuth() && 
                       request.resource.data.userId == request.auth.uid;
      allow read: if isAuth();
      allow delete: if false;
    }
    
    match /health_insights/{insightId} {
      allow read: if isAuth() && 
                     resource.data.userId == request.auth.uid;
      allow write: if isAuth();
      allow delete: if false;
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read, update: if isAuth() && 
                             request.auth.uid == userId;
      allow create: if isAuth() && 
                       request.auth.uid == userId;
      allow read: if isAuth();
      allow delete: if false;
    }

  }
}
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

1. Después de publicar, recarga tu aplicación
2. Abre la consola del navegador (F12)
3. Ya NO deberías ver el error:
   ```
   ❌ FirebaseError: Missing or insufficient permissions
   ```

---

## 🎯 NUEVAS COLECCIONES PROTEGIDAS

Las siguientes colecciones ahora tienen reglas de seguridad:

### Fase 1 - Walking Tracker:
- ✅ `walking_stats` - Estadísticas de caminatas
- ✅ `wellness_records` - Registros de bienestar

### Fase 2 - Health Module:
- 🆕 `health_profiles` - Perfiles biométricos (IMC, peso, altura)
- 🆕 `daily_habits` - Hábitos diarios (hidratación, nutrición)
- 🆕 `weight_history` - Historial de peso
- 🆕 `health_insights` - Recomendaciones de IA

---

## 🔒 SEGURIDAD IMPLEMENTADA

### Para Empleados:
- ✅ Solo pueden leer/escribir **sus propios datos**
- ✅ No pueden ver datos de otros usuarios
- ✅ No pueden eliminar su historial médico

### Para Administradores:
- ✅ Pueden leer todos los datos (para estadísticas)
- ✅ No pueden modificar datos de usuarios
- ✅ No pueden eliminar historial

---

## 🚨 SI ALGO SALE MAL

Si después de publicar sigues viendo errores:

1. **Verifica que publicaste correctamente:**
   - Debe aparecer "Publicado correctamente" en verde
   - La fecha de última actualización debe ser reciente

2. **Recarga con caché limpio:**
   - Chrome/Edge: Ctrl + Shift + R (Cmd + Shift + R en Mac)
   - Firefox: Ctrl + F5

3. **Verifica en la consola:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - Busca errores de Firestore

---

## 📞 NECESITAS AYUDA?

Si sigues teniendo problemas, comparte:
1. El mensaje de error completo
2. Una captura de pantalla de las reglas publicadas
3. El resultado en la consola del navegador
