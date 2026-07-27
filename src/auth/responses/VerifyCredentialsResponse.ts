/** Resultado de la verificación puntual de credenciales (autorización de supervisor). */
export interface VerifyCredentialsResponse {
    /** true solo si las credenciales son válidas Y el usuario tiene el permiso pedido (si se pidió). */
    readonly ok: boolean;
    /** Motivo del rechazo cuando ok=false. */
    readonly reason?: 'invalid_credentials' | 'permission_denied';
    /** Datos mínimos del usuario verificado (solo cuando las credenciales son válidas). */
    readonly user?: {
        readonly id: string;
        readonly email: string;
        readonly displayName: string;
    };
}
