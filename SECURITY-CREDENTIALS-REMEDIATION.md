# 🚨 PLAN DE REMEDIACIÓN - CREDENCIALES EXPUESTAS

## ⚠️ SITUACIÓN ACTUAL

**Fecha de Detección:** 2026-01-14  
**Severidad:** 🔴 CRÍTICA  
**Estado:** Credenciales de Firebase expuestas públicamente en Git

---

## 📋 RESUMEN EJECUTIVO

Tu repositorio Git contiene **credenciales de Firebase** que han sido commiteadas **20+ veces** en el historial. Si este repositorio es público (GitHub, GitLab, Bitbucket), tus credenciales están **EXPUESTAS A INTERNET**.

### Archivos Comprometidos:
1. ✅ `js/firebase-config.js` - **CRÍTICO** (API keys de Firebase)
2. ⚠️ `test_*.php` - Tests de salud mental (algoritmos potencialmente sensibles)
3. ⚠️ `js/wellness.js.backup` - Código duplicado innecesario

---

## 🎯 PLAN DE ACCIÓN INMEDIATA

### PASO 1: Verificar Estado del Repositorio (AHORA MISMO)

```bash
# Verificar si el repo es público o privado
cd "/Users/josemendoza/proyecto ibero 2026"
git remote -v

# Si usas GitHub
# Ir a: https://github.com/[usuario]/[repo]/settings
# Verificar si dice "Public" o "Private"
```

**DECISIÓN:**
- ✅ **Si es PRIVADO:** Menor riesgo, pero aún debes limpiar
- 🚨 **Si es PÚBLICO:** ACCIÓN INMEDIATA REQUERIDA

---

### PASO 2: Rotar Credenciales de Firebase (URGENTE si es público)

#### 2.1. Crear Nueva Configuración de Firebase

1. **Ir a Firebase Console:**
   - https://console.firebase.google.com/
   - Proyecto: `pausas-activas-ibero-2026`

2. **Opción A: Crear Nuevo Proyecto (MÁS SEGURO)**
   ```
   - Clic en "Add project"
   - Nombre: ibero-activate-2026-secure
   - Migrar datos si es necesario
   ```

3. **Opción B: Regenerar API Key (RÁPIDO pero menos seguro)**
   ```
   - Project Settings → General
   - Eliminar la app web actual
   - Crear nueva app web
   - Copiar NUEVA configuración
   ```

#### 2.2. Actualizar Configuración Local

**OPCIÓN RECOMENDADA: Usar Variables de Entorno**

Crear archivo `/js/firebase-config-template.js`:
```javascript
// TEMPLATE - No commitear credenciales reales aquí
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abc123"
};
```

Crear archivo `.env.local` (NO commitear):
```env
FIREBASE_API_KEY=AIzaSy[NUEVA_KEY_AQUI]
FIREBASE_AUTH_DOMAIN=pausas-activas-ibero-2026.firebaseapp.com
FIREBASE_PROJECT_ID=pausas-activas-ibero-2026
FIREBASE_STORAGE_BUCKET=pausas-activas-ibero-2026.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=358840395060
FIREBASE_APP_ID=1:358840395060:web:[NUEVO_APP_ID]
```

#### 2.3. Aplicar Restricciones de API Key

**En Firebase Console → Credentials:**
```
1. Seleccionar API Key
2. Application restrictions:
   - HTTP referrers
   - Agregar: 
     - https://tu-dominio.com/*
     - http://localhost:* (solo desarrollo)

3. API restrictions:
   - Restrict key
   - Seleccionar solo:
     ✓ Cloud Firestore API
     ✓ Firebase Authentication API
     ✓ Identity Toolkit API
```

---

### PASO 3: Limpiar Historial de Git (CRÍTICO)

⚠️ **ADVERTENCIA:** Esto reescribe el historial de Git. Coordina con tu equipo.

#### Opción A: BFG Repo-Cleaner (RECOMENDADO)

```bash
# Instalar BFG
brew install bfg  # macOS
# o descargar de: https://rtyley.github.io/bfg-repo-cleaner/

# Hacer backup
cp -r "/Users/josemendoza/proyecto ibero 2026" "/Users/josemendoza/proyecto-ibero-2026-BACKUP"

# Clonar mirror
cd /tmp
git clone --mirror [URL_DE_TU_REPO] repo-mirror.git
cd repo-mirror.git

# Remover archivo sensible
bfg --delete-files firebase-config.js

# Limpiar y forzar push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### Opción B: git-filter-repo (ALTERNATIVA)

```bash
# Instalar
pip3 install git-filter-repo

# Backup
cp -r "/Users/josemendoza/proyecto ibero 2026" "/Users/josemendoza/proyecto-ibero-2026-BACKUP"

cd "/Users/josemendoza/proyecto ibero 2026"

# Remover archivo
git filter-repo --path js/firebase-config.js --invert-paths

# Force push (si ya está en remote)
git push origin --force --all
git push origin --force --tags
```

#### Opción C: Empezar de Cero (MÁS SIMPLE SI ES PRIVADO)

```bash
# 1. Hacer backup de archivos importantes
cp -r "/Users/josemendoza/proyecto ibero 2026" "/Users/josemendoza/proyecto-backup-$(date +%Y%m%d)"

# 2. Eliminar .git
cd "/Users/josemendoza/proyecto ibero 2026"
rm -rf .git

# 3. Inicializar nuevo repo
git init
git add .
git commit -m "Initial commit - credenciales rotadas"

# 4. Push a nuevo remote (o force al existente)
git remote add origin [URL]
git push -u origin main --force
```

---

### PASO 4: Verificar y Prevenir Futuras Exposiciones

#### 4.1. Actualizar .gitignore

✅ **YA HECHO** - Nuevo `.gitignore` creado con protecciones robustas

#### 4.2. Pre-commit Hook (Prevención Automática)

Crear `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Verificar si se está intentando commitear archivos sensibles
FILES_PATTERN='(firebase-config\.js|\.env|secrets|credentials|api.*key)'
FOUND=$(git diff --cached --name-only | grep -E "$FILES_PATTERN")

if [ -n "$FOUND" ]; then
    echo "❌ ERROR: Intentando commitear archivos sensibles:"
    echo "$FOUND"
    echo ""
    echo "Estos archivos NO deben ser commiteados."
    echo "Agrégalos a .gitignore o usa variables de entorno."
    exit 1
fi

# Verificar si hay API keys en el contenido
if git diff --cached | grep -qE "AIza[0-9A-Za-z_-]{35}"; then
    echo "❌ ERROR: Detectada posible API key de Google en los cambios"
    echo "No commitees API keys directamente en el código."
    exit 1
fi

exit 0
```

Hacer ejecutable:
```bash
chmod +x .git/hooks/pre-commit
```

#### 4.3. Escanear Repositorio con Git-Secrets

```bash
# Instalar
brew install git-secrets

# Configurar
cd "/Users/josemendoza/proyecto ibero 2026"
git secrets --install
git secrets --register-aws  # Detecta AWS keys
git secrets --add 'AIza[0-9A-Za-z_-]{35}'  # Firebase API keys
git secrets --add 'apiKey.*:.*"[^"]*"'  # Patterns de API keys

# Escanear historial completo
git secrets --scan-history
```

---

## 📊 CHECKLIST DE REMEDIACIÓN

### Inmediato (Hoy)
- [ ] Verificar si el repositorio es público o privado
- [ ] Si es público: Hacerlo privado INMEDIATAMENTE
- [ ] Rotar API key de Firebase
- [ ] Aplicar restricciones de dominio a la nueva API key
- [ ] Crear archivo `.env.local` con nuevas credenciales
- [ ] Actualizar `firebase-config.js` para usar variables de entorno

### Corto Plazo (Esta Semana)
- [ ] Limpiar historial de Git con BFG o git-filter-repo
- [ ] Force push del repositorio limpio
- [ ] Instalar pre-commit hooks
- [ ] instalar git-secrets
- [ ] Escanear todo el repositorio con git-secrets
- [ ] Revisar logs de acceso en Firebase Console

### Mediano Plazo (Este Mes)
- [ ] Implementar CI/CD con secret scanning
- [ ] Documentar proceso de manejo de credenciales para el equipo
- [ ] Configurar alertas de seguridad en Firebase
- [ ] Realizar auditoría de seguridad completa
- [ ] Capacitar al equipo en mejores prácticas de Git

---

## 🛡️ MEJORES PRÁCTICAS FUTURAS

### 1. NUNCA Commitear Credenciales
```javascript
// ❌ MAL
const apiKey = "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4";

// ✅ BIEN
const apiKey = process.env.FIREBASE_API_KEY;
```

### 2. Usar .env Files
```bash
# .env.local (NUNCA commitear)
FIREBASE_API_KEY=xxx
FIREBASE_PROJECT_ID=yyy

# .env.example (SÍ commitear como template)
FIREBASE_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project_id
```

### 3. Revisar Antes de Commitear
```bash
# SIEMPRE revisar qué estás commiteando
git diff --cached

# Verificar archivos staged
git status

# Buscar patrones sensibles
git diff --cached | grep -i "key\|secret\|password"
```

### 4. Usar Secret Scanning Tools
- GitHub Secret Scanning (si usas GitHub)
- GitGuardian
- TruffleHog
- git-secrets

---

## 📞 RECURSOS Y AYUDA

### Documentación
- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

### Herramientas
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- git-filter-repo: https://github.com/newren/git-filter-repo
- git-secrets: https://github.com/awslabs/git-secrets
- GitGuardian: https://www.gitguardian.com/

### Contacto de Emergencia
Si detectas acceso no autorizado:
1. Cambiar TODAS las credenciales inmediatamente
2. Revisar logs de Firebase Console
3. Contactar soporte de Firebase si es necesario
4. Documentar el incidente

---

## ✅ ESTADO ACTUAL

### Completado
- ✅ `.gitignore` mejorado creado
- ✅ Archivos sensibles identificados
- ✅ Plan de remediación documentado

### Pendiente (Requiere tu acción)
- ⏳ Verificar privacidad del repositorio
- ⏳ Rotar credenciales de Firebase
- ⏳ Limpiar historial de Git
- ⏳ Implementar pre-commit hooks

---

**PRÓXIMA ACCIÓN REQUERIDA:**  
Ejecutar el PASO 1 inmediatamente para verificar si tu repositorio es público.

```bash
cd "/Users/josemendoza/proyecto ibero 2026"
git remote -v
# Luego verificar en la plataforma (GitHub/GitLab) si es Public o Private
```

**Autor:** Security Team  
**Fecha:** 2026-01-14  
**Prioridad:** 🔴 CRÍTICA
