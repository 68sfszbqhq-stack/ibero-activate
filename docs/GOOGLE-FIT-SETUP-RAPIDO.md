# 🔑 Configuración de Google Fit API - Guía Rápida

## ⚠️ IMPORTANTE: Configuración Requerida

Para que el sistema de seguimiento de caminatas funcione con **Google Fit**, necesitas configurar tu **Client ID** de Google Cloud.

---

## 📝 Pasos Rápidos

### 1. Ir a Google Cloud Console

Visita: https://console.cloud.google.com/

### 2. Crear o Seleccionar Proyecto

- Si no tienes un proyecto, crea uno nuevo
- Nombre sugerido: **"IBERO-Activate-Wellness"**

### 3. Habilitar Google Fitness API

1. Ve a **APIs & Services** > **Library**
2. Busca **"Fitness API"**
3. Haz clic en **Enable**

### 4. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Clic en **Create Credentials** > **OAuth client ID**
3. Tipo: **Web application**
4. Nombre: **"IBERO Activate Web Client"**

### 5. Configurar URLs Autorizadas

**Authorized JavaScript origins:**
```
https://68sfszbqhq-stack.github.io
http://localhost:5500
```

**Authorized redirect URIs:**
```
https://68sfszbqhq-stack.github.io/ibero-activate/employee/wellness-walking.html
http://localhost:5500/employee/wellness-walking.html
```

### 6. Copiar Client ID

Después de crear las credenciales, **copia el Client ID** que se genera.

Se verá algo así:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### 7. Actualizar el Código

Edita el archivo: `/js/walking-tracker.js`

Busca esta sección (líneas 18-22):

```javascript
const GOOGLE_FIT_CONFIG = {
    clientId: '', // ← PEGA TU CLIENT ID AQUÍ
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
};
```

Reemplaza con tu Client ID:

```javascript
const GOOGLE_FIT_CONFIG = {
    clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
};
```

### 8. Configurar Pantalla de Consentimiento

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Tipo de usuario: **External**
3. Completa la información:
   - **App name:** IBERO ACTÍVATE
   - **User support email:** tu-email@ibero.mx
   - **Developer contact:** tu-email@ibero.mx
4. Agrega el scope: `https://www.googleapis.com/auth/fitness.activity.read`
5. Agrega usuarios de prueba (emails de colaboradores)

---

## ✅ Verificación

Una vez configurado:

1. Abre `employee/wellness-walking.html`
2. Haz clic en **"Sincronizar"** > **"Google Fit"**
3. Debería aparecer la ventana de autorización de Google
4. Acepta los permisos
5. Los pasos se sincronizarán automáticamente

---

## 🍎 Nota para Usuarios de iOS

Los usuarios de iPhone **NO pueden usar Google Fit** (es exclusivo de Android).

Para ellos, el sistema ofrece **entrada manual**:
- Hacen clic en **"Sincronizar"** > **"Apple Health (Manual)"**
- Abren la app **"Salud"** en su iPhone
- Copian el número de pasos
- Lo ingresan en el formulario

---

## 🔒 Seguridad

- El **Client ID NO es secreto** (es normal que esté en el código del cliente)
- La seguridad viene de:
  - OAuth 2.0 (autorización del usuario)
  - Firestore Security Rules (ya configuradas)
  - Scopes limitados (solo lectura de actividad física)

---

## ❓ Solución de Problemas

### Error: "Invalid Client ID"

- Verifica que copiaste el Client ID completo
- Asegúrate de que no haya espacios extra
- Confirma que las URLs autorizadas estén correctas

### Error: "Access Blocked"

- Verifica que la Fitness API esté habilitada
- Confirma que el scope esté agregado en la pantalla de consentimiento
- Agrega tu email como usuario de prueba

### No aparece la ventana de autorización

- Verifica que `gapi` esté cargado (revisa la consola del navegador)
- Confirma que el Client ID esté configurado
- Limpia caché del navegador

---

## 📞 Soporte

Si tienes problemas, revisa:
1. La consola del navegador (F12) para errores
2. La documentación completa en `WELLNESS-WALKING-SETUP.md`
3. Los logs de Firebase Console

---

**¡Listo!** Una vez configurado, el sistema funcionará automáticamente para todos los usuarios de Android con Google Fit.
