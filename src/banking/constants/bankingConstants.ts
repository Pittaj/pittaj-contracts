/**
 * @fileoverview Constantes del módulo Banking (app Bancos, Etapa 1 / N1).
 * Solo LIMITS, enums de API y seeds del sistema. La lógica de negocio vive en el dominio.
 */

export const BANKING_CONSTANTS = {
  LIMITS: {
    /** Longitud mínima del nombre de cuenta/categoría */
    MIN_NAME_LENGTH: 2,

    /** Longitud máxima del nombre de cuenta/categoría */
    MAX_NAME_LENGTH: 100,

    /** Longitud máxima del nombre del banco/pasarela */
    MAX_BANK_NAME_LENGTH: 100,

    /** Longitud máxima del número de cuenta */
    MAX_ACCOUNT_NUMBER_LENGTH: 30,

    /** Longitud exacta de la CLABE interbancaria */
    CLABE_LENGTH: 18,

    /** Longitud máxima de la referencia bancaria */
    MAX_REFERENCE_LENGTH: 100,

    /** Longitud máxima de las notas */
    MAX_NOTES_LENGTH: 500,

    /** Longitud máxima del nombre de contraparte */
    MAX_COUNTERPARTY_NAME_LENGTH: 150,

    /** Monto máximo por movimiento (guardrail de captura) */
    MAX_AMOUNT: 999_999_999.99,

    /** CFDIs máximos asociables a un movimiento */
    MAX_CFDI_UUIDS: 50,

    /** Tamaño de página por defecto en listados */
    DEFAULT_PAGE_SIZE: 20,

    /** Tamaño máximo de página en listados */
    MAX_PAGE_SIZE: 100,
  },

  /** Tipos de cuenta. TRANSIT = cuenta puente del sistema ("Fondos en tránsito"). */
  ACCOUNT_KINDS: ['BANK', 'CASH', 'CREDIT_CARD', 'PSP', 'TRANSIT'] as const,

  /** Estados de cuenta y de categoría. */
  STATUSES: ['ACTIVE', 'INACTIVE'] as const,

  /** Flujo que admite una categoría de movimiento. */
  CATEGORY_FLOWS: ['IN', 'OUT', 'BOTH'] as const,

  /** Dirección de un movimiento. */
  DIRECTIONS: ['IN', 'OUT'] as const,

  /** Estados de un movimiento (ledger append-only). */
  TRANSACTION_STATUSES: ['PENDING', 'CLEARED', 'VOID'] as const,

  /** Tipo de documento origen de un movimiento. */
  SOURCE_TYPES: ['CASH_CLOSURE', 'PURCHASE', 'EXPENSE', 'TICKET_BATCH', 'TRANSFER', 'MANUAL'] as const,

  /** Tipo de contraparte de un movimiento. */
  COUNTERPARTY_TYPES: ['SUPPLIER', 'CUSTOMER', 'EMPLOYEE', 'OTHER'] as const,

  /** Moneda por defecto de las cuentas. */
  DEFAULT_CURRENCY: 'MXN',

  /** Nombre de la cuenta puente del sistema (singleton por tenant). */
  TRANSIT_ACCOUNT_NAME: 'Fondos en tránsito',
} as const;

export type BankAccountKindValue = (typeof BANKING_CONSTANTS.ACCOUNT_KINDS)[number];
export type BankingStatusValue = (typeof BANKING_CONSTANTS.STATUSES)[number];
export type CategoryFlowValue = (typeof BANKING_CONSTANTS.CATEGORY_FLOWS)[number];
export type TransactionDirectionValue = (typeof BANKING_CONSTANTS.DIRECTIONS)[number];
export type TransactionStatusValue = (typeof BANKING_CONSTANTS.TRANSACTION_STATUSES)[number];
export type TransactionSourceTypeValue = (typeof BANKING_CONSTANTS.SOURCE_TYPES)[number];
export type CounterpartyTypeValue = (typeof BANKING_CONSTANTS.COUNTERPARTY_TYPES)[number];

/** Definición de una categoría de sistema (seed por tenant, estilo CONTPAQi). */
export interface SystemCategoryDef {
  /** Código estable interno (no se persiste; identifica el seed). */
  readonly code: string;
  /** Nombre visible, único por tenant — clave de idempotencia junto a isSystem. */
  readonly name: string;
  /** Flujo que admite: IN / OUT / BOTH. */
  readonly flow: CategoryFlowValue;
}

/**
 * Categorías del sistema (12, spec `bank-transaction.md` §2).
 * Se siembran por tenant: en onboarding y lazy en la primera lectura del catálogo.
 */
export const BANKING_SYSTEM_CATEGORIES: readonly SystemCategoryDef[] = [
  { code: 'DEPOSITO_VENTA', name: 'Depósito de venta', flow: 'IN' },
  { code: 'LIQUIDACION_TPV', name: 'Liquidación TPV', flow: 'IN' },
  { code: 'COBRO_CLIENTE', name: 'Cobro a cliente', flow: 'IN' },
  { code: 'PAGO_PROVEEDOR', name: 'Pago a proveedor', flow: 'OUT' },
  { code: 'GASTO', name: 'Gasto', flow: 'OUT' },
  { code: 'COMISION_BANCARIA', name: 'Comisión bancaria', flow: 'OUT' },
  { code: 'IMPUESTOS', name: 'Impuestos', flow: 'OUT' },
  { code: 'NOMINA', name: 'Nómina', flow: 'OUT' },
  { code: 'TRASPASO', name: 'Traspaso', flow: 'BOTH' },
  { code: 'APORTACION_SOCIO', name: 'Aportación de socio', flow: 'IN' },
  { code: 'RETIRO_SOCIO', name: 'Retiro de socio', flow: 'OUT' },
  { code: 'OTRO', name: 'Otro', flow: 'BOTH' },
] as const;

/** Nombre de la categoría de sistema usada por los traspasos. */
export const TRANSFER_CATEGORY_NAME = 'Traspaso';
