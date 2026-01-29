# Plan de Implementación: Sistema de Salud "Elite Bio-Metrics"

Este plan detalla la transformación del módulo de bienestar actual en un sistema avanzado de métricas biométricas, inspirado en plataformas de alto rendimiento (estilo Whoop/Oura), centralizando Carga (Strain), Recuperación (Recovery) y Sueño (Sleep).

## 1. Arquitectura de Datos (Firestore)

Necesitamos expandir `wellness_records` para soportar métricas avanzadas diarias.

**Nueva Estructura de Documento Diario (`daily_biometrics`):**
```typescript
interface DailyBiometric {
  date: string; // YYYY-MM-DD
  scores: {
    strain: number; // 0-21 (Escala de esfuerzo)
    recovery: number; // 0-100%
    sleep_performance: number; // 0-100%
  };
  metrics: {
    resting_heart_rate: number; // bpm
    hrv: number; // ms (Heart Rate Variability)
    respiratory_rate: number; // rpm
    calories_active: number;
    calories_total: number;
    steps: number;
  };
  journal: { // Diario (Journal)
    mood: string;
    energy_level: number;
    tags: string[]; // "alcohol", "late_meal", "meditation"
  };
}
```

## 2. Renovación de UI: Estructura de Navegación "App-Like"

Convertiremos la página `wellness.html` en una Single Page Application (SPA) ligera con una barra de navegación inferior persistente.

**Layout General:**
- **Top:** Header limpio con fecha y estado de conexión.
- **Middle:** Contenido dinámico (Vistas).
- **Bottom:** Barra de navegación flotante o fija.

**Menú de Navegación (5 Botones):**
1.  **Home (Inicio):** Dashboard principal con los 3 círculos clave (Strain, Recovery, Sleep).
2.  **Coaching:** Chat con el Asistente IA que interpreta tus datos del día.
3.  **(+) Acción (Centro):** Botón flotante prominente.
    -   *Iniciar Entrenamiento*
    -   *Registrar Diario (Mañana/Noche)*
    -   *Entrada Manual de Biométrica*
4.  **Comunidad:** Rankings de pasos, grupos de "Strain" o retos de equipo.
5.  **Perfil:** Datos de usuario, configuración de dispositivos (Apple Health/Google Fit).

## 3. Detalle de las Vistas

### A. Home (Dashboard "Tappable")
Concepto: "Menos es más". Muestra solo lo vital, permite profundizar al tocar.
-   **Header de Recuperación:** Semáforo (Verde/Amarillo/Rojo) basado en HRV y Sueño. Texto: "Estás listo para entrenar duro" o "Prioriza el descanso".
-   **Tarjetas Biométricas:**
    -   **Strain (Esfuerzo):** Calculado basado en Pasos + Actividad Activa. (Tocar -> Ver desglose de actividad).
    -   **Sleep (Sueño):** Horas dormidas vs. Necesidad de sueño. (Tocar -> Ver fases de sueño si están disponibles).
    -   **HRV & Salud:** Gráfica pequeña de tendencia de variabilidad cardíaca.

### B. Botón de Acción (+)
Al presionar, despliega un menú modal ("Action Sheet"):
-   **"Start Activity":** Inicia un cronómetro para caminar/correr (integra el mapa/GPS actual).
-   **"Morning Journal":** Preguntas clave: ¿Cómo dormiste? ¿Bebiste alcohol? ¿Hora de última comida? -> *Esto recalibra el score de Recuperación.*
-   **"Log Health Data":** Para usuarios que no sincronizan automático (ingresar HRV/RHR manual).

### C. Coaching (IA Integrada)
-   Utiliza el motor actual de Gemini.
-   **Prompt Dinámico:** Se le alimenta los datos de `daily_biometrics`.
    -   *Ejemplo:* "Mi HRV bajó a 30ms y dormí 5 horas. ¿Qué entrenamiento recomiendas?"
    -   *Respuesta IA:* "Tu recuperación es baja (30%). Sugiero caminata ligera o yoga, evita el cardio intenso hoy."

## 4. Estrategia de Cálculos (El "Cerebro")

Dado que no todos tienen sensores avanzados, implementaremos **"Strain Estimado"**:

-   **Strain (Carga):**
    -   Nivel 1 (0-8): < 4,000 pasos.
    -   Nivel 2 (8-14): 4,000 - 10,000 pasos o actividad moderada.
    -   Nivel 3 (14-21): > 10,000 pasos o actividad intensa.
    -   *Se ajusta si hay datos de Ritmo Cardíaco.*

-   **Recovery (Recuperación):**
    -   Fundamentalmente basado en **Sueño** + **Input del Diario (Sensación subjetiva)** si no hay HRV.
    -   Si hay Apple Health/Google Fit: Usamos HRV real.

## 5. Implementación Técnica (Fases)

### Fase 1: La Nueva Interfaz (El "Shell")
-   Crear `wellness-elite.html` con la nueva navegación.
-   Diseñar los componentes visuales de "Anillos" o "Barras" para Strain/Recovery.

### Fase 2: Integración de Datos
-   Conectar el script `native-health-integration.js` existente para llenar los "huecos" de datos automáticamente.
-   Crear el algoritmo de cálculo de puntajes en `js/biometrics-engine.js`.

### Fase 3: El Diario (Journal)
-   Formulario rápido que impacta los "Scores".

### Fase 4: Comunidad
-   Vista simple de Leaderboard basada en "Strain" (no solo pasos, para nivelar el campo de juego).
