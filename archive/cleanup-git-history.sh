#!/bin/bash

# ========================================
# SCRIPT DE LIMPIEZA DE HISTORIAL GIT
# Remueve archivos sensibles del historial
# ========================================

set -e  # Exit on error

echo "🧹 Iniciando limpieza de historial de Git..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# CONFIGURACIÓN
# ========================================

# Archivos a remover del historial
FILES_TO_REMOVE=(
    "js/firebase-config.js"
    "js/wellness.js.backup"
    "test_ansiedad.php"
    "test_burnout.php"
    "test_depresion.php"
    "test_estres.php"
)

# ========================================
# PRE-CHECKS
# ========================================

echo -e "${YELLOW}⚠️  ADVERTENCIAS:${NC}"
echo "  1. Esto reescribirá el historial de Git"
echo "  2. Todos los commits cambiarán sus SHA"
echo "  3. Requerirás force push al remote"
echo "  4. El backup ya fue creado"
echo ""

read -p "¿Estás seguro de continuar? (escriba 'SI' en mayúsculas): " confirm
if [ "$confirm" != "SI" ]; then
    echo -e "${RED}❌ Operación cancelada${NC}"
    exit 1
fi

# Verificar que estamos en un repo git
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: No estás en la raíz de un repositorio Git${NC}"
    exit 1
fi

# ========================================
# MÉTODO 1: Git Filter-Branch (Built-in)
# ========================================

echo ""
echo -e "${GREEN}📦 Paso 1: Preparando limpieza...${NC}"

# Verificar estado limpio
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: Tienes cambios sin commitear${NC}"
    echo "Por favor, commitea o descarta tus cambios primero"
    exit 1
fi

echo -e "${GREEN}✅ Estado de Git limpio${NC}"

# ========================================
# REMOVER ARCHIVOS DEL HISTORIAL
# ========================================

echo ""
echo -e "${GREEN}📦 Paso 2: Removiendo archivos sensibles del historial...${NC}"

for file in "${FILES_TO_REMOVE[@]}"; do
    echo "  Procesando: $file"
    
    # Verificar si el archivo existe en el historial
    if git log --all --pretty=format: --name-only --diff-filter=A | grep -q "^$file$"; then
        echo "    → Archivo encontrado en historial, removiendo..."
        
        # Remover del historial usando filter-branch
        git filter-branch --force --index-filter \
            "git rm --cached --ignore-unmatch '$file'" \
            --prune-empty --tag-name-filter cat -- --all 2>&1 | grep -v "^Rewrite" || true
        
        echo -e "    ${GREEN}✅ Removido${NC}"
    else
        echo "    → No encontrado en historial (puede ser nuevo)"
    fi
done

# ========================================
# LIMPIEZA Y OPTIMIZACIÓN
# ========================================

echo ""
echo -e "${GREEN}📦 Paso 3: Limpiando refs y optimizando...${NC}"

# Limpiar refs del filter-branch
rm -rf .git/refs/original/

# Expirar reflog
git reflog expire --expire=now --all

# Garbage collection agresivo
git gc --prune=now --aggressive

echo -e "${GREEN}✅ Limpieza completada${NC}"

# ========================================
# VERIFICACIÓN
# ========================================

echo ""
echo -e "${GREEN}📦 Paso 4: Verificando resultados...${NC}"

all_clean=true
for file in "${FILES_TO_REMOVE[@]}"; do
    if git log --all --pretty=format: --name-only | grep -q "^$file$"; then
        echo -e "  ${RED}⚠️  $file AÚN está en el historial${NC}"
        all_clean=false
    else
        echo -e "  ${GREEN}✅ $file removido exitosamente${NC}"
    fi
done

# ========================================
# RESULTADOS Y PRÓXIMOS PASOS
# ========================================

echo ""
echo "========================================="
if [ "$all_clean" = true ]; then
    echo -e "${GREEN}✅ LIMPIEZA EXITOSA${NC}"
else
    echo -e "${YELLOW}⚠️  LIMPIEZA PARCIAL${NC}"
    echo "Algunos archivos pueden requerir limpieza manual"
fi
echo "========================================="

echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASOS IMPORTANTES:${NC}"
echo ""
echo "1. Verificar cambios localmente:"
echo "   git log --oneline --all | head -20"
echo ""
echo "2. Crear archivo .env.local con nuevas credenciales:"
echo "   (Ver SECURITY-CREDENTIALS-REMEDIATION.md)"
echo ""
echo "3. Actualizar firebase-config.js para usar variables de entorno"
echo ""
echo "4. Force push al remote (⚠️ DESTRUCTIVO):"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "5. Notificar a colaboradores (si los hay) que deben:"
echo "   - Hacer backup de sus cambios locales"
echo "   - Eliminar su copia local"
echo "   - Re-clonar el repositorio"
echo ""
echo -e "${YELLOW}⚠️  NO OLVIDES:${NC}"
echo "  - Rotar las API keys de Firebase"
echo "  - Verificar restricciones de dominio en Firebase Console"
echo "  - Configurar pre-commit hooks"
echo ""

# Mostrar tamaño del repositorio
echo "📊 Tamaño del repositorio:"
du -sh .git
echo ""

echo -e "${GREEN}✅ Script completado${NC}"
echo ""
echo "¿Listo para hacer force push? Revisa los pasos anteriores primero."
