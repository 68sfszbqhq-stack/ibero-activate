# 🔄 ACTUALIZAR NOMBRES DE SEMANAS EN FIRESTORE

## ⚠️ PROBLEMA IDENTIFICADO

Los nombres de las semanas están guardados en **Firestore**, no solo en el código JavaScript. Por eso no se actualizan aunque hayas hecho push a GitHub.

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Abrir la Consola del Navegador

1. Ve a: https://68sfszbqhq-stack.github.io/ibero-activate/admin/program-overview.html
2. Abre la consola del navegador (F12 o Cmd+Option+I en Mac)
3. Ve a la pestaña **"Console"**

### Paso 2: Copiar y Pegar el Script

Copia TODO el siguiente código y pégalo en la consola:

```javascript
const nuevosNombres = {
    1: "Movimiento y Diversión",
    2: "Masaje y Conexión",
    3: "Calma y Reflexión",
    4: "Voleibol en Acción",
    5: "Raqueta y Respiración",
    6: "Fichas y Flexión",
    7: "Palabras y Extensión",
    8: "Juegos y Relajación",
    9: "Adivinanzas y Precisión",
    10: "Mente y Corazón",
    11: "Masaje y Acción",
    12: "Reflejos en Acción",
    13: "Consola y Emoción",
    14: "Circuitos de Precisión",
    15: "Equilibrio y Cooperación",
    16: "Letras y Respiración",
    17: "Cartas y Atención",
    18: "Gratitud y Diversión",
    19: "Cierre y Celebración"
};

async function actualizarNombresEnFirestore() {
    console.log('🔄 Iniciando actualización de nombres en Firestore...');
    
    try {
        const programDoc = await db.collection('program_periodization').doc('current_program').get();
        
        if (!programDoc.exists) {
            console.error('❌ No se encontró el documento del programa');
            return;
        }
        
        const programData = programDoc.data();
        const weeklySchedule = programData.weeklySchedule || [];
        
        console.log(`📋 Encontradas ${weeklySchedule.length} semanas`);
        
        const updatedSchedule = weeklySchedule.map(week => {
            const nuevoNombre = nuevosNombres[week.week];
            if (nuevoNombre) {
                console.log(`✏️  Semana ${week.week}: "${week.activity}" → "${nuevoNombre}"`);
                return { ...week, activity: nuevoNombre };
            }
            return week;
        });
        
        await db.collection('program_periodization').doc('current_program').update({
            weeklySchedule: updatedSchedule,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ ¡Nombres actualizados exitosamente en Firestore!');
        console.log('🔄 Recarga la página para ver los cambios');
        
    } catch (error) {
        console.error('❌ Error al actualizar:', error);
    }
}

actualizarNombresEnFirestore();
```

### Paso 3: Presionar Enter

Presiona **Enter** y verás mensajes en la consola mostrando los cambios.

### Paso 4: Recargar la Página

Presiona **F5** o **Cmd+R** para recargar la página.

---

## ✅ VERIFICAR QUE FUNCIONÓ

Deberías ver los nuevos nombres:
- S1: **Movimiento y Diversión** (antes: Caminatas Reflexivas)
- S2: **Masaje y Conexión** (antes: Círculos de Movimiento)
- S3: **Calma y Reflexión** (antes: Juegos de Integración)
- etc.

---

## 🔧 TROUBLESHOOTING

### Error: "db is not defined"
**Solución:** Asegúrate de estar en la página `program-overview.html` y que Firebase esté cargado.

### Error: "Permission denied"
**Solución:** Asegúrate de estar logueado con tu cuenta de admin (`716276@iberopuebla.mx`).

### No veo cambios después de recargar
**Solución:** Haz un hard refresh (Cmd+Shift+R o Ctrl+Shift+R).

---

## 📝 NOTA

Este script actualiza directamente la base de datos de Firestore. Los cambios son permanentes y se verán en:
- ✅ La página web (program-overview.html)
- ✅ Los PDFs generados
- ✅ El calendario
- ✅ Todos los dashboards

---

**¿Listo para ejecutar el script?**
