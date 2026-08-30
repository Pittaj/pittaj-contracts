/**
 * @fileoverview Zod schema para editar una compra desde la web.
 *
 * Misma cabecera y mismos renglones que al crear, más `version` para concurrencia
 * optimista. Lo que NO viaja aquí: el folio (se asigna una vez y no cambia), el
 * estado (lo mueven Recibir / Cancelar / Reabrir, no la edición) y los importes
 * (los deriva el dominio).
 *
 * Solo se edita en **borrador** — `PURCHASE_NOT_DRAFT`, invariante del escritorio.
 *
 * @module Contracts/Purchase
 */

import { z } from 'zod';
import { basePurchaseFields } from './createPurchase.schema.js';

/** PUT /api/purchases/:id */
export const updatePurchaseSchema = z
    .object({
        ...basePurchaseFields,
        /** Versión que el cliente tiene en pantalla (OCC). Nace en 1, nunca en 0. */
        version: z.number().int().min(1, { message: 'La versión debe ser 1 o mayor' }),
    })
    .strict();

export type UpdatePurchaseRequest = z.infer<typeof updatePurchaseSchema>;
