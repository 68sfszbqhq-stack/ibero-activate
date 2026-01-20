# Configuración de Usuario Visualizador (Solo Lectura)

## Para el Administrador del Sistema

### Paso 1: Crear el usuario en Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto "pausas-activas-ibero-2026"
3. En el menú lateral, haz clic en "Authentication"
4. Haz clic en la pestaña "Users"
5. Haz clic en "Add user"
6. Ingresa:
   - **Email:** El correo institucional de tu jefe (ej: `jefe@iberopuebla.mx`)
   - **Password:** Una contraseña temporal segura
7. Haz clic en "Add user"

### Paso 2: Configurar el rol en el código

1. Abre el archivo: `js/roles.js`
2. Busca la línea que dice:
   ```javascript
   const USER_ROLES = {
       '716276@iberopuebla.mx': 'admin',
       // Agrega aquí el email de tu jefe con rol 'viewer'
   };
   ```
3. Agrega el email de tu jefe:
   ```javascript
   const USER_ROLES = {
       '716276@iberopuebla.mx': 'admin',
       'jefe@iberopuebla.mx': 'viewer'  // ← Cambia por el email real
   };
   ```
4. Guarda el archivo
5. Haz commit y push a GitHub

### Paso 3: Entregar credenciales

Comparte con tu jefe:
- **URL:** https://68sfszbqhq-stack.github.io/ibero-activate/admin/login.html
- **Usuario:** El email que configuraste
- **Contraseña:** La contraseña temporal

**Recomendación:** Pídele que cambie la contraseña en su primer inicio de sesión.

---

## Características del Rol "Viewer" (Solo Lectura)

### ✅ Lo que PUEDE hacer:
- Ver todas las páginas del admin
- Ver el calendario completo de 19 semanas
- Ver todas las actividades
- Ver reportes y estadísticas
- **Descargar PDFs** del programa
- Ver información de empleados
- Ver pase de lista histórico

### ❌ Lo que NO PUEDE hacer:
- Crear nuevas actividades
- Editar actividades existentes
- Eliminar actividades
- Modificar el calendario
- Tomar pase de lista
- Agregar o editar empleados
- Modificar configuraciones

### 🎨 Indicadores Visuales:
- Badge amarillo en el sidebar: "MODO SOLO LECTURA"
- Notificación al entrar: "Modo Solo Lectura - No puedes editar información"
- Todos los botones de edición/eliminar están ocultos
- Los campos de formularios están deshabilitados

---

## Agregar Más Usuarios Visualizadores

Para agregar más usuarios con acceso de solo lectura:

1. Crea el usuario en Firebase Authentication (Paso 1)
2. Agrega su email en `js/roles.js`:
   ```javascript
   const USER_ROLES = {
       '716276@iberopuebla.mx': 'admin',
       'jefe@iberopuebla.mx': 'viewer',
       'director@iberopuebla.mx': 'viewer',  // ← Nuevo usuario
       'coordinador@iberopuebla.mx': 'viewer'  // ← Otro usuario
   };
   ```

---

## Cambiar Contraseña de un Usuario

### Opción 1: Desde Firebase Console
1. Ve a Authentication > Users
2. Busca el usuario
3. Haz clic en los tres puntos (⋮)
4. Selecciona "Reset password"
5. Firebase enviará un email al usuario

### Opción 2: El usuario puede hacerlo
1. En la página de login, hacer clic en "¿Olvidaste tu contraseña?"
2. Ingresar su email
3. Recibirá un link para resetear

---

## Solución de Problemas

### El usuario puede editar cosas
- Verifica que el email esté correctamente escrito en `USER_ROLES`
- Verifica que el rol sea `'viewer'` (con comillas)
- Asegúrate de haber hecho commit y push del código
- Pide al usuario que haga hard refresh (Ctrl+Shift+R)

### El usuario no puede iniciar sesión
- Verifica que el usuario exista en Firebase Authentication
- Verifica que el email y contraseña sean correctos
- Revisa la consola del navegador para ver errores

---

## Seguridad

⚠️ **IMPORTANTE:**
- Los viewers NO pueden modificar datos en Firebase directamente
- Las reglas de seguridad de Firebase deben configurarse para permitir solo lectura
- El sistema de roles es una capa de UI, pero Firebase debe tener sus propias reglas

### Configurar Reglas de Firebase (Recomendado)

En Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función para verificar si es admin
    function isAdmin() {
      return request.auth.token.email in [
        '716276@iberopuebla.mx'
      ];
    }
    
    // Permitir lectura a todos los autenticados
    // Permitir escritura solo a admins
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

---

**Fecha de creación:** 20 de enero de 2026  
**Versión:** 1.0
