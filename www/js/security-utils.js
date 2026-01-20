/**
 * SECURITY UTILITIES - IBERO ACTÍVATE
 * Funciones de sanitización y validación para prevenir vulnerabilidades XSS
 * @version 1.0.0
 * @author Security Team
 */

// ========================================
// 1. SANITIZACIÓN DE HTML
// ========================================

/**
 * Sanitiza una cadena de texto eliminando tags HTML peligrosos
 * Permite solo tags seguros para formato básico
 * @param {string} dirty - Texto potencialmente inseguro
 * @returns {string} Texto sanitizado
 */
function sanitizeHTML(dirty) {
    if (!dirty || typeof dirty !== 'string') return '';
    
    // Lista blanca de tags permitidos (solo formato básico)
    const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'span'];
    const allowedAttributes = ['class', 'id'];
    
    const tempDiv = document.createElement('div');
    tempDiv.textContent = dirty; // Esto escapa automáticamente
    let sanitized = tempDiv.innerHTML;
    
    // Remover tags peligrosos (script, iframe, object, embed, etc.)
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi, // event handlers
        /javascript:/gi,
        /data:text\/html/gi
    ];
    
    dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
}

/**
 * Escapa texto plano para usar de forma segura en HTML
 * Convierte caracteres especiales en entidades HTML
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHTML(text) {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Sanitiza y formatea markdown a HTML seguro
 * Útil para contenido de AI (Gemini) que necesita formato
 * @param {string} markdown - Texto en formato markdown
 * @returns {string} HTML sanitizado
 */
function sanitizeMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') return '';
    
    // Primero escapar todo el HTML
    let sanitized = escapeHTML(markdown);
    
    // Aplicar formato markdown de forma segura
    // Headers (ya escapados, solo agregamos tags)
    sanitized = sanitized
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold y cursiva (con texto ya escapado)
    sanitized = sanitized
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Listas (preservando el escapado)
    sanitized = sanitized.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Envolver items de lista en <ul>
    sanitized = sanitized.replace(/(<li>.*<\/li>)/gs, match => {
        // Verificar si no está ya dentro de un <ul>
        return `<ul>${match}</ul>`;
    });
    
    // Limpiar <ul> duplicados
    sanitized = sanitized.replace(/<\/ul>\s*<ul>/g, '');
    
    // Párrafos (dividir por doble salto de línea)
    const paragraphs = sanitized.split(/\n\n+/);
    sanitized = paragraphs.map(p => {
        p = p.trim();
        // Si ya es un tag de bloque, no envolver
        if (p.match(/^<(h[1-6]|ul|ol|li)/)) return p;
        return p ? `<p>${p}</p>` : '';
    }).join('\n');
    
    return sanitized;
}

// ========================================
// 2. VALIDACIÓN DE DATOS
// ========================================

/**
 * Valida y sanitiza un número de cuenta de empleado
 * @param {string} accountNumber - Número de cuenta
 * @returns {string|null} Número sanitizado o null si inválido
 */
function validateAccountNumber(accountNumber) {
    if (!accountNumber) return null;
    
    // Remover caracteres no numéricos
    const cleaned = accountNumber.toString().replace(/\D/g, '');
    
    // Validar longitud (ajusta según tu sistema)
    if (cleaned.length < 4 || cleaned.length > 12) return null;
    
    return cleaned;
}

/**
 * Valida y sanitiza un email
 * @param {string} email - Dirección de email
 * @returns {string|null} Email sanitizado o null si inválido
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') return null;
    
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    return emailRegex.test(cleaned) ? cleaned : null;
}

/**
 * Valida y sanitiza un comentario de feedback
 * @param {string} comment - Comentario del usuario
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {string} Comentario sanitizado
 */
function validateComment(comment, maxLength = 500) {
    if (!comment || typeof comment !== 'string') return '';
    
    // Remover espacios al inicio/final
    let sanitized = comment.trim();
    
    // Limitar longitud
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Escapar HTML pero permitir saltos de línea
    sanitized = escapeHTML(sanitized);
    
    // Prevenir inyecciones SQL (aunque Firestore no es SQL, buena práctica)
    const sqlPatterns = [/;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)\s/gi];
    sqlPatterns.forEach(pattern => {
        if (pattern.test(sanitized)) {
            sanitized = sanitized.replace(pattern, '');
        }
    });
    
    return sanitized;
}

/**
 * Valida que un rating esté en el rango permitido
 * @param {number} rating - Calificación
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number|null} Rating válido o null
 */
function validateRating(rating, min = 1, max = 5) {
    const num = parseInt(rating);
    if (isNaN(num) || num < min || num > max) return null;
    return num;
}

// ========================================
// 3. CREACIÓN SEGURA DE ELEMENTOS DOM
// ========================================

/**
 * Crea un elemento DOM de forma segura sin usar innerHTML
 * @param {string} tag - Tag HTML del elemento
 * @param {Object} attributes - Atributos del elemento
 * @param {string|HTMLElement|Array} content - Contenido (texto o hijos)
 * @returns {HTMLElement} Elemento creado
 */
function createSafeElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Agregar atributos de forma segura
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'dataset') {
            Object.keys(attributes[key]).forEach(dataKey => {
                element.dataset[dataKey] = attributes[key][dataKey];
            });
        } else if (key.startsWith('on')) {
            // Eventos como funciones, no strings
            if (typeof attributes[key] === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
            }
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    // Agregar contenido de forma segura
    if (content !== null && content !== undefined) {
        if (typeof content === 'string') {
            element.textContent = content; // textContent auto-escapa
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
    }
    
    return element;
}

/**
 * Actualiza el contenido de un elemento de forma segura
 * @param {string|HTMLElement} elementOrId - Elemento o ID del elemento
 * @param {string} content - Contenido (será escapado automáticamente)
 * @param {boolean} allowHTML - Si es true, usa sanitizeHTML en lugar de textContent
 */
function updateElementSafely(elementOrId, content, allowHTML = false) {
    const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId) 
        : elementOrId;
    
    if (!element) {
        console.warn('Elemento no encontrado:', elementOrId);
        return;
    }
    
    if (allowHTML) {
        element.innerHTML = sanitizeHTML(content);
    } else {
        element.textContent = content;
    }
}

// ========================================
// 4. UTILIDADES ESPECÍFICAS DEL PROYECTO
// ========================================

/**
 * Sanitiza datos de empleado antes de mostrar
 * @param {Object} employee - Datos del empleado
 * @returns {Object} Empleado con datos sanitizados
 */
function sanitizeEmployeeData(employee) {
    if (!employee || typeof employee !== 'object') return {};
    
    return {
        id: validateAccountNumber(employee.id) || 'unknown',
        name: escapeHTML(employee.name || 'Sin nombre'),
        accountNumber: validateAccountNumber(employee.accountNumber) || '',
        area: escapeHTML(employee.area || ''),
        email: validateEmail(employee.email) || '',
        points: parseInt(employee.points) || 0
    };
}

/**
 * Formatea de forma segura el resultado de Gemini AI
 * @param {string} aiResponse - Respuesta de Gemini
 * @returns {string} HTML sanitizado y formateado
 */
function formatAIResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') return '<p>No hay respuesta disponible</p>';
    
    return sanitizeMarkdown(aiResponse);
}

// ========================================
// 5. LOGGER DE SEGURIDAD
// ========================================

const SecurityLogger = {
    log(event, details = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[SECURITY] ${timestamp} - ${event}`, details);
        
        // En producción, enviar a un servicio de logging
        // firebase.analytics().logEvent('security_event', { event, ...details });
    },
    
    warn(event, details = {}) {
        const timestamp = new Date().toISOString();
        console.warn(`[SECURITY WARNING] ${timestamp} - ${event}`, details);
    },
    
    error(event, details = {}) {
        const timestamp = new Date().toISOString();
        console.error(`[SECURITY ERROR] ${timestamp} - ${event}`, details);
        
        // En producción, alertar al equipo
    }
};

// ========================================
// EXPORTAR FUNCIONES (si usas módulos)
// O hacer disponibles globalmente
// ========================================

// Para compatibilidad con scripts actuales, exponemos globalmente
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        sanitizeHTML,
        escapeHTML,
        sanitizeMarkdown,
        validateAccountNumber,
        validateEmail,
        validateComment,
        validateRating,
        createSafeElement,
        updateElementSafely,
        sanitizeEmployeeData,
        formatAIResponse,
        SecurityLogger
    };
}

// Logging de inicialización
console.log('🛡️ Security Utils cargados correctamente');
