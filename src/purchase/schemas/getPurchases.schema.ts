/**
 * @fileoverview Zod schema para query params del listado de compras.
 * @module Contracts/Purchase
 *
 * GET /api/purchases — lista paginada (orden createdAt desc) con filtros
 * opcionales de estado, naturaleza (kind), proveedor y rango de fechas. Espejo
 * (lectura) de la lista de Órdenes de Compra del desktop (ComprasPage).
 */

import { z } from 'zod';

/** Estados de la compra (espejo de PurchaseStatus). */
export const PURCHASE_STATUSES = ['DRAFT', 'RECEIVED', 'CANCELLED'] as const;

/** Naturaleza del documento (espejo de PurchaseKind). */
export const PURCHASE_KINDS = ['INVENTORY', 'EXPENSE'] as const;

/** Query params de GET /api/purchases. */
export const getPurchasesSchema = z.object({
    status: z.enum(PURCHASE_STATUSES).optional(),
    kind: z.enum(PURCHASE_KINDS).optional(),
    supplierId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetPurchasesQuery = z.infer<typeof getPurchasesSchema>;
