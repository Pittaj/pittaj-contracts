/**
 * @fileoverview Ajustes y conteos físicos de inventario: el documento.
 * @module Contracts/Inventory/Schemas/StockAdjustment
 *
 * ── Por qué un documento y no «poner la existencia en 8» ──
 *
 * El mandato de paridad (§4, `arquitectura/paridad-de-plataformas.md`): **ninguna operación
 * escribe una cantidad; escribe un movimiento, y la cantidad se deriva**. Un ajuste es la lista de
 * movimientos de cuadre con su motivo, y un conteo físico es lo mismo con la diferencia calculada.
 * Así el conteo deja rastro en el kárdex en vez de pisar el dato, y dos plataformas pueden ajustar
 * a la vez sin que la última borre lo que hizo la otra.
 *
 * ── Los dos tipos, un documento ──
 *
 * - `ADJUSTMENT` — ajuste: cada renglón dice **cuánto** entra (+) o sale (−), con un motivo para
 *   todo el documento (merma, daño, carga inicial…).
 * - `COUNT` — conteo físico: cada renglón dice **cuánto se contó**. Al capturarlo se fija el
 *   teórico de ese momento (`expectedQuantity`) y la diferencia es `contado − teórico`.
 *
 * ⚠️ **La diferencia se fija al contar, no al aplicar.** Si se aplicara «llevar a lo contado»
 * contra la existencia del momento de aplicar, una venta hecha entre contar y aplicar se perdería:
 * el cuadre la pisaría. Guardada como delta, la venta se descuenta aparte y el cuadre también.
 *
 * ── Estados ──
 *
 * `DRAFT` (se arma o se cuenta, en una sesión o en varias) → `APPLIED` (escribió sus movimientos).
 * `CANCELLED` solo desde borrador: uno aplicado ya está en el kárdex, y el kárdex no se edita — se
 * corrige con otro ajuste.
 *
 * ── Folio ──
 *
 * Letra `A` (`DOCUMENT_LETTERS.STOCK_ADJUSTMENT`), una serie para los dos tipos: `AW-00001` en la
 * web, `AS1-00001` en el escritorio de la sucursal S1 (ADR-018).
 */

import { z } from 'zod';

export const STOCK_ADJUSTMENT_KINDS = ['ADJUSTMENT', 'COUNT'] as const;
export type StockAdjustmentKind = (typeof STOCK_ADJUSTMENT_KINDS)[number];

export const STOCK_ADJUSTMENT_STATUSES = ['DRAFT', 'APPLIED', 'CANCELLED'] as const;
export type StockAdjustmentStatus = (typeof STOCK_ADJUSTMENT_STATUSES)[number];

/**
 * El motivo del ajuste. Decide el tipo de movimiento del kárdex (y con él la póliza, que ya lee
 * `stock_movements` por tipo): ver {@link sourceTypeDeAjuste}.
 */
export const STOCK_ADJUSTMENT_REASONS = [
    /** Merma: se echó a perder, se evaporó, se pesó de menos. */
    'SHRINKAGE',
    /** Dañado: roto, abierto, mojado. */
    'DAMAGE',
    /** Robo o faltante sin explicación. */
    'THEFT',
    /** Caducado. */
    'EXPIRED',
    /** Consumo interno: lo usó el negocio, no se vendió. */
    'INTERNAL_USE',
    /** Error de captura: corregir un movimiento mal hecho. */
    'CORRECTION',
    /** Inventario inicial: la carga de arranque. Su contrapartida es capital, no pérdida. */
    'OPENING',
    /** Diferencia de un conteo físico. Solo los documentos `COUNT`. */
    'COUNT',
    'OTHER',
] as const;
export type StockAdjustmentReason = (typeof STOCK_ADJUSTMENT_REASONS)[number];

/** Nombre en cristiano de cada motivo, para la web y como referencia del escritorio. */
export const STOCK_ADJUSTMENT_REASON_LABELS: Readonly<Record<StockAdjustmentReason, string>> = {
    SHRINKAGE: 'Merma',
    DAMAGE: 'Dañado',
    THEFT: 'Robo o faltante',
    EXPIRED: 'Caducado',
    INTERNAL_USE: 'Consumo interno',
    CORRECTION: 'Error de captura',
    OPENING: 'Inventario inicial',
    COUNT: 'Conteo físico',
    OTHER: 'Otro',
};

/** Los motivos que se eligen en un ajuste (el de conteo lo pone el tipo `COUNT`). */
export const ADJUSTMENT_REASONS_ELEGIBLES: readonly StockAdjustmentReason[] = STOCK_ADJUSTMENT_REASONS.filter(
    (r) => r !== 'COUNT'
);

/** Motivos que son una pérdida: su salida se registra como `MERMA` para reportarla por separado. */
const MOTIVOS_DE_PERDIDA: ReadonlySet<StockAdjustmentReason> = new Set([
    'SHRINKAGE',
    'DAMAGE',
    'THEFT',
    'EXPIRED',
    'INTERNAL_USE',
]);

/**
 * El tipo de movimiento que escribe un renglón. **Espejo exacto en el escritorio**
 * (`StockAdjustment.TipoDeMovimiento`).
 *
 * - Conteo → `COUNT` («Diferencia de conteo» en la póliza).
 * - Inventario inicial → `INITIAL` (contra capital de apertura, no contra resultados).
 * - Una pérdida que SALE → `MERMA` (el reporte de merma por producto la cuenta aparte).
 * - Todo lo demás → `ADJUSTMENT`.
 */
export function sourceTypeDeAjuste(
    kind: StockAdjustmentKind,
    reason: StockAdjustmentReason,
    direction: 'IN' | 'OUT'
): 'COUNT' | 'INITIAL' | 'MERMA' | 'ADJUSTMENT' {
    if (kind === 'COUNT') return 'COUNT';
    if (reason === 'OPENING') return 'INITIAL';
    if (direction === 'OUT' && MOTIVOS_DE_PERDIDA.has(reason)) return 'MERMA';
    return 'ADJUSTMENT';
}

const lineSchema = z
    .object({
        /** Id generado por el cliente: los renglones viajan por sync y necesitan identidad estable. */
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        productName: z.string().trim().min(1).max(200),
        productCode: z.string().trim().max(50).nullish(),
        /** Ajuste: cuánto entra (+) o sale (−). Ignorado en un conteo. */
        quantity: z.number().optional(),
        /** Conteo: lo que se contó. Nulo = todavía no se cuenta ese renglón. */
        countedQuantity: z.number().min(0, 'No se cuentan piezas negativas').nullish(),
        /**
         * Costo unitario de una ENTRADA (típico: inventario inicial). Sin él, entra al costo
         * promedio vigente. Las salidas siempre salen al promedio.
         */
        unitCost: z.number().min(0).nullish(),
    })
    .strict();

export type StockAdjustmentLineInput = z.infer<typeof lineSchema>;

/** GET /api/stock-adjustments · /api/stock-counts */
export const getStockAdjustmentsSchema = z.object({
    status: z.enum(STOCK_ADJUSTMENT_STATUSES).optional(),
    warehouseId: z.string().uuid().optional(),
    reason: z.enum(STOCK_ADJUSTMENT_REASONS).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    /** Folio o producto. */
    search: z.string().trim().max(100).optional(),
    includeCancelled: z.coerce.boolean().optional().default(false),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

/** POST /api/stock-adjustments · /api/stock-counts */
export const createStockAdjustmentSchema = z.object({
    /** Id generado por el cliente: identidad en origen, hace el POST reintentable. */
    id: z.string().uuid('Id de ajuste inválido'),
    warehouseId: z.string().uuid('Bodega inválida'),
    /** En un conteo se ignora: el motivo es `COUNT`. */
    reason: z.enum(STOCK_ADJUSTMENT_REASONS).optional().default('OTHER'),
    note: z.string().trim().max(1000).nullish(),
    /** Un conteo puede nacer vacío y llenarse después; un ajuste también se puede guardar a medias. */
    lines: z.array(lineSchema).max(2000),
    /** Aplicar de una vez (escribe los movimientos). */
    apply: z.boolean().optional().default(false),
    /** Quién lo hace, con nombre: el documento lo enseña y el token solo trae el id. */
    actorName: z.string().trim().max(200).nullish(),
});

/** PUT /:id — solo en borrador. */
export const updateStockAdjustmentSchema = z.object({
    warehouseId: z.string().uuid(),
    reason: z.enum(STOCK_ADJUSTMENT_REASONS).optional(),
    note: z.string().trim().max(1000).nullish(),
    lines: z.array(lineSchema).max(2000),
    version: z.number().int().min(1),
});

/** POST /:id/apply */
export const applyStockAdjustmentSchema = z.object({
    version: z.number().int().min(1),
    actorName: z.string().trim().max(200).nullish(),
});

/** POST /:id/cancel — solo en borrador. */
export const cancelStockAdjustmentSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().trim().min(1, 'Di por qué se cancela').max(1000),
});

export const stockAdjustmentIdParamSchema = z.object({ id: z.string().uuid() });

export type GetStockAdjustmentsQuery = z.infer<typeof getStockAdjustmentsSchema>;
export type CreateStockAdjustmentRequest = z.infer<typeof createStockAdjustmentSchema>;
export type UpdateStockAdjustmentRequest = z.infer<typeof updateStockAdjustmentSchema>;
export type ApplyStockAdjustmentRequest = z.infer<typeof applyStockAdjustmentSchema>;
export type CancelStockAdjustmentRequest = z.infer<typeof cancelStockAdjustmentSchema>;
