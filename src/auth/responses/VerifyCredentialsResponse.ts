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
    /**
     * Vale de autorización firmado (solo si se pidió con `permissions` y ok=true). Se manda en el
     * encabezado `X-Pittaj-Vale` de la petición que el supervisor autorizó; vale tres minutos y
     * no abre sesión.
     */
    readonly vale?: string;
}
