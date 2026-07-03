import type { AuthClaimsPrimitives } from '../primitives';

/** Resultado de la renovación de tokens. */
export interface RefreshTokenResult {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly claims: AuthClaimsPrimitives;
    readonly expiresAt: number;
}
