// Sistema de Roles y Permisos
(function () {
    'use strict';

    // Configuración de usuarios con roles
    const USER_ROLES = {
        '716276@iberopuebla.mx': 'admin',  // Tu usuario - admin completo
        '710029@iberopuebla.mx': 'viewer'  // Jefe - solo lectura
        // Agrega más usuarios aquí según sea necesario
    };

    // Permisos por rol
    const ROLE_PERMISSIONS = {
        admin: {
            canEdit: true,
            canDelete: true,
            canCreate: true,
            canExport: true,
            canViewReports: true,
            canManageEmployees: true
        },
        viewer: {
            canEdit: false,
            canDelete: false,
            canCreate: false,
            canExport: true,  // Puede descargar PDFs
            canViewReports: true,  // Puede ver reportes
            canManageEmployees: false
        }
    };

    // Obtener rol del usuario actual
    window.getUserRole = function (email) {
        return USER_ROLES[email] || 'viewer';  // Por defecto viewer
    };

    // Verificar si el usuario tiene un permiso específico
    window.hasPermission = function (permission) {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase Auth no está disponible aún');
            return false;
        }

        const user = firebase.auth().currentUser;
        if (!user) return false;

        const role = getUserRole(user.email);
        const permissions = ROLE_PERMISSIONS[role];

        return permissions[permission] || false;
    };

    // Aplicar restricciones de UI basadas en permisos
    function applyRoleRestrictions() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase Auth no está disponible en applyRoleRestrictions');
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) return;

        const role = getUserRole(user.email);
        console.log(`Usuario: ${user.email} | Rol: ${role}`);

        // Si es viewer, ocultar/deshabilitar elementos de edición
        if (role === 'viewer') {
            // SOLUCIÓN DEFINITIVA: Inyectar CSS para ocultar elementos del menú
            // Esto es más robusto que manipular el DOM con JavaScript
            const styleId = 'viewer-restrictions-style';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    /* Ocultar elementos del menú para viewers */
                    .nav-menu a[href="attendance.html"],
                    .nav-menu a[href="attendance-late.html"],
                    .nav-menu a[href="employees.html"] {
                        display: none !important;
                    }
                    
                    /* Ocultar el nav-item completo */
                    .nav-menu a[href="attendance.html"].nav-link,
                    .nav-menu a[href="attendance-late.html"].nav-link,
                    .nav-menu a[href="employees.html"].nav-link {
                        display: none !important;
                    }
                    
                    /* Ocultar el li padre también */
                    .nav-item:has(a[href="attendance.html"]),
                    .nav-item:has(a[href="attendance-late.html"]),
                    .nav-item:has(a[href="employees.html"]) {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
                console.log('✅ CSS de restricciones de viewer inyectado');
            }

            // Ocultar botones de crear
            document.querySelectorAll('[data-action="create"], .btn-create, #btn-new-activity, #btn-import-catalog').forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                }
            });

            // Ocultar botones de acción específicos de páginas
            document.querySelectorAll('#generate-report-btn, #btn-no-attendance, #qr-btn').forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                }
            });

            // Ocultar botones de editar
            document.querySelectorAll('[data-action="edit"], .btn-edit, .edit-btn').forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                }
            });

            // Ocultar botones de eliminar (INCLUYENDO LOS DINÁMICOS)
            document.querySelectorAll('[data-action="delete"], .btn-delete, .delete-btn, .btn-delete-activity, .btn-delete-compact').forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                    btn.remove(); // Eliminar completamente del DOM
                }
            });

            // Deshabilitar inputs en formularios
            document.querySelectorAll('input, textarea, select').forEach(input => {
                if (!input.closest('.search-box')) {  // No deshabilitar búsqueda
                    input.disabled = true;
                    input.style.cursor = 'not-allowed';
                    input.style.opacity = '0.6';
                }
            });

            // Agregar badge de "Solo Lectura"
            const sidebar = document.querySelector('.sidebar-header');
            if (sidebar && !document.getElementById('viewer-badge')) {
                const badge = document.createElement('div');
                badge.id = 'viewer-badge';
                badge.style.cssText = `
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                text-align: center;
                font-size: 0.75rem;
                font-weight: 700;
                margin-top: 0.5rem;
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
            `;
                badge.innerHTML = '<i class="fa-solid fa-eye"></i> MODO SOLO LECTURA';
                sidebar.appendChild(badge);
            }

            // Mostrar notificación
            showViewerNotification();

            // Observar cambios en el DOM para aplicar restricciones a elementos dinámicos
            observeDOMChanges(role);
        }
    }

    // Observar cambios en el DOM para contenido dinámico
    function observeDOMChanges(role) {
        if (role !== 'viewer') return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Es un elemento
                        // Ocultar botones de eliminar que se agreguen dinámicamente
                        if (node.classList && (
                            node.classList.contains('btn-delete-activity') ||
                            node.classList.contains('btn-delete') ||
                            node.classList.contains('delete-btn') ||
                            node.classList.contains('btn-delete-compact')
                        )) {
                            node.remove();
                        }

                        // Buscar botones de eliminar dentro del nodo agregado
                        if (node.querySelectorAll) {
                            node.querySelectorAll('.btn-delete-activity, .btn-delete, .delete-btn, .btn-delete-compact').forEach(btn => {
                                btn.remove();
                            });
                        }
                    }
                });
            });
        });

        // Observar todo el body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Mostrar notificación de modo solo lectura
    function showViewerNotification() {
        if (sessionStorage.getItem('viewerNotificationShown')) return;

        const notification = document.createElement('div');
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        z-index: 10000;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
    `;
        notification.innerHTML = `
        <i class="fa-solid fa-eye" style="font-size: 1.25rem;"></i>
        <div>
            <div style="font-size: 0.9rem;">Modo Solo Lectura</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">No puedes editar información</div>
        </div>
    `;

        document.body.appendChild(notification);

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

        // Ocultar después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        sessionStorage.setItem('viewerNotificationShown', 'true');
    }

    // Aplicar restricciones cuando el DOM esté listo y Firebase Auth esté disponible
    function initializeRoleRestrictions() {
        // Esperar a que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase no está disponible, reintentando en 100ms...');
            setTimeout(initializeRoleRestrictions, 100);
            return;
        }

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('✅ Usuario autenticado:', user.email);
                console.log('✅ Rol:', getUserRole(user.email));

                // Aplicar inmediatamente
                applyRoleRestrictions();

                // Reaplicar varias veces para asegurar que se aplique
                setTimeout(() => applyRoleRestrictions(), 500);
                setTimeout(() => applyRoleRestrictions(), 1000);
                setTimeout(() => applyRoleRestrictions(), 2000);
            }
        });
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRoleRestrictions);
    } else {
        initializeRoleRestrictions();
    }

    // Exportar funciones para uso global
    window.applyRoleRestrictions = applyRoleRestrictions;

})(); // Fin de la función auto-ejecutable
