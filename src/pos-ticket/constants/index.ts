/**
 * @fileoverview Constantes de validación para pos-ticket
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const POS_TICKET_CONSTANTS = {
  LIMITS: {
    /** Maximo de lineas por ticket */
    MAX_LINES: 100,
    /** Maximo de pagos por ticket */
    MAX_PAYMENTS: 10,
    /** Longitud maxima de notas */
    MAX_NOTES_LENGTH: 500,
    /** Longitud maxima de razon de cancelacion */
    MAX_CANCELLATION_REASON_LENGTH: 500,
    /** Precio maximo del sistema */
    MAX_PRICE: 999_999_999.99,
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
