# IBERO ACTÍVATE

Sistema de asistencia y feedback para el programa de pausas activas de **IBERO Puebla**. Es la app del trabajo estable de José: la usan empleados reales de la universidad, no es un demo.

## Contexto de uso
- **Admin** (`/admin`): pase de lista por departamento, dashboards de asistencia, inventario, reportes exportables, periodización.
- **Empleado** (`/employee`): registra su participación, deja feedback con estrellas y comentarios, ve su progreso.
- Tiene gamificación: puntos, insignias y rachas. Eso es lo que sostiene la participación — al tocar esa lógica, cuidar que nadie pierda puntos ya ganados.

## Stack
HTML + CSS + JavaScript vanilla (sin framework). Firebase: Firestore + Auth. Capacitor para el build de iOS (`ios/`).

## Comandos
```bash
npm run dev          # servidor local en :8080
npm run backup       # respaldo antes de cualquier migración
npm run validate     # valida el estado de la migración
```

## Despliegue
Se publica en **GitHub Pages** al hacer push a `main`: https://68sfszbqhq-stack.github.io/ibero-activate/

## Reglas al trabajar aquí
- `firebase-service-account.json` es una llave real de administrador. Está en `.gitignore` y **nunca** debe commitearse ni imprimirse en pantalla.
- Los scripts de `scripts/` tocan datos de producción. Correr siempre `--dry-run` antes de `--execute`, y `npm run backup` antes de migrar.
- Hay tres copias del frontend (`/`, `www/`, `ios/App/App/public/`). Si cambias `js/firebase-config.js` o lógica compartida, verifica si hay que sincronizar las otras.
