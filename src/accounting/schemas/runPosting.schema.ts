/**
 * @fileoverview Zod schema para pedirle al motor que barra un rango.
 * @module Contracts/Accounting
 *
 * POST /api/accounting/companies/:companyId/post/{cash-closures|purchases|…}
 *
 * **El motor es un barrido, no un disparador por evento**: se le pide que pase sobre una
 * empresa y un rango, y contabiliza lo que encuentre sin póliza. Volver a pasarlo es seguro
 * —cada documento tiene una sola póliza— así que recuperarse de cualquier hueco es *"pásalo
 * otra vez"* en vez de una investigación.
 *
 * Sin `from`/`to` barre todo lo que haya. Con el id de un documento, solo ese.
 */

import { z } from 'zod';

export const runPostingSchema = z.object({
    /** `YYYY-MM-DD`. Sin él, desde el principio. */
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    /** `YYYY-MM-DD`. Sin él, hasta hoy. */
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type RunPostingBody = z.infer<typeof runPostingSchema>;

/**
 * Los tipos de documento que el motor sabe contabilizar, con la ruta que los barre.
 *
 * **La venta y la compra NO tienen barrido propio de inventario**: la venta la postea el corte
 * y la compra su documento. Si alguien añadiera aquí un barrido de movimientos de venta, el
 * inventario se descargaría dos veces —y el asiento cuadraría igual de bien—, así que la lista
 * vive en un solo sitio a propósito.
 */
export const POSTING_SWEEPS = [
    { key: 'cash-closures', label: 'Cortes de caja' },
    { key: 'purchases', label: 'Compras recibidas' },
    { key: 'bank-transactions', label: 'Movimientos bancarios' },
    { key: 'stock-movements', label: 'Merma, ajuste, conteo e inicial' },
    { key: 'cash-movements', label: 'Movimientos de efectivo' },
    { key: 'supplier-notes', label: 'Notas de proveedor' },
    { key: 'sales-returns', label: 'Devoluciones de venta' },
    { key: 'layaway-payments', label: 'Abonos de apartado' },
    { key: 'production-orders', label: 'Órdenes de producción' },
    { key: 'customer-payments', label: 'Cobros de ventas a crédito' },
] as const;

export type PostingSweepKey = (typeof POSTING_SWEEPS)[number]['key'];
