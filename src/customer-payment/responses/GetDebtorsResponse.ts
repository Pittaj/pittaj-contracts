/**
 * @fileoverview Quién debe, y cuánto: la antigüedad de saldos agrupada por cliente.
 * @module Contracts/CustomerPayment
 *
 * Sustituye a `GET /api/customers/credit-debtors`, que preguntaba por un contador guardado en el
 * cliente —`creditUsed`— que ninguna venta incrementaba, así que contestaba **lista vacía siempre**
 * (BUG-030). Aquí el saldo se **deriva** de las ventas a crédito menos sus cobros vigentes.
 *
 * Vive en cobranza y no en clientes a propósito: la deuda es de las ventas, y `customer` tendría que
 * depender de `customer-payment` para calcularla. Esa dependencia costaría más que el endpoint.
 */

/** Un cliente con saldo, y cómo de viejo es lo que debe. */
export interface DebtorResponse {
    readonly customerId: string;
    readonly customerName: string | null;
    /** Lo que debe en total, a la fecha de corte. */
    readonly balance: number;
    /** Cuántas ventas suyas siguen con saldo. */
    readonly openSales: number;
    /**
     * Días de la venta con saldo **más vieja**.
     *
     * Es el número con el que se decide a quién llamar hoy: un cliente que debe $2,000 desde hace
     * cuatro meses es otro problema que uno que debe $2,000 de ayer, y el importe solo no los
     * distingue.
     */
    readonly oldestAgeDays: number;
    /** El límite de crédito pactado, para poder ver quién se pasó. `null` si no tiene tope. */
    readonly creditLimit: number | null;
    /**
     * Debe más de lo que se le autorizó.
     *
     * Se calcula aquí y no en el cliente porque el que sabe cuánto debe es este endpoint. `false`
     * cuando no hay tope: sin límite no se puede exceder nada.
     */
    readonly overLimit: boolean;
}

export interface GetDebtorsResponse {
    readonly items: readonly DebtorResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Suma de saldos sobre TODO el filtro, no solo la página. */
    readonly balanceTotal: number;
}
