/**
 * @fileoverview Constantes de validación para supplier
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 *
 * Espejo del agregado Supplier del desktop (Pittaj.Domain.Supplier): comparte
 * los value objects de contacto/fiscales con Customer (Email, Phone, TaxId,
 * Address), por eso los límites coinciden con CUSTOMER_CONSTANTS.
 */

export const SUPPLIER_CONSTANTS = {
  LIMITS: {
    /** Longitud minima del nombre / razon social */
    MIN_NAME_LENGTH: 2,
    /** Longitud maxima del nombre / razon social */
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
    /** Longitud maxima del codigo de proveedor */
    MAX_CODE_LENGTH: 20,
    /** Longitud maxima de la clave de regimen fiscal del SAT */
    MAX_REGIMEN_FISCAL_LENGTH: 10,
    /** Dias de credito minimos (0 = contado) */
    MIN_CREDIT_DAYS: 0,
    /** Dias de credito maximos */
    MAX_CREDIT_DAYS: 365,
    /** Longitud maxima del codigo de moneda (ISO 4217) */
    MAX_CURRENCY_LENGTH: 10,
    /** Longitud maxima de direccion */
    MAX_ADDRESS_LINE_LENGTH: 200,
    /** Longitud maxima del codigo postal */
    MAX_POSTAL_CODE_LENGTH: 10,
    /** Paginacion por defecto */
    DEFAULT_PAGE_SIZE: 20,
    /** Paginacion maxima */
    MAX_PAGE_SIZE: 100,
  },

  /**
   * Estados del proveedor. A diferencia de customer NO existe BLOCKED:
   * el agregado del desktop solo modela ACTIVE ↔ INACTIVE.
   */
  STATUSES: ['ACTIVE', 'INACTIVE'] as const,
} as const;

/** Estado del proveedor (ACTIVE | INACTIVE). */
export type SupplierStatusValue = (typeof SUPPLIER_CONSTANTS.STATUSES)[number];
