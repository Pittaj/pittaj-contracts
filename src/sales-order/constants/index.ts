/**
 * @fileoverview Constantes de validación para sales-order
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

/**
 * **Estos son los limites que se aplican de verdad**: los esquemas de la API leen de aqui.
 * El modulo de dominio tiene su propia copia, y la del modulo esta a la sombra de esta —
 * esa duplicidad es la raiz de BUG-023.
 *
 * Se quitaron `MAX_PAYMENTS` y `MAX_PRICE`: nadie los comprobaba, y aplicarlos habria
 * rechazado operaciones legitimas (un cliente que paga una compra grande en 21 abonos no es
 * un error). Un tope que parece un tope y no lo es engaña a quien lo lee.
 *
 * `MAX_NOTES_LENGTH` decia 1000 mientras los esquemas exigian 500 escritos a mano. Ahora dice
 * lo que se aplica, y los esquemas leen de aqui: un solo numero.
 */
export const SALES_ORDER_CONSTANTS = {
  LIMITS: {
    MAX_LINES: 200,
    /** Notas del documento */
    MAX_NOTES_LENGTH: 500,
    /** Notas de un RENGLON: mas cortas que las del documento */
    MAX_LINE_NOTES_LENGTH: 200,
    MAX_CANCELLATION_REASON_LENGTH: 500,
    MAX_RETURN_REASON_LENGTH: 500,
    MAX_QUANTITY: 99_999,
    MIN_QUANTITY: 0.01,
    MAX_UNIT_PRICE: 999_999_999.99,
    PRICE_DECIMAL_PLACES: 2,
  },
} as const;

export * from './receivablePolicy.js';
