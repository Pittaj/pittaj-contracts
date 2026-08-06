/**
 * @fileoverview Zod schema para el :id de un cobro en la ruta.
 * @module Contracts/CustomerPayment
 */

import { z } from 'zod';

export const customerPaymentIdParamSchema = z.object({
    id: z.string().uuid('El id del cobro debe ser un UUID'),
});

export type CustomerPaymentIdParam = z.infer<typeof customerPaymentIdParamSchema>;
