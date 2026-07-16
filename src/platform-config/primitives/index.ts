export type PlatformConfigPrimitives = {
    readonly platformName: string;
    readonly supportEmail: string;
    readonly maxTrialDays: number;
    readonly defaultPlanId: string;
    /** Timbres CFDI incluidos al mes por tenant (default de plataforma). */
    readonly includedStampsPerMonth: number;
    readonly maintenanceMode: boolean;
    readonly features: {
        readonly onboardingEnabled: boolean;
        readonly couponSystemEnabled: boolean;
        readonly apiAccessEnabled: boolean;
    };
};