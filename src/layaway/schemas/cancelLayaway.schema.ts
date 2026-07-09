/**
 * @fileoverview Zod schema para cancelar un apartado.
 * @module Contracts/Layaway
 *
 * POST /api/layaways/:id/cancel — marca CANCELLED. La política de reembolso del anticipo queda
 * como paso siguiente: el desktop NO reembolsa el anticipo al cancelar (CancelLayawayHandler),
 * y la nube tampoco (no se inventa un CASH_OUT). `version` habilita OCC.
 */

import { z } from 'zod';

/** Body de POST /api/layaways/:id/cancel. */
export const cancelLayawaySchema = z.object({
    /** Motivo de la cancelación (texto libre, opcional). */
    reason: z.string().max(200).optional(),
    /** Versión esperada del apartado (OCC). */
    version: z.number().int().min(0),
});

export type CancelLayawayBody = z.infer<typeof cancelLayawaySchema>;
