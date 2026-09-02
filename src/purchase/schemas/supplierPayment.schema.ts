/**
 * @fileoverview Lo que se acepta al registrar y consultar pagos a proveedor.
 */

import { z } from 'zod';
import { FORMAS_DE_PAGO, ORIGENES_DE_PAGO, TIPOS_DE_DOCUMENTO_PAGABLE } from '../cuentasPorPagar.js';

const aplicacionSchema = z
    .object({
        documentType: z.enum(TIPOS_DE_DOCUMENTO_PAGABLE),
        documentId: z.string().uuid(),
        /** Folio con el que se aplica. Snapshot: el documento puede cambiar de folio al sincronizar. */
        documentNumber: z.string().trim().min(1).max(50),
        amount: z.number().positive(),
    })
    .strict();

export const registrarPagoSchema = z.object({
    /** Id generado por el cliente: identidad en origen, hace el POST reintentable. */
    id: z.string().uuid(),
    supplierId: z.string().uuid(),
    supplierName: z.string().trim().min(1).max(200),
    paidAt: z.string().datetime(),
    amount: z.number().positive(),
    currency: z.string().trim().length(3).optional(),
    paymentForm: z.enum(FORMAS_DE_PAGO).optional(),
    reference: z.string().trim().max(100).nullish(),
    origin: z.enum(ORIGENES_DE_PAGO).optional(),
    bankAccountId: z.string().uuid().nullish(),
    /**
     * Sesión de caja de la que salió el efectivo.
     *
     * Va aquí y no se deduce: pagar al proveedor del cajón sin reflejarlo en el corte es lo que
     * hace que el arqueo no cuadre al final del día.
     */
    posSessionId: z.string().uuid().nullish(),
    notes: z.string().trim().max(500).nullish(),
    /**
     * A qué documentos se aplica. Puede ir vacío: eso es un anticipo, y se aplica después.
     */
    applications: z.array(aplicacionSchema).max(50).optional(),
});

export const revertirPagoSchema = z.object({
    /** Obligatorio: sin motivo, dentro de un mes nadie sabrá qué pasó con ese dinero. */
    reason: z.string().trim().min(1).max(500),
});

export const conciliarPagoSchema = z.object({
    bankTransactionId: z.string().uuid(),
});

export const getPagosSchema = z.object({
    supplierId: z.string().uuid().optional(),
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
    incluirRevertidos: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

export const getCuentasPorPagarSchema = z.object({
    supplierId: z.string().uuid().optional(),
    soloVencidas: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

export type RegistrarPagoRequest = z.infer<typeof registrarPagoSchema>;
export type RevertirPagoRequest = z.infer<typeof revertirPagoSchema>;
export type GetPagosQuery = z.infer<typeof getPagosSchema>;
export type GetCuentasPorPagarQuery = z.infer<typeof getCuentasPorPagarSchema>;
