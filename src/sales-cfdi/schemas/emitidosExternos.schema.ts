/**
 * @fileoverview D1 · Registrar como ventas los CFDI que el negocio emitió en otro sistema.
 * @module Contracts/SalesCfdi
 *
 * `POST /api/sales-cfdi/emitidos-externos`. Cada XML se vuelve una **venta sin caja con su CFDI
 * registrado** (sin gastar timbre). Un PUE nace **cobrado**: su cobro queda sin conciliar, y Bancos
 * (B2) lo concilia contra el depósito. Un PPD queda por cobrar hasta su complemento o su depósito.
 * Cada CFDI entra una sola vez: volver a subirlo responde `YA_ESTABA`.
 *
 * Plan: docs `producto/plan-despachos-y-solo-libros.md` (D1).
 */
import { z } from 'zod';

/** Por tanda: lo que cabe en una petición sin que el navegador ni el Worker se ahoguen. */
export const EMITIDOS_POR_TANDA = 50;

export const registrarEmitidosSchema = z.object({
    /** La sucursal que vende: su empresa tiene que ser la que emitió (mismo RFC). */
    locationId: z.string().uuid('Elige la sucursal'),
    businessLineId: z.string().uuid().nullish(),
    xmls: z
        .array(z.string().min(200, 'Eso no parece un CFDI').max(2_000_000, 'Ese XML es demasiado grande'))
        .min(1, 'Sube al menos un XML')
        .max(EMITIDOS_POR_TANDA, `Hasta ${EMITIDOS_POR_TANDA} XML por tanda`),
});
export type RegistrarEmitidosBody = z.infer<typeof registrarEmitidosSchema>;

export const ESTADOS_DEL_EMITIDO = ['REGISTRADA', 'YA_ESTABA', 'RECHAZADA'] as const;
export type EstadoDelEmitido = (typeof ESTADOS_DEL_EMITIDO)[number];

export interface ResultadoDelEmitido {
    /** La posición del XML en la tanda (0…n-1), para ligarlo con su archivo. */
    readonly indice: number;
    readonly uuid: string | null;
    readonly serieFolio: string | null;
    readonly receptorRfc: string | null;
    readonly receptorNombre: string | null;
    readonly total: number | null;
    readonly metodoPago: string | null;
    readonly estado: EstadoDelEmitido;
    /** Por qué no entró (RECHAZADA). */
    readonly motivo: string | null;
    readonly ventaId: string | null;
    readonly ventaFolio: string | null;
    /** El cobro que nació con un PUE. */
    readonly cobroId: string | null;
}

export interface RegistrarEmitidosResponse {
    readonly resultados: readonly ResultadoDelEmitido[];
}
