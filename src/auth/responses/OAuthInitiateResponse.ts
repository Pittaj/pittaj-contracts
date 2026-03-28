/**
 * @fileoverview Response DTO para OAuthInitiate command.
 * @module Auth/Application/Commands/OAuthInitiate
 */

/**
 * Resultado de iniciar el flujo OAuth.
 */
export interface OAuthInitiateResponse {
    /** URL de autorización del proveedor (para redirect 302). */
    readonly authorizationUrl: string;
    /** PKCE code verifier (para guardar en cookie httpOnly). */
    readonly codeVerifier: string;
    /** State JWT firmado (incluido en la URL). */
    readonly state: string;
}
