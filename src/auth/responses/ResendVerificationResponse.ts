/** Respuesta del endpoint POST /api/auth/resend-verification. */
export interface ResendVerificationResponse {
    readonly sent: boolean;
    readonly message: string;
}
