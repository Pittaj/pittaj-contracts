/**
 * Cifras de UNA categoría para la franja de su ficha (2026-11-22). Mismo cálculo que el escritorio
 * (`GetCategoryStatsHandler`): productos de la categoría (todos y activos) y su existencia
 * valuada a costo promedio, contando solo renglones con existencia distinta de cero. Las tres
 * cifras de existencia son `null` cuando nada de la categoría tiene existencia.
 */
export interface CategoryStatsResponse {
    readonly productCount: number;
    readonly activeProductCount: number;
    readonly productsWithStock: number | null;
    readonly onHand: number | null;
    readonly stockValue: number | null;
}
