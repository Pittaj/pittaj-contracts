/**
 * @fileoverview Respuesta del comando ActivateLicense
 * @module ActivateLicenseResponse
 * @version 1.0.0
 */

/**
 * Respuesta del comando de activación de licencia.
 * 
 * @interface ActivateLicenseResponse
 * @since 1.0.0
 */
export interface ActivateLicenseResponse {
    /** Si la activación fue exitosa */
    readonly success: boolean;
    
    /** ID de la licencia */
    readonly licenseId: string;
    
    /** Tier de la licencia */
    readonly tier: string;
    
    /** Token JWT para validación offline */
    readonly token: string;
    
    /** Número de activación (ej: 1 de 3) */
    readonly activationNumber: number;
    
    /** Máximo de activaciones permitidas */
    readonly maxActivations: number;
    
    /** Máximo de clientes permitidos */
    readonly maxClients: number;
    
    /** Días restantes hasta expiración (null si perpetua) */
    readonly daysRemaining: number | null;
    
    /** Período de gracia offline en días */
    readonly offlineGracePeriodDays: number;
    
    /** Fecha de activación */
    readonly activatedAt: Date;
}
