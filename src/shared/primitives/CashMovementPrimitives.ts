export interface CashMovementPrimitives {
  readonly id: string;
  readonly type: 'CASH_IN' | 'CASH_OUT';
  readonly reason:
    | 'OPENING_FUND'
    | 'SALE'
    | 'REFUND'
    | 'EXPENSE'
    | 'WITHDRAWAL'
    | 'DEPOSIT'
    | 'CORRECTION'
    | 'TIP'
    | 'OTHER'
    | 'CHANGE_FUND'
    | 'LAYAWAY_PAYMENT'
    | 'SUPPLIER_PAYMENT'
    | 'OWNER_DRAW'
    | 'CUSTOMER_PAYMENT';
  readonly amount: number;
  readonly currency: string;
  readonly description: string | null;
  readonly userId: string;
  readonly occurredAt: string;
  /**
   * Concepto de gasto (F6.7): qué se pagó del cajón (garrafón, gas, papelería). Solo en una salida
   * con motivo `EXPENSE`; nulo o ausente = Otros gastos. Opcional para no romper a un cliente
   * viejo: si un push no trae la llave, la nube conserva el que tenía.
   */
  readonly expenseConceptId?: string | null;
  /**
   * E2 de plan-efectivo · La cuenta de Bancos del otro lado: a dónde fue un retiro (caja fuerte,
   * caja chica, «en manos de») o de dónde vino el cambio. Nulo en lo demás y en el histórico.
   */
  readonly cashAccountId?: string | null;
}
