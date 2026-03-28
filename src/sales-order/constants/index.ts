/**
 * @fileoverview Constantes de validación para sales-order
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const SALES_ORDER_CONSTANTS = {
  LIMITS: {
    MAX_LINES: 200,
    MAX_PAYMENTS: 20,
    MAX_NOTES_LENGTH: 1000,
    MAX_CANCELLATION_REASON_LENGTH: 500,
    MAX_RETURN_REASON_LENGTH: 500,
    MAX_PRICE: 999_999_999.99,
    MAX_QUANTITY: 99_999,
    MIN_QUANTITY: 0.01,
    MAX_UNIT_PRICE: 999_999_999.99,
    PRICE_DECIMAL_PLACES: 2,
  },
} as const;
