/**
 * @fileoverview Response DTO para OAuthCallback command.
 * @module Auth/Application/Commands/OAuthCallback
 */

import type { AuthUserDto, AuthClaimsDto } from '../../primitives';

/**
 * Resultado del procesamiento del callback OAuth.
 */
export interface OAuthCallbackResponse {
    /** Access token JWT. */
    readonly accessToken: string;
    /** Refresh token para renovar sesión. */
    readonly refreshToken: string;
    /** Información del usuario. */
    readonly user: AuthUserDto;
    /** Claims del usuario incluidos en el JWT. */
    readonly claims: AuthClaimsDto;
    /** Timestamp de expiración del access token. */
    readonly expiresAt: number;
    /** URL del frontend a la que redirigir. */
    readonly redirectUrl: string;
    /** Si el usuario fue creado por primera vez. */
    readonly isNewUser: boolean;
}
