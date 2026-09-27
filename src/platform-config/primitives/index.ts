export type PlatformConfigPrimitives = {
    readonly platformName: string;
    readonly supportEmail: string;
    readonly maxTrialDays: number;
    readonly defaultPlanId: string;
    /** Timbres CFDI al mes de una cuenta SIN plan. Con plan mandan los del plan (50 / 200). */
    readonly includedStampsPerMonth: number;
    readonly maintenanceMode: boolean;
    /** Exigir dispositivo registrado (deviceId) para sincronizar. Candado F4. */
    readonly requireDeviceId: boolean;
    /**
     * Aplicar los cortes por falta de pago. Apagado, el cobro avisa pero no corta nada. Encendido,
     * pasada la gracia se suspende: se bloquean **solo** el timbrado y la sincronización — vender,
     * cobrar y consultar siguen (modelo-negocio §7).
     */
    readonly enforcePastDue: boolean;
    /** Días desde que vence el cobro hasta que se corta; durante la gracia, solo avisos. */
    readonly graceDaysAfterDue: number;
    readonly features: {
        readonly onboardingEnabled: boolean;
        readonly couponSystemEnabled: boolean;
        readonly apiAccessEnabled: boolean;
    };
};