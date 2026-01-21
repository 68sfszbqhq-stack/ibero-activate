#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE DE REGLAS FIRESTORE
# ========================================
# Despliega las reglas de seguridad a Firebase

echo "🔥 Desplegando reglas de Firestore..."
echo ""

# Verificar que firebase-tools esté instalado
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI no está instalado"
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

# Login a Firebase (si no está logueado)
echo "🔐 Verificando autenticación..."
firebase login --reauth

# Desplegar solo las reglas de Firestore
echo ""
echo "📤 Desplegando reglas de Firestore..."
firebase deploy --only firestore:rules

echo ""
echo "✅ ¡Reglas desplegadas exitosamente!"
echo ""
echo "🔍 Verifica en:"
echo "https://console.firebase.google.com/project/ibero-activate-2025/firestore/rules"
