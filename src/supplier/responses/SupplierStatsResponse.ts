/**
 * Cifras de UN proveedor para la franja de su ficha (2026-11-22). Mismo cálculo que el escritorio
 * (`GetSupplierStatsHandler`): compras ACTIVAS, fechadas por recepción, si no por la factura, si no
 * por el alta. Lo comprado es de la ventana (por defecto el último año); la última compra, de toda
 * la historia. `creditDays` es `null` cuando el proveedor es de contado (0 días).
 */
export interface SupplierStatsResponse {
    readonly from: string;
    readonly to: string;
    readonly purchaseCount: number | null;
    readonly purchasedAmount: number | null;
    readonly averagePurchase: number | null;
    /** ISO 8601. */
    readonly lastPurchaseAt: string | null;
    readonly creditDays: number | null;
}
