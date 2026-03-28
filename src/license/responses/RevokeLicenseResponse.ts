/**
 * @fileoverview Response del comando de revocación de licencia
 * @module RevokeLicenseResponse
 * @version 1.0.0
 */

/**
 * Response del comando RevokeLicense.
 *
 * Contiene información sobre el resultado de la revocación.
 *
 * @interface RevokeLicenseResponse
 * @since 1.0.0
 */
export interface RevokeLicenseResponse {
    /** Si la revocación fue exitosa */
    readonly success: boolean;

    /** ID de la licencia revocada */
    readonly licenseId: string;

    /** Key de la licencia (enmascarada) */
    readonly maskedKey: string;

    /** Razón de la revocación */
    readonly reason: string;

    /** Fecha de revocación */
    readonly revokedAt: Date;

    /** Usuario que revocó */
    readonly revokedBy: string;

    /** Número de activaciones que fueron invalidadas */
    readonly invalidatedActivations: number;

    /** Mensaje descriptivo */
    readonly message: string;
}
