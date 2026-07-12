#!/bin/bash

# ========================================
# Script: Refactorizar colores en CSS a variables
# ========================================

echo "🎨 Refactorizando colores en admin.css..."

FILE="css/admin.css"

# Hacer backup
cp "$FILE" "$FILE.backup"

# Reemplazos de colores IBERO
sed -i '' 's/#C1272D/var(--color-brand)/g' "$FILE"
sed -i '' 's/#c1272d/var(--color-brand)/g' "$FILE"
sed -i '' 's/#c4161c/var(--color-brand)/g' "$FILE"
sed -i '' 's/#9e1216/var(--color-brand-hover)/g' "$FILE"

# Reemplazos de colores primarios (morado/índigo)
sed -i '' 's/#5B68C8/var(--color-primary)/g' "$FILE"
sed -i '' 's/#7C6FD6/var(--color-primary)/g' "$FILE"
sed -i '' 's/#4F5AC7/var(--color-primary)/g' "$FILE"
sed -i '' 's/#667eea/var(--color-primary)/g' "$FILE"
sed -i '' 's/#764ba2/var(--color-primary)/g' "$FILE"

# Reemplazos de colores de éxito (verde)
sed -i '' 's/#1AAB8A/var(--color-success)/g' "$FILE"
sed -i '' 's/#2DBFA0/var(--color-success)/g' "$FILE"
sed -i '' 's/#10B981/var(--color-success)/g' "$FILE"
sed -i '' 's/#16a34a/var(--color-success)/g' "$FILE"
sed -i '' 's/#0f763a/var(--color-success-hover)/g' "$FILE"

# Reemplazos de colores de advertencia (amarillo/naranja)
sed -i '' 's/#F6A323/var(--color-warning)/g' "$FILE"
sed -i '' 's/#FF9800/var(--color-warning)/g' "$FILE"
sed -i '' 's/#F59E0B/var(--color-warning)/g' "$FILE"
sed -i '' 's/#eab308/var(--color-warning)/g' "$FILE"
sed -i '' 's/#ca8a04/var(--color-warning-dark)/g' "$FILE"

# Reemplazos de colores de error/peligro (rojo)
sed -i '' 's/#E74C3C/var(--color-danger)/g' "$FILE"
sed -i '' 's/#EF4444/var(--color-danger)/g' "$FILE"
sed -i '' 's/#dc2626/var(--color-danger)/g' "$FILE"

# Reemplazos de textos
sed -i '' 's/#111827/var(--color-text)/g' "$FILE"
sed -i '' 's/#1f2937/var(--color-text)/g' "$FILE"
sed -i '' 's/#6B7280/var(--color-text-muted)/g' "$FILE"
sed -i '' 's/#6b7280/var(--color-text-muted)/g' "$FILE"
sed -i '' 's/#9CA3AF/var(--color-text-light)/g' "$FILE"

# Reemplazos de fondos
sed -i '' 's/#F8F9FA/var(--color-bg)/g' "$FILE"
sed -i '' 's/#fdf2f2/var(--color-bg)/g' "$FILE"
sed -i '' 's/#F3F4F6/var(--color-bg-secondary)/g' "$FILE"
sed -i '' 's/#f3f4f6/var(--color-bg-secondary)/g' "$FILE"
sed -i '' 's/#F9FAFB/var(--color-bg-hover)/g' "$FILE"

# Reemplazos de bordes
sed -i '' 's/#E5E7EB/var(--color-border)/g' "$FILE"
sed -i '' 's/#e5e7eb/var(--color-border)/g' "$FILE"
sed -i '' 's/#D1D5DB/var(--color-border-dark)/g' "$FILE"
sed -i '' 's/#d1d5db/var(--color-border-dark)/g' "$FILE"

echo "✅ Reemplazos completados!"
echo "📊 Diferencias:"
diff -u "$FILE.backup" "$FILE" | head -50

echo ""
echo "💡 Backup guardado en: $FILE.backup"
