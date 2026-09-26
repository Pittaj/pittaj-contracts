/**
 * @fileoverview Reportes de Inventario: las preguntas que el kárdex ya sabe contestar.
 * @module Contracts/Inventory/Schemas/InventoryReports
 *
 * Todos son **lectura del kárdex** (`stock_movements`) con la misma regla de costo que la
 * proyección, así que se pueden pedir **a una fecha**: «¿cuánto valía el inventario el 31 de
 * diciembre?» se contesta reproyectando hasta ese instante, sin fotos guardadas.
 *
 * Un solo esquema de filtros comunes y uno por reporte. Todos aceptan `format` para exportar;
 * `json` es lo que pinta la pantalla.
 */

import { z } from 'zod';
import { STOCK_SOURCE_TYPES } from './getStockMovements.schema.js';
import { ABC_CLASSES } from './countPlan.schema.js';

export const INVENTORY_REPORT_KINDS = [
    /** Existencia y valor a una fecha, por producto × bodega. */
    'STOCK_AT_DATE',
    /** Valuación: valor por categoría/bodega a una fecha, con subtotales. */
    'VALUATION',
    /** Kárdex con saldo corrido: entradas, salidas, saldo y costo después de cada movimiento. */
    'KARDEX',
    /** Resumen de movimientos por tipo en un periodo: inicial + entradas − salidas = final. */
    'MOVEMENT_SUMMARY',
    /** Sin movimiento en N días: el inventario muerto y cuánto dinero tiene parado. */
    'NO_MOVEMENT',
    /** Lotes por caducar y caducados con existencia. */
    'EXPIRY',
    /** Merma y ajustes por motivo, producto y bodega. */
    'SHRINKAGE',
    /** Rotación, días de inventario y clasificación ABC. */
    'ROTATION_ABC',
    /** Exactitud de los conteos: renglones que cuadraron, diferencia en valor. */
    'COUNT_ACCURACY',
    /** Sugerido de reabasto: lo que está bajo el punto de reorden y cuánto pedir. */
    'REPLENISHMENT',
    /** Trazabilidad de un lote o una serie: de dónde vino y a dónde fue. */
    'TRACEABILITY',
] as const;
export type InventoryReportKind = (typeof INVENTORY_REPORT_KINDS)[number];

export const INVENTORY_REPORT_LABELS: Readonly<Record<InventoryReportKind, string>> = {
    STOCK_AT_DATE: 'Existencias a una fecha',
    VALUATION: 'Valuación del inventario',
    KARDEX: 'Kárdex por producto',
    MOVEMENT_SUMMARY: 'Resumen de movimientos',
    NO_MOVEMENT: 'Productos sin movimiento',
    EXPIRY: 'Caducidades',
    SHRINKAGE: 'Merma y ajustes',
    ROTATION_ABC: 'Rotación y ABC',
    COUNT_ACCURACY: 'Exactitud de conteos',
    REPLENISHMENT: 'Sugerido de reabasto',
    TRACEABILITY: 'Trazabilidad de lote o serie',
};

export const REPORT_FORMATS = ['json', 'xlsx', 'csv', 'pdf'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const REPORT_GROUP_BY = ['PRODUCT', 'CATEGORY', 'WAREHOUSE', 'SUPPLIER'] as const;

const comunes = {
    warehouseIds: z.array(z.string().uuid()).max(50).optional(),
    categoryIds: z.array(z.string().uuid()).max(200).optional(),
    productIds: z.array(z.string().uuid()).max(500).optional(),
    /** Incluir productos con existencia cero. */
    includeZero: z.boolean().optional().default(false),
    format: z.enum(REPORT_FORMATS).optional().default('json'),
};

const periodo = {
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
};

export const stockAtDateReportSchema = z.object({
    ...comunes,
    /** Al cierre de este día (hora local de la cuenta). */
    asOf: z.coerce.date(),
});

export const valuationReportSchema = z.object({
    ...comunes,
    asOf: z.coerce.date(),
    groupBy: z.enum(REPORT_GROUP_BY).optional().default('CATEGORY'),
});

export const kardexReportSchema = z.object({
    ...periodo,
    productId: z.string().uuid(),
    warehouseId: z.string().uuid().optional(),
    lotId: z.string().uuid().optional(),
    sourceTypes: z.array(z.enum(STOCK_SOURCE_TYPES)).optional(),
    format: z.enum(REPORT_FORMATS).optional().default('json'),
});

export const movementSummaryReportSchema = z.object({
    ...comunes,
    ...periodo,
    groupBy: z.enum(REPORT_GROUP_BY).optional().default('PRODUCT'),
});

export const noMovementReportSchema = z.object({
    ...comunes,
    days: z.number().int().min(1).max(730).default(90),
    /** Contar como movimiento solo las ventas (una devolución no es rotación). */
    salesOnly: z.boolean().optional().default(true),
});

export const expiryReportSchema = z.object({
    ...comunes,
    withinDays: z.number().int().min(0).max(3650).default(60),
    includeExpired: z.boolean().optional().default(true),
});

export const shrinkageReportSchema = z.object({
    ...comunes,
    ...periodo,
    groupBy: z.enum(['REASON', 'PRODUCT', 'CATEGORY', 'WAREHOUSE']).optional().default('REASON'),
});

export const rotationAbcReportSchema = z.object({
    ...comunes,
    ...periodo,
    abcClass: z.enum(ABC_CLASSES).optional(),
});

export const countAccuracyReportSchema = z.object({
    ...comunes,
    ...periodo,
});

export const replenishmentReportSchema = z.object({
    ...comunes,
    supplierId: z.string().uuid().optional(),
    /** Base del cálculo: bajo el punto de reorden, o bajo el mínimo. */
    trigger: z.enum(['REORDER_POINT', 'MIN_STOCK']).optional().default('REORDER_POINT'),
    /** Descontar lo que ya viene en camino (órdenes de compra abiertas, traspasos enviados). */
    includeIncoming: z.boolean().optional().default(true),
});

export const traceabilityReportSchema = z
    .object({
        lotId: z.string().uuid().optional(),
        serialNumber: z.string().trim().min(1).max(80).optional(),
        productId: z.string().uuid().optional(),
        format: z.enum(REPORT_FORMATS).optional().default('json'),
    })
    .refine((v) => v.lotId || v.serialNumber, { message: 'Di qué lote o qué serie rastrear.' });

/** POST /api/inventory/reports/:kind — cada reporte con su esquema. */
export const INVENTORY_REPORT_SCHEMAS = {
    STOCK_AT_DATE: stockAtDateReportSchema,
    VALUATION: valuationReportSchema,
    KARDEX: kardexReportSchema,
    MOVEMENT_SUMMARY: movementSummaryReportSchema,
    NO_MOVEMENT: noMovementReportSchema,
    EXPIRY: expiryReportSchema,
    SHRINKAGE: shrinkageReportSchema,
    ROTATION_ABC: rotationAbcReportSchema,
    COUNT_ACCURACY: countAccuracyReportSchema,
    REPLENISHMENT: replenishmentReportSchema,
    TRACEABILITY: traceabilityReportSchema,
} as const satisfies Record<InventoryReportKind, z.ZodTypeAny>;

export type StockAtDateReportRequest = z.infer<typeof stockAtDateReportSchema>;
export type ValuationReportRequest = z.infer<typeof valuationReportSchema>;
export type KardexReportRequest = z.infer<typeof kardexReportSchema>;
export type MovementSummaryReportRequest = z.infer<typeof movementSummaryReportSchema>;
export type NoMovementReportRequest = z.infer<typeof noMovementReportSchema>;
export type ExpiryReportRequest = z.infer<typeof expiryReportSchema>;
export type ShrinkageReportRequest = z.infer<typeof shrinkageReportSchema>;
export type RotationAbcReportRequest = z.infer<typeof rotationAbcReportSchema>;
export type CountAccuracyReportRequest = z.infer<typeof countAccuracyReportSchema>;
export type ReplenishmentReportRequest = z.infer<typeof replenishmentReportSchema>;
export type TraceabilityReportRequest = z.infer<typeof traceabilityReportSchema>;
