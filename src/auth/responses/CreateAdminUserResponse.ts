/** Respuesta del endpoint POST /api/auth/admin/users. */
export interface CreateAdminUserResponse {
    readonly userId: string;
    readonly email: string;
    readonly temporaryPassword: string;
    readonly mustChangePassword: boolean;
    readonly message: string;
}
