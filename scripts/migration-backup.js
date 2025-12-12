/**
 * SCRIPT DE BACKUP DE FIRESTORE
 * 
 * Exporta las colecciones actuales (attendances, wellness_tests, feedbacks)
 * a archivos JSON locales como respaldo antes de la migración.
 * 
 * USO:
 *   node scripts/migration-backup.js
 * 
 * SALIDA:
 *   - backups/attendances_YYYY-MM-DD.json
 *   - backups/wellness_tests_YYYY-MM-DD.json
 *   - backups/feedbacks_YYYY-MM-DD.json
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Inicializar Firebase Admin (requiere service account key)
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'pausas-activas-ibero-2026'
});

const db = admin.firestore();

// Colecciones a respaldar
const COLLECTIONS = ['attendances', 'wellness_tests', 'feedbacks', 'employees'];

async function createBackup() {
    console.log('🔄 Iniciando backup de Firestore...\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(__dirname, '..', 'backups', timestamp);

    // Crear directorio de backups
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`📁 Directorio de backup: ${backupDir}\n`);

    for (const collectionName of COLLECTIONS) {
        try {
            console.log(`📥 Exportando ${collectionName}...`);

            const snapshot = await db.collection(collectionName).get();
            const data = [];

            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            const filename = path.join(backupDir, `${collectionName}.json`);
            await fs.writeFile(filename, JSON.stringify(data, null, 2));

            console.log(`   ✅ ${data.length} documentos exportados`);

        } catch (error) {
            console.error(`   ❌ Error exportando ${collectionName}:`, error.message);
        }
    }

    // Crear resumen
    const summary = {
        timestamp: new Date().toISOString(),
        collections: COLLECTIONS,
        backupPath: backupDir
    };

    await fs.writeFile(
        path.join(backupDir, 'summary.json'),
        JSON.stringify(summary, null, 2)
    );

    console.log('\n✨ Backup completado exitosamente!');
    console.log(`📦 Archivos guardados en: ${backupDir}`);

    process.exit(0);
}

// Ejecutar
createBackup().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
