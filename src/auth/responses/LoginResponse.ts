import type { AuthUserPrimitives, AuthClaimsPrimitives } from '../primitives';

/** Respuesta del endpoint POST /api/auth/login. */
export interface LoginResponse {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresAt: number;
    readonly user: AuthUserPrimitives;
    readonly claims: AuthClaimsPrimitives;
}
