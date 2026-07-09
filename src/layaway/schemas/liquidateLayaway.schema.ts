/**
 * @fileoverview Zod schema para liquidar un apartado.
 * @module Contracts/Layaway
 *
 * POST /api/layaways/:id/liquidate — requiere saldo 0: marca COMPLETED y descuenta inventario
 * (OUT/SALE por línea, best-effort/movement-only). La emisión del ticket/CFDI formal queda como
 * paso siguiente (ADR-007): el desktop NO la emite en la liquidación, la nube tampoco.
 * `version` habilita OCC. `sessionId` es opcional (la liquidación no mueve efectivo — el saldo
 * ya está cubierto por los abonos; se acepta por paridad de firma con los demás comandos).
 */

import { z } from 'zod';

/** Body de POST /api/layaways/:id/liquidate. */
export const liquidateLayawaySchema = z.object({
    /** Sesión de caja (opcional; la liquidación no genera movimiento de efectivo). */
    sessionId: z.string().optional(),
    /** Versión esperada del apartado (OCC). */
    version: z.number().int().min(0),
});

export type LiquidateLayawayBody = z.infer<typeof liquidateLayawaySchema>;
