/**
 * @fileoverview Respuesta del comando ValidateLicense
 * @module ValidateLicenseResponse
 * @version 1.0.0
 */

/**
 * Respuesta del comando de validación de licencia.
 * 
 * @interface ValidateLicenseResponse
 * @since 1.0.0
 */
export interface ValidateLicenseResponse {
    /** Si la licencia es válida */
    readonly isValid: boolean;
    
    /** ID de la licencia (si es válida) */
    readonly licenseId: string | null;
    
    /** Tier de la licencia (si es válida) */
    readonly tier: string | null;
    
    /** Nuevo token JWT actualizado (si es válida) */
    readonly token: string | null;
    
    /** Días restantes hasta expiración (null si perpetua) */
    readonly daysRemaining: number | null;
    
    /** Máximo de clientes permitidos */
    readonly maxClients: number | null;
    
    /** Mensaje de error (si no es válida) */
    readonly errorMessage: string | null;
    
    /** Código de error (si no es válida) */
    readonly errorCode: string | null;
}
