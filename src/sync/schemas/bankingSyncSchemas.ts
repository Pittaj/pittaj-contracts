/**
 * @fileoverview Payloads del sync de Bancos entre el escritorio y la nube (frente A · A1).
 * @module sync/schemas/bankingSync
 *
 * Cuatro entidades viajan: `bank-account`, `transaction-category`, `bank-transfer` y
 * `bank-transaction`. Son los **hechos**, no sus acumulados: ningún payload lleva saldo. El saldo de
 * una cuenta es `openingBalance` + Σ de sus movimientos no anulados, y cada punta lo deriva
 * (paridad de plataformas, §4). Que la nube diga `currentBalance` en sus respuestas HTTP no cambia
 * esto: por el sync nunca viaja.
 *
 * Son planos y en camelCase, con las mismas columnas que `bank_*` de la nube. Las fechas civiles
 * (`openingDate`, `date`) van como `AAAA-MM-DD`; los importes, como número.
 *
 * Solo se declara lo que el escritorio **sube**; lo que baja es el DTO del pull, que añade
 * `tenantId` y las marcas de auditoría.
 */

import { z } from 'zod';
import { BANKING_CONSTANTS } from '../../banking/constants/bankingConstants.js';

const { LIMITS } = BANKING_CONSTANTS;

const fechaCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha civil AAAA-MM-DD');
const importe = z.number().finite();
const texto = (max: number) => z.string().max(max);

/** `credit_card` de la cuenta: solo `CREDIT_CARD`. */
const tarjetaSchema = z
    .object({
        cutoffDay: z.number().int().min(1).max(31).nullish(),
        paymentDay: z.number().int().min(1).max(31).nullish(),
        creditLimit: z.number().nullish(),
    })
    .nullable();

/** Cuenta de tesorería. `TRANSIT` no se acepta del escritorio: la crea la nube en el primer traspaso. */
export const bankAccountSyncSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
    kind: z.enum(['BANK', 'CASH', 'CREDIT_CARD', 'PSP']),
    bankName: texto(LIMITS.MAX_BANK_NAME_LENGTH).nullish(),
    accountNumber: texto(LIMITS.MAX_ACCOUNT_NUMBER_LENGTH).nullish(),
    clabe: texto(LIMITS.CLABE_LENGTH).nullish(),
    currency: z.string().length(3),
    openingBalance: importe,
    openingDate: fechaCivil,
    locationId: z.string().uuid().nullish(),
    businessLineId: z.string().uuid().nullish(),
    ledgerAccountCode: texto(20).nullish(),
    creditCard: tarjetaSchema.nullish(),
    status: z.enum(BANKING_CONSTANTS.STATUSES),
    version: z.number().int().min(1),
});

/** Categoría del usuario. Las de sistema (`isSystem`) solo bajan: no se aceptan del escritorio. */
export const transactionCategorySyncSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(LIMITS.MIN_NAME_LENGTH).max(LIMITS.MAX_NAME_LENGTH),
    flow: z.enum(BANKING_CONSTANTS.CATEGORY_FLOWS),
    ledgerAccountCode: texto(20).nullish(),
    status: z.enum(BANKING_CONSTANTS.STATUSES),
    version: z.number().int().min(1),
});

/** Cabecera de un traspaso. Inmutable: sus dos piernas son movimientos con este `transferId`. */
export const bankTransferSyncSchema = z.object({
    id: z.string().uuid(),
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: importe.positive().max(LIMITS.MAX_AMOUNT),
    currency: z.string().length(3),
    date: fechaCivil,
    notes: texto(LIMITS.MAX_NOTES_LENGTH).nullish(),
    version: z.number().int().min(1),
});

const contraparteSchema = z
    .object({
        type: z.enum(BANKING_CONSTANTS.COUNTERPARTY_TYPES),
        id: z.string().nullish(),
        name: texto(LIMITS.MAX_COUNTERPARTY_NAME_LENGTH),
    })
    .nullable();

/**
 * Movimiento del ledger (append-only). `amount` > 0 y el signo lo da `direction`.
 *
 * El escritorio nunca marca `CLEARED` ni `reconciliationId`: eso lo hace la conciliación en la
 * nube (A4). Lo que sí puede subir es un movimiento `PENDING` o, tras anular uno, `VOID`.
 */
export const bankTransactionSyncSchema = z.object({
    id: z.string().uuid(),
    accountId: z.string().uuid(),
    date: fechaCivil,
    direction: z.enum(BANKING_CONSTANTS.DIRECTIONS),
    amount: importe.positive().max(LIMITS.MAX_AMOUNT),
    currency: z.string().length(3),
    categoryId: z.string().uuid(),
    counterparty: contraparteSchema.nullish(),
    sourceType: z.enum(BANKING_CONSTANTS.SOURCE_TYPES),
    sourceId: z.string().uuid().nullish(),
    cfdiUuids: z.array(z.string()).max(LIMITS.MAX_CFDI_UUIDS).default([]),
    reference: texto(LIMITS.MAX_REFERENCE_LENGTH).nullish(),
    notes: texto(LIMITS.MAX_NOTES_LENGTH).nullish(),
    transferId: z.string().uuid().nullish(),
    userId: z.string().uuid(),
    status: z.enum(BANKING_CONSTANTS.TRANSACTION_STATUSES),
    version: z.number().int().min(1),
});

export type BankAccountSync = z.infer<typeof bankAccountSyncSchema>;
export type TransactionCategorySync = z.infer<typeof transactionCategorySyncSchema>;
export type BankTransferSync = z.infer<typeof bankTransferSyncSchema>;
export type BankTransactionSync = z.infer<typeof bankTransactionSyncSchema>;
