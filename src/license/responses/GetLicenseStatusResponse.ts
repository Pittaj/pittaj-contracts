/**
 * @fileoverview Response de la query de estado de licencia
 * @module GetLicenseStatusResponse
 * @version 1.0.0
 */

/**
 * Información de una activación.
 *
 * @interface ActivationInfo
 */
export interface ActivationInfo {
    /** Hardware fingerprint de la activación */
    readonly hardwareFingerprint: string;
    /** Nombre del dispositivo */
    readonly deviceName: string;
    /** Fecha de activación */
    readonly activatedAt: string;
    /** Última validación */
    readonly lastValidatedAt: string;
    /** Días desde última validación */
    readonly daysSinceLastValidation: number;
    /** Si necesita re-validación */
    readonly needsRevalidation: boolean;
    /** Dirección IP del dispositivo */
    readonly ipAddress: string | null;
}

/**
 * Response de la query GetLicenseStatus.
 *
 * Contiene información completa sobre el estado de la licencia.
 *
 * @interface GetLicenseStatusResponse
 * @since 1.0.0
 */
export interface GetLicenseStatusResponse {
    /** ID de la licencia */
    readonly id: string;

    /** Key de la licencia (enmascarada) */
    readonly maskedKey: string;

    /** Tipo de licencia: PERPETUAL | SUBSCRIPTION */
    readonly type: string;

    /** Tier: BASIC | PRO | ENTERPRISE */
    readonly tier: string;

    /** Estado actual: PENDING | ACTIVE | EXPIRED | REVOKED */
    readonly status: string;

    /** ID del tenant propietario */
    readonly tenantId: string;

    /** Número máximo de activaciones permitidas */
    readonly maxActivations: number;

    /** Número de activaciones actuales */
    readonly activeActivations: number;

    /** Slots de activación disponibles */
    readonly availableActivations: number;

    /** Porcentaje de uso de activaciones */
    readonly activationUsagePercentage: number;

    /** Número máximo de clientes/terminales */
    readonly maxClients: number;

    /** Fecha de expiración (ISO string, null si perpetua) */
    readonly expirationDate: string | null;

    /** Días restantes hasta expiración (null si perpetua) */
    readonly daysRemaining: number | null;

    /** Si está próxima a expirar (menos de 7 días) */
    readonly isExpiringSoon: boolean;

    /** Si está dentro del grace period */
    readonly isInGracePeriod: boolean;

    /** Días de gracia para uso offline */
    readonly offlineGracePeriodDays: number;

    /** Lista de activaciones */
    readonly activations: ActivationInfo[];

    /** Si la licencia permite uso actualmente */
    readonly allowsUsage: boolean;

    /** Si puede agregar más activaciones */
    readonly canAddActivation: boolean;

    /** Fecha de creación */
    readonly createdAt: string;

    /** Fecha de última actualización */
    readonly updatedAt: string | null;
}
