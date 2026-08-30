/**
 * @fileoverview Aritmética del documento de compra. **Espejo al centavo del escritorio.**
 * @module Purchase/Domain/Services
 *
 * ── Por qué esto es un archivo aparte y con pruebas propias ──
 *
 * Los importes de una compra se calculan en dos sitios: `PurchaseLine.Recalculate()`
 * del escritorio (C#, `decimal`) y aquí (TypeScript, `number`). Si difieren en un
 * centavo, el sync produce **dos verdades sobre el mismo dinero** — y no se nota
 * hasta que alguien cuadra el IVA acreditable del mes.
 *
 * ── La trampa: `decimal.Round` redondea al PAR, no hacia arriba ──
 *
 * `decimal.Round(x, 2)` de .NET usa `MidpointRounding.ToEven` por omisión: 2.345 → 2.34
 * y 2.355 → 2.36. `Math.round` de JavaScript redondea el empate SIEMPRE hacia arriba,
 * así que `Math.round(2.345 * 100) / 100` da 2.35 y discrepa. Por eso aquí no se usa
 * `Math.round`.
 *
 * ── La otra trampa: el empate binario ──
 *
 * `1.005 * 100` en coma flotante no es 100.5, es 100.49999999999999, así que el empate
 * ni siquiera llega a plantearse y el redondeo cae del lado equivocado. `decimal` de C#
 * no tiene ese problema porque es decimal de verdad. Se corrige normalizando a 15
 * dígitos significativos antes de decidir, que es donde vive la basura binaria y no el
 * dato.
 *
 * ⚠️ Esto vale para lo que **nace en la nube o en la web**. Lo que llega por **sync se
 * copia verbatim y NO se recalcula jamás** (`sync-replica-verbatim-antirebote`).
 */

/** Redondea a `decimals` con empate al par, igual que `decimal.Round` de .NET. */
export function roundHalfEven(value: number, decimals = 2): number {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** decimals;
    // toPrecision(15) borra la basura binaria sin tocar el dato: un decimal capturado
    // por una persona nunca tiene 15 dígitos significativos.
    const scaled = Number((value * factor).toPrecision(15));
    const floor = Math.floor(scaled);
    const rest = scaled - floor;

    let rounded: number;
    if (rest > 0.5) rounded = floor + 1;
    else if (rest < 0.5) rounded = floor;
    // Empate: se va al par. `floor % 2` funciona igual con negativos (−3 % 2 = −1).
    else rounded = floor % 2 === 0 ? floor : floor + 1;

    return rounded / factor;
}

/** Los importes derivados de un renglón. */
export interface PurchaseLineAmounts {
    readonly subtotalAmount: number;
    readonly discountAmount: number;
    /** Base gravable: subtotal − descuento. */
    readonly taxBaseAmount: number;
    readonly taxAmount: number;
    readonly totalAmount: number;
}

/**
 * Calcula los importes de un renglón. Espejo línea por línea de
 * `PurchaseLine.Recalculate()` (`pittaj-native/src/Pittaj.Domain/Purchasing/PurchaseLine.cs`).
 *
 * @param quantity - cantidad en la unidad de COMPRA
 * @param unitCost - costo de esa unidad de compra
 * @param discountPercent - descuento 0-100
 * @param taxPercent - impuesto como FRACCIÓN 0-1 (0.16 = 16 %)
 */
export function calculateLineAmounts(
    quantity: number,
    unitCost: number,
    discountPercent: number,
    taxPercent: number
): PurchaseLineAmounts {
    const subtotalAmount = roundHalfEven(quantity * unitCost, 2);
    const discountAmount = roundHalfEven((subtotalAmount * discountPercent) / 100, 2);
    const taxBaseAmount = roundHalfEven(subtotalAmount - discountAmount, 2);
    const taxAmount = roundHalfEven(taxBaseAmount * taxPercent, 2);
    const totalAmount = roundHalfEven(taxBaseAmount + taxAmount, 2);

    return { subtotalAmount, discountAmount, taxBaseAmount, taxAmount, totalAmount };
}

/** Los importes derivados del documento. */
export interface PurchaseTotals {
    readonly subtotalAmount: number;
    readonly discountAmount: number;
    readonly taxAmount: number;
    readonly totalAmount: number;
}

/**
 * Suma los renglones al pie del documento, espejo de `Purchase.RecalculateTotals()`.
 *
 * El redondeo final es inocuo —los sumandos ya traen dos decimales— pero necesario:
 * sumar `0.1 + 0.2` en coma flotante da `0.30000000000000004`, y eso acaba en la base
 * como un `numeric` con dígitos que nadie escribió.
 */
export function calculateTotals(lines: ReadonlyArray<PurchaseLineAmounts>): PurchaseTotals {
    const sum = (pick: (l: PurchaseLineAmounts) => number): number =>
        roundHalfEven(
            lines.reduce((acc, l) => acc + pick(l), 0),
            2
        );

    return {
        subtotalAmount: sum((l) => l.subtotalAmount),
        discountAmount: sum((l) => l.discountAmount),
        taxAmount: sum((l) => l.taxAmount),
        totalAmount: sum((l) => l.totalAmount),
    };
}
