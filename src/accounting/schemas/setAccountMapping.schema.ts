/**
 * @fileoverview Zod schema para asignar la cuenta de un concepto del motor.
 * @module Contracts/Accounting
 *
 * PUT /api/accounting/companies/:companyId/mappings
 *
 * **`ledgerAccountId: null` no deja el concepto sin cuenta**: le quita el mapeo y lo devuelve a
 * la cuenta de la plantilla PyME. Un concepto sin cuenta no existe en el motor — o la eligió
 * alguien, o la puso la plantilla, o el documento cae en excepciones.
 */

import { z } from 'zod';
import { ACCOUNT_MAPPING_KINDS } from '../responses/AccountingResponses.js';

export const setAccountMappingSchema = z.object({
    kind: z.enum(ACCOUNT_MAPPING_KINDS),
    /** El hueco (`CASH_ON_HAND`), el id de la forma de pago, el del impuesto… */
    key: z.string().min(1, 'Falta el concepto que se está mapeando'),
    /** `null` devuelve el concepto a la cuenta de la plantilla. */
    ledgerAccountId: z.string().uuid().nullable(),
});

export type SetAccountMappingBody = z.infer<typeof setAccountMappingSchema>;
