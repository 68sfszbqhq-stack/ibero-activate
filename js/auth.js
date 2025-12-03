// Lógica de Autenticación

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // Verificar estado de autenticación
    auth.onAuthStateChanged(user => {
        const currentPath = window.location.pathname;

        if (user) {
            // Usuario logueado
            console.log('Usuario autenticado:', user.email);

            // Si estamos en login, redirigir al dashboard
            if (currentPath.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Usuario no logueado
            console.log('Usuario no autenticado');

            // Si estamos en una página protegida (no login), redirigir a login
            if (currentPath.includes('admin/') && !currentPath.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });

    // Manejar envío del formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Resetear errores
            errorMessage.classList.add('hidden');
            errorMessage.textContent = '';

            // Loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando...';

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // La redirección la maneja onAuthStateChanged
            } catch (error) {
                console.error('Error de login:', error);

                let msg = 'Error al iniciar sesión.';

                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        msg = 'Correo o contraseña incorrectos.';
                        break;
                    case 'auth/invalid-email':
                        msg = 'El formato del correo no es válido.';
                        break;
                    case 'auth/too-many-requests':
                        msg = 'Demasiados intentos fallidos. Intenta más tarde.';
                        break;
                }

                errorMessage.textContent = msg;
                errorMessage.classList.remove('hidden');

                // Restaurar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});

// Función de Logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
}
