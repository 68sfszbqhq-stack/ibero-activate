# 🚀 Scripts de Reset Pre-Lanzamiento

## 📋 Descripción

Estos scripts te permiten hacer un reset completo de la plataforma antes del lanzamiento oficial, eliminando todos los datos de prueba pero manteniendo la configuración esencial.

## 📦 Archivos

1. **`backup-before-launch.js`** - Script de backup
2. **`reset-for-launch.js`** - Script de reset
3. **`README-RESET.md`** - Este archivo

---

## ⚠️ IMPORTANTE: Orden de Ejecución

**SIEMPRE ejecuta en este orden:**

1. ✅ **PRIMERO: Backup**
2. ✅ **SEGUNDO: Reset**

**NUNCA ejecutes el reset sin hacer backup primero!**

---

## 🔧 Instrucciones Paso a Paso

### Paso 1: Ejecutar Backup

1. Abre tu navegador en la página de administración:
   ```
   http://localhost:8080/admin/dashboard.html
   ```

2. Abre las DevTools:
   - **Windows/Linux:** `F12` o `Ctrl + Shift + I`
   - **Mac:** `Cmd + Option + I`

3. Ve a la pestaña **Console**

4. Abre el archivo `backup-before-launch.js` en un editor de texto

5. **Copia TODO el contenido** del archivo

6. **Pega** el código en la consola

7. Presiona **Enter**

8. Espera a que termine (verás mensajes en la consola)

9. **Se descargará automáticamente** un archivo JSON:
   ```
   ibero-activate-backup-YYYY-MM-DD.json
   ```

10. **GUARDA ESTE ARCHIVO** en un lugar seguro (Google Drive, Dropbox, etc.)

### Paso 2: Verificar el Backup

1. Abre el archivo JSON descargado en un editor de texto

2. Verifica que contiene datos:
   ```json
   {
     "timestamp": "2026-01-18T...",
     "version": "1.0.0",
     "data": {
       "employees": [...],
       "attendances": [...],
       ...
     },
     "stats": {
       "totalEmployees": XX,
       "totalAttendances": XX,
       ...
     }
   }
   ```

3. Si el archivo está vacío o tiene errores, **NO CONTINÚES**

### Paso 3: Ejecutar Reset

1. **SOLO después de verificar el backup**, vuelve a la consola

2. Abre el archivo `reset-for-launch.js`

3. **Copia TODO el contenido**

4. **Pega** en la consola

5. Presiona **Enter**

6. **Confirma dos veces** cuando te pregunte

7. Espera a que termine (puede tomar varios minutos)

8. Verás mensajes de progreso en la consola

9. Al finalizar, verás:
   ```
   ✅ RESET COMPLETADO EXITOSAMENTE
   ```

### Paso 4: Verificar el Reset

1. **Recarga la página** (`Ctrl+R` o `Cmd+R`)

2. Verifica que:
   - ✅ Empleados siguen ahí
   - ✅ Áreas siguen ahí
   - ✅ Actividades siguen ahí
   - ✅ Calendario sigue configurado
   - ✅ NO hay asistencias del día de hoy
   - ✅ NO hay feedbacks
   - ✅ Puntos de empleados están en 0

---

## 📊 ¿Qué se Borra?

### ❌ Se ELIMINA:
- Todas las asistencias (colección `attendances`)
- Todas las asistencias de empleados (subcollección `employees/{id}/attendance`)
- Todos los feedbacks (subcollección `employees/{id}/feedback`)
- Todos los registros de wellness (colección `wellness_data`)
- Puntos de empleados (se resetean a 0)
- Campo `lastAttendance` de empleados (se pone en `null`)

### ✅ Se MANTIENE:
- 👥 Empleados (colección `employees`)
- 🏢 Áreas (colección `areas`)
- 🏃 Actividades (colección `activities`)
- 📅 Calendario (colección `weekly_schedules`)
- 👤 Usuarios admin
- ⚙️  Toda la configuración

---

## 🆘 Solución de Problemas

### Problema: "db is not defined"

**Solución:** Asegúrate de estar ejecutando el script en una página que tenga Firebase cargado. Usa `admin/dashboard.html` o cualquier página de admin.

### Problema: "Permission denied"

**Solución:** Asegúrate de estar autenticado como admin en la plataforma antes de ejecutar los scripts.

### Problema: El script se detiene a mitad

**Solución:** 
1. Revisa la consola para ver el error específico
2. No cierres la pestaña del navegador durante la ejecución
3. Si falla, puedes volver a ejecutar el script (es idempotente)

### Problema: No se descarga el backup

**Solución:**
1. Verifica que tu navegador permite descargas
2. Revisa la carpeta de descargas de tu navegador
3. Si no aparece, copia manualmente el JSON desde la consola

---

## 📞 Contacto

Si tienes problemas, revisa:
1. Mensajes en la consola del navegador
2. Estado de conexión a Firebase
3. Permisos de tu usuario

---

## ✅ Checklist Pre-Lanzamiento

Antes de dar acceso a los usuarios:

- [ ] Ejecutado script de backup
- [ ] Backup guardado en lugar seguro
- [ ] Ejecutado script de reset
- [ ] Verificado que NO hay asistencias de prueba
- [ ] Verificado que empleados siguen ahí
- [ ] Verificado que actividades siguen ahí
- [ ] Verificado que calendario está configurado
- [ ] Puntos de empleados en 0
- [ ] Probado el flujo completo (pase de lista → feedback)

**¡La plataforma está lista para el lanzamiento! 🎉**
