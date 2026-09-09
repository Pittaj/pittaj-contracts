/**
 * @fileoverview Zod schema para reabrir una compra.
 * @module Contracts/Purchase/Schemas
 *
 * POST /api/purchases/:id/reopen — revierte TODAS las entregas en pie y devuelve
 * el documento a borrador. Es la acción que el escritorio llama igual
 * (`ReopenPurchaseCommand`), y se llama Reabrir en las dos plataformas.
 *
 * Deshacer una sola entrega es otra cosa y tiene su propia ruta
 * (`receptions/:id/reverse`): reabrir es «esto no debió recibirse», no «esta
 * entrega venía mal».
 */

import { z } from 'zod';

/** Cuerpo de la reapertura: la versión esperada de la compra (OCC). */
export const reopenPurchaseSchema = z.object({
    version: z.number().int().min(1),
});

export type ReopenPurchaseBody = z.infer<typeof reopenPurchaseSchema>;
