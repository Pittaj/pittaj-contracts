/**
 * @fileoverview Zod schema para liquidar un apartado.
 * @module Contracts/Layaway
 *
 * POST /api/layaways/:id/liquidate — requiere saldo 0: marca COMPLETED, descuenta inventario
 * (OUT/SALE por línea) y, desde D7h1, deja el TICKET DE VENTA de la entrega (mismo id que el
 * apartado, pagado con la aplicación del anticipo `ADVANCE`). `version` habilita OCC.
 * `sessionId` es la caja donde se entrega: el ticket entra a ese turno y su corte lo contabiliza
 * (no mueve efectivo: el saldo ya lo cubrieron los abonos). Sin ella, la del último abono.
 */

import { z } from 'zod';

/** Body de POST /api/layaways/:id/liquidate. */
export const liquidateLayawaySchema = z.object({
    /** D7h1 · Caja donde se entrega: el ticket de venta entra a su turno. Opcional. */
    sessionId: z.string().optional(),
    /** Versión esperada del apartado (OCC). */
    version: z.number().int().min(0),
});

export type LiquidateLayawayBody = z.infer<typeof liquidateLayawaySchema>;
