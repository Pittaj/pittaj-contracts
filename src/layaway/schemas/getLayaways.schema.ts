/**
 * @fileoverview Zod schema para query params del listado de apartados.
 * @module Contracts/Layaway
 *
 * GET /api/layaways — lista paginada (orden por creación desc) con filtro opcional de estado.
 */

import { z } from 'zod';
import { LAYAWAY_STATUSES } from '../primitives/layawayPrimitives';

/** Query params de GET /api/layaways. */
export const getLayawaysSchema = z.object({
    status: z.enum(LAYAWAY_STATUSES).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetLayawaysQuery = z.infer<typeof getLayawaysSchema>;
