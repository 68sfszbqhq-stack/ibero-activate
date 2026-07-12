# 🎨 IMPLEMENTACIÓN DEL SISTEMA DE DISEÑO - ROADMAP

## ✅ COMPLETADO

### Fase 1: Sistema de Diseño Base
- ✅ Archivo `css/design-system.css` creado
- ✅ Variables CSS definidas
- ✅ Sistema de botones (.btn-primary, .btn-secondary, etc.)
- ✅ Sistema de badges (.badge-success, .badge-pending, etc.)
- ✅ Tarjetas (.card, .card-header, etc.)
- ✅ Estados de semana (.week-active, .week-upcoming, etc.)
- ✅ Utilidades (spacing, colors, shadows)

---

## 🔄 EN PROGRESO

### Fase 2: Integración en HTMLs (SIGUIENTE PASO)

**ACCIÓN MANUAL REQUERIDA:**

Agregar esta línea en TODOS los archivos HTML (admin y employee), ANTES de `main.css`:

```html
<!-- Agregar ANTES de main.css -->
<link rel="stylesheet" href="../css/design-system.css">
<link rel="stylesheet" href="../css/main.css">
```

**Archivos a actualizar:**

#### Admin (13 archivos):
- [ ] `/admin/dashboard.html`
- [ ] `/admin/program-overview.html`
- [ ] `/admin/attendance.html`
- [ ] `/admin/employees.html`
- [ ] `/admin/reports.html`
- [ ] `/admin/activities.html`
- [ ] `/admin/calendar.html`
- [ ] `/admin/login.html`
- [ ] `/admin/auto-import.html`
- [ ] `/admin/ai-reports.html`
- [ ] `/admin/employee-detail.html`
- [ ] `/admin/attendance-late.html`
- [ ] `/admin/seed.html`

#### Employee (Buscar y agregar en todos):
- [ ] `/employee/*.html`

---

### Fase 3: Refactorizar main.css

**Cambios principales:**

#### 1. Reemplazar colores hardcoded por variables

**ANTES:**
```css
.button {
  background-color: #C1272D;
  color: white;
}
```

**DESPUÉS:**
```css
.button {
  background-color: var(--color-brand);
  color: white;
}
```

#### 2. Eliminar definiciones de botones duplicadas

Buscar y ELIMINAR:
- `.btn-primary { ... }` (ya está en design-system.css)
- `.btn-secondary { ... }` (ya está en design-system.css)

#### 3. Actualizar paleta de colores

Buscar y reemplazar en TODOS los archivos CSS:

```
#C1272D → var(--color-brand)
#5B68C8, #7C6FD6 → var(--color-primary)
#1AAB8A, #2DBFA0, #10B981 → var(--color-success)
#F6A323, #FF9800, #F59E0B → var(--color-warning)
#E74C3C, #EF4444 → var(--color-danger)
#111827 → var(--color-text)
#6B7280 → var(--color-text-muted)
#F8F9FA → var(--color-bg)
```

---

### Fase 4: Componentes Específicos

#### A. Dashboard (`admin/dashboard.html` + CSS)

**Prioridades ALTAS:**

1. **Barras de progreso** - Cambiar a verde uniforme:
```css
/* ANTES: Múltiples colores */
.progress-bar { background: linear-gradient(...); }

/* DESPUÉS: Verde uniforme */
.progress-bar {
  background-color: var(--color-success);
  height: 8px;
  border-radius: var(--radius-full);
}
```

2. **Métricas** - Simplificar indicadores:
```css
.metric-positive {
  color: var(--color-success);
}

.metric-negative {
  color: var(--color-danger);
  background-color: var(--color-danger-light);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
```

3. **Badge "5%"** - Cambiar a gris:
```css
.completion-badge {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
}
```

---

#### B. Program Overview (`admin/program-overview.html`)

**CRÍTICO - Cambio de colores de bordes de semanas:**

```css
/* Sistema de 3 colores (en lugar de 5+) */

.week-card.active {
  border: 2px solid var(--color-success);
  background-color: var(--color-success-light);
}

.week-card.upcoming {
  border: 2px solid var(--color-primary);
  background-color: var(--color-primary-light);
}

.week-card.future {
  border: 2px solid var(--color-border);
  background-color: var(--color-bg);
}

.week-card.completed {
  border: 2px solid var(--color-border-dark);
  background-color: var(--color-bg-secondary);
  opacity: 0.7;
}
```

**Fases (1-5):**
```css
.phase-badge {
  background-color: var(--color-primary);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
```

**ELIMINAR:**
- Gradientes decorativos del header
- Variaciones de colores por fase

---

#### C. Activities (`admin/activities.html`)

**Cambios principales:**

1. **Header** - Quitar gradiente:
```css
/* ANTES */
.activities-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* DESPUÉS */
.activities-header {
  background-color: var(--color-primary);
}
```

2. **Badges de intensidad** - Sistema de 3 colores con iconos:
```html
<!-- Agregar iconos -->
<span class="badge intensity-low">
  <i class="fas fa-circle"></i> Intensidad Baja
</span>
<span class="badge intensity-medium">
  <i class="fas fa-circle"></i> Intensidad Moderada
</span>
<span class="badge intensity-high">
  <i class="fas fa-circle"></i> Intensidad Alta
</span>
```

```css
.intensity-low {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.intensity-low i {
  color: var(--color-success);
}

.intensity-medium {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.intensity-medium i {
  color: var(--color-warning);
}

.intensity-high {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

.intensity-high i {
  color: var(--color-danger);
}
```

3. **Filtros** - Monotono en lugar de coloridos:
```css
.filter-btn {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
}

.filter-btn.active,
.filter-btn:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
```

---

#### D. Calendar (`admin/calendar.html`)

**Cambios:**

1. **Días de la semana** - Color unificado:
```css
.calendar-day {
  color: var(--color-primary);
  font-weight: 600;
}

.calendar-day.today {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
}
```

2. **Eventos** - Diferenciación con opacity:
```css
.event {
  background-color: var(--color-success-light);
  border-left: 4px solid var(--color-success);
  opacity: 1;
}

.event.past {
  opacity: 0.6;
}

.event.future {
  opacity: 0.8;
}
```

---

### Fase 5: Formularios y Botones Globales

**Actualizar todos los botones:**

```html
<!-- ANTES -->
<button class="btn" style="background: #C1272D;">Guardar</button>

<!-- DESPUÉS -->
<button class="btn-primary">Guardar</button>
```

```html
<!-- ANTES -->
<button class="btn blue">Cancelar</button>

<!-- DESPUÉS -->
<button class="btn-outline">Cancelar</button>
```

**Buscar y reemplazar en TODOS los HTML:**
- Estilos inline de botones → Clases del sistema
- `background-color: #...` → Usar clases `.btn-primary`, etc.

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Preparación (5 min)
- [x] Crear `design-system.css`
- [ ] Hacer backup de archivos CSS actuales
- [ ] Hacer commit de trabajo actual

### Integración (15 min)
- [ ] Agregar `<link>` a design-system.css en todos los HTML
- [ ] Verificar que se carga antes de main.css

### Refactorización CSS (60 min)
- [ ] main.css: Reemplazar colores hardcoded
- [ ] admin.css: Actualizar componentes
- [ ] employee.css: Actualizar componentes
- [ ] Eliminar definiciones duplicadas

### Componentes (90 min)
- [ ] Dashboard: Barras de progreso + métricas
- [ ] Program Overview: Tarjetas de semanas (S1-S19)
- [ ] Activities: Header + badges + filtros
- [ ] Calendar: Días + eventos
- [ ] Forms: Botones globales

### Testing (30 min)
- [ ] Verificar contraste con herramienta (https://webaim.org/resources/contrastchecker/)
- [ ] Probar en localhost
- [ ] Revisar todos los componentes
- [ ] Ajustes finales

### Deploy (10 min)
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub
- [ ] Verificar en GitHub Pages
- [ ] Documentar cambios

---

## 🎯 ORDEN DE EJECUCIÓN SUGERIDO

1. ✅ **Crear design-system.css** (YA HECHO)
2. **Hacer backup y commit**
3. **Agregar design-system.css a HTMLs** (13 admin + employee)
4. **Refactorizar main.css** (colores a variables)
5. **Dashboard**: Implementar cambios prioritarios
6. **Program Overview**: Sistema de 3 colores para semanas
7. **Activities**: Header + badges
8. **Botones globales**: Reemplazar estilos inline
9. **Testing visual**
10. **Deploy**

---

## ⚡ ATAJOS Y TIPS

### Find & Replace en VSCode

**Buscar:** `background-color:\s*#C1272D`
**Reemplazar:** `background-color: var(--color-brand)`

**Buscar:** `color:\s*#111827`
**Reemplazar:** `color: var(--color-text)`

### Verificar contraste

Usar herramienta: https://webaim.org/resources/contrastchecker/

Variables definidas con contraste AA+:
- `--color-text` sobre `--color-bg`: Ratio 16.48:1 ✅
- `--color-text-muted` sobre `--color-bg`: Ratio 5.74:1 ✅

---

## 🚀 PRÓXIMOS PASOS (AHORA)

1. **Commit del design-system.css**
2. **Agregar link en todos los HTMLs** (o script automático)
3. **Empezar con main.css**

¿Continúo con la automatización de agregar el link en los HTMLs?
