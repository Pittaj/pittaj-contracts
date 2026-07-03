/** Primitivas de una sesión activa del usuario. */
export interface ActiveSessionPrimitives {
    readonly id: string;
    readonly deviceId: string | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    readonly lastActivity: string;
    readonly createdAt: string;
    readonly isCurrent: boolean;
}
