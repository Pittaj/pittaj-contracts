/**
 * @fileoverview Zod schema para la antigüedad de saldos.
 * @module Contracts/CustomerPayment
 *
 * GET /api/customer-payments/receivables — qué se debe, por venta, y desde cuándo.
 *
 * La antigüedad se calcula **contra la fecha del corte**, no contra hoy: un reporte de cierre
 * de mes que se vuelve a sacar en marzo tiene que dar lo mismo que dio en enero.
 */

import { z } from 'zod';

/** Query params de GET /api/customer-payments/receivables. */
export const getReceivablesSchema = z.object({
    customerId: z.string().uuid().optional(),
    locationId: z.string().max(36).optional(),
    /** Fecha de corte (`YYYY-MM-DD`). Si no viene, hoy. */
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    /** Incluir las ventas ya saldadas. Por defecto no: la antigüedad es de lo que se debe. */
    includeSettled: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetReceivablesQuery = z.infer<typeof getReceivablesSchema>;
