/**
 * @fileoverview Zod schema para query params del listado de cobros.
 * @module Contracts/CustomerPayment
 *
 * GET /api/customer-payments — lista paginada (por fecha de cobro desc), filtrable por
 * cliente, sucursal, estado y rango de fechas.
 */

import { z } from 'zod';
import { CUSTOMER_PAYMENT_STATUSES } from '../primitives/customerPaymentPrimitives.js';

/** Query params de GET /api/customer-payments. */
export const getCustomerPaymentsSchema = z.object({
    customerId: z.string().uuid().optional(),
    locationId: z.string().max(36).optional(),
    status: z.enum(CUSTOMER_PAYMENT_STATUSES).optional(),
    /** Desde / hasta, en `YYYY-MM-DD`, sobre la fecha de cobro. */
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetCustomerPaymentsQuery = z.infer<typeof getCustomerPaymentsSchema>;
