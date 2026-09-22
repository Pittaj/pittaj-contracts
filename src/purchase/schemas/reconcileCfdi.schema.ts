/**
 * @fileoverview Zod schema de conciliación de CFDI contra N compras.
 * @module Contracts/Purchase/Schemas
 *
 * POST /api/purchases/reconcile-cfdi — «una factura, ocho remisiones»: marca
 * como facturado lo recibido en cada compra seleccionada y vincula el
 * comprobante del buzón. La suma de lo seleccionado se compara contra el
 * total del CFDI antes de escribir; si no cuadra, solo pasa con
 * `acceptDifference: true`.
 */

import { z } from 'zod';

export const reconcileCfdiSchema = z.object({
    /** Id del CFDI del buzón (received_cfdi). */
    cfdiId: z.string().uuid(),
    /** Compras que cubre este comprobante (≥ 1). */
    purchases: z
        .array(
            z.object({
                id: z.string().uuid(),
                /** Versión esperada de la compra (OCC). */
                version: z.number().int().min(1),
            })
        )
        .min(1)
        .max(100),
    /** Aceptar la diferencia cuando la suma no cuadra (la pantalla la mostró). Equivale a `difference: 'ENLAZAR_CON_AVISO'`. */
    acceptDifference: z.boolean().optional().default(false),
    /**
     * Qué hacer con la diferencia (2026-09-22): `REGISTRAR_AJUSTE` crea el ajuste por redondeo
     * (solo dentro de la tolerancia del negocio) y el comprobante queda cuadrado; `ENLAZAR_CON_AVISO`
     * lo enlaza y deja la diferencia a la vista en «Requieren tu atención».
     */
    difference: z.enum(['REGISTRAR_AJUSTE', 'ENLAZAR_CON_AVISO']).nullish(),
});

export type ReconcileCfdiRequest = z.infer<typeof reconcileCfdiSchema>;
