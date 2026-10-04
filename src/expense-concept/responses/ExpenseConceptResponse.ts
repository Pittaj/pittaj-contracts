/**
 * @fileoverview Respuesta de un concepto de gasto.
 * @module Contracts/ExpenseConcept
 */
import type { ExpenseConceptStatus } from '../schemas/expenseConcept.schema.js';
import type { SyncPullResponse, SyncPushResponse } from '../../sync/index.js';

export interface ExpenseConceptResponse {
    readonly id: string;
    readonly name: string;
    /**
     * Clave estable de los conceptos sembrados (`ELECTRICITY`, `RENT`, `OTHER`…). Nula en los
     * que crea el usuario. No se enseña: sirve para reconocer la semilla sin depender del nombre,
     * que el usuario puede cambiar.
     */
    readonly code: string | null;
    /** Código de la cuenta de gasto (`601-03`). Se resuelve contra el libro de cada empresa. */
    readonly ledgerAccountCode: string;
    readonly businessLineId: string | null;
    readonly offeredAtCash: boolean;
    /**
     * Del sistema: «Otros gastos», donde cae lo que no tiene concepto. No se borra, no se
     * desactiva y no cambia de cuenta.
     */
    readonly isSystem: boolean;
    readonly status: ExpenseConceptStatus;
    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

export interface CreateExpenseConceptResponse {
    readonly id: string;
}

export type SyncPullExpenseConceptResponse = SyncPullResponse<ExpenseConceptResponse>;
export type SyncPushExpenseConceptResponse = SyncPushResponse;
