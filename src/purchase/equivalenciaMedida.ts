/**
 * @fileoverview U-T3 · Equivalencia variable medida al recibir.
 *
 * El huevo se factura por kilo y se cuenta por tapa; una caja nunca pesa igual. No hay factor que
 * valga: se mide en cada recepción. Del CFDI salen los kilos y el importe exactos; del almacén, las
 * tapas contadas. Costo por tapa = importe ÷ tapas (16,200 ÷ 300 = $54.00), sin redondeos de un
 * factor inventado. Espejo: `EquivalenciaMedida.cs` (escritorio).
 */

/** Lo que entra en la base: lo contado si lo hay, si no `cantidad × factor`. */
export function cantidadBaseRecibida(cantidad: number, factor: number, contada?: number | null): number {
    return contada != null && contada > 0 ? contada : cantidad * (factor > 0 ? factor : 1);
}

/**
 * Costo por unidad base: el importe de lo recibido entre lo que entró en la base. Con la
 * medición es exacto; sin ella es el costo por unidad de compra entre el factor.
 */
export function costoBaseRecibido(costoPorUnidadDeCompra: number, cantidad: number, factor: number, contada?: number | null): number {
    const base = cantidadBaseRecibida(cantidad, factor, contada);
    return base > 0 ? (costoPorUnidadDeCompra * cantidad) / base : 0;
}

/** La equivalencia que resultó en esta entrega: unidades base por 1 de compra (300 / 540 = 0.5556). */
export function factorMedido(cantidad: number, contada: number): number | null {
    return cantidad > 0 && contada > 0 ? Math.round((contada / cantidad) * 10000) / 10000 : null;
}

/** El rango de las últimas mediciones, para decir «últimas 5: 1.76 – 1.86 kg por tapa». */
export function rangoDeMediciones(factores: readonly number[], ultimas = 5): { min: number; max: number; promedio: number; n: number } | null {
    const xs = factores.filter((f) => f > 0).slice(-ultimas);
    if (xs.length === 0) return null;
    const suma = xs.reduce((a, b) => a + b, 0);
    return { min: Math.min(...xs), max: Math.max(...xs), promedio: Math.round((suma / xs.length) * 10000) / 10000, n: xs.length };
}
