/**
 * IBERO ACTÍVATE - QR Scanner Utility
 * Wrapper para el plugin nativo de escaneo de códigos QR/Barcode
 * Usa @capacitor-mlkit/barcode-scanning para iOS
 */

import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

/**
 * Verifica si el escáner está disponible en el dispositivo
 * @returns {Promise<boolean>}
 */
export async function isScannerAvailable() {
    try {
        const { supported } = await BarcodeScanner.isSupported();
        return supported;
    } catch (error) {
        console.error('Error checking scanner availability:', error);
        return false;
    }
}

/**
 * Verifica si la app tiene permisos de cámara
 * @returns {Promise<boolean>}
 */
export async function checkCameraPermission() {
    try {
        const { camera } = await BarcodeScanner.checkPermissions();
        return camera === 'granted';
    } catch (error) {
        console.error('Error checking camera permission:', error);
        return false;
    }
}

/**
 * Solicita permisos de cámara al usuario
 * @returns {Promise<boolean>} true si se otorgaron los permisos
 */
export async function requestCameraPermission() {
    try {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera === 'granted';
    } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
    }
}

/**
 * Escanea un código QR/Barcode
 * @returns {Promise<{success: boolean, data: string|null, error: string|null}>}
 */
export async function scanQRCode() {
    try {
        // Verificar disponibilidad
        const available = await isScannerAvailable();
        if (!available) {
            return {
                success: false,
                data: null,
                error: 'El escáner no está disponible en este dispositivo'
            };
        }

        // Verificar permisos
        let hasPermission = await checkCameraPermission();
        if (!hasPermission) {
            hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                return {
                    success: false,
                    data: null,
                    error: 'Se requieren permisos de cámara para escanear códigos QR'
                };
            }
        }

        // Iniciar escaneo
        const { barcodes } = await BarcodeScanner.scan();

        if (barcodes && barcodes.length > 0) {
            return {
                success: true,
                data: barcodes[0].rawValue,
                error: null
            };
        } else {
            return {
                success: false,
                data: null,
                error: 'No se detectó ningún código QR'
            };
        }
    } catch (error) {
        console.error('Error scanning QR code:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Error al escanear el código QR'
        };
    }
}

/**
 * Escanea un código QR con opciones personalizadas
 * @param {Object} options - Opciones de escaneo
 * @param {Array<string>} options.formats - Formatos a escanear (default: QR_CODE)
 * @returns {Promise<{success: boolean, data: string|null, error: string|null}>}
 */
export async function scanWithOptions(options = {}) {
    try {
        const available = await isScannerAvailable();
        if (!available) {
            return {
                success: false,
                data: null,
                error: 'El escáner no está disponible en este dispositivo'
            };
        }

        let hasPermission = await checkCameraPermission();
        if (!hasPermission) {
            hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                return {
                    success: false,
                    data: null,
                    error: 'Se requieren permisos de cámara'
                };
            }
        }

        const { barcodes } = await BarcodeScanner.scan(options);

        if (barcodes && barcodes.length > 0) {
            return {
                success: true,
                data: barcodes[0].rawValue,
                error: null
            };
        } else {
            return {
                success: false,
                data: null,
                error: 'No se detectó ningún código'
            };
        }
    } catch (error) {
        console.error('Error scanning with options:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Error al escanear'
        };
    }
}

/**
 * Ejemplo de uso para escanear el número de cuenta de un empleado
 * @returns {Promise<{success: boolean, accountNumber: string|null, error: string|null}>}
 */
export async function scanEmployeeAccount() {
    const result = await scanQRCode();
    
    if (result.success && result.data) {
        // Validar que sea un número de cuenta válido (ajusta según tu formato)
        const accountNumber = result.data.trim();
        
        // Ejemplo: validar que sea numérico y tenga cierta longitud
        if (/^\d{4,10}$/.test(accountNumber)) {
            return {
                success: true,
                accountNumber: accountNumber,
                error: null
            };
        } else {
            return {
                success: false,
                accountNumber: null,
                error: 'El código QR no contiene un número de cuenta válido'
            };
        }
    }
    
    return {
        success: false,
        accountNumber: null,
        error: result.error
    };
}
