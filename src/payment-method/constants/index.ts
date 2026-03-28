/**
 * @fileoverview Constantes de validación para payment-method
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const PAYMENT_METHOD_CONSTANTS = {
  LIMITS: {
    /** Longitud minima del nombre */
    MIN_NAME_LENGTH: 2,

    /** Longitud maxima del nombre */
    MAX_NAME_LENGTH: 50,

    /** Orden minimo de visualizacion */
    MIN_DISPLAY_ORDER: 0,

    /** Orden maximo de visualizacion */
    MAX_DISPLAY_ORDER: 999,

    /** Numero maximo de metodos de pago por tenant */
    MAX_PAYMENT_METHODS_PER_TENANT: 20,

    /** Porcentaje maximo de comision */
    MAX_COMMISSION_PERCENT: 100,

    /** Tamano de pagina por defecto */
    DEFAULT_PAGE_SIZE: 20,

    /** Tamano maximo de pagina */
    MAX_PAGE_SIZE: 50,
  },

  TYPES: ['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'WALLET', 'OTHER'] as const,

  STATUSES: ['ACTIVE', 'INACTIVE'] as const,
} as const;
