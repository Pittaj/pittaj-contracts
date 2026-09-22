/**
 * @fileoverview «Corregir producto» en un renglón de compra: el deshacer principal.
 * @module Contracts/Purchase/Schemas/CorrectLine
 *
 * Decisión del 2026-09-22 («todo lo automático se deshace»): la memoria de Emparejar aprendió mal
 * y el renglón dice Huevo Tehuacán donde el CFDI decía HUEVO BLANCO, que en ese proveedor es
 * Jalisco. Corregir se puede **sobre una compra ya recibida** —ahí está la gracia— y entonces mueve
 * el inventario con movimientos contrarios: sale lo recibido del equivocado, entra al correcto, al
 * costo de esa compra.
 *
 * `scope` es la pregunta que decide si el error vuelve: `DESDE_AHORA` reescribe la memoria del
 * proveedor (lo marcado de fábrica, porque nueve de cada diez veces el error es de la memoria);
 * `SOLO_ESTA` la olvida y la siguiente factura volverá a preguntar.
 */

import { z } from 'zod';

export const correctPurchaseLineSchema = z
    .object({
        lineId: z.string().uuid(),
        /** El producto que debió ser. */
        productId: z.string().uuid(),
        /** Versión OCC de la compra. */
        version: z.number().int().min(1),
        scope: z.enum(['DESDE_AHORA', 'SOLO_ESTA']).optional().default('DESDE_AHORA'),
        /**
         * El código de barras estaba en el producto equivocado: además de corregir el renglón, se
         * mueve al correcto. Solo se ofrece cuando el renglón emparejó por `BARCODE`.
         */
        moverCodigoDeBarras: z.boolean().optional().default(false),
        /** Corregir también las otras compras que arrastran el mismo error (ids de compra). */
        tambienEnCompras: z.array(z.string().uuid()).max(50).optional().default([]),
        /** Nombre de quien corrige (snapshot para la marca del renglón, como `receivedBy`). */
        userName: z.string().trim().max(120).nullish(),
    })
    .strict();

export type CorrectPurchaseLineRequest = z.infer<typeof correctPurchaseLineSchema>;

/** Quitar el comprobante de una compra (el paso previo a adjuntar otro, y «Desconciliar» del Buzón). */
export const removeCfdiFromPurchaseSchema = z
    .object({
        version: z.number().int().min(1),
    })
    .strict();

export type RemoveCfdiFromPurchaseRequest = z.infer<typeof removeCfdiFromPurchaseSchema>;
