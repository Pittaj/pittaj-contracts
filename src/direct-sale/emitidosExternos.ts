/**
 * @fileoverview D1 · Un CFDI emitido por otro sistema (SICAR, eleventa, el portal de un PAC)
 * convertido en los renglones de una venta sin caja.
 * @module Contracts/DirectSale
 *
 * Quien factura fuera de Pittaj trae sus XML para que sus ingresos lleguen a los libros. Aquí no se
 * calcula nada nuevo: se copian los conceptos del comprobante (cantidad, valor unitario, descuento e
 * impuesto) y se comprueba que la venta que resulta **cuadra al centavo** con el total timbrado. Si
 * no cuadra, o el comprobante trae algo que la venta sin caja todavía no lleva (impuestos locales,
 * otra moneda, un egreso), se rechaza con el motivo: un ingreso registrado a medias es peor que uno
 * que falta y se ve en la lista.
 *
 * **D1c:** el IEPS (por tasa o cuota) se copia al renglón, y las retenciones de ISR y de IVA de los
 * conceptos se suman en las de la venta. La clase del IEPS no viene en el CFDI: la pone quien
 * registra, con el catálogo de la empresa (`categoriaDelIepsRecibido`).
 *
 * Es puro y sin dependencias para que el escritorio use los mismos vectores el día que tenga su
 * propia carga (paridad de D1).
 *
 * Plan: docs `producto/plan-despachos-y-solo-libros.md` (D1) y `producto/frente-fiscal-sin-caja.md`.
 */
import type { ComprobanteEmitido } from './cfdi.js';
import type { DirectSaleLineInput } from './schemas.js';
import {
    totalesDeVentaSinCaja,
    type RenglonDeVentaSinCaja,
    type RetencionesDeVentaSinCaja,
} from './ventaSinCaja.js';

export interface TrasladoDelConcepto {
    /** 002 IVA · 003 IEPS. */
    readonly impuesto: string | null;
    /** Tasa · Cuota · Exento. */
    readonly tipoFactor: string | null;
    readonly tasaOCuota: number | null;
}

export interface ConceptoEmitido {
    readonly claveProdServ: string | null;
    readonly claveUnidad: string | null;
    readonly unidad: string | null;
    readonly descripcion: string;
    readonly cantidad: number;
    readonly valorUnitario: number;
    readonly importe: number;
    readonly descuento: number;
    /** 01 no objeto · 02 sí objeto · 03 sí objeto sin desglose · 04 sí objeto que no causa. */
    readonly objetoImp: string | null;
    readonly traslados: readonly TrasladoDelConcepto[];
    /** D1c · Las retenciones del concepto: 001 ISR · 002 IVA (cualquier otro se rechaza). */
    readonly retenciones: readonly { readonly impuesto: string | null; readonly importe: number }[];
}

const desescapar = (v: string) =>
    v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function atributo(etiqueta: string, nombre: string): string | null {
    const m = new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(etiqueta);
    return m ? desescapar(m[2] ?? m[3] ?? '').trim() : null;
}

const numero = (v: string | null) => (v === null || v === '' ? 0 : Number(v));

/** Los conceptos del comprobante con sus impuestos, en el orden del XML. */
export function leerConceptosEmitidos(xml: string): ConceptoEmitido[] {
    const conceptos: ConceptoEmitido[] = [];
    // Un concepto con impuestos trae cuerpo; uno sin ellos puede venir cerrado en sí mismo.
    const re = /<(?:[\w.-]+:)?Concepto\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?Concepto>)/g;
    for (let m = re.exec(xml); m; m = re.exec(xml)) {
        const a = m[1] ?? '';
        const cuerpo = m[2] ?? '';
        const traslados: TrasladoDelConcepto[] = [];
        for (const t of cuerpo.matchAll(/<(?:[\w.-]+:)?Traslado\b([^>]*?)\/?>/g)) {
            const tasa = atributo(t[1] ?? '', 'TasaOCuota');
            traslados.push({
                impuesto: atributo(t[1] ?? '', 'Impuesto'),
                tipoFactor: atributo(t[1] ?? '', 'TipoFactor'),
                tasaOCuota: tasa === null || tasa === '' ? null : Number(tasa),
            });
        }
        conceptos.push({
            claveProdServ: atributo(a, 'ClaveProdServ'),
            claveUnidad: atributo(a, 'ClaveUnidad'),
            unidad: atributo(a, 'Unidad'),
            descripcion: atributo(a, 'Descripcion') ?? '',
            cantidad: numero(atributo(a, 'Cantidad')),
            valorUnitario: numero(atributo(a, 'ValorUnitario')),
            importe: numero(atributo(a, 'Importe')),
            descuento: numero(atributo(a, 'Descuento')),
            objetoImp: atributo(a, 'ObjetoImp'),
            traslados,
            retenciones: [...cuerpo.matchAll(/<(?:[\w.-]+:)?Retencion\b([^>]*?)\/?>/g)].map((r) => ({
                impuesto: atributo(r[1] ?? '', 'Impuesto'),
                importe: numero(atributo(r[1] ?? '', 'Importe')),
            })),
        });
    }
    return conceptos;
}

/** El impuesto de un concepto en los términos de la venta sin caja, o por qué no se puede llevar. */
function impuestoDelConcepto(c: ConceptoEmitido): Pick<DirectSaleLineInput, 'tax' | 'taxRate' | 'ieps'> | string {
    const otraRetencion = c.retenciones.find((r) => r.impuesto !== '001' && r.impuesto !== '002');
    if (otraRetencion) return `trae una retención de ${otraRetencion.impuesto === '003' ? 'IEPS' : 'un impuesto desconocido'}`;
    if (c.traslados.some((t) => t.impuesto !== '002' && t.impuesto !== '003')) return 'trae un impuesto trasladado que no es IVA ni IEPS';

    // D1c · El IEPS, uno por concepto, por tasa o por cuota. Un IEPS exento o en cero no cobra nada.
    const iepss = c.traslados.filter((t) => t.impuesto === '003');
    if (iepss.length > 1) return 'trae más de un traslado de IEPS';
    let ieps: DirectSaleLineInput['ieps'] = null;
    const i = iepss[0];
    if (i && (i.tasaOCuota ?? 0) > 0) {
        if (i.tipoFactor !== 'Tasa' && i.tipoFactor !== 'Cuota') return `trae IEPS por ${i.tipoFactor ?? 'un factor desconocido'}`;
        ieps = { factor: i.tipoFactor, tasaOCuota: i.tasaOCuota! };
    }

    const ivas = c.traslados.filter((t) => t.impuesto === '002');
    // Sin IVA trasladado: no objeto (01), o sí objeto sin desglose o que no causa (03, 04). En los
    // tres casos no se cobró IVA, y así se lleva.
    if (ivas.length === 0) {
        if (c.objetoImp === '02' && !ieps) return 'dice ser objeto de impuesto pero no trae el traslado del IVA';
        // Con IEPS y sin IVA el concepto sí es objeto: se lleva a tasa 0 para que el IEPS tenga dónde ir.
        return ieps ? { tax: 'ZERO', ieps } : { tax: 'NOT_OBJECT' };
    }
    if (ivas.length > 1) return 'trae más de un traslado de IVA';
    const t = ivas[0]!;
    if (t.tipoFactor === 'Exento') return { tax: 'EXEMPT', ieps };
    if (t.tipoFactor !== 'Tasa') return `trae IVA por ${t.tipoFactor ?? 'un factor desconocido'}`;
    if (t.tasaOCuota === 0) return { tax: 'ZERO', ieps };
    if (t.tasaOCuota === 0.16 || t.tasaOCuota === 0.08) return { tax: 'IVA', taxRate: t.tasaOCuota, ieps };
    return `trae IVA al ${((t.tasaOCuota ?? 0) * 100).toFixed(2)} %`;
}

/** D1c · Lo retenido en todos los conceptos, por impuesto. */
function retencionesDe(conceptos: readonly ConceptoEmitido[]): RetencionesDeVentaSinCaja {
    let isr = 0;
    let iva = 0;
    for (const c of conceptos) {
        for (const r of c.retenciones) {
            if (r.impuesto === '001') isr += r.importe;
            if (r.impuesto === '002') iva += r.importe;
        }
    }
    return { isr: Math.round(isr * 100) / 100, iva: Math.round(iva * 100) / 100 };
}

/** Por qué el comprobante entero no se puede registrar como venta; vacío si el tipo y la moneda sirven. */
export function motivosDelComprobanteEmitido(c: ComprobanteEmitido, xml: string): string[] {
    const motivos: string[] = [];
    if (!c.uuid) motivos.push('No está timbrado: no trae el UUID del timbre fiscal.');
    if (c.version !== '4.0') motivos.push(`Es un CFDI ${c.version ?? 'sin versión'}; se registran CFDI 4.0.`);
    switch (c.tipoDeComprobante) {
        case 'I':
            break;
        case 'E':
            motivos.push('Es un egreso (nota de crédito): todavía no se registra; llega en D1b.');
            break;
        case 'P':
            motivos.push('Es un complemento de pago: todavía no se registra; llega en D1b.');
            break;
        case 'N':
            motivos.push('Es de nómina: se registra como gasto en Contabilidad (C4), no como venta.');
            break;
        case 'T':
            motivos.push('Es un traslado de mercancía: no es una venta.');
            break;
        default:
            motivos.push('No dice qué tipo de comprobante es.');
    }
    if ((c.moneda ?? 'MXN') !== 'MXN') motivos.push(`Está en ${c.moneda}; la venta sin caja va en pesos.`);
    if (/<(?:[\w.-]+:)?ImpuestosLocales\b/.test(xml)) motivos.push('Trae impuestos locales, que la venta sin caja todavía no lleva.');
    return motivos;
}

const aRenglon = (r: DirectSaleLineInput): RenglonDeVentaSinCaja => ({
    cantidad: r.quantity,
    precioUnitario: r.unitPrice,
    descuentoPorcentaje: r.discountPercent ?? 0,
    impuesto: r.tax,
    tasaIva: r.taxRate,
    impuestosIncluidos: r.taxIncluded ?? false,
    ieps: r.ieps ?? null,
});

const cuadra = (renglones: readonly DirectSaleLineInput[], retenciones: RetencionesDeVentaSinCaja, total: number) =>
    Math.round(totalesDeVentaSinCaja(renglones.map(aRenglon), retenciones).total * 100) === Math.round(total * 100);

/**
 * Los renglones de la venta sin caja que reproducen el comprobante, o los motivos por los que no.
 *
 * Primero se copia cada concepto como viene (cantidad, valor unitario y descuento). Si el redondeo
 * del emisor no coincide con el de Pittaj, se intenta cada concepto como una sola pieza por su
 * importe neto, que quita el redondeo del precio y del descuento. Si tampoco cuadra, se rechaza.
 */
export function renglonesDelCfdiEmitido(
    c: ComprobanteEmitido,
    xml: string,
):
    | { readonly renglones: DirectSaleLineInput[]; readonly retenciones: RetencionesDeVentaSinCaja }
    | { readonly motivos: string[] } {
    const generales = motivosDelComprobanteEmitido(c, xml);
    if (generales.length > 0) return { motivos: generales };

    const conceptos = leerConceptosEmitidos(xml).filter((k) => k.importe - k.descuento > 0);
    if (conceptos.length === 0) return { motivos: ['No trae conceptos con importe.'] };
    if (conceptos.length > 200) return { motivos: ['Trae más de 200 conceptos; la venta sin caja lleva hasta 200.'] };

    const motivos: string[] = [];
    const tal: DirectSaleLineInput[] = [];
    const neto: DirectSaleLineInput[] = [];
    conceptos.forEach((k, i) => {
        const impuesto = impuestoDelConcepto(k);
        if (typeof impuesto === 'string') {
            motivos.push(`El concepto ${i + 1} (${k.descripcion.slice(0, 60)}) ${impuesto}.`);
            return;
        }
        const clave = k.claveProdServ && /^\d{8}$/.test(k.claveProdServ) ? k.claveProdServ : '01010101';
        const comun = {
            description: k.descripcion.slice(0, 1000) || 'Concepto',
            satProductCode: clave,
            satUnitCode: (k.claveUnidad ?? 'ACT').slice(0, 5),
            unitName: k.unidad ? k.unidad.slice(0, 30) : null,
            ...impuesto,
            taxIncluded: false,
        };
        const comoViene: DirectSaleLineInput = {
            ...comun,
            quantity: k.cantidad > 0 ? k.cantidad : 1,
            unitPrice: k.cantidad > 0 ? k.valorUnitario : k.importe,
            discountPercent: k.descuento > 0 && k.importe > 0 ? (k.descuento / k.importe) * 100 : 0,
        };
        tal.push(comoViene);
        // Una cuota de IEPS se cobra por unidad: el concepto como una sola pieza la cambiaría, así
        // que ese renglón se queda como viene también en el intento por importe neto.
        neto.push(
            impuesto.ieps?.factor === 'Cuota'
                ? comoViene
                : { ...comun, quantity: 1, unitPrice: Math.round((k.importe - k.descuento) * 100) / 100, discountPercent: 0 },
        );
    });
    if (motivos.length > 0) return { motivos };
    if (c.total === null) return { motivos: ['No trae el total del comprobante.'] };
    const retenciones = retencionesDe(conceptos);
    if (cuadra(tal, retenciones, c.total)) return { renglones: tal, retenciones };
    if (cuadra(neto, retenciones, c.total)) return { renglones: neto, retenciones };
    const calculado = totalesDeVentaSinCaja(tal.map(aRenglon), retenciones).total;
    return {
        motivos: [
            `No cuadra al centavo: el comprobante dice ${c.total.toFixed(2)} y la venta daría ${calculado.toFixed(2)} (redondeo del sistema que lo emitió).`,
        ],
    };
}
