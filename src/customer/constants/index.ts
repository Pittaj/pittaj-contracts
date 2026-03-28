/**
 * @fileoverview Constantes de validación para customer
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const CUSTOMER_CONSTANTS = {
  LIMITS: {
    /** Longitud minima del nombre */
    MIN_NAME_LENGTH: 2,
    /** Longitud maxima del nombre */
    MAX_NAME_LENGTH: 100,
    /** Longitud maxima del email */
    MAX_EMAIL_LENGTH: 254,
    /** Longitud minima del telefono */
    MIN_PHONE_LENGTH: 7,
    /** Longitud maxima del telefono */
    MAX_PHONE_LENGTH: 20,
    /** Longitud minima del RFC/NIT/CUIT */
    MIN_TAX_ID_LENGTH: 8,
    /** Longitud maxima del RFC/NIT/CUIT */
    MAX_TAX_ID_LENGTH: 20,
    /** Longitud maxima del codigo de cliente */
    MAX_CODE_LENGTH: 20,
    /** Limite de credito minimo */
    MIN_CREDIT_LIMIT: 0,
    /** Limite de credito maximo por defecto (en moneda local) */
    MAX_CREDIT_LIMIT: 999_999_999.99,
    /** Dias de credito minimos */
    MIN_CREDIT_DAYS: 0,
    /** Dias de credito maximos */
    MAX_CREDIT_DAYS: 365,
    /** Maximo clientes por tenant */
    MAX_CUSTOMERS_PER_TENANT: 50_000,
    /** Longitud maxima de notas */
    MAX_NOTES_LENGTH: 500,
    /** Longitud maxima de direccion */
    MAX_ADDRESS_LINE_LENGTH: 200,
    /** Longitud maxima del codigo postal */
    MAX_POSTAL_CODE_LENGTH: 10,
    /** Paginacion por defecto */
    DEFAULT_PAGE_SIZE: 20,
    /** Paginacion maxima */
    MAX_PAGE_SIZE: 100,
  },

  TYPES: ['INDIVIDUAL', 'BUSINESS'] as const,

  STATUSES: ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const,
} as const;
