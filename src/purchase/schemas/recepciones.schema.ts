/**
 * @fileoverview Peticiones de la lista de entregas.
 * @module Contracts/Purchase/Schemas/Recepciones
 */

import { z } from 'zod';

export const getRecepcionesSchema = z.object({
    warehouseId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    /** Rango por fecha de entrega, no de documento: la pregunta es «qué llegó el martes». */
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    /**
     * Solo las que entraron sin remisión.
     *
     * Es el filtro que justifica la pantalla para quien lleva la contabilidad: la remisión es el
     * hilo entre lo que entró al almacén y la factura que llega a fin de mes.
     */
    sinRemision: z.coerce.boolean().optional().default(false),
    /** Incluir las revertidas. Apagado: la pregunta normal es qué entró y sigue en pie. */
    incluirRevertidas: z.coerce.boolean().optional().default(false),
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export const setRemittanceSchema = z.object({
    /**
     * El número de remisión, o `null` para quitarlo.
     *
     * Lo único que esta pantalla escribe: poner el papel a una entrega que entró sin él. Se puede
     * borrar porque capturarlo mal y no poder corregirlo sería peor que no tenerlo.
     */
    remittance: z.string().trim().max(100).nullish(),
});

export type GetRecepcionesQuery = z.infer<typeof getRecepcionesSchema>;
export type SetRemittanceRequest = z.infer<typeof setRemittanceSchema>;
