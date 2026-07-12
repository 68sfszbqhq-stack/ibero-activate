# 🗺️ GUÍA DE NAVEGACIÓN - MÓDULO DE SALUD

## 📱 PARA EMPLEADOS

### Desde el Dashboard Principal (`/employee/dashboard.html`)

Ahora verás **7 tarjetas** en tu dashboard:

1. **📊 Mis Estadísticas** - Tus puntos y asistencias
2. **🏆 Mi Ranking** - Tu posición en el leaderboard
3. **🧠 Centro de Bienestar** - Cuestionarios de bienestar
4. **🤖 Experto de IA** - Asistente virtual
5. **📖 Mi Diario de Bienestar** - Diario personal
6. **🚶 Mis Caminatas** ⭐ - Walking tracker (7,000 pasos)
7. **❤️ Perfil de Salud** 🆕 - IMC y datos biométricos
8. **✅ Mis Hábitos Diarios** 🆕 - Hidratación y nutrición
9. **🏃 Mi Macrociclo** 🆕 - Programa de 19 semanas

---

## 🆕 NUEVAS FUNCIONALIDADES (FASE 2)

### 1. ❤️ Perfil de Salud
**Enlace:** `employee/health-onboarding.html`  
**Color:** Rojo  
**Icono:** 💓

**¿Qué hace?**
- Modal de onboarding de 4 pasos
- Registro de datos básicos (género, edad, tipo de sangre)
- Datos biométricos (altura, peso)
- **Calculadora de IMC en vivo** mientras escribes
- Registro de condiciones médicas
- Resumen final antes de guardar

**Flujo:**
```
1. Haz clic en "Perfil de Salud"
   ↓
2. Completa 4 pasos:
   - Paso 1: Datos básicos
   - Paso 2: Altura y peso (ve tu IMC calculándose)
   - Paso 3: Condiciones médicas
   - Paso 4: Confirma todo
   ↓
3. Sistema crea tu perfil
   ↓
4. Te redirige al Macrociclo
```

---

### 2. ✅ Mis Hábitos Diarios
**Enlace:** `employee/daily-habits.html`  
**Color:** Azul  
**Icono:** 📋

**¿Qué hace?**
- **Wellness Score** (0-100 puntos) en tiempo real
- **Hidrómetro interactivo** - 10 vasos de agua
- **Selector de nutrición** - 3 opciones con emojis
- **Tracker de actividad** - Sincronizado con caminatas
- **Health Insights** - Recomendaciones personalizadas

**Cómo usar:**
```
1. Haz clic en "Mis Hábitos Diarios"
   ↓
2. Registra tu día:
   - Click en vasos para marcar agua bebida
   - Selecciona calidad de nutrición (🍎/🥗/🍔)
   - Confirma si hiciste caminata continua
   ↓
3. Ve tu Wellness Score actualizarse
   ↓
4. Sistema guarda automáticamente cada 2 segundos
```

**Wellness Score:**
- 💧 Hidratación: 30 puntos (8 vasos = 100%)
- 🍎 Nutrición: 30 puntos (según calidad)
- 🏃 Actividad: 30 puntos (pasos vs meta)
- ⏱️ Continuo: 10 puntos (15+ min)

---

### 3. 🏃 Mi Macrociclo
**Enlace:** `employee/macrocycle-dashboard.html`  
**Color:** Naranja  
**Icono:** 🛣️

**¿Qué hace?**
- Muestra tu **fase actual** del programa de 19 semanas
- **Gráfica de evolución** de tus pasos (últimos 30 días)
- **Timeline visual** de las 4 fases
- **Recomendaciones** específicas para tu fase
- **Preview** de la próxima fase

**Las 4 Fases:**
```
🌱 Fase 1: Adaptación (Semanas 1-5)
   Meta: 3,000 pasos | Hábito: Hidratación

💪 Fase 2: Resistencia (Semanas 6-10)
   Meta: 4,500 pasos | Hábito: Caminata continua

🔥 Fase 3: Intensificación (Semanas 11-15)
   Meta: 6,000 pasos | Hábito: Nutrición

🏆 Fase 4: Consolidación (Semanas 16-19)
   Meta: 7,000 pasos | Hábito: Meta final
```

---

## 👨‍💼 PARA ADMINISTRADORES

### Desde el Sidebar (`/admin/dashboard.html`)

Ahora verás un **nuevo item** en el menú lateral:

**❤️ Dashboard de Salud** 🆕

**Ubicación:** Después de "Gamificación"  
**Enlace:** `admin/health-dashboard.html`

---

## 🆕 PANEL ADMINISTRATIVO DE SALUD

**¿Qué muestra?**

### 1. Resumen General (4 métricas)
- 👥 **Total Colaboradores**
- ❤️ **Con Perfil de Salud** (% completado)
- ⚖️ **IMC Promedio** (con categoría)
- ⭐ **Wellness Score Promedio** (/100)

### 2. Distribución de IMC
- **Gráfica de dona** con Chart.js
- **4 categorías:**
  - 🔵 Bajo Peso
  - 🟢 Normal
  - 🟠 Sobrepeso
  - 🔴 Obesidad
- **Estadísticas detalladas** por categoría

### 3. Alertas de Salud
- ⚠️ **Obesidad** (IMC > 30)
- 🚨 **Riesgo cardiovascular alto**
- 🏥 **Múltiples condiciones médicas** (3+)
- **Acciones recomendadas** para cada alerta

### 4. Progreso del Macrociclo
- **4 barras de progreso** (una por fase)
- **Usuarios por fase**
- **Porcentaje de distribución**

### 5. Condiciones Médicas Prevalentes
- 💉 Diabetes
- ❤️ Hipertensión
- 🫁 Asma
- 🚶 Lesión de Espalda
- 💔 Enfermedad Cardíaca

### 6. Riesgo Cardiovascular
- 🟢 **Bajo** - Sin factores de riesgo
- 🟡 **Medio** - Algunos factores
- 🔴 **Alto** - Múltiples factores

---

## 🔗 MAPA COMPLETO DE NAVEGACIÓN

```
PÁGINA DE INICIO (index.html)
├── Administrador
│   └── Dashboard Admin (admin/dashboard.html)
│       ├── Programa 19 Semanas
│       ├── Calendario
│       ├── Reportes IA
│       ├── Actividades
│       ├── Pase de Lista
│       ├── Empleados
│       ├── Reportes
│       ├── Gamificación
│       └── 🆕 Dashboard de Salud ⭐
│           ├── Métricas generales
│           ├── Distribución de IMC
│           ├── Alertas de salud
│           ├── Progreso de macrociclo
│           ├── Condiciones médicas
│           └── Riesgo cardiovascular
│
└── Colaborador
    └── Dashboard Empleado (employee/dashboard.html)
        ├── Mis Estadísticas
        ├── Mi Ranking
        ├── Centro de Bienestar
        ├── Experto de IA
        ├── Mi Diario
        ├── 🆕 Mis Caminatas ⭐
        ├── 🆕 Perfil de Salud ⭐
        │   └── Onboarding de 4 pasos
        ├── 🆕 Mis Hábitos Diarios ⭐
        │   ├── Wellness Score
        │   ├── Hidrómetro (10 vasos)
        │   ├── Nutrición (3 opciones)
        │   └── Health Insights
        └── 🆕 Mi Macrociclo ⭐
            ├── Fase actual
            ├── Gráfica de pasos
            ├── Timeline de 4 fases
            └── Recomendaciones
```

---

## 🎯 FLUJO RECOMENDADO PARA NUEVOS USUARIOS

### Primera Vez:
```
1. Inicia sesión como Colaborador
   ↓
2. Ve el Dashboard con las nuevas tarjetas
   ↓
3. Haz clic en "Perfil de Salud" (rojo)
   ↓
4. Completa el onboarding de 4 pasos
   ↓
5. Sistema te redirige a "Mi Macrociclo"
   ↓
6. Explora tu fase actual (Fase 1: Adaptación)
   ↓
7. Ve a "Mis Hábitos Diarios"
   ↓
8. Registra tu primer día (agua, nutrición, pasos)
   ↓
9. Ve tu Wellness Score
```

### Uso Diario:
```
1. Accede a "Mis Hábitos Diarios"
   ↓
2. Registra:
   - Vasos de agua (click en vasos)
   - Calidad de nutrición
   - Confirma caminata continua
   ↓
3. Ve tu Wellness Score del día
   ↓
4. Lee tus Health Insights personalizados
```

### Seguimiento Semanal:
```
1. Accede a "Mi Macrociclo"
   ↓
2. Revisa:
   - Tu progreso en la fase actual
   - Gráfica de pasos (últimos 30 días)
   - Recomendaciones para tu fase
   ↓
3. Ajusta tus hábitos según recomendaciones
```

---

## 🎨 IDENTIFICACIÓN VISUAL

### Colores de las Tarjetas:

| Módulo | Color | Gradiente |
|--------|-------|-----------|
| Mis Caminatas | Verde | `#10b981 → #059669` |
| Perfil de Salud | Rojo | `#ef4444 → #dc2626` |
| Mis Hábitos | Azul | `#3b82f6 → #2563eb` |
| Mi Macrociclo | Naranja | `#f59e0b → #d97706` |

### Iconos:

- 🚶 Mis Caminatas: `fa-walking`
- ❤️ Perfil de Salud: `fa-heartbeat`
- ✅ Mis Hábitos: `fa-clipboard-check`
- 🏃 Mi Macrociclo: `fa-route`

---

## 📱 ACCESO DIRECTO (URLs)

### Empleados:
- **Onboarding:** `/employee/health-onboarding.html`
- **Hábitos:** `/employee/daily-habits.html`
- **Macrociclo:** `/employee/macrocycle-dashboard.html`
- **Caminatas:** `/employee/wellness-walking.html`

### Administradores:
- **Dashboard de Salud:** `/admin/health-dashboard.html`

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Para Empleados:
- [x] Ver tarjetas en dashboard
- [x] Acceder a Perfil de Salud
- [x] Completar onboarding
- [x] Registrar hábitos diarios
- [x] Ver Wellness Score
- [x] Ver fase del macrociclo
- [x] Ver gráfica de progreso
- [x] Recibir recomendaciones

### Para Administradores:
- [x] Ver enlace en sidebar
- [x] Acceder a Dashboard de Salud
- [x] Ver métricas generales
- [x] Ver distribución de IMC
- [x] Ver alertas de salud
- [x] Ver progreso de macrociclo
- [x] Analizar condiciones médicas
- [x] Evaluar riesgo cardiovascular

---

## 🚀 ¡TODO LISTO!

Ahora puedes:
1. **Abrir** `https://68sfszbqhq-stack.github.io/ibero-activate/`
2. **Iniciar sesión** como Colaborador
3. **Ver las nuevas tarjetas** en tu dashboard
4. **Hacer clic** en cualquiera de las 3 nuevas opciones

**¿Necesitas ayuda?** Consulta este documento o los archivos de documentación en la carpeta raíz del proyecto.
