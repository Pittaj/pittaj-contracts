/**
 * @fileoverview D2 · La DIOT con las bases ya separadas: por tasa de IVA y por tipo de operación.
 * @module Contracts/Purchase
 *
 * La DIOT 2025 (nueva plataforma del SAT, carga de 54 campos) pide el valor de los actos pagados
 * **separado por tasa** —16 %, 8 % de la región fronteriza, 0 %, exento, no objeto— y el **tipo de
 * operación** por tercero. Hasta D2 la compra guardaba una sola base: una factura mixta mandaba
 * todo a «con IVA» y lo exento se confundía con la tasa 0.
 *
 * - **La base de cada tasa es la `Base` del traslado de IVA del concepto**, no su importe: en la
 *   gasolina, el importe trae la cuota de IEPS y la base al 16 % es menor. Sin ese dato (una
 *   punta vieja), la base legal: importe − descuento + IEPS.
 * - **Exento** es `TipoFactor="Exento"`; **no objeto** es `ObjetoImp="01"` (o un concepto sin
 *   traslado de IVA); **tasa 0** es un traslado `Tasa` al 0.000000.
 * - **Tipo de operación** (catálogo DIOT 2025): 02 enajenación de bienes, 03 servicios
 *   profesionales, 06 uso o goce temporal, 07 importación, 08 importación por transferencia
 *   virtual, 85 otros, 87 operaciones globales (solo el proveedor global, RFC
 *   `XAXX010101000`). Se sugiere por lo que se compró y el concepto de gasto, y se corrige en la
 *   compra.
 *
 * El escritorio tiene la gemela en `Pittaj.Domain/Purchasing/Diot.cs`, con los mismos vectores.
 */

/** Las columnas de la DIOT para el valor de los actos pagados. */
export const CLASES_DE_IVA = ['IVA16', 'IVA8', 'TASA0', 'EXENTO', 'NO_OBJETO'] as const;
export type ClaseDeIva = (typeof CLASES_DE_IVA)[number];

export interface BaseDeIva {
    readonly base: number;
    readonly iva: number;
}
/** Base e IVA por clase, en pesos. Una clase ausente vale cero. */
export type BasesDeIva = Readonly<Partial<Record<ClaseDeIva, BaseDeIva>>>;

/** Catálogo de tipos de operación de la DIOT 2025. */
export const OPERACIONES_DIOT = {
    '02': 'Enajenación de bienes',
    '03': 'Prestación de servicios profesionales',
    '06': 'Uso o goce temporal de bienes',
    '07': 'Importación de bienes o servicios',
    '08': 'Importación por transferencia virtual',
    '85': 'Otros',
    '87': 'Operaciones globales',
} as const;
export type OperacionDiot = keyof typeof OPERACIONES_DIOT;
export const CLAVES_DE_OPERACION_DIOT = Object.keys(OPERACIONES_DIOT) as OperacionDiot[];

/** El RFC genérico obligatorio del proveedor global (tipo de tercero 15, operación 87). */
export const RFC_PROVEEDOR_GLOBAL = 'XAXX010101000';

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Lo que hace falta de un concepto para saber su clase y su base. */
export interface ConceptoParaDiot {
    readonly importe: number;
    readonly descuento?: number | null;
    /** Tasa de IVA del concepto como fracción (0.16). */
    readonly taxRate: number;
    readonly taxAmount?: number | null;
    readonly iepsAmount?: number | null;
    /** `Base` del traslado de IVA (002) del concepto. */
    readonly ivaBase?: number | null;
    /** `TipoFactor` del traslado de IVA: Tasa o Exento. Null = no trae traslado de IVA. */
    readonly ivaFactor?: string | null;
    /** `ObjetoImp` del concepto (01 no objeto, 02 sí, 03/04/05). */
    readonly objetoImp?: string | null;
}

/** La columna de la DIOT de un concepto. */
export function claseDeIvaDelConcepto(c: ConceptoParaDiot): ClaseDeIva {
    if ((c.objetoImp ?? '').trim() === '01') return 'NO_OBJETO';
    const factor = (c.ivaFactor ?? '').trim().toLowerCase();
    if (factor === 'exento') return 'EXENTO';
    // Sin traslado de IVA: si la punta ya lee el objeto de impuesto, el concepto no lo causa; una
    // punta vieja no dice nada y se decide por la tasa.
    if (!factor && c.objetoImp !== undefined && c.objetoImp !== null) return 'NO_OBJETO';
    if (c.taxRate >= 0.155) return 'IVA16';
    if (c.taxRate >= 0.075) return 'IVA8';
    if (c.taxRate > 0) return 'IVA16'; // una tasa rara va a la general y se revisa
    return 'TASA0';
}

/** La base de un concepto para su columna: la del traslado de IVA, o la legal. */
export function baseDeIvaDelConcepto(c: ConceptoParaDiot): BaseDeIva {
    const clase = claseDeIvaDelConcepto(c);
    const neto = r2((c.importe ?? 0) - (c.descuento ?? 0));
    if (clase === 'NO_OBJETO') return { base: neto, iva: 0 };
    const base = c.ivaBase !== null && c.ivaBase !== undefined ? r2(c.ivaBase) : r2(neto + (c.iepsAmount ?? 0));
    const iva = clase === 'IVA16' || clase === 'IVA8' ? r2(c.taxAmount ?? base * c.taxRate) : 0;
    return { base, iva };
}

/** Suma por clase. */
export function sumarBasesDeIva(partes: Iterable<readonly [ClaseDeIva, BaseDeIva]>): BasesDeIva {
    const r: Partial<Record<ClaseDeIva, BaseDeIva>> = {};
    for (const [k, v] of partes) {
        const a = r[k] ?? { base: 0, iva: 0 };
        r[k] = { base: r2(a.base + v.base), iva: r2(a.iva + v.iva) };
    }
    return r;
}

/** Las bases de un CFDI recibido, concepto por concepto (en la moneda en que vengan). */
export function basesDeIvaDelComprobante(conceptos: readonly ConceptoParaDiot[]): BasesDeIva {
    return sumarBasesDeIva(conceptos.map((c) => [claseDeIvaDelConcepto(c), baseDeIvaDelConcepto(c)] as const));
}

/**
 * Las bases de una compra **sin** desglose del comprobante (capturada a mano, o anterior a D2):
 * por la tasa de cada renglón. Sin el CFDI no se distingue lo exento de la tasa 0: va a tasa 0 y
 * el reporte lo avisa.
 */
export function basesDeIvaDeRenglones(
    renglones: readonly { readonly taxPercent: number; readonly taxBaseAmount: number; readonly taxAmount: number }[]
): BasesDeIva {
    return sumarBasesDeIva(
        renglones.map((r) => {
            const t = r.taxPercent > 1 ? r.taxPercent / 100 : r.taxPercent;
            const clase: ClaseDeIva = t >= 0.155 || (t > 0 && t < 0.075) ? 'IVA16' : t >= 0.075 ? 'IVA8' : 'TASA0';
            return [clase, { base: r2(r.taxBaseAmount), iva: clase === 'TASA0' ? 0 : r2(r.taxAmount) }] as const;
        })
    );
}

/** Multiplica las bases por una proporción (lo pagado de la factura), al centavo. */
export function prorratearBasesDeIva(b: BasesDeIva, proporcion: number): BasesDeIva {
    const r: Partial<Record<ClaseDeIva, BaseDeIva>> = {};
    for (const k of CLASES_DE_IVA) {
        const v = b[k];
        if (v) r[k] = { base: r2(v.base * proporcion), iva: r2(v.iva * proporcion) };
    }
    return r;
}

/** Concepto de gasto (`code` de la semilla) → tipo de operación. Lo demás es 85. */
const OPERACION_DEL_CONCEPTO: Readonly<Record<string, OperacionDiot>> = {
    RENT: '06',
    FEES: '03',
    STATIONERY: '02',
    FUEL: '02',
};

/**
 * El tipo de operación que se sugiere para una compra. Mercancía y activo fijo son bienes (02); un
 * gasto, según su concepto: renta 06, honorarios 03, papelería o combustible 02, lo demás 85. El
 * proveedor global siempre es 87.
 */
export function operacionDiotSugerida(input: {
    readonly kind: string;
    /** `code` del concepto de gasto con más base en la compra. */
    readonly conceptoCode?: string | null;
    readonly proveedorGlobal?: boolean;
}): OperacionDiot {
    if (input.proveedorGlobal) return '87';
    if (input.kind === 'INVENTORY' || input.kind === 'FIXED_ASSET') return '02';
    return OPERACION_DEL_CONCEPTO[(input.conceptoCode ?? '').toUpperCase()] ?? '85';
}

export function esOperacionDiot(v: string | null | undefined): v is OperacionDiot {
    return Boolean(v) && v! in OPERACIONES_DIOT;
}
