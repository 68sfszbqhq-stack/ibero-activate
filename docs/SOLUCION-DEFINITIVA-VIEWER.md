# 🔧 Solución Definitiva: Ocultación de Menú para Viewers

## 🎯 Cambio de Estrategia

### ❌ Problema con la Solución Anterior
- Intentábamos ocultar elementos manipulando el DOM con JavaScript
- Los elementos aparecían brevemente antes de ser ocultados
- Al navegar entre páginas, los elementos reaparecían

### ✅ Nueva Solución: Inyección de CSS
En lugar de manipular el DOM, ahora **inyectamos CSS directamente** en el `<head>` del documento:

```javascript
const style = document.createElement('style');
style.textContent = `
    .nav-item:has(a[href="attendance.html"]),
    .nav-item:has(a[href="attendance-late.html"]),
    .nav-item:has(a[href="employees.html"]) {
        display: none !important;
    }
`;
document.head.appendChild(style);
```

**Ventajas:**
- ✅ Los elementos se ocultan **inmediatamente**
- ✅ El CSS persiste durante toda la sesión
- ✅ Usa `!important` para sobrescribir cualquier otro estilo
- ✅ Usa el selector `:has()` para ocultar el `<li>` completo

## 🧪 Pasos de Verificación

### 1. Limpiar Caché Completamente

**IMPORTANTE:** Debes hacer un hard refresh para cargar la nueva versión.

#### En Chrome/Edge (Mac):
1. Abre DevTools (`Cmd + Option + I`)
2. Ve a la pestaña **Network**
3. Marca la casilla **"Disable cache"**
4. Haz clic derecho en el botón de recargar → **"Empty Cache and Hard Reload"**

#### En Safari:
1. `Cmd + Option + E` (vaciar cachés)
2. `Cmd + R` (recargar)

### 2. Verificar en la Consola

Abre la consola del navegador y deberías ver estos logs automáticamente:

```
✅ Usuario autenticado: 710029@iberopuebla.mx
✅ Rol: viewer
Usuario: 710029@iberopuebla.mx | Rol: viewer
✅ CSS de restricciones de viewer inyectado
```

### 3. Verificar que el CSS se Inyectó

Ejecuta en la consola:

```javascript
// Verificar que el estilo se inyectó
const style = document.getElementById('viewer-restrictions-style');
console.log('CSS inyectado:', style !== null);
if (style) {
    console.log('Contenido del CSS:', style.textContent);
}
```

**Resultado esperado:**
```
CSS inyectado: true
Contenido del CSS: [muestra las reglas CSS]
```

### 4. Verificar Elementos Ocultos

Ejecuta en la consola:

```javascript
// Verificar que los elementos están ocultos
const items = [
    { name: 'Pase de Lista', selector: '.nav-item:has(a[href="attendance.html"])' },
    { name: 'Pase Extemporáneo', selector: '.nav-item:has(a[href="attendance-late.html"])' },
    { name: 'Empleados', selector: '.nav-item:has(a[href="employees.html"])' }
];

items.forEach(item => {
    const element = document.querySelector(item.selector);
    if (element) {
        const isHidden = window.getComputedStyle(element).display === 'none';
        console.log(`${item.name}: ${isHidden ? '✅ OCULTO' : '❌ VISIBLE'}`);
    } else {
        console.log(`${item.name}: ⚠️ No encontrado`);
    }
});
```

**Resultado esperado:**
```
Pase de Lista: ✅ OCULTO
Pase Extemporáneo: ✅ OCULTO
Empleados: ✅ OCULTO
```

### 5. Probar Navegación Entre Páginas

Navega a estas páginas **sin recargar** (usando los links del menú):

1. ✅ Dashboard → Verificar que los elementos siguen ocultos
2. ✅ Programa 19 Semanas → Verificar que los elementos siguen ocultos
3. ✅ Calendario → Verificar que los elementos siguen ocultos
4. ✅ Actividades → Verificar que los elementos siguen ocultos
5. ✅ Reportes → Verificar que los elementos siguen ocultos

**Los elementos deben permanecer ocultos en TODAS las páginas.**

### 6. Verificar Menú Visible

Los siguientes elementos **SÍ deben ser visibles** para el viewer:

- ✅ Dashboard
- ✅ Programa 19 Semanas
- ✅ Calendario
- ✅ Reportes IA
- ✅ Actividades
- ✅ Reportes
- ✅ Gamificación

## 🔍 Troubleshooting

### Si los elementos siguen apareciendo:

#### 1. Verificar que el caché está limpio
```javascript
// Verificar la versión del archivo
console.log('Timestamp del archivo roles.js:', performance.getEntriesByName('https://68sfszbqhq-stack.github.io/ibero-activate/js/roles.js')[0]?.responseStart);
```

#### 2. Forzar la inyección del CSS manualmente
```javascript
// Ejecutar esto en la consola
applyRoleRestrictions();
```

#### 3. Verificar compatibilidad del navegador con :has()
```javascript
// El selector :has() es compatible con navegadores modernos
// Safari 15.4+, Chrome 105+, Firefox 121+
console.log('Navegador:', navigator.userAgent);
```

**Nota:** Si usas un navegador antiguo, el selector `:has()` podría no funcionar.

#### 4. Solución alternativa si :has() no funciona

Si tu navegador no soporta `:has()`, ejecuta esto en la consola:

```javascript
// Ocultar manualmente los elementos
document.querySelectorAll('a[href="attendance.html"], a[href="attendance-late.html"], a[href="employees.html"]').forEach(link => {
    const li = link.closest('.nav-item');
    if (li) li.style.display = 'none';
});
```

## 📊 Commit Desplegado

- **Commit:** `ead0aaf`
- **Mensaje:** "fix: CSS injection for viewer menu restrictions"
- **Estado:** ✅ Desplegado en GitHub Pages
- **URL:** https://68sfszbqhq-stack.github.io/ibero-activate/

## 🎯 Qué Esperar

Cuando inicies sesión con `710029@iberopuebla.mx`:

1. **Inmediatamente** verás en la consola:
   ```
   ✅ Usuario autenticado: 710029@iberopuebla.mx
   ✅ Rol: viewer
   ✅ CSS de restricciones de viewer inyectado
   ```

2. **El menú mostrará:**
   - ✅ Dashboard
   - ✅ Programa 19 Semanas
   - ✅ Calendario
   - ✅ Reportes IA
   - ✅ Actividades
   - ❌ ~~Pase de Lista~~ (OCULTO)
   - ❌ ~~Pase Extemporáneo~~ (OCULTO)
   - ❌ ~~Empleados~~ (OCULTO)
   - ✅ Reportes
   - ✅ Gamificación

3. **Al navegar entre páginas**, los elementos permanecerán ocultos

## 🚨 Si Aún No Funciona

Si después de seguir todos estos pasos los elementos siguen apareciendo:

1. Comparte una captura de pantalla del menú
2. Comparte los logs de la consola
3. Ejecuta este comando y comparte el resultado:

```javascript
console.log({
    usuario: firebase.auth().currentUser?.email,
    rol: getUserRole(firebase.auth().currentUser?.email),
    cssInyectado: document.getElementById('viewer-restrictions-style') !== null,
    navegador: navigator.userAgent,
    soportaHas: CSS.supports('selector(:has(*))')
});
```

---

**Nota:** Esta solución usa el selector CSS `:has()` que es compatible con:
- ✅ Chrome 105+ (Agosto 2022)
- ✅ Safari 15.4+ (Marzo 2022)
- ✅ Firefox 121+ (Diciembre 2023)
- ✅ Edge 105+ (Septiembre 2022)

Si usas un navegador más antiguo, necesitaremos una solución alternativa.
