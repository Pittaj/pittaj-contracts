/**
 * @fileoverview Constantes de validación para cash-closure
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const CASH_CLOSURE_CONSTANTS = {
  LIMITS: {
    /** Fondo de apertura minimo */
    MIN_OPENING_FUND: 0,
    /** Fondo de apertura maximo */
    MAX_OPENING_FUND: 999_999.99,
    /** Diferencia maxima aceptable (abs) sin requerir revision */
    AUTO_APPROVE_THRESHOLD: 10.00,
    /** Maximo resumenes de pago por cierre */
    MAX_PAYMENT_SUMMARIES: 20,
    /** Longitud maxima de notas */
    MAX_NOTES_LENGTH: 1000,
    /** Longitud maxima de razon de rechazo */
    MAX_REJECTION_REASON_LENGTH: 500,
    /** Paginacion por defecto */
    DEFAULT_PAGE_SIZE: 20,
    /** Paginacion maxima */
    MAX_PAGE_SIZE: 100,
  },

  STATUSES: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const,

  SHIFTS: ['MORNING', 'AFTERNOON', 'NIGHT', 'FULL'] as const,

  CURRENCIES: ['MXN', 'COP', 'ARS', 'USD'] as const,
} as const;
