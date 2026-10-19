import type { AuthUserPrimitives } from '../primitives/index.js';
import type { AuthHandoffPurpose } from '../schemas/authSchemas.js';

/**
 * Un pase recién emitido. El pase en claro solo existe aquí (la base guarda su hash) y viaja en
 * el fragmento de la dirección (`#p=…`), que el navegador no manda a ningún servidor.
 */
export interface AuthHandoffResponse {
    readonly ticket: string;
    readonly expiresAt: string;
    readonly expiresInSeconds: number;
}

/**
 * La sesión que recibe la página de destino al canjear el pase: solo un token de acceso corto,
 * **sin** token de renovación ni cookie. Vive en memoria y se acaba con la pestaña.
 */
export interface AuthHandoffSessionResponse {
    readonly accessToken: string;
    /** Epoch en segundos. */
    readonly expiresAt: number;
    readonly purpose: AuthHandoffPurpose;
    readonly user: AuthUserPrimitives;
    /** Tenant de la sesión, para el `X-Tenant-ID` de las llamadas siguientes. */
    readonly tenantId: string;
    /** La empresa que venía elegida en la app, si venía. */
    readonly companyId?: string;
}
