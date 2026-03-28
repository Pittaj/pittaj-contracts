/**
 * @fileoverview Respuesta del comando CreateLicense
 * @module CreateLicenseResponse
 * @version 1.0.0
 */

/**
 * Respuesta del comando de creación de licencia.
 * 
 * @interface CreateLicenseResponse
 * @since 1.0.0
 */
export interface CreateLicenseResponse {
    /** ID de la licencia creada */
    readonly id: string;
    
    /** Key de la licencia (completa, solo se muestra una vez) */
    readonly key: string;
    
    /** Key enmascarada para mostrar después */
    readonly maskedKey: string;
    
    /** Tipo de licencia */
    readonly type: string;
    
    /** Tier de la licencia */
    readonly tier: string;
    
    /** Estado de la licencia */
    readonly status: string;
    
    /** ID del tenant */
    readonly tenantId: string;
    
    /** Máximo de activaciones permitidas */
    readonly maxActivations: number;
    
    /** Máximo de clientes permitidos */
    readonly maxClients: number;
    
    /** Fecha de expiración (null si perpetua) */
    readonly expirationDate: Date | null;
    
    /** Período de gracia offline en días */
    readonly offlineGracePeriodDays: number;
    
    /** Fecha de creación */
    readonly createdAt: Date;
}
