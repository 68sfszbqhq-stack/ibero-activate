# 🏃‍♂️ Propuesta Técnica: Proyecto Caminatas Laborales "Health Analytics"

Esta propuesta detalla la arquitectura y pasos para construir la aplicación móvil solicitada, enfocada en la integración de HealthKit/Google Fit, análisis científico de datos y privacidad.

## 🏗️ Arquitectura Tecnológica Recomendada

Para cumplir con los requisitos de integración nativa (HealthKit/Google Fit) y análisis avanzado, **no podemos usar tecnología web simple** (HTML/JS) como en el proyecto actual. Debemos usar **React Native**.

*   **Frontend Mobile**: React Native (TypeScript). Es necesario para acceder a las APIs de salud nativas de iOS y Android.
*   **Gestión de Estado**: React Query & Zustand (para manejar la data asíncrona de salud).
*   **Backend / Procesamiento**: Firebase Cloud Functions (Python Gen 2). Python es ideal para la lógica científica y estadística solicitada.
*   **Base de Datos**: Firestore (Escalable, igual que el proyecto actual).

---

## 🟢 Tarea 1: Módulo de Integración de Salud (TypeScript)

Esta es la base del sistema. No usaremos la API web, sino módulos nativos.

### Estrategia de Implementación
1.  **Librerías**:
    *   iOS: `react-native-health` (La más robusta para HealthKit).
    *   Android: `react-native-google-fit` (Estándar para Android).
2.  **Normalización**: Crearemos un "Adapter Pattern" para que la app no sepa si los datos vienen de Apple o Google.

### Interfaz Unificada (Draft)
```typescript
interface HealthDataPoint {
  source: 'apple_health' | 'google_fit';
  type: 'steps' | 'distance' | 'heart_rate' | 'vo2_max';
  value: number;
  unit: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  metadata?: {
    device?: string;
    manualEntry: boolean;
  };
}
```

---

## 🟡 Tarea 2: Análisis Previo y Línea de Base (Python Cloud Function)

Al registrarse, el usuario no empieza de cero. Usaremos Python para analizar su pasado.

### Lógica Científica (Python)
1.  **Trigger**: Al completarse la "Importación Inicial" en Firestore.
2.  **Cálculo de Promedio Ponderado**:
    *   No usaremos un promedio simple. Daremos más peso a las últimas 4 semanas para reflejar la condición actual.
3.  **Algoritmo de Metas Dinámicas**:
    ```python
    def calcular_nueva_meta(historial_semanas):
        baseline = calcular_promedio_ponderado(historial_semanas)
        # Principio de sobrecarga progresiva (15% es agresivo pero viable para caminata)
        nueva_meta = baseline * 1.15 
        return round(nueva_meta, -2) # Redondear a centenas (ej. 7500 pasos)
    ```
4.  **Detector de Sedentarismo**: Si `actividad_actual < (baseline * 0.7)`, disparar alerta `risk_level: "HIGH"`.

---

## 🔴 Tarea 3: Motor de Métricas y Ciencia del Ejercicio

Aquí convertimos datos crudos en "Insights" de valor.

### Métricas Clave
1.  **Economía de Caminata (Efficiency Score)**:
    *   Fórmula: `Velocidad (m/min) / Frecuencia Cardíaca (bpm)`.
    *   Si este ratio aumenta, significa que el usuario camina más rápido con menos esfuerzo.
2.  **METs (Metabolic Equivalent of Task)**:
    *   Usaremos la fórmula estándar: `Caminata moderada (4-6 km/h) = 3.5 METs`.
    *   `Minutos Activos Reales` = Tiempo acumulado donde METs > 3.0.
3.  **Proyección de Salud (Gamificación Científica)**:
    *   Utilizaremos tablas de conversión de riesgo basadas en estudios (ej. *Harvard Alumni Study*).
    *   "Por cada hora caminada vigorosamente, estadísticamente reduces tu riesgo cardiovascular un X%".

---

## �️ Tarea Crítica: Seguridad y Validación Anti-Fraude

Para garantizar la integridad de los datos de la Ibero Puebla y evitar simulaciones ("agitar el teléfono"):

### Algoritmo de Validación Cruzada (Sensor + GPS)
1.  **Principio de "Desplazamiento Real"**:
    *   No basta con que el podómetro cuente pasos. Debe haber un cambio de coordenadas GPS concomitante.
2.  **Lógica "Shake-Guard"**:
    *   Cada minuto, el sistema compara:
        *   `Delta Pasos` (Sensor de movimiento).
        *   `Delta Distancia` (GPS).
    *   **Cálculo de Coherencia**: `Longitud de Zancada Calculada = Distancia GPS / Pasos`.
    *   **Regla de Rechazo**: Si `Longitud de Zancada < 10cm` (indicativo de agitar el dispositivo sin moverse), esos pasos se **descartan** de la meta oficial.
3.  **Filtrado de Velocidad**:
    *   Descartar tramos con `Velocidad > 25 km/h` (Usuario en coche/bici olvidó detener la actividad).

---

## �🔵 Tarea 4: Sistema de Exportación de Datos

Generación de reportes profesionales directamente desde el móvil.

### Stack de Exportación
1.  **PDF**: `react-native-html-to-pdf`.
    *   Permite diseñar el reporte usando HTML/CSS (que ya dominas) y convertirlo a PDF nativo.
2.  **CSV/JSON**: `react-native-fs` para escribir archivos planos.
3.  **Privacidad**:
    *   Selector simple en UI: `[x] Incluir datos biométricos` vs `[ ] Solo actividad física`.

---

## 🚀 ¿Cómo empezamos? (Roadmap Inicial)

Dado que esto requiere un entorno de desarrollo móvil (Xcode/Android Studio), te sugiero el siguiente plan de arranque:

1.  **Fase 0: Inicialización del Proyecto (Mañana)**
    *   Crear nuevo repo `ibero-walk-analytics`.
    *   Inicializar con **Expo (Managed Workflow)** para facilitar el desarrollo sin configurar Xcode manualmente al principio.
    *   Instalar dependencias clave: `expo-health-connect` (Android), `react-native-health` (iOS).

2.  **Fase 1: Prototipo de Extracción (Día 2-3)**
    *   Crear pantalla de "Permisos".
    *   Lograr imprimir en consola los pasos de ayer del iPhone de prueba.

3.  **Fase 2: Conexión con Python (Día 4)**
    *   Configurar Firebase Functions.
    *   Escribir el script básico de "Baseline".

¿Te gustaría que te genere la estructura de carpetas y el `package.json` inicial para este nuevo proyecto aquí mismo para que puedas revisarlo?
