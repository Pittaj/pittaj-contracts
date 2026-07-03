import type { AuthUserPrimitives, AuthClaimsPrimitives } from '../primitives';

/** Respuesta del endpoint POST /api/auth/verify-email. */
export interface VerifyEmailResponse {
    readonly success: boolean;
    readonly email?: string;
    readonly message: string;
    readonly canAutoLogin: boolean;
    readonly accessToken?: string;
    readonly refreshToken?: string;
    readonly expiresAt?: number;
    /** Datos del usuario para auto-login (presentes cuando canAutoLogin=true). */
    readonly user?: AuthUserPrimitives;
    /** Claims del usuario para auto-login (presentes cuando canAutoLogin=true). */
    readonly claims?: AuthClaimsPrimitives;
}
