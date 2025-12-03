# IBERO ACTÍVATE - Sistema de Pausas Activas

Sistema web de asistencia y feedback para el programa de bienestar laboral IBERO ACTÍVATE.

## 🚀 Configuración Inicial

### 1. Configurar Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un nuevo proyecto.
2. Habilita **Firestore Database** (en modo de prueba para empezar).
3. Habilita **Authentication** y activa el proveedor de **Correo electrónico/Contraseña**.
4. Ve a la configuración del proyecto y copia las credenciales del SDK web.
5. Abre el archivo `js/firebase-config.js` y pega tus credenciales.

### 2. Crear Usuario Administrador
En la consola de Authentication de Firebase, crea un usuario manualmente (ej: `admin@ibero.mx` / `password123`) para poder iniciar sesión en el panel de administrador.

### 3. Cargar Datos Iniciales (Áreas y Empleados)
Para que el sistema funcione, necesitas crear las colecciones `areas` y `employees` en Firestore.
Puedes hacerlo manualmente desde la consola de Firebase:

**Colección: areas**
- Documento ID: (auto-id)
- Campo `name`: "Recursos Humanos"

**Colección: employees**
- Documento ID: (auto-id)
- Campo `fullName`: "Juan Pérez"
- Campo `accountNumber`: "12345"
- Campo `areaId`: (ID del documento del área creada arriba)

## 📂 Estructura del Proyecto

- `/admin`: Panel de control para administradores (Pase de lista, Dashboard).
- `/employee`: Portal para colaboradores (Feedback, Progreso personal).
- `/css`: Estilos globales y específicos.
- `/js`: Lógica de la aplicación y conexión a Firebase.

## 🌐 Despliegue en GitHub Pages

1. Sube este código a un repositorio de GitHub.
2. Ve a **Settings** > **Pages**.
3. En **Source**, selecciona `main` (o la rama donde esté tu código) y la carpeta `/ (root)`.
4. Guarda y espera unos minutos. Tu sitio estará disponible en `https://tu-usuario.github.io/tu-repo/`.

## ✨ Características

- **Pase de Lista Digital**: Selección rápida por áreas.
- **Feedback en Tiempo Real**: Calificaciones y comentarios de empleados.
- **Gamificación**: Puntos, rachas e insignias.
- **Dashboards**: Visualización de datos para toma de decisiones.
