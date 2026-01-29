/**
 * native-health-integration.js
 * Módulo para integración con HealthKit (iOS) y Google Fit (Android) vía Capacitor
 * Requiere el plugin: @capgo/capacitor-health
 */

const NativeHealth = {
    // Verificar si estamos en un entorno nativo (iOS/Android)
    isNative: function () {
        return window.Capacitor && (window.Capacitor.getPlatform() === 'ios' || window.Capacitor.getPlatform() === 'android');
    },

    // Inicializar y pedir permisos
    async requestPermissions() {
        if (!this.isNative()) {
            console.log('No es un entorno nativo, saltando permisos de salud nativos.');
            return false;
        }

        try {
            // Verificar si el plugin está disponible
            if (!window.Capacitor.Plugins.CapacitorHealth) {
                console.warn('Plugin CapacitorHealth no instalado. Ejecuta: npm install @capgo/capacitor-health');
                return false;
            }

            const { CapacitorHealth } = window.Capacitor.Plugins;

            // Solicitar permisos de lectura para Pasos
            const result = await CapacitorHealth.requestAuthorization({
                read: ['steps', 'calories', 'distance'], // Permisos de lectura
                all: [], // Permisos de escritura (si fuera necesario)
            });

            console.log('Permisos de salud solicitados:', result);
            return true;
        } catch (error) {
            console.error('Error al solicitar permisos de salud:', error);
            return false;
        }
    },

    // Obtener pasos de hoy
    async getTodaySteps() {
        if (!this.isNative() || !window.Capacitor.Plugins.CapacitorHealth) {
            return null;
        }

        try {
            const { CapacitorHealth } = window.Capacitor.Plugins;

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Consultar datos agregados
            const result = await CapacitorHealth.queryAggregated({
                startDate: startOfDay.toISOString(),
                endDate: now.toISOString(),
                dataType: 'steps',
                bucket: 'day'
            });

            console.log('Datos de salud nativos obtenidos:', result);

            // Procesar resultado (depende de la estructura exacta del plugin, ajustamos según documentación común)
            // Normalmente devuelve un array de buckets
            let totalSteps = 0;
            if (result && result.value) {
                totalSteps = result.value; // Caso simple
            } else if (result && Array.isArray(result)) {
                totalSteps = result.reduce((acc, curr) => acc + (curr.value || 0), 0);
            }

            return totalSteps;
        } catch (error) {
            console.error('Error al obtener pasos nativos:', error);
            return null;
        }
    }
};

// Exponer globalmente
window.NativeHealth = NativeHealth;
