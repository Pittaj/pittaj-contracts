/**
 * @fileoverview «Reclamar al proveedor»: pedirle por correo lo que te debe.
 * @module Contracts/ReceivedCfdi/Schemas/Reclamo
 *
 * ── Qué es y qué no ──
 *
 * Es un correo que Pittaj manda **en nombre del negocio** al proveedor, con el remitente visible
 * «<negocio> vía Pittaj» y el Reply-To de quien lo pidió, para que el proveedor le conteste a la
 * persona y no a un buzón muerto. Dos motivos y solo dos: falta la **factura** de una compra ya
 * recibida, o falta el **complemento de pago** de una factura a plazos. Son los dos huecos que le
 * cuestan IVA al negocio y que nadie reclama porque «ya lo pagué» y nadie vuelve a mirar.
 *
 * No es un chat con el proveedor ni un historial: lo que queda es la bitácora de correos.
 */

import { z } from 'zod';

export const RECLAMO_TIPOS = ['FACTURA', 'COMPLEMENTO_DE_PAGO'] as const;
export type ReclamoTipo = (typeof RECLAMO_TIPOS)[number];

export const reclamarAlProveedorSchema = z.object({
    tipo: z.enum(RECLAMO_TIPOS),
    /**
     * A qué se refiere, para la bitácora: el folio de la compra o el de la factura. No lleva ids
     * a propósito: el correo sale igual aunque el documento se renumere o se borre después.
     */
    referencia: z.string().trim().min(1).max(120),
    /**
     * A quién. Lo pone quien reclama —viene prellenado con el correo del proveedor— porque hay que
     * poder corregirlo: el del catálogo puede ser el de ventas y el que manda complementos es el
     * de facturación.
     */
    para: z.string().trim().email().max(254),
    asunto: z.string().trim().min(1).max(200),
    /** El mensaje, en texto plano. Se respetan los saltos de línea. */
    mensaje: z.string().trim().min(1).max(4000),
});

export type ReclamarAlProveedorRequest = z.infer<typeof reclamarAlProveedorSchema>;
