export type AlertPrimitives = {
    readonly id: string;
    readonly type: 'warning' | 'error' | 'info';
    readonly message: string;
    readonly tenantId?: string;
    readonly createdAt: string;
};

export type SystemHealthPrimitives = {
    readonly status: 'healthy' | 'degraded' | 'down';
    readonly uptime: number;
    readonly cpuUsage: number;
    readonly memoryUsage: number;
    readonly errorRate: number;
};