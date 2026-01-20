#!/bin/bash

# IBERO ACTÍVATE - Script de Desarrollo iOS
# Este script facilita las tareas comunes de desarrollo para iOS

echo "🚀 IBERO ACTÍVATE - Herramientas de Desarrollo iOS"
echo "=================================================="
echo ""

# Función para mostrar el menú
show_menu() {
    echo "Selecciona una opción:"
    echo ""
    echo "1) 📱 Sincronizar cambios con iOS (cap sync ios)"
    echo "2) 🔨 Abrir proyecto en Xcode"
    echo "3) 🎨 Regenerar iconos y splash screens"
    echo "4) 🔄 Sincronizar y abrir Xcode"
    echo "5) 📦 Instalar/Actualizar dependencias"
    echo "6) 🧹 Limpiar y reconstruir"
    echo "7) ℹ️  Ver información del proyecto"
    echo "8) 🚪 Salir"
    echo ""
    echo -n "Opción: "
}

# Función para sincronizar
sync_ios() {
    echo ""
    echo "📱 Sincronizando cambios con iOS..."
    npx cap sync ios
    echo "✅ Sincronización completada"
}

# Función para abrir Xcode
open_xcode() {
    echo ""
    echo "🔨 Abriendo proyecto en Xcode..."
    npx cap open ios
}

# Función para regenerar assets
regenerate_assets() {
    echo ""
    echo "🎨 Regenerando iconos y splash screens..."
    npx capacitor-assets generate --ios
    echo "✅ Assets regenerados"
}

# Función para instalar dependencias
install_deps() {
    echo ""
    echo "📦 Instalando/Actualizando dependencias..."
    npm install
    echo "✅ Dependencias actualizadas"
}

# Función para limpiar y reconstruir
clean_rebuild() {
    echo ""
    echo "🧹 Limpiando proyecto..."
    rm -rf ios/App/App/public
    rm -rf node_modules/.cache
    echo "📦 Reinstalando dependencias..."
    npm install
    echo "📱 Sincronizando con iOS..."
    npx cap sync ios
    echo "✅ Proyecto limpio y reconstruido"
}

# Función para mostrar información
show_info() {
    echo ""
    echo "ℹ️  Información del Proyecto"
    echo "============================"
    echo ""
    echo "📱 App ID: com.ibero.activate"
    echo "📝 Nombre: Ibero Activate"
    echo "🌐 Web Dir: www"
    echo ""
    echo "🔌 Plugins instalados:"
    echo "  - @capacitor/core"
    echo "  - @capacitor/assets"
    echo "  - @capacitor-mlkit/barcode-scanning"
    echo ""
    echo "📂 Estructura de assets:"
    echo "  - assets/icon.png (1024x1024)"
    echo "  - assets/splash.png (2732x2732)"
    echo ""
    echo "📋 Archivos importantes:"
    echo "  - capacitor.config.json"
    echo "  - ios/App/App/Info.plist"
    echo "  - css/main.css (Safe Areas configuradas)"
    echo "  - js/qr-scanner.js (Utilidad de escaneo QR)"
    echo ""
}

# Loop principal
while true; do
    show_menu
    read option
    
    case $option in
        1)
            sync_ios
            ;;
        2)
            open_xcode
            ;;
        3)
            regenerate_assets
            ;;
        4)
            sync_ios
            open_xcode
            ;;
        5)
            install_deps
            ;;
        6)
            clean_rebuild
            ;;
        7)
            show_info
            ;;
        8)
            echo ""
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Opción inválida. Por favor selecciona 1-8."
            ;;
    esac
    
    echo ""
    echo "Presiona Enter para continuar..."
    read
    clear
done
