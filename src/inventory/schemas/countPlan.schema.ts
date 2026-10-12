/**
 * @fileoverview Conteo cíclico: el plan que decide qué contar cada día.
 * @module Contracts/Inventory/Schemas/CountPlan
 *
 * ── Por qué ──
 *
 * Contar la tienda entera una vez al año cierra el negocio un domingo y, para marzo, la existencia
 * ya se desvió. El conteo cíclico cuenta **poquito todos los días**, con más frecuencia lo que más
 * vale o más se mueve (clase A), y así la tienda nunca cierra y el error se detecta a tiempo.
 *
 * ── Qué es el plan y qué produce ──
 *
 * El plan es configuración: bodega, a quién entra (clases ABC, categorías, «los que tuvieron
 * diferencia la vez pasada»), cada cuánto y cuántos productos por tanda. Al generarse una tanda
 * produce un **conteo** normal (`StockAdjustment` con `kind: 'COUNT'`, `countPlanId` apuntando al
 * plan). No hay un segundo tipo de documento de conteo: el cíclico es un conteo con origen.
 *
 * ── La clasificación ABC ──
 *
 * Por valor de consumo (costo × salidas en la ventana), con los cortes de
 * `inventorySettings.abc`. Se recalcula en un proceso nocturno; el resultado está en el reporte de
 * rotación y en cada producto (`abcClass`).
 */

import { z } from 'zod';

export const ABC_CLASSES = ['A', 'B', 'C'] as const;
export type AbcClass = (typeof ABC_CLASSES)[number];

/** Qué entra a la tanda. Se combinan: todos los criterios elegidos suman candidatos. */
export const COUNT_PLAN_STRATEGIES = [
    /** Por clase ABC, cada una con su frecuencia. */
    'ABC',
    /** Por categoría, rotando: hoy abarrotes, mañana limpieza. */
    'CATEGORY_ROTATION',
    /** Aleatorio entre todo lo que tiene existencia. */
    'RANDOM',
] as const;
export type CountPlanStrategy = (typeof COUNT_PLAN_STRATEGIES)[number];

export const COUNT_PLAN_STATUSES = ['ACTIVE', 'PAUSED'] as const;
export type CountPlanStatus = (typeof COUNT_PLAN_STATUSES)[number];

/** Días de la semana en que se genera tanda (0 = domingo, ISO local). */
const diasSchema = z.array(z.number().int().min(0).max(6)).min(1).max(7);

const countPlanBody = z.object({
    name: z.string().trim().min(1).max(120),
    warehouseId: z.string().uuid(),
    strategy: z.enum(COUNT_PLAN_STRATEGIES),
    /** Cada cuántos días debe contarse al menos una vez un producto de cada clase. */
    frequencyDays: z
        .object({
            A: z.number().int().min(1).max(365).default(30),
            B: z.number().int().min(1).max(365).default(90),
            C: z.number().int().min(1).max(365).default(180),
        })
        .optional(),
    /** CATEGORY_ROTATION: el orden de las categorías. */
    categoryIds: z.array(z.string().uuid()).max(200).optional(),
    /** Cuántos productos por tanda. */
    itemsPerRun: z.number().int().min(1).max(500),
    weekdays: diasSchema,
    /** Incluir siempre los que tuvieron diferencia en el último conteo (hasta cuadrar dos veces). */
    includeLastDiscrepancies: z.boolean().optional().default(true),
    /** Incluir los que están en negativo: un negativo siempre es un error de conteo o de captura. */
    includeNegatives: z.boolean().optional().default(true),
    /** Conteo ciego: el que cuenta no ve el teórico (ver `StockAdjustment.blind`). */
    blind: z.boolean().optional().default(true),
    /** A quién se le asigna la tanda por defecto. */
    assigneeUserId: z.string().uuid().nullish(),
});

/** POST /api/count-plans */
export const createCountPlanSchema = countPlanBody.extend({ id: z.string().uuid() });

/** PUT /api/count-plans/:id */
export const updateCountPlanSchema = countPlanBody.extend({
    status: z.enum(COUNT_PLAN_STATUSES),
    version: z.number().int().min(1),
});

/**
 * POST /api/count-plans/:id/run — generar la tanda ya, sin esperar al calendario.
 * Devuelve el conteo (borrador) creado.
 */
export const runCountPlanSchema = z.object({
    /** Id del conteo que se va a crear (identidad en origen). */
    countId: z.string().uuid(),
    /** Sobrescribe `itemsPerRun` para esta tanda. */
    itemsPerRun: z.number().int().min(1).max(500).optional(),
    actorName: z.string().trim().max(200).nullish(),
});

/** GET /api/count-plans */
export const getCountPlansSchema = z.object({
    warehouseId: z.string().uuid().optional(),
    status: z.enum(COUNT_PLAN_STATUSES).optional(),
});

export type CreateCountPlanRequest = z.infer<typeof createCountPlanSchema>;
export type UpdateCountPlanRequest = z.infer<typeof updateCountPlanSchema>;
export type RunCountPlanRequest = z.infer<typeof runCountPlanSchema>;
export type GetCountPlansQuery = z.infer<typeof getCountPlansSchema>;
