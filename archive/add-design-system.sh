#!/bin/bash

# ========================================
# Script: Agregar design-system.css a todos los HTMLs
# ========================================

echo "🎨 Agregando design-system.css a archivos HTML..."

# Función para procesar cada archivo HTML
process_html() {
    local file=$1
    
    # Verificar si ya tiene design-system.css
    if grep -q "design-system.css" "$file"; then
        echo "  ⏭️  $file - Ya tiene design-system.css"
        return
    fi
    
    # Buscar la línea de main.css y agregar design-system.css ANTES
    if grep -q 'href="../css/main.css"' "$file"; then
        # Crear backup
        cp "$file" "$file.backup"
        
        # Agregar design-system.css antes de main.css
        sed -i '' 's|<link rel="stylesheet" href="../css/main.css">|<link rel="stylesheet" href="../css/design-system.css">\
    <link rel="stylesheet" href="../css/main.css">|g' "$file"
        
        echo "  ✅ $file - Actualizado"
    elif grep -q 'href="css/main.css"' "$file"; then
        # Para archivos en la raíz
        cp "$file" "$file.backup"
        
        sed -i '' 's|<link rel="stylesheet" href="css/main.css">|<link rel="stylesheet" href="css/design-system.css">\
    <link rel="stylesheet" href="css/main.css">|g' "$file"
        
        echo "  ✅ $file - Actualizado"
    else
        echo "  ⚠️  $file - No encontró main.css"
    fi
}

# Contador
count=0

# Procesar archivos en /admin
echo ""
echo "📁 Procesando /admin..."
for file in admin/*.html; do
    if [ -f "$file" ]; then
        process_html "$file"
        ((count++))
    fi
done

# Procesar archivos en /employee
echo ""
echo "📁 Procesando /employee..."
for file in employee/*.html; do
    if [ -f "$file" ]; then
        process_html "$file"
        ((count++))
    fi
done

# Procesar archivos en raíz (si existen)
echo ""
echo "📁 Procesando raíz..."
for file in *.html; do
    if [ -f "$file" ]; then
        process_html "$file"
        ((count++))
    fi
done

echo ""
echo "✅ Proceso completado!"
echo "📊 Total de archivos procesados: $count"
echo ""
echo "💡 Los archivos originales fueron respaldados con extensión .backup"
echo "💡 Puedes eliminar los backups con: find . -name '*.backup' -delete"
