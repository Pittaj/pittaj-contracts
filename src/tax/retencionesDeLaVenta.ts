/**
 * @fileoverview D7c · Las retenciones que lleva un CFDI de venta.
 * @module Contracts/Tax
 *
 * Quien **paga** retiene, pero quien **factura** tiene que poner la retención en su CFDI: si no va,
 * el cliente no puede deducir ni acreditar, y pide la factura de nuevo. No se teclea: depende de
 * quién emite, quién recibe y qué se vende, y eso ya lo sabe el sistema.
 *
 * | Qué se vende (`ClaseDeRetencion`) | Emisor | Receptor | ISR | IVA |
 * |---|---|---|---|---|
 * | `HONORARIOS` (servicios profesionales independientes) | persona física | persona moral | 10 % (LISR art. 106, último párrafo) · RESICO 1.25 % | ⅔ del IVA (LIVA art. 1-A fr. II a; RLIVA art. 3 fr. I) |
 * | `ARRENDAMIENTO` (uso o goce temporal de bienes) | persona física | persona moral | 10 % (LISR art. 116, tercer párrafo) · RESICO 1.25 % | ⅔ del IVA (LIVA art. 1-A fr. II a; RLIVA art. 3 fr. I) |
 * | `COMISIONES` (comisión, mediación, agencia, correduría) | persona física | persona moral | RESICO 1.25 % | ⅔ del IVA (LIVA art. 1-A fr. II b; RLIVA art. 3 fr. I) |
 * | `FLETES` (autotransporte terrestre de bienes) | cualquiera | persona moral | RESICO 1.25 % | 4 % (LIVA art. 1-A fr. II c; RLIVA art. 3 fr. II) |
 * | `PERSONAL` (servicios con personal puesto a disposición) | cualquiera | persona moral o física con actividad empresarial | RESICO 1.25 % | 6 % (LIVA art. 1-A fr. IV) |
 * | sin clase (bienes, servicios en general) | persona física en RESICO | persona moral | 1.25 % (LISR art. 113-J) | — |
 *
 * Reglas que cruzan la tabla:
 *
 * - **RESICO** (`626`) persona física cobrando a una persona moral: la retención de ISR es 1.25 %
 *   sobre lo cobrado sin IVA, **en lugar** del 10 % (LISR art. 113-J).
 * - **⅔ del IVA** es dos terceras partes **del IVA trasladado**, no del 16 %: en la frontera (8 %)
 *   son 5.3333 %. En un renglón exento, a tasa 0 o no objeto no hay IVA que retener.
 * - **Público en general** (`XAXX010101000`) y **extranjero** (`XEXX010101000`) no retienen.
 * - La persona se sabe por el RFC: 12 caracteres es moral, 13 es física (CFF art. 27; Anexo 20,
 *   «Rfc»).
 *
 * El resultado es una **decisión** (`RetencionesDecididas`): las tasas por clase. Se guarda con el
 * CFDI y de ella salen las retenciones de cada concepto, las del complemento de pago y las de una
 * nota de crédito. Quien timbra la ve antes y la puede cambiar: es su comprobante.
 *
 * La gemela del escritorio es `Pittaj.Domain/Tax/RetencionesDeLaVenta.cs`, con los mismos vectores.
 */

/** Qué se vende, en lo que importa para retener. `null` = bienes o servicios en general. */
export const CLASES_DE_RETENCION = ['HONORARIOS', 'ARRENDAMIENTO', 'COMISIONES', 'FLETES', 'PERSONAL'] as const;
export type ClaseDeRetencion = (typeof CLASES_DE_RETENCION)[number];

export const NOMBRE_DE_CLASE_DE_RETENCION: Record<ClaseDeRetencion, string> = {
    HONORARIOS: 'Honorarios (servicios profesionales)',
    ARRENDAMIENTO: 'Arrendamiento (renta de bienes)',
    COMISIONES: 'Comisiones, mediación o agencia',
    FLETES: 'Fletes (autotransporte terrestre de bienes)',
    PERSONAL: 'Servicios con personal a disposición',
};

/** Clave para «sin clase» en la decisión. */
export const SIN_CLASE = 'GENERAL' as const;
export type ClaveDeRetencion = ClaseDeRetencion | typeof SIN_CLASE;

/** Cómo se retiene el IVA de un renglón. */
export type RetencionDeIva =
    /** Dos terceras partes del IVA trasladado del renglón (RLIVA art. 3 fr. I). */
    | { readonly modo: 'DOS_TERCIOS' }
    /** Una tasa fija sobre la base del IVA del renglón (fletes 4 %, personal 6 %, o la que se capture). */
    | { readonly modo: 'TASA'; readonly tasa: number };

/** Las tasas de una clase. `null` = no se retiene ese impuesto. */
export interface TasasDeRetencion {
    /** Fracción sobre la base sin impuestos (0.10, 0.0125). */
    readonly isr: number | null;
    readonly iva: RetencionDeIva | null;
    /** Por qué (artículos). Para mostrarlo antes de timbrar. */
    readonly fundamento?: string;
}

/** La decisión de un CFDI: tasas por clase. Una clase ausente no retiene. */
export type RetencionesDecididas = Partial<Record<ClaveDeRetencion, TasasDeRetencion>>;

export interface ParteFiscal {
    readonly rfc: string;
    readonly regimenFiscal?: string | null;
}

export const RFC_PUBLICO_EN_GENERAL = 'XAXX010101000';
export const RFC_EXTRANJERO = 'XEXX010101000';
export const REGIMEN_RESICO = '626';
/** Regímenes de persona física con actividad empresarial (para `PERSONAL`, LIVA art. 1-A fr. IV). */
const REGIMENES_PF_EMPRESARIAL = new Set(['612', '626', '621', '625']);

export const TASA_ISR_HONORARIOS_Y_ARRENDAMIENTO = 0.1;
export const TASA_ISR_RESICO = 0.0125;
export const TASA_IVA_FLETES = 0.04;
export const TASA_IVA_PERSONAL = 0.06;

const limpio = (rfc: string) => rfc.trim().toUpperCase();
export const esPersonaMoral = (rfc: string) => limpio(rfc).length === 12;
export const esPersonaFisica = (rfc: string) => limpio(rfc).length === 13;
const esGenerico = (rfc: string) => [RFC_PUBLICO_EN_GENERAL, RFC_EXTRANJERO].includes(limpio(rfc));

/**
 * Las tasas que la ley pide para una clase, dados emisor y receptor. `null` si no se retiene nada.
 */
export function tasasDeRetencion(
    emisor: ParteFiscal,
    receptor: ParteFiscal,
    clase: ClaseDeRetencion | null,
): TasasDeRetencion | null {
    if (esGenerico(receptor.rfc)) return null;
    const receptorPM = esPersonaMoral(receptor.rfc);
    const emisorPF = esPersonaFisica(emisor.rfc);
    const resico = emisorPF && (emisor.regimenFiscal ?? '').trim() === REGIMEN_RESICO;
    const isrResico = resico && receptorPM ? TASA_ISR_RESICO : null;
    const fResico = isrResico ? 'ISR 1.25 % (LISR art. 113-J)' : null;

    const armar = (isr: number | null, iva: RetencionDeIva | null, ...fund: (string | null)[]): TasasDeRetencion | null =>
        isr === null && iva === null ? null : { isr, iva, fundamento: fund.filter(Boolean).join('; ') };

    switch (clase) {
        case 'HONORARIOS':
        case 'ARRENDAMIENTO': {
            if (!(emisorPF && receptorPM)) return null;
            const art = clase === 'HONORARIOS' ? 'LISR art. 106, último párrafo' : 'LISR art. 116, tercer párrafo';
            return armar(
                isrResico ?? TASA_ISR_HONORARIOS_Y_ARRENDAMIENTO,
                { modo: 'DOS_TERCIOS' },
                fResico ?? `ISR 10 % (${art})`,
                'IVA ⅔ (LIVA art. 1-A fr. II a; RLIVA art. 3 fr. I)',
            );
        }
        case 'COMISIONES':
            if (!(emisorPF && receptorPM)) return null;
            return armar(isrResico, { modo: 'DOS_TERCIOS' }, fResico, 'IVA ⅔ (LIVA art. 1-A fr. II b; RLIVA art. 3 fr. I)');
        case 'FLETES':
            if (!receptorPM) return null;
            return armar(isrResico, { modo: 'TASA', tasa: TASA_IVA_FLETES }, fResico, 'IVA 4 % (LIVA art. 1-A fr. II c; RLIVA art. 3 fr. II)');
        case 'PERSONAL': {
            const receptorEmpresarial = receptorPM || REGIMENES_PF_EMPRESARIAL.has((receptor.regimenFiscal ?? '').trim());
            if (!receptorEmpresarial) return armar(isrResico, null, fResico);
            return armar(isrResico, { modo: 'TASA', tasa: TASA_IVA_PERSONAL }, fResico, 'IVA 6 % (LIVA art. 1-A fr. IV)');
        }
        default:
            return armar(isrResico, null, fResico);
    }
}

/** La decisión del CFDI para las clases que trae. Vacía si no se retiene nada. */
export function decidirRetenciones(
    emisor: ParteFiscal,
    receptor: ParteFiscal,
    clases: readonly (ClaseDeRetencion | null | undefined)[],
): RetencionesDecididas {
    const d: Partial<Record<ClaveDeRetencion, TasasDeRetencion>> = {};
    for (const c of new Set(clases.map((x) => x ?? null))) {
        const t = tasasDeRetencion(emisor, receptor, c);
        if (t) d[c ?? SIN_CLASE] = t;
    }
    return d;
}

/** `true` si la decisión no retiene nada. */
export const sinRetenciones = (d: RetencionesDecididas | null | undefined): boolean =>
    !d || Object.values(d).every((t) => !t || (t.isr === null && t.iva === null));

/** Una retención de un concepto (o del documento, agrupada). */
export interface RetencionDelConcepto {
    /** c_Impuesto: '001' ISR · '002' IVA. */
    readonly impuesto: '001' | '002';
    readonly tipoFactor: 'Tasa';
    /** Fracción a 6 decimales, como va en el CFDI. */
    readonly tasaOCuota: number;
    readonly base: number;
    readonly importe: number;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const r6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

export interface ConceptoParaRetener {
    readonly clase?: ClaseDeRetencion | null;
    /** Importe − descuento: la base del ISR. */
    readonly base: number;
    /** Base del IVA trasladado (base + IEPS). */
    readonly baseIva: number;
    /** Tasa del IVA trasladado como fracción; 0 o null si es exento, tasa 0 o no objeto. */
    readonly tasaIva: number | null;
}

/**
 * Las retenciones de un concepto según la decisión. El importe es `base × tasa` con la tasa a 6
 * decimales: es lo que el PAC valida (Anexo 20, límites del importe de la retención).
 */
export function retencionesDelConcepto(d: RetencionesDecididas | null | undefined, c: ConceptoParaRetener): RetencionDelConcepto[] {
    const t = d?.[c.clase ?? SIN_CLASE];
    if (!t) return [];
    const out: RetencionDelConcepto[] = [];
    if (t.isr !== null && t.isr > 0 && c.base > 0) {
        const tasa = r6(t.isr);
        out.push({ impuesto: '001', tipoFactor: 'Tasa', tasaOCuota: tasa, base: r2(c.base), importe: r2(c.base * tasa) });
    }
    const tasaIva = c.tasaIva ?? 0;
    if (t.iva && tasaIva > 0 && c.baseIva > 0) {
        const tasa = r6(t.iva.modo === 'DOS_TERCIOS' ? (tasaIva * 2) / 3 : Math.min(t.iva.tasa, tasaIva));
        if (tasa > 0) out.push({ impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: tasa, base: r2(c.baseIva), importe: r2(c.baseIva * tasa) });
    }
    return out;
}

/** Agrupa por impuesto y tasa (el nodo del comprobante y el desglose del complemento de pago). */
export function agruparRetenciones(rs: readonly RetencionDelConcepto[]): RetencionDelConcepto[] {
    const g = new Map<string, RetencionDelConcepto>();
    for (const r of rs) {
        const k = `${r.impuesto}|${r.tasaOCuota}`;
        const a = g.get(k);
        g.set(k, a ? { ...a, base: r2(a.base + r.base), importe: r2(a.importe + r.importe) } : r);
    }
    return [...g.values()];
}

export function totalRetenido(rs: readonly RetencionDelConcepto[]): number {
    return r2(rs.reduce((s, r) => s + r.importe, 0));
}

/** Las retenciones de un documento en la proporción de un abono (desglose «DR» del REP). */
export function prorratearRetenciones(rs: readonly RetencionDelConcepto[], proporcion: number): RetencionDelConcepto[] {
    const p = Math.max(0, Math.min(1, proporcion));
    return rs.map((r) => ({ ...r, base: r2(r.base * p), importe: r2(r.importe * p) }));
}

/**
 * Valida una decisión capturada a mano antes de timbrar: ISR entre 0 y 35 % (la tasa máxima de
 * LISR art. 9 y 152), IVA entre 0 y 16 %. Devuelve el motivo o `null`.
 */
export function validarRetenciones(d: RetencionesDecididas): string | null {
    for (const [clave, t] of Object.entries(d)) {
        if (!t) continue;
        if (t.isr !== null && !(t.isr >= 0 && t.isr <= 0.35)) return `La retención de ISR de ${clave} debe estar entre 0 y 35 %.`;
        if (t.iva?.modo === 'TASA' && !(t.iva.tasa >= 0 && t.iva.tasa <= 0.16)) {
            return `La retención de IVA de ${clave} debe estar entre 0 y 16 %.`;
        }
    }
    return null;
}
