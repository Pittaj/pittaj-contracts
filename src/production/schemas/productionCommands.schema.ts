/**
 * @fileoverview (2026-11-13) Producción en la web: los actos de la orden y la receta.
 * @module Contracts/Production
 *
 * Hasta aquí la nube solo guardaba lo que subía el escritorio. Desde el plan de paridad (un módulo
 * que solo existe en una punta es trabajo pendiente) la web crea, libera, termina y cancela órdenes
 * y edita recetas; la nube ejecuta la misma regla que el escritorio (`CompleteProductionOrderHandler`):
 * salen los insumos al costo promedio de la bodega y entra el producto a `Σ consumido ÷ obtenido`.
 */
import { z } from 'zod';

const cantidad = z.number().positive('La cantidad debe ser mayor que cero').max(99_999_999);

export const productionLineInputSchema = z.object({
    componentProductId: z.string().uuid('Elige el insumo'),
    plannedQuantity: z.number().min(0).max(99_999_999),
    consumedQuantity: z.number().min(0).max(99_999_999),
});
export type ProductionLineInput = z.infer<typeof productionLineInputSchema>;

/**
 * Crear una orden en borrador. Sin `lines`, los consumos salen de la receta del producto escalados
 * a la cantidad planeada (la receta rinde 5 → pides 10 → ×2).
 */
export const createProductionOrderSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid('Elige el producto'),
    warehouseId: z.string().uuid('Elige la bodega'),
    plannedQuantity: cantidad,
    notes: z.string().trim().max(500).nullish(),
    lines: z.array(productionLineInputSchema).max(200).optional(),
});
export type CreateProductionOrderRequest = z.infer<typeof createProductionOrderSchema>;

export const updateProductionOrderSchema = z.object({
    warehouseId: z.string().uuid('Elige la bodega'),
    plannedQuantity: cantidad,
    notes: z.string().trim().max(500).nullish(),
    lines: z.array(productionLineInputSchema).min(1, 'Agrega al menos un consumo').max(200),
    version: z.number().int().min(1),
});
export type UpdateProductionOrderRequest = z.infer<typeof updateProductionOrderSchema>;

/** Liberar (aparta los insumos), regresar a borrador (los suelta) o cancelar. */
export const PRODUCTION_ORDER_ACTIONS = ['RELEASE', 'RETURN_TO_DRAFT', 'CANCEL'] as const;
export type ProductionOrderAction = (typeof PRODUCTION_ORDER_ACTIONS)[number];

export const changeProductionOrderStatusSchema = z.object({
    action: z.enum(PRODUCTION_ORDER_ACTIONS),
    version: z.number().int().min(1),
});

/** Terminar con lo realmente obtenido: puede diferir de lo planeado (el secado, la merma). */
export const completeProductionOrderSchema = z.object({
    producedQuantity: cantidad,
    version: z.number().int().min(1),
});

export const getProductionOrdersSchema = z.object({
    status: z.enum(['DRAFT', 'RELEASED', 'COMPLETED', 'CANCELLED']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type GetProductionOrdersQuery = z.infer<typeof getProductionOrdersSchema>;

/** Crear o editar una receta (identidad en origen: el id lo pone quien la crea). */
export const upsertRecipeSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid('Elige el producto'),
    outputQuantity: cantidad,
    notes: z.string().trim().max(500).nullish(),
    isActive: z.boolean().default(true),
    lines: z
        .array(z.object({ componentProductId: z.string().uuid('Elige el insumo'), quantity: cantidad }))
        .min(1, 'Una receta necesita al menos un insumo')
        .max(200),
    version: z.number().int().min(0).optional(),
});
export type UpsertRecipeRequest = z.infer<typeof upsertRecipeSchema>;

/** Escalar una receta a una cantidad planeada: la sugerencia de consumos de una orden nueva. */
export function consumosDeReceta(
    receta: { readonly outputQuantity: number; readonly lines: readonly { readonly componentProductId: string; readonly quantity: number }[] },
    planeado: number
): ProductionLineInput[] {
    const factor = receta.outputQuantity > 0 ? planeado / receta.outputQuantity : 0;
    return receta.lines.map((l) => {
        const q = Math.round(l.quantity * factor * 10000) / 10000;
        return { componentProductId: l.componentProductId, plannedQuantity: q, consumedQuantity: q };
    });
}
