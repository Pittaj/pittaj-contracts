export type SaasMetricsPrimitives = {
    readonly mrr: number;
    readonly previousMrr: number;
    readonly mrrGrowth: number;
    readonly activeTenants: number;
    readonly trialTenants: number;
    readonly churnRate: number;
    readonly arpu: number;
    readonly newTenantsThisMonth: number;
    readonly cancelledTenantsThisMonth: number;
    readonly period: string;
};