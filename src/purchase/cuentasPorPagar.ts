/**
 * @fileoverview Cuánto se debe y desde cuándo.
 *
 * ── Por qué esto vive en contracts ──
 *
 * El saldo de una compra y la cubeta de antigüedad en la que cae son **la misma pregunta en las dos
 * plataformas**. Si el escritorio y la web las calcularan por su cuenta, el mismo proveedor
 * aparecería con dos deudas distintas según por dónde entres — y esa es la clase de divergencia que
 * se descubre discutiendo con el proveedor, no en una pantalla.
 *
 * Mismo patrón que `quoteComparison`, `reposicion` y `comprasAtencion`: espejo literal en C#
 * (`CuentasPorPagar.cs`).
 *
 * ── La doctrina que manda aquí ──
 *
 * **El saldo NO se guarda: se deriva.** Es el §4 del mandato de arquitectura, y en ningún sitio
 * aplica tan directo: una columna `saldo_pendiente` en la compra es el número que un día no cuadra
 * con sus propios movimientos, y nadie sabe cuál de los dos está mal.
 */

/** En qué se puede aplicar un pago. */
export const TIPOS_DE_DOCUMENTO_PAGABLE = ['PURCHASE', 'SUPPLIER_NOTE'] as const;
export type TipoDeDocumentoPagable = (typeof TIPOS_DE_DOCUMENTO_PAGABLE)[number];

/** De dónde salió el dinero. */
export const ORIGENES_DE_PAGO = ['CAJA', 'BANCO', 'OTRO'] as const;
export type OrigenDePago = (typeof ORIGENES_DE_PAGO)[number];

/**
 * Con qué se pagó.
 *
 * No es la clave del SAT (`c_FormaPago`): es lo que el usuario reconoce. La clave fiscal se deriva
 * de aquí cuando haga falta timbrar, no al revés — pedirle a alguien que elija «03» en vez de
 * «transferencia» es pedirle que sepa un catálogo que no es suyo.
 */
export const FORMAS_DE_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO'] as const;
export type FormaDePago = (typeof FORMAS_DE_PAGO)[number];

/** Lo que un documento debe, con sus partes a la vista. */
export interface SaldoDeDocumento {
    /** El total del documento tal como se emitió. */
    readonly total: number;
    /**
     * Efecto firmado de las notas aplicadas: negativo en devolución y crédito, positivo en débito.
     *
     * Va **aparte y no restado del total** a propósito: un renglón que no cuadra con la factura que
     * el proveedor tiene sobre la mesa, y que no explica por qué, es un renglón que nadie se cree.
     */
    readonly notas: number;
    /** Suma de lo aplicado por pagos NO revertidos. */
    readonly pagado: number;
    /** Lo que falta: `total + notas − pagado`, nunca negativo. */
    readonly saldo: number;
}

/**
 * El saldo de un documento.
 *
 * `total + notas − pagado`, con piso en cero: pagar de más no genera un saldo a favor dentro del
 * documento — eso es un anticipo, y vive en el pago sin aplicar.
 */
export function saldoDeDocumento(total: number, notas: number, pagado: number): SaldoDeDocumento {
    const saldo = Math.max(0, redondear(total + notas - pagado));
    return { total: redondear(total), notas: redondear(notas), pagado: redondear(pagado), saldo };
}

/** ¿Está saldado? Con un céntimo de tolerancia: por debajo de eso no queda deuda real. */
export function estaSaldado(saldo: number): boolean {
    return saldo < 0.01;
}

/**
 * Las cubetas de antigüedad.
 *
 * **Se cuentan desde el vencimiento, no desde la emisión.** Una factura a 30 días emitida hace 40
 * lleva 10 de atraso, no 40 — y esa diferencia es justo la que decide si hay que llamar al
 * proveedor.
 */
export const CUBETAS_DE_ANTIGUEDAD = [
    { clave: 'POR_VENCER', etiqueta: 'Por vencer', desde: null, hasta: 0 },
    { clave: 'D1_30', etiqueta: '1 a 30 días', desde: 1, hasta: 30 },
    { clave: 'D31_60', etiqueta: '31 a 60 días', desde: 31, hasta: 60 },
    { clave: 'D61_90', etiqueta: '61 a 90 días', desde: 61, hasta: 90 },
    { clave: 'D90_MAS', etiqueta: 'Más de 90 días', desde: 91, hasta: null },
] as const;

export type ClaveDeCubeta = (typeof CUBETAS_DE_ANTIGUEDAD)[number]['clave'];

/** En qué cubeta cae un documento según sus días de atraso. */
export function cubetaDeAntiguedad(diasDeAtraso: number): ClaveDeCubeta {
    if (diasDeAtraso <= 0) return 'POR_VENCER';
    if (diasDeAtraso <= 30) return 'D1_30';
    if (diasDeAtraso <= 60) return 'D31_60';
    if (diasDeAtraso <= 90) return 'D61_90';
    return 'D90_MAS';
}

/**
 * Días de atraso de un documento a una fecha.
 *
 * `0` si no ha vencido o si es de contado (`dueDate` nulo). Se cuenta por días completos: «vence
 * hoy» todavía no es atraso.
 */
export function diasDeAtraso(dueDate: string | Date | null, hoy: Date = new Date()): number {
    if (!dueDate) return 0;

    const vence = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const dias = Math.floor((soloFecha(hoy) - soloFecha(vence)) / 86_400_000);
    return Math.max(0, dias);
}

/**
 * Cuánto de un pago queda sin aplicar.
 *
 * Es el anticipo: dinero entregado que todavía no tiene documento. Se puede aplicar después, y por
 * eso el reparto es una tabla aparte y no columnas dentro del pago.
 */
export function sinAplicar(importeDelPago: number, aplicado: number): number {
    return Math.max(0, redondear(importeDelPago - aplicado));
}

/** Dos decimales. Los importes de dinero no admiten la aritmética cruda de coma flotante. */
function redondear(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
}

function soloFecha(d: Date): number {
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}
