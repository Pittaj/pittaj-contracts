/**
 * @fileoverview Lo que contesta «Reclamar al proveedor» cuando el correo salió.
 * @module Contracts/ReceivedCfdi/Responses/Reclamo
 */

export interface ReclamoEnviadoResponse {
    /** A quién se mandó, ya normalizado. */
    readonly para: string;
    /** Quién recibirá la respuesta (el Reply-To): el correo de quien reclamó. */
    readonly respuestasA: string | null;
    /** Id del mensaje en el proveedor de correo, si lo dio. Sirve para rastrearlo en la bitácora. */
    readonly messageId: string | null;
    readonly enviadoEl: string;
}
