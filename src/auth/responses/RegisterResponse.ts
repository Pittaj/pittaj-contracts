/** Respuesta del endpoint POST /api/auth/register. */
export interface RegisterResponse {
    readonly userId: string;
    readonly email: string;
    readonly tenantId: string | null;
    readonly requiresEmailVerification: boolean;
    readonly message: string;
}
