# 🔑 GUÍA: ROTAR API KEYS EN GOOGLE CLOUD CONSOLE

**Fecha:** 2026-01-14  
**Proyecto:** pausas-activas-ibero-2026

---

## 📋 OBJETIVO

Regenerar la API key de Firebase que fue expuesta en el historial de Git para asegurar que nadie pueda abusar de las credenciales antiguas.

---

## 🎯 PASO 1: ACCEDER A GOOGLE CLOUD CONSOLE

### 1.1 Ir a la consola
```
URL: https://console.cloud.google.com/
```

### 1.2 Seleccionar el proyecto
```
Proyecto: pausas-activas-ibero-2026
```

### 1.3 Navegar a Credenciales
```
☰ (Menú) → APIs y servicios → Credenciales
```

---

## 🔍 PASO 2: IDENTIFICAR LA API KEY ACTUAL

### 2.1 Buscar la key
En la sección "API keys", busca la key que tiene el valor:
```
AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4
```

### 2.2 Verificar el nombre
Probablemente se llama algo como:
- "Browser key (auto created by Firebase)"
- "Web API key"
- O un nombre personalizado

### 2.3 Ver restricciones actuales
Clic en el nombre de la key para ver:
- ¿Qué restricciones tiene?
- ¿Qué APIs puede acceder?

---

## ⚙️ PASO 3: OPCIONES PARA ROTAR

### OPCIÓN A: Regenerar la Key Existente (RECOMENDADO)

**Ventajas:**
- Mantiene las restricciones configuradas
- Proceso más rápido
- No necesitas configurar todo de nuevo

**Pasos:**
```
1. Clic en la API key actual
2. Buscar opción "Regenerate key" o "Rotate key"
3. Confirmar la acción
4. COPIAR el nuevo valor inmediatamente
5. Actualizar firebase-config.js con el nuevo valor
```

### OPCIÓN B: Crear Nueva Key y Eliminar la Antigua

**Ventajas:**
- Mayor control
- Puedes configurar restricciones desde cero

**Pasos:**
```
1. Clic en "+ CREATE CREDENTIALS" → API key
2. Google Cloud creará una nueva key
3. INMEDIATAMENTE aplicar restricciones (ver Paso 4)
4. Actualizar firebase-config.js
5. Probar que todo funcione
6. ELIMINAR la key antigua
```

---

## 🔒 PASO 4: APLICAR RESTRICCIONES DE SEGURIDAD

### 4.1 Application restrictions

Selecciona: **HTTP referrers (web sites)**

Agrega los siguientes referrers permitidos:
```
https://tu-dominio-produccion.com/*
https://tu-dominio-staging.com/*
http://localhost:*
http://127.0.0.1:*
```

**Si usas GitHub Pages:**
```
https://[tu-usuario].github.io/*
```

**Si usas Firebase Hosting:**
```
https://pausas-activas-ibero-2026.web.app/*
https://pausas-activas-ibero-2026.firebaseapp.com/*
```

### 4.2 API restrictions

Selecciona: **Restrict key**

APIs permitidas (marca solo estas):
```
☑ Cloud Firestore API
☑ Identity Toolkit API
☑ Token Service API
☑ Firebase Installations API (opcional)
```

**NO marques:**
```
☐ Cloud Storage API (a menos que la uses)
☐ Compute Engine API
☐ Otras APIs no relacionadas con Firebase
```

### 4.3 Guardar cambios
```
Clic en "SAVE" al final de la página
```

---

## 📝 PASO 5: ACTUALIZAR EL CÓDIGO

### 5.1 Abrir firebase-config.js
```bash
# Archivo ubicado en:
/Users/josemendoza/proyecto ibero 2026/js/firebase-config.js
```

### 5.2 Reemplazar la API key
```javascript
// ANTES (key antigua - ya expuesta):
apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4",

// DESPUÉS (key nueva - desde Google Cloud Console):
apiKey: "AIzaSy[TU_NUEVA_KEY_REGENERADA_AQUI]",
```

### 5.3 Los demás valores NO cambian
```javascript
// Estos permanecen igual:
authDomain: "pausas-activas-ibero-2026.firebaseapp.com",
projectId: "pausas-activas-ibero-2026",
// etc...
```

---

## ✅ PASO 6: PROBAR Y VERIFICAR

### 6.1 Probar localmente
```bash
# Abrir el proyecto en un servidor local
# Por ejemplo, con Live Server, Python, o cualquier servidor HTTP
```

### 6.2 Verificaciones
```
☑ ¿La autenticación funciona?
☑ ¿Firestore responde correctamente?
☑ ¿No hay errores en la consola del navegador?
```

### 6.3 Si algo falla
```
Posibles causas:
1. API key incorrecta → Verifica que copiaste bien
2. Restricciones muy estrictas → Temporalmente quita restricciones para probar
3. APIs no habilitadas → Verifica que habilitaste las APIs correctas
```

---

## 🚀 PASO 7: COMMITEAR Y PUSH

### 7.1 Agregar y commitear
```bash
cd "/Users/josemendoza/proyecto ibero 2026"
git add js/firebase-config.js
git commit -m "security: Actualizar API key rotada de Firebase

- API key anterior fue expuesta en historial
- Nueva key con restricciones de dominio aplicadas
- Restricciones configuradas en Google Cloud Console"
```

### 7.2 Push al repositorio
```bash
# Si ya hiciste force push de la limpieza:
git push origin main

# Si aún NO has hecho force push de la limpieza:
git push origin --force --all
git push origin --force --tags
```

---

## 📊 CHECKLIST COMPLETO

```
ROTACIÓN DE API KEY:
[ ] Acceder a Google Cloud Console
[ ] Navegar a APIs y servicios → Credenciales
[ ] Identificar la API key actual
[ ] Regenerar la key O crear una nueva
[ ] COPIAR el nuevo valor de la key

CONFIGURACIÓN DE SEGURIDAD:
[ ] Aplicar restricciones de HTTP referrers
[ ] Aplicar restricciones de APIs permitidas
[ ] Guardar cambios en Google Cloud Console

ACTUALIZACIÓN DE CÓDIGO:
[ ] Abrir js/firebase-config.js
[ ] Reemplazar el valor de apiKey
[ ] Guardar el archivo

PRUEBAS:
[ ] Probar autenticación localmente
[ ] Verificar acceso a Firestore
[ ] Revisar consola del navegador (sin errores)

DEPLOYMENT:
[ ] Commitear los cambios
[ ] Push al repositorio
[ ] Verificar en producción (si aplica)

LIMPIEZA:
[ ] Si creaste nueva key: ELIMINAR la key antigua
[ ] Verificar que solo existe UNA key activa
[ ] Documentar el cambio (fecha, motivo)
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "API key not valid"
```
Causa: Key incorrecta o restricciones muy estrictas
Solución:
1. Verifica que copiaste la key completa
2. Temporalmente quita las restricciones
3. Si funciona sin restricciones, ajústalas gradualmente
```

### Error: "This API key is not authorized to use this service"
```
Causa: API restrictions bloquean el servicio
Solución:
1. Ve a Google Cloud Console → Credenciales
2. Edita la key
3. En "API restrictions", agrega los servicios necesarios:
   - Cloud Firestore API
   - Identity Toolkit API
```

### Error: "Origin not allowed"
```
Causa: HTTP referrer restrictions
Solución:
1. Verifica que tu dominio esté en la lista de referrers
2. Para desarrollo local, agrega:
   - http://localhost:*
   - http://127.0.0.1:*
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- [Google Cloud: Managing API Keys](https://cloud.google.com/docs/authentication/api-keys)
- [Firebase: Understanding API Keys](https://firebase.google.com/docs/projects/api-keys)
- [Best Practices for API Keys](https://cloud.google.com/docs/authentication/best-practices-api-keys)

### Videos Tutoriales
- [How to Secure Firebase API Keys](https://www.youtube.com/results?search_query=secure+firebase+api+keys)

---

## ⚠️ RECORDATORIO IMPORTANTE

**Las API keys de Firebase para web NO son secretas:**
- Es normal que estén en el código del cliente
- NO se pueden ocultar completamente en apps web
- La verdadera seguridad viene de:
  ✓ Restricciones de dominio (HTTP referrers)
  ✓ Firestore Security Rules (ya implementadas)
  ✓ Firebase Authentication
  ✓ API restrictions

**Sin embargo:**
- Evita exponerlas en GitHub público innecesariamente
- Siempre aplica restricciones
- Rota las keys si hay sospecha de abuso

---

**Última actualización:** 2026-01-14  
**Próxima revisión recomendada:** Cada 3 meses  
**Responsable:** Equipo de Seguridad
