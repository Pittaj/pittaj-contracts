/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Banking (Bancos N1).
 * @module banking/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { BANKING_CONSTANTS } from '../constants/index.js';

const { LIMITS } = BANKING_CONSTANTS;

// ============================================================
// ENUMS
// ============================================================

const accountKindEnum = z.enum(BANKING_CONSTANTS.ACCOUNT_KINDS);
const statusEnum = z.enum(BANKING_CONSTANTS.STATUSES);
const flowEnum = z.enum(BANKING_CONSTANTS.CATEGORY_FLOWS);
const directionEnum = z.enum(BANKING_CONSTANTS.DIRECTIONS);
const transactionStatusEnum = z.enum(BANKING_CONSTANTS.TRANSACTION_STATUSES);
const sourceTypeEnum = z.enum(BANKING_CONSTANTS.SOURCE_TYPES);
const counterpartyTypeEnum = z.enum(BANKING_CONSTANTS.COUNTERPARTY_TYPES);

// ============================================================
// SUB-SCHEMAS
// ============================================================

/** CLABE interbancaria: 18 dígitos (el dígito verificador se valida en dominio). */
const clabeSchema = z
  .string()
  .trim()
  .regex(/^\d{18}$/, 'La CLABE debe tener 18 dígitos');

/** Fecha en formato ISO (YYYY-MM-DD). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD');

/** Configuración de tarjeta de crédito (solo kind=CREDIT_CARD). */
const creditCardConfigSchema = z.object({
  cutoffDay: z.number().int().min(1).max(31).nullish(),
  paymentDay: z.number().int().min(1).max(31).nullish(),
  creditLimit: z.number().min(0).max(LIMITS.MAX_AMOUNT).nullish(),
});

/** Contraparte del movimiento. */
const counterpartySchema = z.object({
  type: counterpartyTypeEnum,
  id: z.string().uuid().nullish(),
  name: z.string().trim().min(1).max(LIMITS.MAX_COUNTERPARTY_NAME_LENGTH),
});

/** Documento origen del movimiento. */
const transactionSourceSchema = z.object({
  type: sourceTypeEnum,
  id: z.string().uuid().nullish(),
});

// ============================================================
// PARAMS
// ============================================================

/** Validación de parámetro :id en la URL. */
export const bankingIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS — Cuentas
// ============================================================

/** POST /api/bank-accounts — Crear cuenta (SaveBankAccount, modo create). */
export const createBankAccountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
  kind: accountKindEnum.exclude(['TRANSIT']),
  bankName: z.string().trim().max(LIMITS.MAX_BANK_NAME_LENGTH).nullish(),
  accountNumber: z.string().trim().max(LIMITS.MAX_ACCOUNT_NUMBER_LENGTH).nullish(),
  clabe: clabeSchema.nullish(),
  currency: z.string().trim().length(3).optional(),
  openingBalance: z.number().min(-LIMITS.MAX_AMOUNT).max(LIMITS.MAX_AMOUNT).optional(),
  openingDate: isoDateSchema,
  locationId: z.string().uuid().nullish(),
  ledgerAccountCode: z.string().trim().max(20).nullish(),
  creditCard: creditCardConfigSchema.nullish(),
});

/** PUT /api/bank-accounts/:id — Actualizar cuenta (SaveBankAccount, modo update). */
export const updateBankAccountSchema = z.object({
  version: z.number().int().min(1),
  name: z.string().trim().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH).optional(),
  kind: accountKindEnum.exclude(['TRANSIT']).optional(),
  bankName: z.string().trim().max(LIMITS.MAX_BANK_NAME_LENGTH).nullish(),
  accountNumber: z.string().trim().max(LIMITS.MAX_ACCOUNT_NUMBER_LENGTH).nullish(),
  clabe: clabeSchema.nullish(),
  currency: z.string().trim().length(3).optional(),
  openingBalance: z.number().min(-LIMITS.MAX_AMOUNT).max(LIMITS.MAX_AMOUNT).optional(),
  openingDate: isoDateSchema.optional(),
  locationId: z.string().uuid().nullish(),
  ledgerAccountCode: z.string().trim().max(20).nullish(),
  creditCard: creditCardConfigSchema.nullish(),
});

/**
 * PUT /api/transaction-categories/:id/ledger-account — asignar (o quitar) su cuenta contable.
 *
 * Sin `version`: lo único mutable de una categoría es este código, y dos personas asignándoselo a
 * la vez quieren lo mismo. Un conflicto OCC aquí sería fricción sin dato que proteger.
 */
export const assignCategoryLedgerAccountSchema = z.object({
  /** Código del catálogo (`701-01`). `null` o cadena vacía quita la asignación. */
  ledgerAccountCode: z.string().trim().max(20).nullable(),
});

/**
 * POST /api/bank-transactions/:id/reverse — contramovimiento de un movimiento conciliado.
 *
 * No existe un endpoint para reabrir la conciliación, y esa ausencia es la decisión: una
 * conciliación cerrada es el soporte de un saldo que ya se declaró. Se corrige hacia adelante.
 */
export const reverseTransactionSchema = z.object({
  /** Fecha del contramovimiento. Tiene que ir después del periodo que concilió el original. */
  date: isoDateSchema,
  /** Por qué se corrige. Obligatorio: sin él, dentro de un año nadie sabrá qué es ese movimiento. */
  reason: z.string().trim().min(3).max(300),
});

/** GET /api/bank-accounts/ledger-options — cuentas contables que Tesorería puede elegir. */
export const getLedgerAccountOptionsSchema = z.object({
  /** Acota a la empresa dueña de esa sucursal. Sin él, todas las del tenant. */
  locationId: z.string().uuid().optional(),
});

/** POST /api/bank-accounts/:id/archive — Archivar (INACTIVE) / reactivar. */
export const archiveBankAccountSchema = z.object({
  version: z.number().int().min(1),
  /** true = archivar (default); false = reactivar. */
  archive: z.boolean().optional(),
});

// ============================================================
// COMMANDS — Movimientos
// ============================================================

/** POST /api/bank-transactions — Registrar ingreso/egreso. */
export const registerTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  accountId: z.string().uuid(),
  date: isoDateSchema,
  direction: directionEnum,
  amount: z.number().positive().max(LIMITS.MAX_AMOUNT),
  categoryId: z.string().uuid({ message: 'La categoría es obligatoria' }),
  counterparty: counterpartySchema.nullish(),
  source: transactionSourceSchema.optional(),
  cfdiUuids: z.array(z.string().uuid()).max(LIMITS.MAX_CFDI_UUIDS).optional(),
  reference: z.string().trim().max(LIMITS.MAX_REFERENCE_LENGTH).nullish(),
  notes: z.string().trim().max(LIMITS.MAX_NOTES_LENGTH).nullish(),
});

/** POST /api/bank-transactions/:id/void — Anular (solo desde PENDING). */
export const voidTransactionSchema = z.object({
  version: z.number().int().min(1),
});

// ============================================================
// COMMANDS — Traspasos
// ============================================================

/** POST /api/bank-transfers — Crear traspaso (2 piernas vía cuenta puente). */
export const createTransferSchema = z
  .object({
    id: z.string().uuid().optional(),
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().positive().max(LIMITS.MAX_AMOUNT),
    date: isoDateSchema,
    notes: z.string().trim().max(LIMITS.MAX_NOTES_LENGTH).nullish(),
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: 'La cuenta origen y destino deben ser distintas',
    path: ['toAccountId'],
  });

// ============================================================
// QUERIES
// ============================================================

/** GET /api/bank-accounts — Listar cuentas con saldos. */
export const getBankAccountsSchema = z.object({
  q: z.string().max(100).optional(),
  kind: accountKindEnum.optional(),
  status: statusEnum.optional(),
  /** true = incluir cuentas del sistema (TRANSIT); default false. */
  includeSystem: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

/** GET /api/transaction-categories — Listar categorías (lazy-seed del sistema). */
export const getTransactionCategoriesSchema = z.object({
  flow: flowEnum.optional(),
  status: statusEnum.optional(),
});

/** GET /api/bank-transactions — Listar movimientos (paginado + filtros). */
export const getBankTransactionsSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: transactionStatusEnum.optional(),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

// ============================================================
// N2 · CONCILIACIÓN
// ============================================================

const { RECONCILIATION_LIMITS: RECON } = BANKING_CONSTANTS;

const statementSourceEnum = z.enum(BANKING_CONSTANTS.STATEMENT_SOURCES);
const statementStatusEnum = z.enum(BANKING_CONSTANTS.STATEMENT_STATUSES);
const ruleActionEnum = z.enum(BANKING_CONSTANTS.RULE_ACTIONS);

/**
 * Una línea extraída del documento. Es también la forma que debe devolver
 * cualquier extractor (modelo multimodal, parser CSV, agregador), así que se
 * valida igual venga de donde venga.
 */
export const extractedStatementLineSchema = z.object({
  date: isoDateSchema,
  description: z.string().trim().min(1).max(RECON.MAX_LINE_DESCRIPTION_LENGTH),
  reference: z.string().trim().max(LIMITS.MAX_REFERENCE_LENGTH).nullish(),
  /** Con signo: + abono, − cargo. Cero no es un movimiento. */
  amount: z
    .number()
    .refine((v) => v !== 0, 'El monto no puede ser cero')
    .refine((v) => Math.abs(v) <= LIMITS.MAX_AMOUNT, 'Monto fuera de rango'),
});

/**
 * Cifras de control del resumen del estado de cuenta.
 *
 * Opcionales porque no todos los bancos las imprimen; cada una que llegue es
 * una comprobación independiente más sobre la lectura.
 */
export const statementDeclaredTotalsSchema = z.object({
  totalCredits: z.number().min(0).max(LIMITS.MAX_AMOUNT).nullish(),
  totalDebits: z.number().min(0).max(LIMITS.MAX_AMOUNT).nullish(),
  movementCount: z.number().int().min(0).max(RECON.MAX_STATEMENT_LINES).nullish(),
  /**
   * Solo la cola de la cuenta: no se guarda el número completo.
   *
   * Se normaliza en vez de exigir el formato porque quien llena este campo es
   * una lectura automática, y llega de mil formas: `**** 4521`, el número
   * completo, con guiones. Exigir cuatro dígitos exactos tiraría la extracción
   * entera —los 17 movimientos ya bien leídos— por el formato de un dato
   * accesorio. Lo que no alcance a cuatro dígitos se queda en null, que el
   * verificador reporta como "no comprobable" y no como fallo.
   */
  accountNumberTail: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((value) => {
      if (value === null || value === undefined) return null;
      // Formato y enmascarado fuera; el resto tiene que ser todo dígitos. Si
      // el extractor devuelve un identificador alfanumérico (el `acct_…` de
      // una pasarela), quedarse con sus dígitos sueltos fabricaría una cola
      // que después se compara y falla sin que nadie se haya equivocado.
      const limpio = String(value).replace(/[\s._·•*#xX-]/g, '');
      if (!/^\d{4,}$/.test(limpio)) return null;
      return limpio.slice(-4);
    }),
});

/** Lo que produce el puerto de extracción: saldos declarados + líneas. */
/**
 * Un renglón de la ecuación del resumen.
 *
 * El importe se exige POSITIVO y el sentido va aparte en `sign`. Es a propósito:
 * si se aceptara el signo dentro del número, un banco que imprime
 * `Salidas: $-80,875.35` y otro que imprime `−  $19,417.49` producirían la misma
 * cifra con sentidos opuestos, y nadie podría saber cuál era cuál después.
 */
export const statementSummaryTermSchema = z.object({
  label: z.string().trim().min(1).max(120),
  amount: z.number().min(0).max(LIMITS.MAX_AMOUNT),
  sign: z.union([z.literal(1), z.literal(-1)]),
  kind: z.enum(BANKING_CONSTANTS.SUMMARY_TERM_KINDS),
});

/** El bloque de resumen del documento, como ecuación. */
export const statementDeclaredSummarySchema = z.object({
  openingBalance: z.number().min(-LIMITS.MAX_AMOUNT).max(LIMITS.MAX_AMOUNT),
  closingBalance: z.number().min(-LIMITS.MAX_AMOUNT).max(LIMITS.MAX_AMOUNT),
  nature: z.enum(BANKING_CONSTANTS.ACCOUNT_NATURES),
  /** Un resumen puede traer muchos renglones; 30 ya es un documento raro. */
  terms: z.array(statementSummaryTermSchema).max(30),
});

export const statementExtractionSchema = z
  .object({
    openingBalance: z.number(),
    closingBalance: z.number(),
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
    lines: z.array(extractedStatementLineSchema).min(1).max(RECON.MAX_STATEMENT_LINES),
    declared: statementDeclaredTotalsSchema.nullish(),
    summary: statementDeclaredSummarySchema.nullish(),
  })
  .refine((v) => v.periodStart <= v.periodEnd, {
    message: 'El periodo inicia después de terminar',
    path: ['periodEnd'],
  });

/**
 * POST /api/bank-statements — Importar un estado de cuenta ya extraído.
 *
 * El archivo se sube aparte (va por el worker a R2, como los adjuntos de
 * soporte) y aquí se referencia por su llave: así el import es idempotente y
 * se puede reintentar la extracción sin volver a subir el documento.
 */
export const importBankStatementSchema = z.object({
  id: z.string().uuid().optional(),
  accountId: z.string().uuid(),
  source: statementSourceEnum,
  /** Llave del original en R2; null solo cuando la captura fue manual. */
  sourceFileKey: z.string().trim().max(300).nullish(),
  /** Qué extractor produjo las líneas; null en captura manual. */
  extractor: z.string().trim().max(100).nullish(),
  extraction: statementExtractionSchema,
});

/** Condición de una regla sobre la línea del banco. */
const reconciliationMatchSchema = z
  .object({
    descriptionContains: z.string().trim().min(2).max(100),
    sign: directionEnum.nullish(),
    amountMin: z.number().min(0).max(LIMITS.MAX_AMOUNT).nullish(),
    amountMax: z.number().min(0).max(LIMITS.MAX_AMOUNT).nullish(),
  })
  .refine((v) => v.amountMin == null || v.amountMax == null || v.amountMin <= v.amountMax, {
    message: 'El monto mínimo no puede exceder al máximo',
    path: ['amountMax'],
  });

/** Acción de la regla. TPV_SPLIT no lleva categoría: usa las del sistema. */
const reconciliationActionSchema = z
  .object({
    type: ruleActionEnum,
    categoryId: z.string().uuid().nullish(),
    commissionRate: z.number().min(0).max(RECON.MAX_COMMISSION_RATE).nullish(),
  })
  .refine((v) => v.type !== 'SET_CATEGORY' || Boolean(v.categoryId), {
    message: 'SET_CATEGORY exige una categoría',
    path: ['categoryId'],
  });

/** POST/PUT /api/reconciliation-rules */
export const upsertReconciliationRuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
  /** null = aplica a todas las cuentas. */
  accountId: z.string().uuid().nullish(),
  match: reconciliationMatchSchema,
  action: reconciliationActionSchema,
  priority: z.number().int().min(0).max(9999),
});

/**
 * POST /api/bank-statements/:id/lines/:lineId/match — Ligar a movimientos existentes.
 * Acepta varios para la cardinalidad 1:N (un depósito que junta dos cortes).
 */
export const matchStatementLineSchema = z.object({
  transactionIds: z
    .array(z.string().uuid())
    .min(1)
    .max(RECON.MAX_MATCHED_TRANSACTIONS),
});

/**
 * POST /api/bank-statements/:id/lines/:lineId/create-transaction — Crear el
 * movimiento que falta y ligarlo. La categoría es obligatoria, como en todo
 * el ledger: no existen movimientos sin clasificar.
 */
export const createTransactionForLineSchema = z.object({
  categoryId: z.string().uuid(),
  counterparty: counterpartySchema.nullish(),
  notes: z.string().trim().max(LIMITS.MAX_NOTES_LENGTH).nullish(),
});

/**
 * POST /api/bank-statements/:id/lines/:lineId/tpv-split — Aplicar el split TPV.
 *
 * Los tres montos los captura el usuario con los centavos reales del banco; el
 * sistema los propone pero no los impone (spec §6).
 */
export const applyTpvSplitSchema = z
  .object({
    grossAmount: z.number().positive().max(LIMITS.MAX_AMOUNT),
    commissionAmount: z.number().min(0).max(LIMITS.MAX_AMOUNT),
    commissionTaxAmount: z.number().min(0).max(LIMITS.MAX_AMOUNT),
    cashClosureIds: z.array(z.string().uuid()).max(100).optional(),
  })
  .refine((v) => v.commissionAmount + v.commissionTaxAmount < v.grossAmount, {
    message: 'La comisión y su IVA no pueden igualar o superar la venta bruta',
    path: ['commissionAmount'],
  });

/** POST /api/bank-statements/:id/close — Cerrar la conciliación (irreversible). */
export const closeBankStatementSchema = z.object({
  /** Confirmación explícita: cerrar no se deshace, se corrige con contramovimientos. */
  confirm: z.literal(true),
});

/** GET /api/bank-statements — Listar conciliaciones de una cuenta. */
export const getBankStatementsSchema = z.object({
  accountId: z.string().uuid().optional(),
  status: statementStatusEnum.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

/** GET /api/reconciliation-rules */
export const getReconciliationRulesSchema = z.object({
  accountId: z.string().uuid().optional(),
  status: statusEnum.optional(),
});

// ============================================================
// N3 · APLICACIÓN DE PAGOS A DOCUMENTOS
// ============================================================

const { PAYMENT_APPLICATION_LIMITS: APPLY } = BANKING_CONSTANTS;

const payableDocumentTypeEnum = z.enum(BANKING_CONSTANTS.PAYABLE_DOCUMENT_TYPES);

/** Un tramo del movimiento destinado a un documento. */
const paymentApplicationSchema = z.object({
  documentType: payableDocumentTypeEnum,
  documentId: z.string().uuid(),
  appliedAmount: z.number().positive().max(LIMITS.MAX_AMOUNT),
});

/**
 * PUT /api/bank-transactions/:id/applications — Reparto del movimiento.
 *
 * Reemplaza el reparto completo, no lo acumula: mandar `[]` desaplica todo.
 * Reemplazar en bloque es lo único que permite validar la suma de una sola
 * vez; aplicar de a uno dejaría estados intermedios donde el reparto excede
 * el movimiento y habría que decidir si eso es válido "por un momento".
 *
 * El folio y el nombre del proveedor NO viajan: los resuelve el servidor
 * leyendo el documento. Si los mandara el cliente, el snapshot guardaría lo
 * que la pantalla creía, no lo que el documento dice.
 */
export const applyPaymentSchema = z.object({
  version: z.number().int().min(1),
  applications: z.array(paymentApplicationSchema).max(APPLY.MAX_APPLICATIONS),
});

/** GET /api/payable-documents — Documentos por pagar con su saldo. */
export const getPayableDocumentsSchema = z.object({
  /** Filtra por proveedor (soft ref). */
  counterpartyId: z.string().uuid().optional(),
  /** Texto libre: folio, proveedor o folio fiscal. */
  search: z.string().trim().max(100).optional(),
  documentType: payableDocumentTypeEnum.optional(),
  /** true (default) = solo con saldo > 0; false = incluye los saldados. */
  onlyPending: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MAX_PAGE_SIZE).optional(),
});

/**
 * `GET /api/bank-reports/balances` — saldos y disponible.
 *
 * `asOf` acota el corte del saldo en libros. Por omisión, hoy.
 */
export const getAccountBalancesReportSchema = z.object({
  asOf: isoDateSchema.optional(),
  locationId: z.string().uuid().optional(),
});

/** `GET /api/bank-reports/by-category` — movimientos agrupados por concepto. */
export const getCategoryTotalsReportSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  accountId: z.string().uuid().optional(),
});

/** `GET /api/bank-reports/commissions` — comisiones y tasa real de la terminal. */
export const getCommissionsReportSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  accountId: z.string().uuid().optional(),
});
