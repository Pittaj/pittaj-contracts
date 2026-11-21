/**
 * Cifras de UN cliente para la franja de su ficha (2026-11-22). Mismo cálculo que el escritorio
 * (`GetCustomerStatsHandler`):
 *
 * - **Lo comprado** son los tickets COMPLETADOS en la ventana (`from`–`to`, por defecto el último
 *   año). `null` = sin tickets en la ventana; nunca un 0 que parezca dato.
 * - **La última compra** es de toda la historia, sin ventana.
 * - **El crédito** solo viene si el cliente lo tiene habilitado. El saldo se DERIVA de ventas y
 *   cobros (como cobranza), y el disponible solo existe si hay tope: sin tope no hay «disponible»
 *   que mostrar, y un $0.00 diría lo contrario de la verdad.
 */
export interface CustomerStatsResponse {
    readonly from: string;
    readonly to: string;
    readonly ticketCount: number | null;
    readonly purchasedAmount: number | null;
    readonly averageTicket: number | null;
    /** ISO 8601. */
    readonly lastPurchaseAt: string | null;
    readonly creditEnabled: boolean;
    readonly creditLimit: number | null;
    readonly creditDays: number | null;
    readonly creditBalance: number | null;
    readonly creditAvailable: number | null;
}
