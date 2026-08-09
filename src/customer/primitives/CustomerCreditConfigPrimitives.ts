/**
 * Condiciones de crédito del cliente: si se le fía, hasta cuánto y a cuántos días.
 *
 * **No lleva saldo, y es deliberado** (BUG-030). La deuda se deriva de las ventas a crédito menos
 * sus cobros vigentes, y vive en cuentas por cobrar. Aquí solo hay valores *declarados*, que es lo
 * único que sobrevive a un sync de última-escritura-gana: un contador acumulado se pierde en cuanto
 * dos cajas fían sin red y la que sube después se lleva por delante el cargo de la otra.
 *
 * `creditLimit: 0` **con** `creditEnabled: true` significa **sin tope**, no «sin crédito».
 */
export interface CustomerCreditConfigPrimitives {
  readonly creditEnabled: boolean;
  readonly creditLimit: number;
  readonly creditDays: number;
}
