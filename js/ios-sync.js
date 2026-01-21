/**
 * ========================================
 * RECEPTOR DE DATOS DESDE ATAJO DE IPHONE
 * ========================================
 * IBERO ACTÍVATE - Sincronización de Bienestar iOS
 * 
 * Este script captura datos de Apple Health enviados
 * a través de un Atajo de iOS (Shortcut)
 */

(function () {
    'use strict';

    console.log('🍎 iOS Sync Receptor cargado');

    // ========================================
    // CAPTURAR DATOS DE LA URL
    // ========================================
    function capturarDatosDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);

        const pasos = urlParams.get('pasos');
        const km = urlParams.get('km');
        const kcal = urlParams.get('kcal');
        const minutos = urlParams.get('minutos'); // Para caminata continua

        // Si detectamos datos del iPhone
        if (pasos) {
            console.log('📱 Datos recibidos desde iPhone:', { pasos, km, kcal, minutos });

            // Autocompletar formulario
            autocompletarFormulario(pasos, km, kcal, minutos);

            // Mostrar confirmación visual
            mostrarConfirmacionSync(pasos);

            // Intentar guardado automático
            intentarGuardadoAutomatico(pasos, km, kcal, minutos);

            // Limpiar URL para que no se queden los parámetros
            limpiarURL();
        }
    }

    // ========================================
    // AUTOCOMPLETAR FORMULARIO
    // ========================================
    function autocompletarFormulario(pasos, km, kcal, minutos) {
        // Campos del formulario de entrada manual
        const stepInput = document.getElementById('manual-steps');
        const durationInput = document.getElementById('manual-duration');
        const continuousCheckbox = document.getElementById('continuous-walk');

        if (stepInput) {
            stepInput.value = pasos;
            console.log('✅ Campo de pasos autocompletado:', pasos);
        }

        if (durationInput && minutos) {
            durationInput.value = minutos;
            console.log('✅ Campo de duración autocompletado:', minutos);
        }

        // Si la caminata fue de 15+ minutos, marcar como continua
        if (continuousCheckbox && minutos && parseInt(minutos) >= 15) {
            continuousCheckbox.checked = true;
            console.log('✅ Marcado como caminata continua');
        }

        // Resaltar los campos autocompletados
        if (stepInput) {
            stepInput.style.background = '#d1fae5';
            stepInput.style.borderColor = '#10b981';
            setTimeout(() => {
                stepInput.style.background = '';
                stepInput.style.borderColor = '';
            }, 3000);
        }
    }

    // ========================================
    // GUARDADO AUTOMÁTICO
    // ========================================
    function intentarGuardadoAutomatico(pasos, km, kcal, minutos) {
        // Esperar a que Firebase esté listo
        if (typeof auth === 'undefined') {
            console.warn('⚠️ Firebase Auth no disponible aún');
            return;
        }

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    await autoGuardarDatosSalud(user, pasos, km, kcal, minutos);
                } catch (error) {
                    console.error('❌ Error en guardado automático:', error);
                    mostrarToast('Datos recibidos. Haz clic en "Guardar" para confirmar.', 'info');
                }
            } else {
                console.log('ℹ️ Usuario no autenticado - esperando login');
                mostrarToast('¡Datos recibidos! Inicia sesión para guardarlos.', 'warning');
            }
        });
    }

    async function autoGuardarDatosSalud(user, steps, distance, calories, duration) {
        console.log('💾 Intentando guardado automático...');

        const userDoc = await db.collection('users').doc(user.uid).get();
        const userEmail = userDoc.data()?.email || user.email;

        const today = new Date().toISOString().split('T')[0];
        const isContinuous = duration && parseInt(duration) >= 15;

        const walkingData = {
            collaboratorEmail: userEmail,
            date: today,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metrics: {
                steps: parseInt(steps),
                distance_km: parseFloat(distance) || estimateDistance(steps),
                calories: parseInt(calories) || estimateCalories(steps, duration),
                duration_mins: parseInt(duration) || 0,
                intensity: 'moderate'
            },
            physiological: {
                avg_heart_rate: null,
                max_heart_rate: null
            },
            source: 'AppleHealth_Shortcut',
            is_continuous: isContinuous,
            meets_goal: parseInt(steps) >= 7000
        };

        // Guardar en walking_stats
        await db.collection('walking_stats').add(walkingData);

        // Actualizar wellness_records
        const statsRef = db.collection('wellness_records').doc(userEmail);
        const statsDoc = await statsRef.get();
        const currentStats = statsDoc.exists ? statsDoc.data() : {};

        if (!currentStats.daily_stats) {
            currentStats.daily_stats = {};
        }

        currentStats.daily_stats[today] = {
            steps: parseInt(steps),
            continuous_walk_minutes: parseInt(duration) || 0,
            calories: walkingData.metrics.calories,
            distance_km: walkingData.metrics.distance_km,
            source: 'AppleHealth_Shortcut',
            is_continuous: isContinuous,
            meets_goal: walkingData.meets_goal
        };

        await statsRef.set({
            ...currentStats,
            last_sync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Guardado automático exitoso');
        mostrarToast(`¡Sincronizado! ${steps} pasos guardados automáticamente`, 'success');

        // Recargar dashboard si existe la función
        if (typeof loadWalkingDashboard === 'function') {
            setTimeout(() => loadWalkingDashboard(), 1000);
        }
    }

    // ========================================
    // UTILIDADES
    // ========================================
    function estimateDistance(steps) {
        return (parseInt(steps) / 1250).toFixed(2);
    }

    function estimateCalories(steps, duration) {
        let calories = parseInt(steps) * 0.04;
        if (duration && parseInt(duration) >= 15) {
            calories *= 1.2; // Bonus por intensidad continua
        }
        return Math.round(calories);
    }

    function limpiarURL() {
        // Remover parámetros de la URL sin recargar la página
        const cleanURL = window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
        console.log('🧹 URL limpiada');
    }

    // ========================================
    // FEEDBACK VISUAL
    // ========================================
    function mostrarConfirmacionSync(pasos) {
        const toast = document.createElement('div');
        toast.className = 'ios-sync-toast';
        toast.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 16px;
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 15px;
                animation: slideIn 0.3s ease-out;
                max-width: 350px;
            ">
                <i class="fa-brands fa-apple" style="font-size: 2rem;"></i>
                <div>
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">
                        ¡Sincronizado con iPhone!
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.95;">
                        <strong>${parseInt(pasos).toLocaleString()}</strong> pasos importados desde Apple Health
                    </div>
                </div>
            </div>
        `;

        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Remover después de 5 segundos
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease-out';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    function mostrarToast(message, type = 'info') {
        // Usar el sistema de toasts existente si está disponible
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`Toast [${type}]:`, message);
        }
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    document.addEventListener('DOMContentLoaded', capturarDatosDesdeURL);

    // También ejecutar inmediatamente por si DOMContentLoaded ya pasó
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(capturarDatosDesdeURL, 100);
    }

})();
