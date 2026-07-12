# 🏥 FASE 2: Módulo de Salud Biométrica y Macrociclo - Plan de Implementación

## 📋 Resumen Ejecutivo

Evolución de IBERO ACTÍVATE de un sistema de asistencia a una **Plataforma Integral de Gestión de Salud Corporativa (E-Health)**.

---

## 🎯 Objetivos de la Fase 2

1. **Captura de Perfiles Médicos** - Datos biométricos y condiciones de salud
2. **Cálculo de IMC Automático** - Indicadores de riesgo en tiempo real
3. **Macrociclo "Ruta a los 7K"** - Programa de 19 semanas basado en evidencia
4. **Registro de Hábitos Diarios** - Hidratación, nutrición, actividad física
5. **Panel de Riesgo Poblacional** - Vista administrativa de salud por área
6. **Insights con IA** - Recomendaciones personalizadas

---

## 🗄️ Arquitectura de Datos

### Nueva Colección 1: `health_profiles`

**Document ID:** Firebase UID del colaborador

```javascript
{
  userId: String,              // Firebase UID
  email: String,               // Email del colaborador
  biometrics: {
    gender: "M" | "F" | "O",
    height_cm: Number,         // Ej: 175
    weight_initial: Number,    // Peso al inicio del programa
    current_weight: Number,    // Se actualiza mensualmente
    birth_date: Date,
    blood_type: String,        // "A+", "O-", etc.
    age: Number                // Calculado automáticamente
  },
  medical_conditions: {
    diabetes: Boolean,
    hypertension: Boolean,
    asthma: Boolean,
    back_injury: Boolean,
    heart_disease: Boolean,
    other: String              // Texto libre
  },
  computed_metrics: {
    bmi_value: Number,         // (peso / (altura/100)^2)
    bmi_category: String,      // "Bajo Peso", "Normal", "Sobrepeso", "Obesidad"
    cardiovascular_risk: String, // "Bajo", "Medio", "Alto"
    ideal_weight_range: {
      min: Number,
      max: Number
    }
  },
  macrocycle: {
    start_date: Date,
    current_phase: Number,     // 1-4 (Mes actual)
    current_week: Number,      // 1-19
    daily_step_goal: Number,   // Meta actual según fase
    phase_name: String         // "Adaptación Anatómica", etc.
  },
  status: "active" | "onboarding_pending" | "inactive",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Nueva Colección 2: `daily_habits`

**Document ID:** Autogenerado

```javascript
{
  userId: String,              // Firebase UID
  email: String,
  date: "YYYY-MM-DD",
  hydration: {
    glasses_count: Number,     // 0-10
    goal_met: Boolean          // >= 8 vasos
  },
  nutrition: {
    quality: "nutritivo" | "antojo" | "balanceado",
    emoji: "🍎" | "🍔" | "🥗",
    notes: String              // Opcional
  },
  physical_activity: {
    steps_count: Number,
    continuous_walk_15min: Boolean, // Clave científica
    duration_mins: Number,
    source: "Manual" | "GoogleFit" | "AppleHealth"
  },
  wellness_score: Number,      // 0-100 (calculado)
  phase_compliance: Boolean,   // ¿Cumplió meta de la fase?
  timestamp: Timestamp
}
```

### Nueva Colección 3: `weight_history`

**Document ID:** Autogenerado

```javascript
{
  userId: String,
  email: String,
  date: "YYYY-MM-DD",
  weight_kg: Number,
  bmi_value: Number,
  bmi_category: String,
  notes: String,               // Opcional
  measurement_type: "monthly" | "manual",
  timestamp: Timestamp
}
```

---

## 📊 Macrociclo "Ruta a los 7K" (19 Semanas)

### Fases del Programa

| Mes | Fase | Semanas | Meta Pasos/Día | Hábito Prioritario | Objetivo Científico |
|-----|------|---------|----------------|-------------------|---------------------|
| **1** | Adaptación Anatómica | 1-5 | 3,000 | Hidratación (8 vasos) | Preparar articulaciones |
| **2** | Base de Resistencia | 6-10 | 4,500 | Caminata continua >15 min | Capacidad aeróbica |
| **3** | Intensificación | 11-15 | 6,000 | Nutrición Balanceada | Composición corporal |
| **4** | Consolidación | 16-19 | 7,000 | Meta Final "7K Club" | Mantenimiento óptimo |

### Cálculo de Fase Actual

```javascript
function calculateCurrentPhase(startDate) {
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.ceil(diffDays / 7);
  
  let phase, stepGoal, habitPriority;
  
  if (currentWeek <= 5) {
    phase = 1;
    stepGoal = 3000;
    habitPriority = "Hidratación (8 vasos)";
  } else if (currentWeek <= 10) {
    phase = 2;
    stepGoal = 4500;
    habitPriority = "Caminata continua >15 min";
  } else if (currentWeek <= 15) {
    phase = 3;
    stepGoal = 6000;
    habitPriority = "Nutrición Balanceada";
  } else {
    phase = 4;
    stepGoal = 7000;
    habitPriority = "Meta Final 7K Club";
  }
  
  return { phase, currentWeek, stepGoal, habitPriority };
}
```

---

## 🎨 Componentes de UI a Crear

### 1. Modal de Onboarding de Salud
- **Archivo:** `/employee/health-onboarding.html`
- **Trigger:** Primera vez que el usuario accede al sistema
- **Campos:**
  - Género (radio buttons)
  - Altura (cm)
  - Peso (kg)
  - Fecha de nacimiento
  - Tipo de sangre
  - Condiciones médicas (checkboxes)
- **Cálculo en vivo:** IMC mientras escribe

### 2. Calculadora de IMC Interactiva
- **Componente:** `<imc-calculator>`
- **Características:**
  - Actualización en tiempo real
  - Colores según categoría:
    - Verde: Normal (18.5-24.9)
    - Amarillo: Sobrepeso (25-29.9)
    - Naranja: Obesidad I (30-34.9)
    - Rojo: Obesidad II+ (35+)
  - Rango de peso ideal

### 3. Hidrómetro Interactivo
- **Componente:** `<water-tracker>`
- **Características:**
  - 10 vasos visuales
  - Click para llenar/vaciar
  - Animación de agua
  - Progreso hacia meta (8 vasos)

### 4. Dashboard de Macrociclo
- **Archivo:** `/employee/macrocycle-dashboard.html`
- **Secciones:**
  - Fase actual y progreso
  - Meta de pasos del día
  - Hábito prioritario
  - Gráfica de evolución
  - Próxima fase

### 5. Registro de Hábitos Diarios
- **Archivo:** `/employee/daily-habits.html`
- **Campos:**
  - Hidratación (hidrómetro)
  - Nutrición (selector con emojis)
  - Pasos (integrado con walking tracker)
  - Caminata continua (checkbox)

### 6. Panel de Salud Poblacional (Admin)
- **Archivo:** `/admin/health-dashboard.html`
- **Características:**
  - Heatmap de IMC por área
  - Alertas médicas
  - Estadísticas de riesgo
  - Exportar carnets de salud

---

## 🔒 Reglas de Seguridad de Firestore

```javascript
// Perfiles de salud
match /health_profiles/{userId} {
  // Solo el dueño puede leer/escribir
  allow read, write: if request.auth.uid == userId;
  
  // Admin/Coach puede leer (para estadísticas)
  allow read: if request.auth.token.role == 'admin' || 
                 request.auth.token.role == 'coach';
}

// Hábitos diarios
match /daily_habits/{habitId} {
  // Solo el dueño puede leer/escribir
  allow read, write: if request.auth.uid == resource.data.userId;
  
  // Admin/Coach puede leer
  allow read: if request.auth.token.role == 'admin' || 
                 request.auth.token.role == 'coach';
}

// Historial de peso
match /weight_history/{recordId} {
  // Solo el dueño puede leer/escribir
  allow read, write: if request.auth.uid == resource.data.userId;
  
  // Admin/Coach puede leer
  allow read: if request.auth.token.role == 'admin' || 
                 request.auth.token.role == 'coach';
}
```

---

## 🤖 Health Insights con IA

### Mensajes Dinámicos Basados en Datos

```javascript
function generateHealthInsight(profile, todayHabits) {
  const insights = [];
  
  // Basado en condiciones médicas
  if (profile.medical_conditions.hypertension) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: 'Tienes Hipertensión. Mantén un paso moderado y evita esfuerzos bruscos.'
    });
  }
  
  // Basado en IMC
  if (profile.computed_metrics.bmi_category === 'Obesidad') {
    insights.push({
      type: 'info',
      icon: '💪',
      message: `Tu IMC es ${profile.computed_metrics.bmi_value.toFixed(1)}. ¡Cada paso cuenta! Meta: ${profile.macrocycle.daily_step_goal} pasos hoy.`
    });
  }
  
  // Basado en caminata continua
  if (todayHabits?.physical_activity?.continuous_walk_15min) {
    insights.push({
      type: 'success',
      icon: '🎉',
      message: '¡Felicidades! Tus 15+ min de caminata continua reducen tu riesgo metabólico.'
    });
  }
  
  // Basado en hidratación
  if (todayHabits?.hydration?.glasses_count >= 8) {
    insights.push({
      type: 'success',
      icon: '💧',
      message: '¡Excelente hidratación! Esto mejora tu rendimiento físico.'
    });
  }
  
  return insights;
}
```

---

## 📁 Archivos a Crear

### JavaScript (6 archivos)
1. `/js/health-profile.js` - Gestión de perfiles de salud
2. `/js/bmi-calculator.js` - Calculadora de IMC
3. `/js/macrocycle-manager.js` - Lógica del macrociclo
4. `/js/daily-habits.js` - Registro de hábitos
5. `/js/health-insights.js` - Generación de insights con IA
6. `/js/admin-health-dashboard.js` - Panel administrativo

### HTML (5 archivos)
1. `/employee/health-onboarding.html` - Modal de onboarding
2. `/employee/health-profile.html` - Perfil de salud del usuario
3. `/employee/macrocycle-dashboard.html` - Dashboard del macrociclo
4. `/employee/daily-habits.html` - Registro diario
5. `/admin/health-dashboard.html` - Panel de salud poblacional

### CSS (2 archivos)
1. `/css/health-module.css` - Estilos del módulo de salud
2. `/css/admin-health.css` - Estilos del panel admin

---

## 🚀 Plan de Implementación

### Fase 2.1: Base de Datos y Lógica (Día 1)
- [x] Crear estructura de colecciones
- [ ] Implementar cálculo de IMC
- [ ] Implementar lógica de macrociclo
- [ ] Actualizar reglas de Firestore

### Fase 2.2: Onboarding y Perfil (Día 2)
- [ ] Modal de onboarding
- [ ] Calculadora de IMC interactiva
- [ ] Perfil de salud del usuario
- [ ] Historial de peso

### Fase 2.3: Hábitos Diarios (Día 3)
- [ ] Hidrómetro interactivo
- [ ] Selector de nutrición
- [ ] Integración con walking tracker
- [ ] Cálculo de wellness score

### Fase 2.4: Dashboard de Macrociclo (Día 4)
- [ ] Vista de fase actual
- [ ] Gráfica de progreso
- [ ] Recomendaciones por fase
- [ ] Integración con insights

### Fase 2.5: Panel Administrativo (Día 5)
- [ ] Heatmap de salud por área
- [ ] Alertas médicas
- [ ] Estadísticas de riesgo
- [ ] Exportar carnets de salud

---

## 📊 Métricas de Éxito

- **Adopción:** % de colaboradores que completan onboarding
- **Engagement:** Frecuencia de registro de hábitos
- **Salud:** Reducción promedio de IMC en 4 meses
- **Cumplimiento:** % de usuarios que alcanzan meta de fase
- **Retención:** % de usuarios activos mes a mes

---

## 🎯 Próximos Pasos Inmediatos

1. ✅ Revisar y aprobar este plan
2. ⏳ Implementar estructura de base de datos
3. ⏳ Crear modal de onboarding
4. ⏳ Desarrollar calculadora de IMC
5. ⏳ Implementar lógica de macrociclo

---

**Fecha de Inicio:** 20 de enero de 2026  
**Duración Estimada:** 5 días  
**Estado:** 📋 Planificación Completa
