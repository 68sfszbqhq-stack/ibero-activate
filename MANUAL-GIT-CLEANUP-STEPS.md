# LIMPIEZA MANUAL DE HISTORIAL GIT - PASOS DETALLADOS

## Pre-requisitos
cd "/Users/josemendoza/proyecto ibero 2026"

## 1. Verificar estado limpio
git status
# Si hay cambios, commitearlos o descartarlos

## 2. Remover firebase-config.js del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/firebase-config.js" \
  --prune-empty --tag-name-filter cat -- --all

## 3. Remover archivos PHP del historial
for file in test_ansiedad.php test_burnout.php test_depresion.php test_estres.php; do
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch $file" \
    --prune-empty --tag-name-filter cat -- --all
done

## 4. Remover backup
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/wellness.js.backup" \
  --prune-empty --tag-name-filter cat -- --all

## 5. Limpiar referencias
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

## 6. Verificar
git log --all --oneline -- js/firebase-config.js
# Debe estar vacío

## 7. Ver tamaño del repo
du -sh .git
