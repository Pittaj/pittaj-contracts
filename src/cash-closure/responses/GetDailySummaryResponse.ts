import type { MoneyPrimitives } from '../../shared';

/** Resumen diario de cierres. */
export interface DailyCashClosureSummary {
    readonly date: string;
    readonly closureCount: number;
    readonly totalExpected: MoneyPrimitives;
    readonly totalActual: MoneyPrimitives;
    readonly totalDifference: MoneyPrimitives;
}

export interface GetDailySummaryResponse {
    readonly summaries: DailyCashClosureSummary[];
}
