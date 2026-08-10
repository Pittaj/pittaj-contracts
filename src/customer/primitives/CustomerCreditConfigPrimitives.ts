/**
 * Condiciones de crédito del cliente: si se le fía, hasta cuánto y a cuántos días.
 *
 * **No lleva saldo, y es deliberado** (BUG-030). La deuda se deriva de las ventas a crédito menos
 * sus cobros vigentes, y vive en cuentas por cobrar. Aquí solo hay valores *declarados*, que es lo
 * único que sobrevive a un sync de última-escritura-gana: un contador acumulado se pierde en cuanto
 * dos cajas fían sin red y la que sube después se lleva por delante el cargo de la otra.
 */
export interface CustomerCreditConfigPrimitives {
  readonly creditEnabled: boolean;

  /**
   * Tope de crédito. **`null` = sin tope.**
   *
   * Antes el «sin tope» se codificaba con un `0`, que es **la misma cifra que usa un cliente sin
   * crédito** — los distinguía `creditEnabled`. La trampa más cara del módulo: quien ponía límite 0
   * para cerrarle el crédito a alguien **se lo abría del todo**. Cada consumidor tenía que volver a
   * saberlo, y había comentarios explicándolo en cuatro archivos distintos.
   *
   * Con `null` la ambigüedad desaparece del tipo: `0` ya solo puede significar «no le fíes ni un
   * peso», que es lo que cualquiera lee al verlo.
   */
  readonly creditLimit: number | null;

  readonly creditDays: number;
}
