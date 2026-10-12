/**
 * @fileoverview Respuesta de un concepto de gasto.
 * @module Contracts/ExpenseConcept
 */
import type { ExpenseConceptGroup, ExpenseConceptStatus } from '../schemas/expenseConcept.schema.js';
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
    /** Grupo en «Mostrar todos» (E1). */
    readonly group: ExpenseConceptGroup;
    /** Frecuente de fábrica o marcado por el negocio: sale arriba del combo (E1). */
    readonly frequent: boolean;
    /** Variantes por tipo de proveedor (E1 §3). Ver `cuentaDelConcepto`. */
    readonly ledgerAccountCodeCompany: string | null;
    readonly ledgerAccountCodeForeignIndividual: string | null;
    readonly ledgerAccountCodeForeignCompany: string | null;
    /**
     * Veces que el negocio lo usó en los últimos 90 días, para ordenar el combo. Solo en la lista
     * (no viaja por sync: cada plataforma lo cuenta con sus datos).
     */
    readonly recentUses?: number;
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
