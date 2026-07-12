# 🔥 SOLUCIÓN: Error de Permisos en Firestore

## ❌ PROBLEMA

```
FirebaseError: Missing or insufficient permissions.
```

Este error significa que las **reglas de seguridad de Firestore** no están desplegadas o no permiten el acceso.

---

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Usar el Script Automático

```bash
# Desde la carpeta del proyecto
./deploy-firestore-rules.sh
```

### Opción 2: Manual con Firebase CLI

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Login a Firebase
firebase login

# 3. Inicializar (solo la primera vez)
firebase init firestore

# 4. Desplegar reglas
firebase deploy --only firestore:rules
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

1. Ve a la consola de Firebase:
   https://console.firebase.google.com/project/ibero-activate-2025/firestore/rules

2. Deberías ver las reglas actualizadas con las nuevas colecciones:
   - `health_profiles`
   - `daily_habits`
   - `weight_history`

---

## 📋 REGLAS QUE SE DESPLEGARÁN

Las reglas en `/firestore.rules` incluyen:

### Para Empleados:
```javascript
// Perfiles de salud
match /health_profiles/{userId} {
  allow read, write: if request.auth.uid == userId;
  allow read: if isAdmin() || isCoach();
}

// Hábitos diarios
match /daily_habits/{habitId} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow read: if isAdmin() || isCoach();
}

// Historial de peso
match /weight_history/{entryId} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow read: if isAdmin() || isCoach();
}
```

---

## 🚨 SOLUCIÓN TEMPORAL (Solo para Desarrollo)

Si necesitas probar **INMEDIATAMENTE** mientras despliegas las reglas:

1. Ve a Firebase Console → Firestore → Rules
2. **Temporalmente** cambia a modo de prueba:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 2, 1);
    }
  }
}
```

⚠️ **IMPORTANTE:** Esto permite acceso total. Solo úsalo para pruebas y **recuerda volver a desplegar las reglas de seguridad correctas**.

---

## 🔄 DESPUÉS DE DESPLEGAR

1. **Recarga** la página del walking tracker
2. **Verifica** en la consola que ya no aparezca el error
3. **Prueba** guardar pasos manualmente

---

## 📝 OTROS ERRORES (Normales)

Estos errores son **normales** y no afectan la funcionalidad:

- ❌ `sidebar.css` - No se usa en wellness-walking
- ❌ `auth-check.js` - No se usa en wellness-walking  
- ❌ `sidebar.js` - No se usa en wellness-walking
- ❌ `favicon.png` - Opcional (puedes agregarlo después)

---

## ✅ CHECKLIST

- [ ] Firebase CLI instalado (`npm install -g firebase-tools`)
- [ ] Login a Firebase (`firebase login`)
- [ ] Proyecto inicializado (`firebase init firestore`)
- [ ] Reglas desplegadas (`firebase deploy --only firestore:rules`)
- [ ] Verificado en consola de Firebase
- [ ] Página recargada
- [ ] Error resuelto

---

## 🆘 SI SIGUE SIN FUNCIONAR

1. **Verifica el proyecto de Firebase:**
   ```bash
   firebase use --add
   # Selecciona: ibero-activate-2025
   ```

2. **Verifica que el archivo `.firebaserc` existe:**
   ```json
   {
     "projects": {
       "default": "ibero-activate-2025"
     }
   }
   ```

3. **Despliega de nuevo:**
   ```bash
   firebase deploy --only firestore:rules --force
   ```

---

## 📞 NECESITAS AYUDA?

Si el error persiste después de desplegar las reglas, comparte:
1. El mensaje de error completo
2. El resultado de `firebase deploy --only firestore:rules`
3. Las reglas que ves en la consola de Firebase
