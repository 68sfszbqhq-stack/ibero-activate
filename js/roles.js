// Sistema de Roles y Permisos

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
function getUserRole(email) {
    return USER_ROLES[email] || 'viewer';  // Por defecto viewer
}

// Verificar si el usuario tiene un permiso específico
function hasPermission(permission) {
    const user = auth.currentUser;
    if (!user) return false;

    const role = getUserRole(user.email);
    const permissions = ROLE_PERMISSIONS[role];

    return permissions[permission] || false;
}

// Aplicar restricciones de UI basadas en permisos
function applyRoleRestrictions() {
    const user = auth.currentUser;
    if (!user) return;

    const role = getUserRole(user.email);
    console.log(`Usuario: ${user.email} | Rol: ${role}`);

    // Si es viewer, ocultar/deshabilitar elementos de edición
    if (role === 'viewer') {
        // Ocultar botones de crear
        document.querySelectorAll('[data-action="create"], .btn-create, #btn-new-activity, #btn-import-catalog').forEach(btn => {
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

        // Ocultar botones de eliminar
        document.querySelectorAll('[data-action="delete"], .btn-delete, .delete-btn').forEach(btn => {
            if (btn) {
                btn.style.display = 'none';
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
    }
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

// Aplicar restricciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Esperar un poco para que el DOM se renderice completamente
            setTimeout(() => {
                applyRoleRestrictions();
            }, 500);
        }
    });
});

// Exportar funciones para uso global
window.getUserRole = getUserRole;
window.hasPermission = hasPermission;
window.applyRoleRestrictions = applyRoleRestrictions;
