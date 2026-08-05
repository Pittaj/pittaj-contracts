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

  // ── N2 · Conciliación ────────────────────────────────────────────

  /** De dónde salieron las líneas del estado de cuenta. */
  STATEMENT_SOURCES: ['PDF', 'IMAGE', 'CSV', 'XLSX', 'OFX', 'MANUAL', 'FEED'] as const,

  /** Estados de la conciliación. RECONCILED es terminal (no se reabre). */
  STATEMENT_STATUSES: ['IMPORTED', 'IN_PROGRESS', 'RECONCILED'] as const,

  /** Estado de emparejamiento de una línea del banco. */
  MATCH_STATUSES: ['UNMATCHED', 'SUGGESTED', 'MATCHED', 'CREATED'] as const,

  /**
   * De dónde vino la sugerencia, en el orden de prioridad del spec (§5).
   * Se guarda en la línea para poder auditar por qué se propuso el match.
   */
  MATCH_ORIGINS: [
    'EXACT_REFERENCE',
    'AMOUNT_AND_DATE',
    'CASH_CLOSURE',
    'TPV_SETTLEMENT',
    'RULE',
    'MANUAL',
  ] as const,

  /** Acción de una regla de conciliación. */
  RULE_ACTIONS: ['SET_CATEGORY', 'TPV_SPLIT'] as const,

  RECONCILIATION_LIMITS: {
    /** Días de tolerancia al emparejar por monto + fecha (spec §5.2). */
    DATE_TOLERANCE_DAYS: 3,

    /**
     * Tolerancia en centavos para *sugerir* un match. Nunca aplica nada
     * automáticamente: por debajo de este umbral la línea se propone, no se concilia.
     */
    AMOUNT_TOLERANCE_CENTS: 2,

    /** Líneas máximas por estado de cuenta importado. */
    MAX_STATEMENT_LINES: 2000,

    /** Longitud máxima de la descripción que manda el banco. */
    MAX_LINE_DESCRIPTION_LENGTH: 300,

    /** Movimientos máximos ligados a una sola línea (cardinalidad 1:N). */
    MAX_MATCHED_TRANSACTIONS: 50,

    /** Reglas de conciliación máximas por tenant. */
    MAX_RULES: 200,

    /** Tasa de comisión TPV máxima aceptada (fracción, no porcentaje). */
    MAX_COMMISSION_RATE: 0.2,
  },

  /**
   * Naturaleza del saldo de la cuenta.
   *
   * DEBTOR (deudora) = el dinero es tuyo: el abono sube el saldo.
   * CREDITOR (acreedora) = es una deuda: el CARGO sube el saldo y el PAGO lo
   * baja. Las tarjetas de crédito son acreedoras, y no distinguirlo invierte
   * el estado de cuenta completo.
   */
  ACCOUNT_NATURES: ['DEBTOR', 'CREDITOR'] as const,

  /**
   * Clases de término del resumen que imprime un banco.
   *
   * NO se usan para cuadrar —para eso basta el signo— sino para casar los
   * movimientos leídos contra el término que les corresponde. `OTHER` existe
   * porque el noveno banco va a traer un renglón que nadie previó, y perder la
   * ecuación entera por no saber cómo llamarlo sería absurdo.
   */
  SUMMARY_TERM_KINDS: [
    'DEPOSITS',
    'WITHDRAWALS',
    'COMMISSIONS',
    'COMMISSIONS_TAX',
    'INTEREST_EARNED',
    'INTEREST_CHARGED',
    'TAX_WITHHELD',
    'PAYMENTS',
    'CHARGES',
    'INSTALLMENTS',
    'ADJUSTMENTS',
    'OTHER',
  ] as const,

  // ── N3 · Aplicación de pagos a documentos ────────────────────────

  /**
   * Documentos a los que un egreso se puede aplicar.
   *
   * Son los dos sabores de `Purchase` (kind INVENTORY / EXPENSE) y se
   * distinguen a propósito: la contabilidad futura no arma la misma póliza
   * pagando mercancía que pagando la luz. Coinciden con los `SOURCE_TYPES`
   * homónimos porque son el mismo documento visto desde el movimiento.
   */
  PAYABLE_DOCUMENT_TYPES: ['PURCHASE', 'EXPENSE'] as const,

  PAYMENT_APPLICATION_LIMITS: {
    /**
     * Documentos que un solo movimiento puede pagar.
     *
     * Un pago a proveedor que cubre 30 facturas es un caso real; 200 es un
     * error de captura o un intento de meter un lote entero como un pago.
     */
    MAX_APPLICATIONS: 30,

    /** Longitud máxima del folio del documento que se guarda como snapshot. */
    MAX_DOCUMENT_NUMBER_LENGTH: 50,
  },

  /**
   * Epsilon para comparar dinero.
   *
   * Los montos son decimales de 2 posiciones, así que medio centavo separa
   * "igual" de "distinto" sin que la aritmética de punto flotante genere
   * falsos descuadres (`0.1 + 0.2 !== 0.3` en binario).
   *
   * Vive en el contrato a propósito: backend y frontend deben coincidir en
   * qué cuenta como cuadrado. Si cada capa lo declarara por su cuenta,
   * podrían discrepar en silencio sobre si una conciliación puede cerrarse.
   */
  MONEY_EPSILON: 0.005,
} as const;

export type BankAccountKindValue = (typeof BANKING_CONSTANTS.ACCOUNT_KINDS)[number];
export type BankingStatusValue = (typeof BANKING_CONSTANTS.STATUSES)[number];
export type CategoryFlowValue = (typeof BANKING_CONSTANTS.CATEGORY_FLOWS)[number];
export type TransactionDirectionValue = (typeof BANKING_CONSTANTS.DIRECTIONS)[number];
export type TransactionStatusValue = (typeof BANKING_CONSTANTS.TRANSACTION_STATUSES)[number];
export type TransactionSourceTypeValue = (typeof BANKING_CONSTANTS.SOURCE_TYPES)[number];
export type CounterpartyTypeValue = (typeof BANKING_CONSTANTS.COUNTERPARTY_TYPES)[number];
export type StatementSourceValue = (typeof BANKING_CONSTANTS.STATEMENT_SOURCES)[number];
export type StatementStatusValue = (typeof BANKING_CONSTANTS.STATEMENT_STATUSES)[number];
export type MatchStatusValue = (typeof BANKING_CONSTANTS.MATCH_STATUSES)[number];
export type MatchOriginValue = (typeof BANKING_CONSTANTS.MATCH_ORIGINS)[number];
export type ReconciliationRuleActionValue = (typeof BANKING_CONSTANTS.RULE_ACTIONS)[number];
export type PayableDocumentTypeValue = (typeof BANKING_CONSTANTS.PAYABLE_DOCUMENT_TYPES)[number];
export type AccountNatureValue = (typeof BANKING_CONSTANTS.ACCOUNT_NATURES)[number];
export type SummaryTermKindValue = (typeof BANKING_CONSTANTS.SUMMARY_TERM_KINDS)[number];

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
