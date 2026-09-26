/**
 * @fileoverview Niveles de existencia por producto y bodega: mínimo, punto de reorden y máximo.
 * @module Contracts/Inventory/Schemas/StockLevel
 *
 * ── Por qué por bodega y no en el producto ──
 *
 * `Product.inventoryConfig` trae `minStock`/`maxStock`/`reorderPoint` **por producto**. En un
 * negocio con una sola bodega alcanza; con dos no: la tienda del centro vende 40 coca-colas al día
 * y la de la colonia 6, y un mínimo común es mentira en las dos. El nivel vive en la pareja
 * producto×bodega, y el del producto queda como **plantilla**: lo que se propone al dar de alta una
 * bodega o un producto nuevo (`source: 'PRODUCT_DEFAULT'`).
 *
 * ── Qué NO es ──
 *
 * No es una cantidad acumulada (§4 del mandato de paridad): es configuración editable, con
 * `version` para concurrencia optimista y sync como cualquier catálogo. La existencia contra la que
 * se compara sigue saliendo del kárdex.
 *
 * ── Decimales ──
 *
 * Los niveles aceptan decimales: 2.5 kg de queso es un mínimo razonable. Los del producto eran
 * enteros en el escritorio (`int`) — este contrato no hereda esa limitación.
 */

import { z } from 'zod';

/** De dónde sale el nivel efectivo que se muestra. */
export const STOCK_LEVEL_SOURCES = [
    /** Capturado para esta bodega. */
    'WAREHOUSE',
    /** Sin captura en la bodega: se usa el del producto (`inventoryConfig`). */
    'PRODUCT_DEFAULT',
    /** Calculado por la sugerencia de reabasto (demanda × días de cobertura) y aceptado. */
    'SUGGESTED',
] as const;
export type StockLevelSource = (typeof STOCK_LEVEL_SOURCES)[number];

const nivel = z.number().min(0).max(999_999_999);

const stockLevelBody = z
    .object({
        productId: z.string().uuid(),
        warehouseId: z.string().uuid(),
        /** Por debajo, la existencia está «baja» (alerta `LOW_STOCK`). */
        minStock: nivel,
        /** Al cruzarlo hacia abajo se sugiere pedir. Cero = igual al mínimo. */
        reorderPoint: nivel.optional().default(0),
        /** Hasta dónde se repone. Cero = sin tope (no hay alerta de sobreinventario). */
        maxStock: nivel.optional().default(0),
        /** Cuánto pedir de una vez (múltiplo de compra: cajas de 12). Nulo = lo que falte al máximo. */
        reorderQuantity: nivel.nullish(),
        source: z.enum(STOCK_LEVEL_SOURCES).optional().default('WAREHOUSE'),
    })
    .strict();

/** Chequeo de coherencia compartido por alta y edición. */
function coherente(v: { minStock: number; maxStock: number; reorderPoint: number }): boolean {
    if (v.maxStock > 0 && v.minStock > v.maxStock) return false;
    if (v.maxStock > 0 && v.reorderPoint > v.maxStock) return false;
    return true;
}
const MENSAJE_INCOHERENTE = 'El mínimo y el punto de reorden no pueden pasar del máximo.';

/** PUT /api/stock-levels — alta o edición de un nivel (idempotente por producto×bodega). */
export const upsertStockLevelSchema = stockLevelBody
    .extend({
        /** Id generado por el cliente la primera vez. */
        id: z.string().uuid().optional(),
        /** Ausente en el alta; obligatoria al editar. */
        version: z.number().int().min(1).optional(),
    })
    .refine(coherente, { message: MENSAJE_INCOHERENTE, path: ['minStock'] });

/**
 * PUT /api/stock-levels/bulk — la hoja «Niveles de existencia»: muchos renglones de una vez
 * (una bodega entera, o un producto en todas las bodegas). Todo o nada.
 */
export const bulkUpsertStockLevelsSchema = z.object({
    levels: z
        .array(
            stockLevelBody
                .extend({ id: z.string().uuid().optional(), version: z.number().int().min(1).optional() })
                .refine(coherente, { message: MENSAJE_INCOHERENTE, path: ['minStock'] })
        )
        .min(1)
        .max(2000),
});

/**
 * POST /api/stock-levels/suggest — propone niveles a partir de la demanda real.
 * No escribe: devuelve la propuesta para que el usuario la acepte o la corrija.
 */
export const suggestStockLevelsSchema = z.object({
    warehouseId: z.string().uuid(),
    categoryId: z.string().uuid().optional(),
    /** Ventana de demanda a promediar. */
    historyDays: z.number().int().min(7).max(365).optional().default(90),
    /** Días de venta que debe cubrir el mínimo (colchón de seguridad). */
    safetyDays: z.number().int().min(0).max(120).optional().default(7),
    /** Días que tarda el proveedor en surtir: el punto de reorden los cubre. */
    leadTimeDays: z.number().int().min(0).max(180).optional().default(5),
    /** Días de venta que debe cubrir el máximo. */
    coverageDays: z.number().int().min(1).max(365).optional().default(30),
});

/** GET /api/stock-levels */
export const getStockLevelsSchema = z.object({
    warehouseId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    /** Solo los que no tienen nivel propio en la bodega (heredan del producto o no tienen). */
    onlyMissing: z.coerce.boolean().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export type UpsertStockLevelRequest = z.infer<typeof upsertStockLevelSchema>;
export type BulkUpsertStockLevelsRequest = z.infer<typeof bulkUpsertStockLevelsSchema>;
export type SuggestStockLevelsRequest = z.infer<typeof suggestStockLevelsSchema>;
export type GetStockLevelsQuery = z.infer<typeof getStockLevelsSchema>;

// ── Reglas compartidas (espejo exacto en el escritorio: `NivelDeExistencia.cs`) ─────────────────

/** Los números de un nivel que usan las reglas. Todo en unidad base. */
export interface NivelNumeros {
    readonly minStock: number;
    readonly reorderPoint: number;
    readonly maxStock: number;
}

/**
 * El estado de una existencia contra su nivel. Es lo que pinta la pastilla de Existencias y lo que
 * alimenta la alerta de existencia baja.
 *
 * - `NEGATIVE` — bajo cero: se vendió sin existencia (un conteo o una captura la corrige).
 * - `OUT` — en cero exacto.
 * - `LOW` — por debajo del mínimo, **o** en/bajo el punto de reorden: ya toca pedir.
 * - `OVER` — por encima del máximo (solo si hay máximo).
 * - `OK` — lo demás, incluido «no tiene nivel».
 */
export function estadoDeNivel(
    onHand: number,
    nivel: NivelNumeros | null | undefined
): 'NEGATIVE' | 'OUT' | 'LOW' | 'OK' | 'OVER' {
    if (onHand < 0) return 'NEGATIVE';
    if (onHand === 0) return 'OUT';
    if (!nivel) return 'OK';
    if (nivel.minStock > 0 && onHand < nivel.minStock) return 'LOW';
    if (nivel.reorderPoint > 0 && onHand <= nivel.reorderPoint) return 'LOW';
    if (nivel.maxStock > 0 && onHand > nivel.maxStock) return 'OVER';
    return 'OK';
}

/** Parámetros de la sugerencia, con los mismos defaults que `suggestStockLevelsSchema`. */
export interface ParametrosDeSugerencia {
    readonly safetyDays: number;
    readonly leadTimeDays: number;
    readonly coverageDays: number;
    /** Redondear a enteros (productos que no se venden en fracción). */
    readonly enteros: boolean;
}

/**
 * Propone un nivel a partir de la venta diaria promedio.
 *
 * - mínimo = venta diaria × días de colchón
 * - reorden = venta diaria × (colchón + días de entrega): al cruzarlo, lo pedido llega antes de
 *   tocar el mínimo
 * - máximo = venta diaria × días de cobertura, y nunca por debajo del reorden
 *
 * Siempre hacia arriba (un mínimo de 2.1 piezas es 3). Sin venta, todo en cero: no se inventa
 * un mínimo para lo que no se mueve.
 */
export function sugerirNivel(ventaDiaria: number, p: ParametrosDeSugerencia): NivelNumeros {
    if (!(ventaDiaria > 0)) return { minStock: 0, reorderPoint: 0, maxStock: 0 };
    const arriba = (x: number) => (p.enteros ? Math.ceil(x - 1e-9) : Math.ceil(x * 100 - 1e-9) / 100);
    const minStock = arriba(ventaDiaria * p.safetyDays);
    const reorderPoint = arriba(ventaDiaria * (p.safetyDays + p.leadTimeDays));
    const maxStock = Math.max(reorderPoint, arriba(ventaDiaria * p.coverageDays));
    return { minStock, reorderPoint, maxStock };
}

export const stockLevelIdParamSchema = z.object({ id: z.string().uuid() });

/** DELETE /api/stock-levels/:id?version=N — la bodega vuelve a usar el nivel del producto. */
export const deleteStockLevelQuerySchema = z.object({
    version: z.coerce.number().int().min(1).optional(),
});
