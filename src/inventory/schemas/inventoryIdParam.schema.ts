/**
 * @fileoverview Zod schema para el parámetro :id de los recursos de Inventory.
 * @module Contracts/Inventory
 *
 * Compartido por GET /:id de warehouses, stock-items y stock-movements
 * (los tres usan un UUID como identificador).
 */

import { z } from 'zod';

/** Valida el parámetro `:id` (UUID) de la URL. */
export const inventoryIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

export type InventoryIdParam = z.infer<typeof inventoryIdParamSchema>;
