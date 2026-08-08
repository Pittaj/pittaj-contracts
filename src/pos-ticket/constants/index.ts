/**
 * @fileoverview Constantes de validación para pos-ticket
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

/**
 * **Estos son los limites que se aplican de verdad**: los esquemas de la API leen de aqui.
 * El modulo de dominio tiene su propia copia, a la sombra de esta — esa duplicidad es la raiz
 * de BUG-023.
 *
 * Se quitaron `MAX_PAYMENTS` y `MAX_PRICE`: nadie los comprobaba, y aplicarlos habria
 * rechazado operaciones legitimas.
 */
export const POS_TICKET_CONSTANTS = {
  LIMITS: {
    /** Maximo de lineas por ticket */
    MAX_LINES: 100,
    /** Longitud maxima de las notas del TICKET */
    MAX_NOTES_LENGTH: 500,
    /** Longitud maxima de las notas de un RENGLON: mas cortas que las del ticket */
    MAX_LINE_NOTES_LENGTH: 200,
    /** Longitud maxima de razon de cancelacion */
    MAX_CANCELLATION_REASON_LENGTH: 500,
    /** Precio unitario maximo */
    MAX_UNIT_PRICE: 999_999_999.99,
    /** Cantidad minima por linea */
    MIN_QUANTITY: 1,
    /** Cantidad maxima por linea */
    MAX_QUANTITY: 99_999,
    /** Precision decimal para precios */
    PRICE_DECIMAL_PLACES: 2,
  },
} as const;
