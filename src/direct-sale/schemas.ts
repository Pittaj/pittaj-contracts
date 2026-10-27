/**
 * @fileoverview Cuerpos y filtros de la venta sin caja.
 * @module Contracts/DirectSale
 *
 * POST /api/direct-sales               — emitirla
 * GET  /api/direct-sales               — la lista
 * GET  /api/direct-sales/:id           — una
 * POST /api/direct-sales/:id/cancel    — cancelarla
 */
import { z } from 'zod';
import { fechaCivilSchema } from '../shared/fechas.js';
import { IMPUESTOS_DE_VENTA_SIN_CAJA, TASAS_DE_IVA } from './ventaSinCaja.js';
import { CATEGORIAS_DE_IEPS } from '../tax/iepsDeLaLey.js';

/** D1c · El IEPS de un renglón. Por tasa es una fracción (0.08); por cuota, pesos por unidad. */
export const iepsDeRenglonSchema = z.object({
    factor: z.enum(['Tasa', 'Cuota']),
    tasaOCuota: z.number().positive('La tasa o cuota del IEPS debe ser mayor que 0').max(100),
    categoria: z.enum(CATEGORIAS_DE_IEPS).nullish(),
});

export const directSaleLineSchema = z
    .object({
        /** Producto del que se copió el renglón, si vino de uno. Solo informativo: no mueve inventario. */
        productId: z.string().uuid().nullish(),
        description: z.string().trim().min(1, 'El concepto no puede ir vacío').max(1000),
        /** ClaveProdServ del SAT (8 dígitos). */
        satProductCode: z.string().regex(/^\d{8}$/, 'La clave del SAT son 8 dígitos'),
        /** ClaveUnidad del SAT (E48 servicio, H87 pieza, ACT actividad…). */
        satUnitCode: z.string().trim().min(1).max(5),
        unitName: z.string().trim().max(30).nullish(),
        quantity: z.number().positive('La cantidad debe ser mayor que 0'),
        unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
        discountPercent: z.number().min(0).max(100).default(0),
        tax: z.enum(IMPUESTOS_DE_VENTA_SIN_CAJA),
        /** Solo con `tax = 'IVA'`: 0.16 o 0.08. */
        taxRate: z
            .number()
            .refine((t) => (TASAS_DE_IVA as readonly number[]).includes(t), 'La tasa de IVA es 16 % u 8 %')
            .optional(),
        taxIncluded: z.boolean().default(false),
        /** D1c · IEPS del renglón; ausente = no lleva. Un renglón no objeto de impuesto no lo lleva. */
        ieps: iepsDeRenglonSchema.nullish(),
        /** Línea de negocio del renglón; si no viene, la de la venta. */
        businessLineId: z.string().uuid().nullish(),
    })
    .refine((l) => l.quantity * l.unitPrice > 0, {
        message: 'Un renglón sin importe no es una venta',
        path: ['unitPrice'],
    })
    .refine((l) => !(l.ieps && l.tax === 'NOT_OBJECT'), {
        message: 'Un renglón no objeto de impuesto no lleva IEPS',
        path: ['ieps'],
    });

/** D1c · Lo que el cliente retiene. Importes ya decididos, no tasas. */
export const retencionesDeVentaSchema = z.object({
    isr: z.number().min(0).default(0),
    iva: z.number().min(0).default(0),
});

export const createDirectSaleSchema = z.object({
    /**
     * Identidad generada en origen: si la web o el escritorio reintentan, el mismo id no emite
     * dos ventas. Sin él, la nube pone uno.
     */
    id: z.string().uuid().optional(),
    customerId: z.string().uuid('El cliente es obligatorio: una venta sin caja siempre se debe'),
    /** De la sucursal sale la empresa (RFC) que vende y a cuyo libro va la póliza. */
    locationId: z.string().uuid('La sucursal es obligatoria'),
    /** Línea de negocio de la venta: la que toman los renglones que no traen la suya. */
    businessLineId: z.string().uuid().nullish(),
    /** Fecha de la venta, civil (`YYYY-MM-DD`). Sin ella, hoy en la zona de la sucursal. */
    issueDate: fechaCivilSchema.optional(),
    /** Vencimiento pactado, civil. Informativo: la antigüedad se cuenta desde la venta. */
    dueDate: fechaCivilSchema.nullish(),
    /** Referencia externa: la orden de compra del cliente, el contrato, la factura de origen. */
    reference: z.string().trim().max(100).nullish(),
    notes: z.string().max(2000).nullish(),
    lines: z.array(directSaleLineSchema).min(1, 'La venta necesita al menos un renglón').max(200),
    /** D1c · Lo que el cliente retiene de ISR y de IVA. Sin ello, nada. */
    withholdings: retencionesDeVentaSchema.nullish(),
});

export const cancelDirectSaleSchema = z.object({
    reason: z.string().trim().min(3, 'Di por qué se cancela').max(300),
});

export const getDirectSalesSchema = z.object({
    from: fechaCivilSchema.optional(),
    to: fechaCivilSchema.optional(),
    customerId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    status: z.enum(['ISSUED', 'CANCELLED']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type DirectSaleLineInput = z.input<typeof directSaleLineSchema>;
export type CreateDirectSaleBody = z.input<typeof createDirectSaleSchema>;
export type CreateDirectSaleParsed = z.output<typeof createDirectSaleSchema>;
export type CancelDirectSaleBody = z.infer<typeof cancelDirectSaleSchema>;
export type GetDirectSalesQuery = z.input<typeof getDirectSalesSchema>;
