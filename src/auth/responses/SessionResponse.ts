import type { AuthUserPrimitives, AuthClaimsPrimitives } from '../primitives';

/** Respuesta del endpoint GET /api/auth/session. */
export interface SessionResponse {
    readonly isAuthenticated: boolean;
    readonly user: AuthUserPrimitives | null;
    readonly claims: AuthClaimsPrimitives | null;
    readonly expiresIn: number;
}
