export type AuditLogPrimitives = {
    readonly id: string;
    readonly userId: string;
    readonly userEmail: string;
    readonly action: string;
    readonly resource: string;
    readonly resourceId: string | null;
    readonly details: Record<string, unknown> | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    readonly createdAt: string;
};