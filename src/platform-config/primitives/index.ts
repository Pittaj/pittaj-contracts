export type PlatformConfigPrimitives = {
    readonly platformName: string;
    readonly supportEmail: string;
    readonly maxTrialDays: number;
    readonly defaultPlanId: string;
    readonly maintenanceMode: boolean;
    readonly features: {
        readonly onboardingEnabled: boolean;
        readonly couponSystemEnabled: boolean;
        readonly apiAccessEnabled: boolean;
    };
};