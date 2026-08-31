/**
 * @fileoverview Peticiones de los avisos del buzón.
 * @module Contracts/ReceivedCfdi/Schemas/CfdiAlert
 */

import { z } from 'zod';

export const getCfdiAlertsSchema = z.object({
    /**
     * Qué bandeja se pide.
     *
     * `abiertos` por omisión, que es la pregunta de la pantalla. `atendidos` es el archivo: no se
     * borra nada, porque un aviso cerrado **es la prueba de que se miró**.
     */
    bandeja: z.enum(['abiertos', 'atendidos']).optional().default('abiertos'),
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export const reviewCfdiAlertSchema = z.object({
    /**
     * Qué pasó, en palabras de quien lo revisó.
     *
     * Opcional a propósito: exigir una nota para poder cerrar un aviso hace que la gente escriba
     * «ok» cien veces, y cien «ok» valen menos que noventa vacíos y diez de verdad.
     */
    note: z.string().trim().max(1000).nullish(),
});

export type GetCfdiAlertsQuery = z.infer<typeof getCfdiAlertsSchema>;
export type ReviewCfdiAlertRequest = z.infer<typeof reviewCfdiAlertSchema>;
