/**
 * @fileoverview Alta y edición de bodegas (hasta hoy solo se creaban en el escritorio).
 * @module Contracts/Inventory/Schemas/Warehouse
 *
 * ── Tipo de bodega ──
 *
 * No todas las bodegas son iguales para quien vende: la de mercancía en tránsito no se vende, la
 * de cuarentena tampoco, y la de producción guarda materia prima que el POS no debe ofrecer. El
 * tipo decide los defaults de `allowsSale`/`countsInAvailable`; los dos se pueden corregir a mano.
 *
 * ── Ubicaciones dentro de la bodega (pasillo, anaquel, nivel) ──
 *
 * **Todavía no.** Queda documentado como F-futura en `producto/plan-inventario-completo.md` (docs):
 * `usesBins` existe para que el día que se active no haya que cambiar la forma de la bodega, pero
 * hoy el servidor solo acepta `false`.
 */

import { z } from 'zod';
import { WAREHOUSE_STATUSES } from './getWarehouses.schema.js';

export const WAREHOUSE_TYPES = [
    /** Piso de venta: lo que el POS descuenta. */
    'STORE',
    /** Almacén de respaldo. */
    'WAREHOUSE',
    /** Mercancía en camino (virtual): la usan los traspasos enviados. */
    'TRANSIT',
    /** Materia prima y producto en proceso. */
    'PRODUCTION',
    /** Retenido por calidad, devoluciones por revisar, dañado. */
    'QUARANTINE',
] as const;
export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];

export const WAREHOUSE_TYPE_LABELS: Readonly<Record<WarehouseType, string>> = {
    STORE: 'Piso de venta',
    WAREHOUSE: 'Almacén',
    TRANSIT: 'En tránsito',
    PRODUCTION: 'Producción',
    QUARANTINE: 'Cuarentena',
};

/** Defaults por tipo: se proponen al elegir el tipo y se pueden corregir. */
export const WAREHOUSE_TYPE_DEFAULTS: Readonly<
    Record<WarehouseType, { readonly allowsSale: boolean; readonly countsInAvailable: boolean }>
> = {
    STORE: { allowsSale: true, countsInAvailable: true },
    WAREHOUSE: { allowsSale: false, countsInAvailable: true },
    TRANSIT: { allowsSale: false, countsInAvailable: false },
    PRODUCTION: { allowsSale: false, countsInAvailable: false },
    QUARANTINE: { allowsSale: false, countsInAvailable: false },
};

const warehouseBody = z.object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().max(20).nullish(),
    locationId: z.string().uuid().nullish(),
    type: z.enum(WAREHOUSE_TYPES).optional().default('STORE'),
    /** El POS puede descontar de ella. */
    allowsSale: z.boolean().optional(),
    /** Su existencia suma en el «disponible» que ven ventas y pedidos. */
    countsInAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional().default(false),
    address: z.string().trim().max(300).nullish(),
    responsibleUserId: z.string().uuid().nullish(),
    /**
     * Cuenta de inventario de la bodega (1.19.0). Ausente = la del tipo
     * (`WAREHOUSE_INVENTORY_SLOT`): producción usa materia prima; las demás, mercancía.
     */
    inventoryAccountSlot: z.enum(['INVENTORY', 'INVENTORY_RAW', 'INVENTORY_FINISHED']).nullish(),
    /** Reservado para ubicaciones (pasillo/anaquel). Hoy solo `false`. */
    usesBins: z.literal(false).optional().default(false),
});

/** POST /api/warehouses */
export const createWarehouseSchema = warehouseBody.extend({ id: z.string().uuid() });

/** PUT /api/warehouses/:id */
export const updateWarehouseSchema = warehouseBody.extend({
    status: z.enum(WAREHOUSE_STATUSES),
    version: z.number().int().min(1),
});

export type CreateWarehouseRequest = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseRequest = z.infer<typeof updateWarehouseSchema>;
