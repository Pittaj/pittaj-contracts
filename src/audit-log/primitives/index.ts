export type AuditLogPrimitives = {
    readonly id: string;
    /** Identidad que ejecutó la acción; null = evento de sistema/cron. */
    readonly userId: string | null;
    /** Email de la identidad; null si es sistema o no se pudo resolver. */
    readonly userEmail: string | null;
    readonly action: string;
    readonly resource: string;
    readonly resourceId: string | null;
    readonly details: Record<string, unknown> | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    readonly createdAt: string;
};