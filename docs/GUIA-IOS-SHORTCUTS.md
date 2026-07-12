# 🍎 GUÍA: Sincronización con iPhone (iOS Shortcuts)

## 🎯 ¿QUÉ ES ESTO?

Un "botón mágico" en tu iPhone que envía tus pasos de Apple Health directamente a IBERO ACTÍVATE **sin escribir nada**.

---

## ✅ LO QUE YA ESTÁ LISTO

El sistema web **YA está preparado** para recibir datos de iPhone. Solo falta crear el Atajo.

---

## 📱 CÓMO CREAR TU ATAJO DE SINCRONIZACIÓN

### Paso 1: Abrir la App "Atajos"

1. Busca la app **"Atajos"** (Shortcuts) en tu iPhone
2. Si no la tienes, descárgala gratis del App Store

### Paso 2: Crear Nuevo Atajo

1. Toca el botón **"+"** (arriba a la derecha)
2. Toca **"Añadir acción"**

### Paso 3: Agregar Acciones (en este orden)

#### Acción 1: Buscar Pasos
1. Busca: **"Buscar muestras de salud"**
2. Configura:
   - **Tipo:** Pasos
   - **Filtro:** La fecha es **hoy**
   - **Ordenar:** Más reciente primero
   - **Límite:** 1000 (o sin límite)

#### Acción 2: Sumar Pasos
1. Busca: **"Calcular estadística"**
2. Configura:
   - **Operación:** Suma
   - **Entrada:** Muestras de salud (del paso anterior)

#### Acción 3: Crear URL
1. Busca: **"URL"**
2. Escribe **EXACTAMENTE** esto (copia y pega):
   ```
   https://68sfszbqhq-stack.github.io/ibero-activate/employee/wellness-walking.html?pasos=
   ```
3. **⚠️ IMPORTANTE:** 
   - Después del `=`, **NO escribas nada más**
   - Toca el botón de **"Variables"** (parece una varita mágica)
   - Selecciona **"Resultado de estadística"** (del paso 2)
   - La URL final debe verse así:
     ```
     ...wellness-walking.html?pasos=[Resultado de estadística]
     ```
   - **NO debe quedar:** `?pasos=` (sin variable)
   - **SÍ debe quedar:** `?pasos=[Resultado de estadística]`

#### Acción 4: Abrir URL
1. Busca: **"Abrir URL"**
2. Selecciona la **URL** del paso anterior

### Paso 4: Personalizar el Atajo

1. Toca los **tres puntos** (arriba a la derecha)
2. Cambia el nombre a: **"Sincronizar IBERO"**
3. Toca **"Icono"** y elige un color (sugerencia: verde 🟢)
4. Toca **"Añadir a pantalla de inicio"**
5. Toca **"Añadir"**

---

## 🚀 CÓMO USAR TU ATAJO

### Opción 1: Desde la Pantalla de Inicio
1. Toca el icono **"Sincronizar IBERO"** en tu pantalla
2. Autoriza el acceso a Salud (solo la primera vez)
3. ¡Listo! Safari se abrirá y tus pasos se cargarán automáticamente

### Opción 2: Desde Siri
1. Di: **"Hey Siri, Sincronizar IBERO"**
2. ¡Listo!

---

## ✨ LO QUE VERÁS

Cuando uses el atajo:

1. **Safari se abre** automáticamente
2. **Aparece un mensaje verde** que dice:
   ```
   🍎 ¡Sincronizado con iPhone!
   7,234 pasos importados desde Apple Health
   ```
3. **Los campos se llenan solos** con tus datos
4. **Se guarda automáticamente** en tu perfil

---

## 🎓 VERSIÓN AVANZADA (Opcional)

### Para Incluir Distancia y Calorías:

Modifica el Atajo para incluir más datos:

#### Agregar Distancia:
1. Después de la Acción 2, agrega:
   - **"Buscar muestras de salud"**
   - Tipo: **Distancia caminando + corriendo**
   - Filtro: La fecha es **hoy**
2. Agrega **"Calcular estadística"** → Suma
3. En la URL, cambia a:
   ```
   ...wellness-walking.html?pasos=PASOS&km=DISTANCIA
   ```

#### Agregar Calorías:
1. Agrega:
   - **"Buscar muestras de salud"**
   - Tipo: **Energía activa quemada**
   - Filtro: La fecha es **hoy**
2. Agrega **"Calcular estadística"** → Suma
3. En la URL, cambia a:
   ```
   ...wellness-walking.html?pasos=PASOS&km=DISTANCIA&kcal=CALORIAS
   ```

---

## 🏃 BONUS: Detectar Caminatas Continuas

Para registrar automáticamente si caminaste 15+ minutos seguidos:

1. Agrega **"Buscar entrenamientos"**
   - Tipo: **Caminata**
   - Filtro: La fecha es **hoy**
2. Agrega **"Obtener detalles del entrenamiento"**
   - Detalle: **Duración**
3. En la URL, agrega:
   ```
   ...wellness-walking.html?pasos=PASOS&minutos=DURACION
   ```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### "Error 35: URL no existe" o "No se puede abrir la URL"
**Causa:** La variable no está conectada correctamente en la URL.

**Solución:**
1. Abre el atajo y ve a la Acción 3 (URL)
2. Verifica que después de `?pasos=` haya una **variable azul** que diga `[Resultado de estadística]`
3. Si solo dice `?pasos=` (sin nada después), elimina la acción y créala de nuevo
4. **Pasos correctos:**
   - Escribe: `https://68sfszbqhq-stack.github.io/ibero-activate/employee/wellness-walking.html?pasos=`
   - Toca **después** del `=`
   - Toca el botón de **Variables** (varita mágica)
   - Selecciona **"Resultado de estadística"**
   - Debe quedar: `...?pasos=[Resultado de estadística]` (con la variable en azul)

### "No se puede acceder a los datos de Salud"
**Solución:**
1. Ve a **Ajustes** → **Privacidad** → **Salud**
2. Busca **"Atajos"**
3. Activa **"Pasos"** y otros datos que quieras compartir

### "El atajo no funciona"
**Solución:**
1. Verifica que la URL esté **exactamente** como se muestra
2. Asegúrate de usar **Variables** y no escribir números manualmente
3. Prueba el atajo paso por paso para ver dónde falla

### "Los datos no se guardan"
**Solución:**
1. Asegúrate de estar **logueado** en IBERO ACTÍVATE
2. Verifica que tengas **conexión a internet**
3. Revisa la consola del navegador (F12) para ver errores

---

## 📊 VENTAJAS DE USAR EL ATAJO

### Para Ti:
- ✅ **Ahorra tiempo** - No escribes nada
- ✅ **Datos precisos** - Directo del sensor del iPhone
- ✅ **Fácil de usar** - Un solo toque
- ✅ **Funciona con Siri** - Manos libres

### Para el Entrenador:
- ✅ **Datos reales** - No inventados
- ✅ **Mayor adherencia** - Más fácil = más uso
- ✅ **Análisis preciso** - Datos confiables para el macrociclo
- ✅ **Detección de intensidad** - Sabe si caminaste rápido o lento

---

## 🎬 VIDEO TUTORIAL (Sugerencia)

Puedes grabar un video corto (1-2 minutos) mostrando:
1. Cómo abrir la app Atajos
2. Cómo crear el atajo paso a paso
3. Cómo usarlo
4. Qué esperar cuando funciona

Compártelo en el grupo de WhatsApp del equipo.

---

## 📝 PLANTILLA PARA COMPARTIR

Copia y pega esto en WhatsApp para tu equipo:

```
🍎 ¡NUEVO! Sincronización con iPhone

Ya no tienes que escribir tus pasos manualmente.

📱 Crea un "Atajo" en tu iPhone que envía tus pasos automáticamente.

🎯 Instrucciones completas:
[Adjunta esta guía o el link al archivo]

⏱️ Tiempo de configuración: 2 minutos
✨ Tiempo de uso diario: 1 toque

¿Dudas? Pregunta en el grupo.
```

---

## 🔗 ENLACES ÚTILES

- **App Atajos:** https://apps.apple.com/app/shortcuts/id915249334
- **Guía oficial de Apple:** https://support.apple.com/guide/shortcuts/welcome/ios
- **IBERO ACTÍVATE:** https://68sfszbqhq-stack.github.io/ibero-activate/

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] App "Atajos" instalada
- [ ] Atajo creado con 4 acciones
- [ ] URL correcta configurada
- [ ] Variables conectadas
- [ ] Atajo renombrado a "Sincronizar IBERO"
- [ ] Icono personalizado
- [ ] Agregado a pantalla de inicio
- [ ] Probado y funcionando
- [ ] Permisos de Salud otorgados

---

**¿Listo para probarlo? ¡Crea tu atajo ahora y sincroniza tus pasos con un solo toque!** 🚀
