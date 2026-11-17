/**
 * @fileoverview (2.95.0) E4 de plan-efectivo: la configuración del efectivo de la cuenta.
 * @module Contracts/Banking/Schemas/CashSettings
 *
 * Mismo canal que Inventario y Producción: claves `cash.<sección>.<campo>` de `tenant_settings`, que
 * el sync ya reparte entre la nube y el escritorio sin red (último en escribir gana, **por clave**).
 *
 * - `count.explainAbove`: un arqueo con diferencia mayor que esto pide explicación.
 * - `custody.agingDays`: días que el efectivo puede seguir «en manos de» alguien antes de marcarse.
 * - `petty.lowBalancePercent`: por debajo de este % de su fondo, la caja chica se marca para reponer.
 * - `deposit.matchDays`: días de holgura al sugerir un depósito de efectivo en la conciliación.
 *
 * {@link aClavesDeEfectivo} y {@link deClavesDeEfectivo} son la única traducción; el escritorio las
 * espeja en `ConfiguracionDeEfectivo.cs`.
 */

import { z } from 'zod';

export const cashSettingsSchema = z.object({
    count: z
        .object({
            /** Diferencia de arqueo (en pesos) a partir de la cual se exige explicación. */
            explainAbove: z.number().min(0).max(1_000_000).default(50),
        })
        .default({}),
    custody: z
        .object({
            /** Días que el efectivo puede estar «en manos de» alguien antes de marcarse. */
            agingDays: z.number().int().min(1).max(365).default(7),
        })
        .default({}),
    petty: z
        .object({
            /** % del fondo fijo por debajo del cual la caja chica se marca para reponer. */
            lowBalancePercent: z.number().min(0).max(100).default(30),
        })
        .default({}),
    deposit: z
        .object({
            /** Días de holgura entre la fecha del depósito y la del banco al sugerirlo. */
            matchDays: z.number().int().min(0).max(30).default(5),
        })
        .default({}),
});

/** PUT /api/cash-settings — el documento entero (se guarda solo lo que cambió). */
export const updateCashSettingsSchema = cashSettingsSchema;

export type CashSettings = z.infer<typeof cashSettingsSchema>;
export type UpdateCashSettingsRequest = z.input<typeof updateCashSettingsSchema>;

/** GET /api/cash-settings. `updatedAt` = la clave más reciente. */
export interface CashSettingsResponse extends CashSettings {
    readonly updatedAt: string | null;
}

/** Prefijo de las claves. Va en `SYNCABLE_SETTING_PREFIXES` (nube) y en `SyncablePrefixes` (escritorio). */
export const CASH_SETTINGS_PREFIX = 'cash.';

/** El documento con todo por omisión. */
export const CASH_SETTINGS_DEFAULT: CashSettings = cashSettingsSchema.parse({});

type Seccion = keyof CashSettings;
const SECCIONES = Object.keys(cashSettingsSchema.shape) as Seccion[];

function formaDe(seccion: Seccion): z.ZodRawShape {
    return (cashSettingsSchema.shape[seccion] as z.ZodDefault<z.AnyZodObject>)._def.innerType.shape;
}

/** `cash.count.explainAbove` y similares. */
export function claveDeEfectivo(seccion: Seccion, campo: string): string {
    return `${CASH_SETTINGS_PREFIX}${seccion}.${campo}`;
}

/** El documento como claves → valor (JSON). */
export function aClavesDeEfectivo(settings: CashSettings): Record<string, string> {
    const claves: Record<string, string> = {};
    for (const seccion of SECCIONES) {
        const valores = settings[seccion] as Record<string, unknown>;
        for (const campo of Object.keys(formaDe(seccion))) {
            claves[claveDeEfectivo(seccion, campo)] = JSON.stringify(valores[campo] ?? null);
        }
    }
    return claves;
}

/** Las claves → el documento. Lo que falte, no sea JSON o no valide toma su valor por omisión. */
export function deClavesDeEfectivo(claves: Readonly<Record<string, string | null | undefined>>): CashSettings {
    const crudo: Record<string, Record<string, unknown>> = {};
    for (const seccion of SECCIONES) {
        const valores: Record<string, unknown> = {};
        for (const [campo, tipo] of Object.entries(formaDe(seccion))) {
            const texto = claves[claveDeEfectivo(seccion, campo)];
            if (texto == null) continue;
            let valor: unknown;
            try {
                valor = JSON.parse(texto);
            } catch {
                continue;
            }
            if (valor === null) continue;
            if ((tipo as z.ZodTypeAny).safeParse(valor).success) valores[campo] = valor;
        }
        crudo[seccion] = valores;
    }
    return cashSettingsSchema.parse(crudo);
}

// ── Arqueo ──────────────────────────────────────────────────────────────────

/** Una denominación contada (billete o moneda) y cuántas piezas. */
export const denominacionContadaSchema = z.object({
    value: z.number().positive().max(100_000),
    quantity: z.number().int().min(0).max(1_000_000),
});

/**
 * POST /api/bank-accounts/:id/cash-count — arquear un lugar de efectivo. El esperado no viaja: lo
 * calcula quien recibe, del ledger, en ese momento. Si hay diferencia se escribe un movimiento a cargo
 * del responsable del lugar (113-01).
 */
export const registerCashCountSchema = z.object({
    countedAmount: z.number().min(0).max(999_999_999.99),
    /** Fecha ISO (YYYY-MM-DD). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    explanation: z.string().trim().max(400).nullish(),
    denominations: z.array(denominacionContadaSchema).max(40).nullish(),
});

export type RegisterCashCountRequest = z.infer<typeof registerCashCountSchema>;

export interface CashCountResponse {
    /** Tanda 5: el arqueo es un documento propio (`cash_counts`). */
    readonly id: string;
    /** `ARQ-W-######` en la web, `ARQ-<equipo>-######` en cada escritorio. */
    readonly countNumber: string;
    readonly accountId: string;
    readonly expected: number;
    readonly counted: number;
    /** contado − esperado: negativo es faltante. */
    readonly difference: number;
    /** El movimiento de la diferencia, si la hubo. */
    readonly transactionId: string | null;
}

/** Tanda 5: serie de folios de los arqueos hechos en la web. */
export const CASH_COUNT_WEB_PREFIX = 'ARQ-W-';

/** Tanda 5: la semilla del id del movimiento de la diferencia de un arqueo (la misma en las dos puntas). */
export const semillaDeDiferenciaDeArqueo = (cashCountId: string): string => `cash-count-difference:${cashCountId}`;

/** GET /api/bank-accounts/cash-counts?accountId= — un arqueo de la lista (lo más nuevo primero). */
export interface CashCountListItem {
    readonly id: string;
    readonly countNumber: string;
    readonly accountId: string;
    /** YYYY-MM-DD */
    readonly date: string;
    readonly expected: number;
    readonly counted: number;
    readonly difference: number;
    readonly denominations: readonly { readonly value: number; readonly quantity: number }[] | null;
    readonly explanation: string | null;
    readonly responsibleName: string | null;
    readonly transactionId: string | null;
    readonly createdBy: string | null;
    /** ISO */
    readonly createdAt: string;
}
