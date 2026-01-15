# 🚀 Inicialización del Sistema de Periodización

Este documento explica cómo inicializar el sistema de periodización científica de 19 semanas en Firestore.

---

## 📋 Requisitos Previos

1. **Node.js** instalado (v14 o superior)
2. **Dependencias instaladas:**
   ```bash
   npm install
   ```
3. **Service Account Key de Firebase** (ver siguiente sección)

---

## 🔑 Paso 1: Descargar Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ir a **⚙️ Project Settings** (rueda de configuración)
4. Ir a pestaña **Service Accounts**
5. Click en **Generate New Private Key**
6. Se descargará un archivo JSON (ej: `ibero-activate-firebase-adminsdk-xxxxx.json`)
7. **Renombrar** el archivo a: `firebase-service-account.json`
8. **Mover** el archivo a: `/Users/josemendoza/proyecto ibero 2026/scripts/`

⚠️ **IMPORTANTE:** Este archivo contiene credenciales sensibles. **NO** lo subas a Git.

### Verificar .gitignore

Asegúrate de que `.gitignore` incluya:
```
scripts/firebase-service-account.json
```

---

## 📅 Paso 2: Configurar Fecha de Inicio

Edita el archivo: `scripts/init-periodization-node.js`

Encuentra la línea:
```javascript
startDate: "2026-01-13", // ⚠️ CAMBIAR A FECHA REAL DE INICIO
```

Cambia la fecha a la fecha real de inicio del programa.

**✅ Recomendaciones:**
- La fecha debe ser un **lunes** (primer día de la semana laboral)
- Usa formato `YYYY-MM-DD`
- Ejemplo: `"2026-02-03"` para el 3 de febrero de 2026

---

## ▶️ Paso 3: Ejecutar el Script

Desde la raíz del proyecto (`/Users/josemendoza/proyecto ibero 2026/`), ejecuta:

```bash
npm run init-periodization
```

---

## ✅ Salida Esperada

Si todo está correcto, verás:

```
🚀 Iniciando sistema de periodización...

✅ Firebase Admin inicializado correctamente
📅 Fecha de inicio: lunes, 13 de enero de 2026
📊 Total de semanas: 19
🎯 Total de fases: 5

💾 Guardando en Firestore...

✅ ¡Sistema de periodización inicializado correctamente!

📋 Resumen de fases:
   1. Reconexión y Adaptación (Semanas 1-3)
   2. Construcción de Base Física y Lúdica (Semanas 4-7)
   3. Intensificación Cognitiva y Estratégica (Semanas 8-11)
   4. Pico de Rendimiento (Semanas 12-14)
   5. Consolidación y Autonomía (Semanas 15-19)

✨ Próximos pasos:
   1. Abre admin/program-overview.html para ver el programa completo
   2. Verifica que el dashboard muestra el card de progreso
   3. Revisa que el calendario muestra el banner de fase actual
```

---

## ❌ Solución de Errores

### Error: "Cannot find module './firebase-service-account.json'"

**Causa:** No se encontró el archivo de credenciales.

**Solución:**
1. Verifica que el archivo esté en: `scripts/firebase-service-account.json`
2. Verifica que el nombre sea exactamente `firebase-service-account.json`
3. Asegúrate de estar ejecutando desde la raíz del proyecto

---

### Error: "Fecha de inicio inválida"

**Causa:** El formato de fecha está mal.

**Solución:**
- Usa formato: `YYYY-MM-DD`
- Ejemplo correcto: `"2026-01-13"`
- Ejemplo incorrecto: `"13/01/2026"` o `"Jan 13, 2026"`

---

### Advertencia: "La fecha de inicio no es lunes"

**Causa:** Has configurado una fecha que no es lunes.

**Solución:**
- Ajusta la fecha al lunes más cercano
- El programa está diseñado para comenzar en lunes (inicio de semana laboral)
- Puedes continuar de todos modos, pero se recomienda ajustar

---

## 🔍 Verificar que Funcionó

### 1. Firebase Console
1. Ve a Firestore Database en Firebase Console
2. Busca la colección: `program_periodization`
3. Debe existir un documento: `current_macrocycle`
4. El documento debe tener:
   - `programName`
   - `totalWeeks: 19`
   - `startDate`
   - `phases` (array de 5 elementos)
   - `weeklySchedule` (array de 19 elementos)

### 2. En la Aplicación Web

#### Dashboard (`admin/dashboard.html`):
- Debe aparecer un card arriba con:
  - "Semana X/19"
  - Nombre de la fase
  - Anillo de progreso
  - Botón "Ver Programa Completo"

#### Programa Completo (`admin/program-overview.html`):
- Hero section con:
  - Barra de progreso
  - Estadísticas (semana actual, progreso %, fase, días restantes)
- Timeline con 5 bloques de fases (con colores)
- Grilla de 19 tarjetas de semanas

#### Calendario (`admin/calendar.html`):
- Banner arriba mostrando:
  - "Semana X/19 - Calendario Semanal"
  - Badge con nombre de fase
  - Objetivo dominante
  - Link "Ver fundamentos científicos"

---

## 🔄 Ejecutar Nuevamente

Si necesitas volver a ejecutar el script (por ejemplo, para cambiar la fecha de inicio):

1. **Opción 1 - Sobrescribir:**
   ```bash
   npm run init-periodization
   ```
   Esto sobrescribirá los datos existentes.

2. **Opción 2 - Borrar primero:**
   - Ve a Firebase Console → Firestore
   - Elimina el documento `program_periodization/current_macrocycle`
   - Ejecuta el script nuevamente

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa que `firebase-admin` esté instalado:
   ```bash
   npm list firebase-admin
   ```

2. Verifica que el archivo de credenciales sea válido (debe ser un JSON válido)

3. Asegúrate de tener permisos de escritura en Firestore (revisa Firebase Rules)

---

## 🎯 Resumen de Archivos

```
proyecto ibero 2026/
├── scripts/
│   ├── init-periodization-node.js    ← Script Node.js
│   ├── firebase-service-account.json ← Credenciales (NO subir a Git)
│   └── INIT-README.md                ← Este archivo
├── package.json                       ← Contiene script "init-periodization"
└── js/
    └── program-utils.js               ← Utilidades compartidas
```

---

**Última actualización:** 1 de Enero, 2026  
**Versión del script:** 1.0
