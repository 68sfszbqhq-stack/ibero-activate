# Configuración de Firebase Admin SDK para Scripts de Migración

## Pasos para configurar

### 1. Generar Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **pausas-activas-ibero-2026**
3. Ve a **⚙️ Configuración del Proyecto** > **Cuentas de Servicio**
4. Haz clic en **Generar nueva clave privada**
5. Se descargará un archivo JSON

### 2. Guardar el archivo de credenciales

Renombra el archivo descargado a `firebase-service-account.json` y colócalo en la raíz del proyecto:

```
proyecto ibero 2026/
├── firebase-service-account.json  ← AQUÍ
├── scripts/
│   ├── migration-backup.js
│   ├── migrate-to-subcollections.js
│   └── validate-migration.js
└── ...
```

⚠️ **IMPORTANTE**: Este archivo contiene credenciales sensibles. Asegúrate de que está en `.gitignore`:

```bash
echo "firebase-service-account.json" >> .gitignore
```

### 3. Instalar dependencias

Los scripts requieren el SDK de Firebase Admin:

```bash
npm install firebase-admin
```

### 4. Ejecutar scripts

Una vez configurado, puedes ejecutar:

```bash
# Backup
node scripts/migration-backup.js

# Migración (dry-run primero)
node scripts/migrate-to-subcollections.js --dry-run

# Migración real
node scripts/migrate-to-subcollections.js --execute

# Validación
node scripts/validate-migration.js
```

## Estructura de archivos

```
proyecto ibero 2026/
├── firebase-service-account.json (gitignored)
├── scripts/
│   ├── migration-backup.js
│   ├── migrate-to-subcollections.js
│   └── validate-migration.js
├── backups/
│   └── YYYY-MM-DD/
│       ├── attendances.json
│       ├── wellness_tests.json
│       ├── feedbacks.json
│       └── summary.json
└── migration-logs/
    ├── migration_dryrun_123456789.json
    └── migration_exec_123456790.json
```

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"

```bash
npm install firebase-admin
```

### Error: "ENOENT: no such file or directory, open '../firebase-service-account.json'"

Asegúrate de que el archivo `firebase-service-account.json` esté en la raíz del proyecto.

### Error: "Permission denied"

Verifica que la cuenta de servicio tenga permisos de lectura/escritura en Firestore:
- Firebase Console → Firestore Database → Reglas
- La cuenta de servicio tiene permisos de administrador automáticamente
