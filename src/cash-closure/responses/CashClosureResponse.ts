/**
 * @fileoverview Response DTO canónico de CashClosure
 * @module CashClosureResponse
 * @version 1.0.0
 */

import type { CashClosurePaymentSummaryPrimitives } from '../primitives/index.js';
import type { CashClosurePeriodPrimitives } from '../primitives/index.js';
import type {MoneyPrimitives} from '../../shared/index.js';

export interface CashClosureResponse {
    readonly id: string;
    readonly tenantId: string;
    readonly status: string;
    readonly shift: string;
    readonly period: CashClosurePeriodPrimitives;
    readonly posSessionId: string;
    readonly locationId: string;
    readonly userId: string;
    /** Snapshot del nombre del operador (el Operator local del desktop no sincroniza). */
    readonly userName: string | null;
    /** Dispositivo de origen (anti-rebote: el feed lo expone como originDeviceId). */
    readonly deviceId?: string | null;
    /**
     * Folio secuencial del cierre (CLS-######), generado por el desktop.
     * `null` en filas creadas en la nube o previas a la migración del campo.
     */
    readonly sequence: number | null;
    readonly openingFund: MoneyPrimitives;
    readonly paymentSummaries: CashClosurePaymentSummaryPrimitives[];
    readonly notes: string | null;
    readonly rejectionReason: string | null;
    readonly reviewedBy: string | null;
    readonly reviewedAt: string | null;
    readonly totalExpected: MoneyPrimitives;
    readonly totalActual: MoneyPrimitives;
    readonly totalDifference: MoneyPrimitives;
    /**
     * Efectivo a depositar (contado − fondo que queda al siguiente turno).
     * Lo consume Bancos como "depósito esperado" del corte. Null en cierres
     * previos a la migración o sin captura.
     */
    readonly cashToDeposit: MoneyPrimitives | null;
    readonly createdBy: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
}
