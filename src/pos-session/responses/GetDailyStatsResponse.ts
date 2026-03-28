/** Resumen diario de sesiones. */
export interface DailySessionStats {
    readonly date: string;
    readonly sessionCount: number;
    readonly totalSales: number;
    readonly totalRefunds: number;
    readonly averageDuration: number;
    readonly currency: string;
}

export interface GetDailyStatsResponse {
    readonly stats: DailySessionStats[];
}
