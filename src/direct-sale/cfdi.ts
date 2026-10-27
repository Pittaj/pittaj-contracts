/**
 * @fileoverview F3.2 · El CFDI de la venta sin caja: timbrarlo o registrar uno ya timbrado.
 * @module Contracts/DirectSale
 *
 * Dos caminos, un solo comprobante vigente por venta:
 *
 * - **Timbrarlo aquí** (`POST /api/sales-cfdi/direct-sales/:id/stamp`): la nube lo arma con el
 *   mismo constructor que la factura de un ticket. Por omisión **PPD con forma 99**: la venta sin
 *   caja nace a crédito y lo que se cobre después lleva complemento de pago. Si ya se cobró completa,
 *   va **PUE** con la forma real del pago (el SAT rechaza PUE con 99).
 * - **Registrar uno que ya existe** (`…/register`): el XML timbrado en otro sistema (el de cobranza
 *   de la plataforma en F3.3, o el portal del SAT). No se vuelve a timbrar: se lee, se comprueba que
 *   sea de esta venta y se guarda. Así el libro y el comprobante dicen lo mismo sin gastar un timbre.
 *
 * La lectura es por expresiones regulares sobre atributos y no con un parser: la nube corre en
 * Workers, donde no hay `DOMParser` (misma decisión que `leerRespuestaSat`).
 */
import { z } from 'zod';
import { CLASES_DE_RETENCION, type RetencionesDecididas } from '../tax/retencionesDeLaVenta.js';

/** CANCELLED (F3.3): el comprobante se canceló ante el SAT donde se emitió (p. ej. en la cobranza de la plataforma). */
export const CFDI_DE_VENTA_SIN_CAJA = ['STAMPED', 'FAILED', 'CANCELLED'] as const;
export type EstadoDelCfdiDeVentaSinCaja = (typeof CFDI_DE_VENTA_SIN_CAJA)[number];

/** De dónde salió el comprobante: timbrado por la nube, o registrado ya timbrado. */
export type OrigenDelCfdi = 'PAC' | 'REGISTERED';

export const stampDirectSaleSchema = z
    .object({
        metodoPago: z.enum(['PPD', 'PUE']).default('PPD'),
        /** c_FormaPago. Con PUE es obligatoria y no puede ser 99. */
        formaPago: z.string().regex(/^\d{2}$/, 'La forma de pago son dos dígitos del catálogo del SAT').optional(),
        /** c_UsoCFDI; si no viene, el de la ficha del cliente. */
        usoCfdi: z.string().trim().min(3).max(4).optional(),
    })
    .refine((b) => b.metodoPago === 'PPD' || (b.formaPago && b.formaPago !== '99'), {
        message: 'Una factura PUE necesita la forma real del pago: el SAT rechaza la 99 con PUE',
        path: ['formaPago'],
    });

export const registerDirectSaleCfdiSchema = z.object({
    /** El XML timbrado, tal cual (UTF-8). */
    xml: z.string().min(200, 'Eso no parece un CFDI').max(2_000_000),
});

/**
 * D3 · POST /api/sales-cfdi/direct-sales/retenciones — las retenciones que la ley pide para una venta
 * sin caja antes de emitirla: dependen de quién vende (la empresa de la sucursal), a quién y qué se
 * vende. La web y el escritorio la piden al capturar; quien captura puede cambiarla.
 */
export const retencionesSugeridasSchema = z.object({
    locationId: z.string().uuid(),
    customerId: z.string().uuid(),
    /** La clase de cada renglón; null = general. */
    clases: z.array(z.enum(CLASES_DE_RETENCION).nullable()).max(200),
});

export interface RetencionesSugeridasResponse {
    /** `{}` = no se retiene nada. */
    readonly decididas: RetencionesDecididas;
    /** Por qué no se pudo decidir (faltan datos fiscales); null si se decidió. */
    readonly motivo: string | null;
}

export type RetencionesSugeridasBody = z.infer<typeof retencionesSugeridasSchema>;
export type StampDirectSaleBody = z.input<typeof stampDirectSaleSchema>;
export type RegisterDirectSaleCfdiBody = z.infer<typeof registerDirectSaleCfdiSchema>;

/** Lo que importa de un CFDI timbrado para saber si es de una venta. */
export interface ComprobanteEmitido {
    readonly uuid: string | null;
    readonly fechaTimbrado: string | null;
    /** D1 · La fecha del comprobante (cuando se emitió), en hora local del emisor, sin zona. */
    readonly fecha: string | null;
    readonly tipoDeComprobante: string | null;
    readonly version: string | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly moneda: string | null;
    readonly metodoPago: string | null;
    readonly formaPago: string | null;
    readonly total: number | null;
    readonly emisorRfc: string | null;
    readonly receptorRfc: string | null;
    readonly usoCfdi: string | null;
    /** F3.3 · Lo que hace falta para dar de alta al cliente con los datos con que se le facturó. */
    readonly receptorNombre: string | null;
    readonly receptorRegimen: string | null;
    readonly receptorCp: string | null;
}

const desescapar = (v: string) =>
    v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** La etiqueta de apertura de un nodo, por nombre local (sin importar el prefijo). */
function nodo(xml: string, nombre: string): string | null {
    const m = new RegExp(`<(?:[\\w.-]+:)?${nombre}\\b([^>]*)>`, 'i').exec(xml);
    return m ? (m[1] ?? '') : null;
}

function atributo(etiqueta: string | null, nombre: string): string | null {
    if (etiqueta === null) return null;
    const m = new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(etiqueta);
    const v = m ? (m[2] ?? m[3] ?? '') : null;
    return v === null ? null : desescapar(v).trim();
}

export function leerComprobanteEmitido(xml: string): ComprobanteEmitido {
    const comprobante = nodo(xml, 'Comprobante');
    const emisor = nodo(xml, 'Emisor');
    const receptor = nodo(xml, 'Receptor');
    const timbre = nodo(xml, 'TimbreFiscalDigital');
    const total = atributo(comprobante, 'Total');
    return {
        uuid: atributo(timbre, 'UUID')?.toUpperCase() ?? null,
        fechaTimbrado: atributo(timbre, 'FechaTimbrado'),
        fecha: atributo(comprobante, 'Fecha'),
        tipoDeComprobante: atributo(comprobante, 'TipoDeComprobante'),
        version: atributo(comprobante, 'Version'),
        serie: atributo(comprobante, 'Serie'),
        folio: atributo(comprobante, 'Folio'),
        moneda: atributo(comprobante, 'Moneda'),
        metodoPago: atributo(comprobante, 'MetodoPago'),
        formaPago: atributo(comprobante, 'FormaPago'),
        total: total === null || total === '' ? null : Number(total),
        emisorRfc: atributo(emisor, 'Rfc')?.toUpperCase() ?? null,
        receptorRfc: atributo(receptor, 'Rfc')?.toUpperCase() ?? null,
        usoCfdi: atributo(receptor, 'UsoCFDI'),
        receptorNombre: atributo(receptor, 'Nombre'),
        receptorRegimen: atributo(receptor, 'RegimenFiscalReceptor'),
        receptorCp: atributo(receptor, 'DomicilioFiscalReceptor'),
    };
}

/** Contra qué se compara el comprobante: la venta y quién la vende. */
export interface VentaParaRegistrar {
    readonly total: number;
    readonly emisorRfc: string;
    /** El RFC del cliente según su ficha; null si no lo tiene capturado. */
    readonly receptorRfc: string | null;
}

/**
 * Por qué ese XML no puede ser el CFDI de esta venta; lista vacía = se puede registrar.
 * Cada motivo es una frase para quien lo subió.
 */
export function faltasDelRegistro(c: ComprobanteEmitido, v: VentaParaRegistrar): string[] {
    const faltas: string[] = [];
    if (!c.uuid || !/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(c.uuid)) {
        faltas.push('El XML no trae timbre fiscal (UUID): no está timbrado o no es un CFDI.');
    }
    if (c.version !== '4.0') faltas.push(`Es un CFDI ${c.version ?? 'sin versión'}; se registran CFDI 4.0.`);
    if (c.tipoDeComprobante !== 'I') faltas.push('No es un comprobante de ingreso (tipo I).');
    if ((c.moneda ?? 'MXN') !== 'MXN') faltas.push(`Está en ${c.moneda}; la venta sin caja va en pesos.`);
    if (c.emisorRfc !== v.emisorRfc.toUpperCase()) {
        faltas.push(`Lo emitió ${c.emisorRfc ?? 'un RFC ilegible'}, y la empresa de la sucursal es ${v.emisorRfc.toUpperCase()}.`);
    }
    if (v.receptorRfc && c.receptorRfc !== v.receptorRfc.toUpperCase()) {
        faltas.push(`Está a nombre de ${c.receptorRfc ?? 'un RFC ilegible'}, y el cliente de la venta es ${v.receptorRfc.toUpperCase()}.`);
    }
    if (c.total === null || Math.round(c.total * 100) !== Math.round(v.total * 100)) {
        faltas.push(`Su total es ${c.total ?? '?'} y el de la venta ${v.total.toFixed(2)}: tienen que ser el mismo.`);
    }
    return faltas;
}
