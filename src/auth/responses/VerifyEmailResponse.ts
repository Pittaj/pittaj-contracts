/** Respuesta del endpoint POST /api/auth/verify-email. */
export interface VerifyEmailResponse {
    readonly success: boolean;
    readonly email?: string;
    readonly message: string;
    readonly canAutoLogin: boolean;
}
