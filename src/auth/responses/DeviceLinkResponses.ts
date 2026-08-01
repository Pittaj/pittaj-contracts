import type { AuthUserPrimitives, AuthClaimsPrimitives } from '../primitives';

/**
 * Código de vinculación recién emitido.
 *
 * El código en claro solo existe aquí: la base guarda su hash. Si el usuario lo
 * pierde, se genera otro — no hay forma de volver a mostrarlo.
 */
export interface DeviceLinkCodeResponse {
    /** Listo para dictar: `ABCD-2345`. */
    readonly code: string;
    readonly expiresAt: string;
    readonly expiresInSeconds: number;
}

/**
 * Sesión que recibe la caja al canjear un código.
 *
 * Mismo contenido que un login normal, más la sucursal cuando el código venía
 * con una asignada: así vincular y asignar son un solo paso.
 */
export interface DeviceLinkSessionResponse {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly user: AuthUserPrimitives;
    readonly claims: AuthClaimsPrimitives;
    readonly expiresAt: number;
    /** Sucursal preasignada, si el código la traía. */
    readonly locationId?: string;
}
