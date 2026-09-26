/**
 * @fileoverview Configuración de Inventario de la cuenta.
 * @module Contracts/Inventory/Schemas/InventorySettings
 *
 * Un solo documento por cuenta (singleton), editable con `version` y sincronizado
 * (`entityType: 'inventory-settings'`): las reglas que deciden si se puede vender en negativo o qué
 * lote sale primero tienen que ser las mismas en la web y en el escritorio sin red.
 *
 * ── Costeo ──
 *
 * Solo **promedio ponderado** está implementado, en las dos puntas y con la misma regla
 * (`(occurred_at, id)`). `valuationMethod` se deja en el contrato para que el día que exista PEPS
 * no haya que migrar la forma, pero hoy el único valor aceptado es `AVERAGE`. Cambiar de método con
 * movimientos ya escritos obliga a reproyectar todo el costo: no es un interruptor.
 */

import { z } from 'zod';
import { ABC_CLASSES } from './countPlan.schema.js';

export const INVENTORY_VALUATION_METHODS = ['AVERAGE'] as const;

/** Qué pasa cuando una salida deja la existencia bajo cero. */
export const NEGATIVE_STOCK_POLICIES = [
    /** Se permite (el POS nunca se detiene; el conteo lo corrige). Lo de hoy. */
    'ALLOW',
    /** Se permite y se avisa: alerta `NEGATIVE` y aviso en el POS. */
    'WARN',
    /** No se permite: la venta o el traspaso se detienen. No aplica al escritorio sin red. */
    'BLOCK',
] as const;
export type NegativeStockPolicy = (typeof NEGATIVE_STOCK_POLICIES)[number];

export const LOT_PICKING_POLICIES = [
    /** El que caduca primero. Lo correcto para lo perecedero. */
    'FEFO',
    /** El que entró primero. */
    'FIFO',
    /** Siempre se elige a mano. */
    'MANUAL',
] as const;
export type LotPickingPolicy = (typeof LOT_PICKING_POLICIES)[number];

export const inventorySettingsSchema = z.object({
    costing: z.object({
        valuationMethod: z.enum(INVENTORY_VALUATION_METHODS).default('AVERAGE'),
        /** Decimales del costo unitario (el valor total siempre a 2). */
        costDecimals: z.number().int().min(2).max(6).default(4),
    }),
    negativeStock: z.object({
        policy: z.enum(NEGATIVE_STOCK_POLICIES).default('ALLOW'),
    }),
    lots: z.object({
        pickingPolicy: z.enum(LOT_PICKING_POLICIES).default('FEFO'),
        /** Días antes de la caducidad en que un lote deja de venderse (vida útil mínima al cliente). */
        blockSaleDaysBeforeExpiry: z.number().int().min(0).max(365).default(0),
        /** Cómo se propone el número de un lote nuevo si el proveedor no trae uno. */
        autoNumberPattern: z.string().trim().max(40).default('L{AAMMDD}-{n}'),
    }),
    alerts: z.object({
        lowStock: z.boolean().default(true),
        negative: z.boolean().default(true),
        overstock: z.boolean().default(false),
        /** Avisar de caducidad con estos días de anticipación. */
        expiringDays: z.number().int().min(0).max(365).default(30),
        /** Sin movimiento en N días = inventario muerto. 0 = no avisar. */
        noMovementDays: z.number().int().min(0).max(730).default(90),
        /** A quién le llegan por correo, además de la campana. */
        emailUserIds: z.array(z.string().uuid()).max(50).default([]),
        /** Resumen diario en vez de uno por alerta. */
        dailyDigest: z.boolean().default(true),
    }),
    counts: z.object({
        /** Conteo ciego por defecto al abrir un conteo nuevo. */
        blindByDefault: z.boolean().default(false),
        /** Diferencia (en valor) a partir de la cual aplicar pide un segundo par de ojos. */
        approvalThresholdValue: z.number().min(0).default(0),
        /** Recontar automáticamente los renglones con diferencia antes de dejar aplicar. */
        requireRecountOnDiscrepancy: z.boolean().default(false),
    }),
    abc: z.object({
        /** Porcentaje acumulado del valor de consumo que cierra la clase A y la B (80/95 típico). */
        cutoffA: z.number().min(1).max(99).default(80),
        cutoffB: z.number().min(2).max(100).default(95),
        historyDays: z.number().int().min(30).max(730).default(180),
    }),
    labels: z.object({
        defaultTemplateId: z.string().uuid().nullish(),
        /** Imprimir etiquetas al recibir una compra (propone la cantidad recibida). */
        printOnReceive: z.boolean().default(false),
    }),
});

/** PUT /api/inventory-settings — el documento entero, con su versión. */
export const updateInventorySettingsSchema = inventorySettingsSchema
    .extend({ version: z.number().int().min(1) })
    .refine((v) => v.abc.cutoffA < v.abc.cutoffB, {
        message: 'El corte de la clase A tiene que ser menor que el de la B.',
        path: ['abc', 'cutoffA'],
    });

export type InventorySettings = z.infer<typeof inventorySettingsSchema>;
export type UpdateInventorySettingsRequest = z.infer<typeof updateInventorySettingsSchema>;

/** Para validar cortes y frecuencias: las clases en orden. */
export const ABC_ORDER = ABC_CLASSES;
