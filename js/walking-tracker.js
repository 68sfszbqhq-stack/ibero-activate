// ========================================
// WALKING TRACKER - Evidence-Based Wellness
// ========================================
// Basado en investigación científica:
// - 7,000 pasos/día = reducción óptima de mortalidad
// - 15+ minutos continuos = beneficio cardiovascular adicional
// - Integración con GPS Nativo Web para cálculo preciso

const WALKING_GOALS = {
    DAILY_STEPS: 7000,
    CONTINUOUS_MINUTES: 15,
    STRIDE_LENGTH_METERS: 0.74 // Promedio ajustable
};

// ========================================
// CLASE GPS TRACKER (Web Geolocation API)
// ========================================
class GPSTracker {
    constructor() {
        this.watchId = null;
        this.isTracking = false;
        this.startTime = null;
        this.pathPoints = [];

        // Métricas en tiempo real
        this.totalDistanceKm = 0;
        this.totalSteps = 0;
        this.currentCadence = 0; // Pasos por minuto
        this.currentSpeedKmh = 0;

        // Configuración
        this.minAccuracyMeters = 50; // Ignorar puntos con mala precisión
        this.minDisplacementMeters = 2; // Ignorar micromovimientos (ruido GPS)
    }

    start(onUpdateCallback) {
        if (!navigator.geolocation) {
            console.error("Geolocalización no soportada");
            return false;
        }

        this.isTracking = true;
        this.startTime = Date.now();
        this.pathPoints = [];
        this.totalDistanceKm = 0;
        this.totalSteps = 0;
        this.currentCadence = 0;

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this._handlePositionUpdate(position, onUpdateCallback),
            (error) => this._handleError(error),
            options
        );

        console.log("📡 GPS Traking Iniciado");
        return true;
    }

    stop() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
        const durationMin = (Date.now() - this.startTime) / 60000;

        console.log(`🛑 GPS Detenido. Distancia: ${this.totalDistanceKm.toFixed(2)}km, Pasos: ${this.totalSteps}`);

        return {
            distance_km: parseFloat(this.totalDistanceKm.toFixed(3)),
            steps: this.totalSteps,
            duration_minutes: Math.ceil(durationMin),
            avg_cadence: durationMin > 0 ? Math.round(this.totalSteps / durationMin) : 0,
            path: this.pathPoints // Para guardar ruta si se desea
        };
    }

    _handlePositionUpdate(position, callback) {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;

        // Filtrar lectura pobre
        if (accuracy > this.minAccuracyMeters) return;

        const newPoint = { lat: latitude, lng: longitude, time: timestamp };

        if (this.pathPoints.length > 0) {
            const lastPoint = this.pathPoints[this.pathPoints.length - 1];

            // Distancia Haversine entre puntos
            const distKm = this._calculateHaversine(
                lastPoint.lat, lastPoint.lng,
                latitude, longitude
            );
            const distMeters = distKm * 1000;

            // Filtro de ruido: Mínimo desplazamiento y velocidad lógica (< 25km/h para caminar/correr)
            const timeDiffSec = (timestamp - lastPoint.time) / 1000;
            const speedKmh = (distKm / (timeDiffSec / 3600));

            if (distMeters >= this.minDisplacementMeters && speedKmh < 25) {
                this.totalDistanceKm += distKm;

                // Estimación de Pasos
                // Se asume zancada promedio. Se podría calibrar por usuario.
                // Ajuste dinámico: menor zancada a menor velocidad? Por ahora constante.
                const newSteps = Math.round(distMeters / WALKING_GOALS.STRIDE_LENGTH_METERS);
                this.totalSteps += newSteps;

                // Cálculo de Cadencia Instantánea (pasos/min)
                if (timeDiffSec > 0) {
                    this.currentCadence = Math.round((newSteps / timeDiffSec) * 60);
                    this.currentSpeedKmh = speedKmh;
                }

                this.pathPoints.push(newPoint);

                // Notificar a la UI
                if (callback) {
                    callback({
                        distance: this.totalDistanceKm.toFixed(2),
                        steps: this.totalSteps,
                        cadence: this.currentCadence,
                        speed: this.currentSpeedKmh.toFixed(1)
                    });
                }
            }
        } else {
            // Primer punto
            this.pathPoints.push(newPoint);
        }
    }

    _handleError(error) {
        console.warn(`GPS Error (${error.code}): ${error.message}`);
    }

    _calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio Tierra km
        const dLat = this._deg2rad(lat2 - lat1);
        const dLon = this._deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    _deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

// Instancia Global
const gpsTracker = new GPSTracker();


// ========================================
// VALIDACIÓN DE ACTIVACIÓN (Seguridad)
// ========================================
async function verifyEmployeeActivation(employeeId) {
    if (!employeeId) return false;
    try {
        const employeeDoc = await db.collection('employees').doc(employeeId).get();
        if (!employeeDoc.exists) return false;

        const data = employeeDoc.data();
        if (data.status !== 'active') {
            console.warn(`Empleado ${employeeId} inactivo.`);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error verificando activación:", error);
        return false;
    }
}

// ========================================
// GUARDAR SESIÓN (CHI WALKING / TECH VALUES)
// ========================================
async function saveChiWalkingSession(completeSessionData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        // --- VALIDACIÓN DE EMPLEADO ---
        let currentEmployeeId = user.uid;
        const storedEmployee = localStorage.getItem('currentEmployee');
        if (storedEmployee) {
            currentEmployeeId = JSON.parse(storedEmployee).id;
        }

        const isActive = await verifyEmployeeActivation(currentEmployeeId);
        if (!isActive) {
            throw new Error('ACCESO DENEGADO: Tu usuario no está activo.');
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = user.email || userDoc.data()?.email;
        const today = new Date().toISOString().split('T')[0];

        // Calcular semana
        const weekNum = getWeekNumber(new Date());

        // Estructura Tech Values
        const techValues = {
            performance: {
                steps: parseInt(completeSessionData.steps || 0),
                distance_km: parseFloat(completeSessionData.distance || 0),
                duration_total_min: parseInt(completeSessionData.duration || 0),
                cadence_zpm: parseInt(completeSessionData.cadence || 0),
                gps_tracked: true
            },
            perception: {
                borg_scale: parseInt(completeSessionData.borgScale || 0),
                mood_pre: completeSessionData.moodPre || 'neutral',
                mood_post: completeSessionData.moodPost || 'neutral'
            },
            context: {
                weather: completeSessionData.weather || 'unknown',
                hydration: completeSessionData.hydration || 'unknown'
            },
            mindful: {
                gratitude_log: completeSessionData.gratitudeText || ""
            }
        };

        const sessionRecord = {
            collaboratorEmail: userEmail,
            employeeId: currentEmployeeId,
            date: today,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            session_id: `sem_${weekNum}_dia_${new Date().getDay()}`,
            tech_values: techValues,
            is_continuous: techValues.performance.duration_total_min >= WALKING_GOALS.CONTINUOUS_MINUTES,
            meets_step_goal: techValues.performance.steps >= WALKING_GOALS.DAILY_STEPS,
            type: 'CHI_WALKING_GPS'
        };

        // Guardar
        const docRef = await db.collection('walking_stats').add(sessionRecord);
        console.log('✅ Sesión GPS guardada:', docRef.id);

        // Subcolección Historial
        await db.collection('wellness_records')
            .doc(userEmail)
            .collection('chi_sessions')
            .doc(docRef.id)
            .set(sessionRecord);

        // Actualizar Dashboard Stats (Acumulativo)
        await updateUserWalkingStats(userEmail, sessionRecord);

        return { success: true, id: docRef.id };

    } catch (error) {
        console.error('❌ Error al guardar sesión:', error);
        return { success: false, error: error.message };
    }
}

// Actualizar Stats Diarios (Acumulativo)
async function updateUserWalkingStats(email, sessionRecord) {
    try {
        const statsRef = db.collection('wellness_records').doc(email);
        const statsDoc = await statsRef.get();
        const today = sessionRecord.date;
        const currentData = statsDoc.exists ? statsDoc.data() : { daily_stats: {} };

        if (!currentData.daily_stats) currentData.daily_stats = {};

        const existingDay = currentData.daily_stats[today] || { steps: 0, distance_km: 0, continuous_walk_minutes: 0 };

        // Sumar valores del día
        const newSteps = (existingDay.steps || 0) + sessionRecord.tech_values.performance.steps;
        const newDist = (existingDay.distance_km || 0) + sessionRecord.tech_values.performance.distance_km;
        const newDur = (existingDay.continuous_walk_minutes || 0) + sessionRecord.tech_values.performance.duration_total_min;

        currentData.daily_stats[today] = {
            steps: newSteps,
            distance_km: parseFloat(newDist.toFixed(2)),
            continuous_walk_minutes: newDur,
            is_continuous: newDur >= 15 || existingDay.is_continuous,
            meets_goal: newSteps >= 7000
        };

        await statsRef.set(currentData, { merge: true });
    } catch (e) {
        console.error("Error updating stats:", e);
    }
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Cargar Dashboard (Stub para compatibilidad)
async function loadWalkingDashboard() {
    const user = auth.currentUser;
    if (user && window.updateWalkingDashboardUI) {
        const doc = await db.collection('wellness_records').doc(user.email).get();
        if (doc.exists) window.updateWalkingDashboardUI(doc.data());
    }
}

// ========================================
// EXPORTAR FUNCIONES
// ========================================
// Se adjuntan al objeto window para acceso global si no es módulo
window.gpsTracker = gpsTracker;
window.saveChiWalkingSession = saveChiWalkingSession;
window.loadWalkingDashboard = loadWalkingDashboard;
