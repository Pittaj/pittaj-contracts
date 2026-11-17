/**
 * @fileoverview (2.112.0) La forma de pago SAT de la factura cuando no la dice el método de pago.
 * @module Contracts/SalesCfdi/FormaDePago
 *
 * Dos casos que antes salían con `99` («Por definir») junto a `PUE`, una combinación que la guía de
 * llenado del Anexo 20 reserva para lo que no se ha pagado (`99` va con `PPD`):
 *
 * 1. **Venta pagada con nota de crédito.** No hay un método del catálogo detrás del pago: la clave la da
 *    el ajuste `cfdi.formaPago.notaDeCredito`. Por omisión `17` (Compensación): el cliente y el negocio
 *    se deben mutuamente —él la compra, el negocio la nota— y se compensa (pregunta 28 del apéndice de
 *    preguntas y respuestas). La alternativa que la guía da para la tarjeta de regalo es `01` (pregunta 31).
 * 2. **Egreso de una devolución.** El ajuste `cfdi.formaPago.egresoDevolucion` elige entre la regla
 *    principal de la guía —«la misma clave que se registró en el CFDI de ingreso que le dio origen»—
 *    (`ORIGEN`, por omisión) y la opcional —«la forma con la que se está efectuando la devolución»—
 *    (`REEMBOLSO`). Si la venta de origen no se pagó (fiado), `15` (Condonación), como pide la guía.
 *
 * Las dos claves viajan como `tenant_settings` con prefijo `cfdi.` (ya sincronizable): texto plano,
 * igual que `cfdi.series`. Las edita Configuración › CFDI en la web y en el escritorio; las lee la nube,
 * que es quien timbra.
 */

/** Las claves del ajuste. */
export const CLAVES_FORMA_DE_PAGO = {
    NOTA_DE_CREDITO: 'cfdi.formaPago.notaDeCredito',
    EGRESO_DEVOLUCION: 'cfdi.formaPago.egresoDevolucion',
} as const;

/** c_FormaPago: Compensación. */
export const FORMA_PAGO_COMPENSACION = '17';
/** c_FormaPago: Condonación (egreso de algo que no se pagó). */
export const FORMA_PAGO_CONDONACION = '15';
/** c_FormaPago: Por definir (solo con PPD). */
export const FORMA_PAGO_POR_DEFINIR = '99';

export const FORMA_PAGO_NOTA_DE_CREDITO_POR_OMISION = FORMA_PAGO_COMPENSACION;

export const CRITERIOS_DEL_EGRESO = ['ORIGEN', 'REEMBOLSO'] as const;
export type CriterioDelEgreso = (typeof CRITERIOS_DEL_EGRESO)[number];
export const CRITERIO_DEL_EGRESO_POR_OMISION: CriterioDelEgreso = 'ORIGEN';

/**
 * (2.113.0) Las claves que tiene sentido elegir para la venta pagada con nota de crédito, con su nombre del
 * catálogo c_FormaPago. Las dos pantallas enseñan esta lista (el catálogo de métodos de pago no trae 15, 17 ni 23).
 */
export const FORMAS_PARA_LA_NOTA_DE_CREDITO: ReadonlyArray<{ readonly clave: string; readonly texto: string }> = [
    { clave: '17', texto: '17 · Compensación' },
    { clave: '01', texto: '01 · Efectivo' },
    { clave: '15', texto: '15 · Condonación' },
    { clave: '23', texto: '23 · Novación' },
];

/** Las opciones del criterio, con el texto que enseñan las dos pantallas. */
export const OPCIONES_DEL_CRITERIO_DEL_EGRESO: ReadonlyArray<{ readonly valor: CriterioDelEgreso; readonly texto: string }> = [
    { valor: 'ORIGEN', texto: 'Como la venta de origen (regla principal del SAT)' },
    { valor: 'REEMBOLSO', texto: 'Como se le devolvió al cliente' },
];

/** ¿Es una clave c_FormaPago con la que se puede timbrar algo ya pagado? (2 dígitos y no `99`). */
export function esFormaDePagoPagada(clave: string | null | undefined): clave is string {
    return typeof clave === 'string' && /^\d{2}$/.test(clave.trim()) && clave.trim() !== FORMA_PAGO_POR_DEFINIR;
}

/** El texto guardado, venga plano (`17`) o como cadena JSON (`"17"`, como guarda la web otros `cfdi.*`). */
function textoGuardado(guardado: string | null | undefined): string {
    const t = (guardado ?? '').trim();
    if (t.startsWith('"')) {
        try {
            const v: unknown = JSON.parse(t);
            if (typeof v === 'string') return v.trim();
        } catch {
            /* no era JSON: va tal cual */
        }
    }
    return t;
}

/** El valor guardado de `cfdi.formaPago.notaDeCredito`, o `17` si falta o no sirve. */
export function formaPagoDeLaNota(guardado: string | null | undefined): string {
    const t = textoGuardado(guardado);
    return esFormaDePagoPagada(t) ? t : FORMA_PAGO_NOTA_DE_CREDITO_POR_OMISION;
}

/** El valor guardado de `cfdi.formaPago.egresoDevolucion`, o `ORIGEN` si falta o no sirve. */
export function criterioDelEgreso(guardado: string | null | undefined): CriterioDelEgreso {
    const v = textoGuardado(guardado).toUpperCase();
    return (CRITERIOS_DEL_EGRESO as readonly string[]).includes(v) ? (v as CriterioDelEgreso) : CRITERIO_DEL_EGRESO_POR_OMISION;
}

/**
 * La forma de pago del egreso de una devolución.
 * - `formaDeLaVenta`: la que lleva (o llevaría) la factura de la venta devuelta; `99` si fue a crédito.
 * - `formaDelReembolso`: la clave con que se le devolvió (efectivo, transferencia, la nota…); null si no se sabe.
 */
export function formaPagoDelEgreso(entrada: {
    readonly criterio: CriterioDelEgreso;
    readonly formaDeLaVenta: string | null | undefined;
    readonly formaDelReembolso: string | null | undefined;
}): string {
    if (entrada.criterio === 'REEMBOLSO' && esFormaDePagoPagada(entrada.formaDelReembolso)) return entrada.formaDelReembolso.trim();
    if (esFormaDePagoPagada(entrada.formaDeLaVenta)) return entrada.formaDeLaVenta.trim();
    // La venta no se pagó (fiado, `99`): la guía propone Condonación.
    if ((entrada.formaDeLaVenta as string | null | undefined)?.trim() === FORMA_PAGO_POR_DEFINIR) return FORMA_PAGO_CONDONACION;
    // No hay de dónde sacar la de la venta: la del reembolso, y si tampoco, Condonación.
    if (esFormaDePagoPagada(entrada.formaDelReembolso)) return entrada.formaDelReembolso.trim();
    return FORMA_PAGO_CONDONACION;
}
