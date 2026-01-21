// ========================================
// HEALTH ONBOARDING UI - FASE 2
// ========================================
// Maneja la interfaz del modal de onboarding de salud
// Incluye navegación de pasos, validación y calculadora de IMC en vivo

let currentStep = 1;
const totalSteps = 4;
let formData = {};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    initializeOnboarding();
    setupEventListeners();
    updateProgress();
});

function initializeOnboarding() {
    // Verificar si el usuario ya tiene perfil
    checkExistingProfile();

    // Configurar fecha máxima (18 años atrás)
    const birthDateInput = document.getElementById('birth_date');
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    birthDateInput.max = eighteenYearsAgo.toISOString().split('T')[0];
}

async function checkExistingProfile() {
    try {
        const user = auth.currentUser;
        if (!user) {
            // Solo esperar a que se autentique, NO redirigir
            console.log('⏳ Esperando autenticación...');
            return;
        }

        const needsOnboarding = await window.healthProfile.needsHealthOnboarding();
        if (!needsOnboarding) {
            // Ya tiene perfil, redirigir al dashboard de macrociclo
            window.location.href = 'macrocycle-dashboard.html';
        }
    } catch (error) {
        console.error('Error al verificar perfil:', error);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Botones de navegación
    document.getElementById('btn-next').addEventListener('click', nextStep);
    document.getElementById('btn-prev').addEventListener('click', prevStep);
    document.getElementById('btn-submit').addEventListener('click', submitForm);

    // Calculadora de IMC en vivo
    document.getElementById('height_cm').addEventListener('input', updateBMICalculator);
    document.getElementById('weight_initial').addEventListener('input', updateBMICalculator);

    // Cálculo de edad
    document.getElementById('birth_date').addEventListener('change', updateAgeDisplay);

    // Validación en tiempo real
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
    });
}

// ========================================
// NAVEGACIÓN DE PASOS
// ========================================
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }

    saveCurrentStepData();

    if (currentStep < totalSteps) {
        // Ocultar paso actual
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');

        // Avanzar
        currentStep++;

        // Mostrar nuevo paso
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

        // Actualizar UI
        updateProgress();
        updateNavigationButtons();

        // Si es el último paso, mostrar resumen
        if (currentStep === totalSteps) {
            updateSummary();
        }

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    if (currentStep > 1) {
        // Ocultar paso actual
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');

        // Retroceder
        currentStep--;

        // Mostrar paso anterior
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

        // Actualizar UI
        updateProgress();
        updateNavigationButtons();

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-step').textContent = currentStep;
}

function updateNavigationButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');

    // Botón anterior
    btnPrev.style.display = currentStep > 1 ? 'flex' : 'none';

    // Botón siguiente vs submit
    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'flex';
    } else {
        btnNext.style.display = 'flex';
        btnSubmit.style.display = 'none';
    }
}

// ========================================
// VALIDACIÓN
// ========================================
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredInputs = currentStepElement.querySelectorAll('[required]');

    let isValid = true;

    requiredInputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });

    if (!isValid) {
        showToast('Por favor completa todos los campos requeridos', 'warning');
    }

    return isValid;
}

function validateField(event) {
    const input = event.target;
    const value = input.value.trim();

    // Limpiar errores previos
    input.classList.remove('error');
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Validar según tipo
    if (input.hasAttribute('required') && !value) {
        showFieldError(input, 'Este campo es requerido');
        return false;
    }

    if (input.type === 'number') {
        const num = parseFloat(value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        if (isNaN(num)) {
            showFieldError(input, 'Ingresa un número válido');
            return false;
        }

        if (min && num < min) {
            showFieldError(input, `El valor mínimo es ${min}`);
            return false;
        }

        if (max && num > max) {
            showFieldError(input, `El valor máximo es ${max}`);
            return false;
        }
    }

    if (input.type === 'date' && value) {
        const date = new Date(value);
        const maxDate = new Date(input.max);

        if (date > maxDate) {
            showFieldError(input, 'Debes tener al menos 18 años');
            return false;
        }
    }

    return true;
}

function showFieldError(input, message) {
    input.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    input.parentElement.appendChild(errorDiv);
}

// ========================================
// CALCULADORA DE IMC EN VIVO
// ========================================
function updateBMICalculator() {
    const height = parseFloat(document.getElementById('height_cm').value);
    const weight = parseFloat(document.getElementById('weight_initial').value);

    if (!height || !weight || height < 100 || weight < 30) {
        document.getElementById('bmi-calculator').style.display = 'none';
        return;
    }

    // Calcular IMC
    const bmiData = window.healthProfile.calculateBMI(weight, height);
    const idealRange = window.healthProfile.calculateIdealWeightRange(height);

    // Mostrar calculadora
    document.getElementById('bmi-calculator').style.display = 'block';

    // Actualizar valores
    document.getElementById('bmi-value').textContent = bmiData.value;
    document.getElementById('bmi-category').textContent = bmiData.category;
    document.getElementById('bmi-category').style.color = bmiData.color;

    // Actualizar indicador visual
    const indicator = document.getElementById('bmi-indicator');
    let position = 0;

    if (bmiData.value < 18.5) {
        position = (bmiData.value / 18.5) * 20;
    } else if (bmiData.value < 25) {
        position = 20 + ((bmiData.value - 18.5) / 6.5) * 30;
    } else if (bmiData.value < 30) {
        position = 50 + ((bmiData.value - 25) / 5) * 25;
    } else {
        position = Math.min(75 + ((bmiData.value - 30) / 10) * 25, 100);
    }

    indicator.style.left = `${position}%`;
    indicator.style.backgroundColor = bmiData.color;

    // Actualizar rango ideal
    if (idealRange) {
        document.getElementById('ideal-range').textContent =
            `${idealRange.min} - ${idealRange.max} kg`;
    }

    // Guardar para el resumen
    formData.bmi = bmiData;
    formData.idealRange = idealRange;
}

// ========================================
// CÁLCULO DE EDAD
// ========================================
function updateAgeDisplay() {
    const birthDate = document.getElementById('birth_date').value;
    if (!birthDate) return;

    const age = window.healthProfile.calculateAge(birthDate);
    const ageDisplay = document.getElementById('age-display');

    if (age) {
        ageDisplay.textContent = `${age} años`;
        ageDisplay.style.color = '#10b981';
        formData.age = age;
    }
}

// ========================================
// GUARDAR DATOS DEL PASO ACTUAL
// ========================================
function saveCurrentStepData() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else {
            formData[input.name] = input.value;
        }
    });
}

// ========================================
// ACTUALIZAR RESUMEN
// ========================================
function updateSummary() {
    // Datos personales
    const genderMap = { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' };
    document.getElementById('summary-gender').textContent = genderMap[formData.gender] || '--';
    document.getElementById('summary-age').textContent = formData.age ? `${formData.age} años` : '--';
    document.getElementById('summary-blood').textContent = formData.blood_type || 'No especificado';

    // Datos biométricos
    document.getElementById('summary-height').textContent = formData.height_cm ? `${formData.height_cm} cm` : '--';
    document.getElementById('summary-weight').textContent = formData.weight_initial ? `${formData.weight_initial} kg` : '--';

    if (formData.bmi) {
        const bmiElement = document.getElementById('summary-bmi');
        bmiElement.textContent = `${formData.bmi.value} (${formData.bmi.category})`;
        bmiElement.style.backgroundColor = formData.bmi.color;
        bmiElement.style.color = 'white';
        bmiElement.style.padding = '4px 12px';
        bmiElement.style.borderRadius = '12px';
    }

    // Condiciones médicas
    const conditions = [];
    const conditionLabels = {
        diabetes: 'Diabetes',
        hypertension: 'Hipertensión',
        asthma: 'Asma',
        back_injury: 'Lesión de Espalda',
        heart_disease: 'Enfermedad Cardíaca'
    };

    Object.keys(conditionLabels).forEach(key => {
        if (formData[key]) {
            conditions.push(conditionLabels[key]);
        }
    });

    if (formData.other_conditions) {
        conditions.push(formData.other_conditions);
    }

    const conditionsContainer = document.getElementById('summary-conditions');
    if (conditions.length > 0) {
        conditionsContainer.innerHTML = conditions.map(c =>
            `<div class="condition-tag"><i class="fas fa-check-circle"></i> ${c}</div>`
        ).join('');
    } else {
        conditionsContainer.innerHTML = '<p class="text-muted">Ninguna condición seleccionada</p>';
    }
}

// ========================================
// ENVIAR FORMULARIO
// ========================================
async function submitForm(event) {
    event.preventDefault();

    // Guardar datos del último paso
    saveCurrentStepData();

    // Mostrar loading
    document.getElementById('loading-overlay').style.display = 'flex';

    try {
        // Crear perfil de salud
        const result = await window.healthProfile.createHealthProfile(formData);

        if (result.success) {
            showToast('¡Perfil de salud creado exitosamente!', 'success');

            // Esperar 1 segundo y redirigir
            setTimeout(() => {
                window.location.href = 'macrocycle-dashboard.html';
            }, 1500);
        } else {
            throw new Error(result.error || 'Error al crear perfil');
        }

    } catch (error) {
        console.error('Error al crear perfil:', error);
        showToast('Error al crear tu perfil. Intenta de nuevo.', 'error');
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Mostrar
    setTimeout(() => toast.classList.add('show'), 100);

    // Ocultar y remover
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
