/**
 * @fileoverview Petición de «complementos que te deben».
 * @module Contracts/ReceivedCfdi/Schemas/RepPendientes
 */

import { z } from 'zod';

export const getRepPendientesSchema = z.object({
    /**
     * Incluir también las facturas que ya tienen algún complemento.
     *
     * Apagado por omisión: la pregunta de la pantalla es qué te falta. Encendido sirve para el
     * caso de las parcialidades —llegó el primer REP y faltan los otros tres—, que es real pero no
     * es por lo que se abre la pantalla.
     */
    incluirConRep: z.coerce.boolean().optional().default(false),
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export type GetRepPendientesQuery = z.infer<typeof getRepPendientesSchema>;
