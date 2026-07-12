# Guía de Integración de Salud (HealthKit / Google Fit)

Esta guía explica cómo integrar el conteo de pasos nativo desde iOS (HealthKit) y Android (Google Fit/Health Connect) usando Capacitor.

## 1. Instalación del Plugin

Para acceder a los datos de salud nativos, necesitas el plugin `@capgo/capacitor-health`.

Ejecuta el siguiente comando en tu terminal:

```bash
npm install @capgo/capacitor-health
npx cap sync
```

## 2. Configuración para iOS (HealthKit)

Para que la app pueda leer los pasos en iPhone, debes configurar Xcode:

1. Abre el proyecto en Xcode (`npx cap open ios`).
2. Selecciona tu **App Target**.
3. Ve a la pestaña **Signing & Capabilities**.
4. Haz clic en **+ Capability** y busca **HealthKit**. Añádelo.
5. Abre el archivo `Info.plist` y añade las siguientes claves (Descripción de uso):
   - key: `Privacy - Health Share Usage Description`
   - value: `Esta app necesita acceso a tus pasos para monitorear tu progreso de bienestar.`
   - key: `Privacy - Health Update Usage Description`
   - value: `Esta app necesita acceso para guardar tus sesiones de caminata.`

## 3. Configuración para Android (Health Connect)

1. Abre el archivo `android/app/src/main/AndroidManifest.xml`.
2. Añade los permisos dentro de `<manifest>`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<!-- Para Health Connect -->
<uses-permission android:name="android.permission.health.READ_STEPS"/>
```

## 4. Uso en la Aplicación

El archivo `js/native-health-integration.js` ya ha sido creado e incluido en tu proyecto.
Este script detecta automáticamente si la app está corriendo en un dispositivo nativo y trata de conectar con HealthKit o Google Fit.

### Flujo de Funcionamiento:

1. El usuario abre la sección "Mi Progreso de Caminatas".
2. Si es un móvil (iOS/Android), aparecerá un botón (o se ejecutará automáticamente) para "Sincronizar Salud".
3. Se pedirán permisos al usuario (la primera vez).
4. Se leerán los pasos de hoy y se actualizará el gráfico.

## 5. Solución de Problemas

- **Cero pasos:** Asegúrate de que los permisos estén otorgados en la configuración del teléfono (Configuración -> Salud -> Tu App).
- **Error de Plugin:** Si ves "Plugin CapacitorHealth no instalado" en la consola, asegúrate de haber ejecutado `npx cap sync` y recompilado la app nativa.
