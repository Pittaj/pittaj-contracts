/**
 * @fileoverview Zod schema para query params del listado de apartados.
 * @module Contracts/Layaway
 *
 * GET /api/layaways — lista paginada (orden por creación desc) con filtro opcional de estado.
 */

import { z } from 'zod';
import { LAYAWAY_STATUSES } from '../primitives/layawayPrimitives.js';

/** Query params de GET /api/layaways. */
export const getLayawaysSchema = z.object({
    status: z.enum(LAYAWAY_STATUSES).optional(),
    /**
     * (2.115.0) Solo los apartados con algún abono en ese turno de caja: el corte X y el cajón lateral los usan para
     * contar los abonos del turno (los de tarjeta no pasan por el cajón, así que no están en sus movimientos).
     */
    sessionId: z.string().min(1).max(36).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetLayawaysQuery = z.infer<typeof getLayawaysSchema>;
