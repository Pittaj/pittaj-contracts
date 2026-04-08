/** Respuesta del endpoint POST /api/auth/register. */
export interface RegisterResponse {
    readonly userId: string;
    readonly email: string;
    readonly tenantId?: string;
    readonly requiresEmailVerification: boolean;
    readonly message: string;
}
