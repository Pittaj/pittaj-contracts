/**
 * U-T1 · Qué unidades de un producto se ofrecen al vender y al comprar.
 *
 * Cada producto tiene una unidad base (la de inventario, implícita, factor 1) y unidades alternas
 * con su factor. Cada una —la base incluida— dice si se vende y si se compra: el huevo se compra
 * por kilo (base) y se vende por tapa y por caja, así que el kilo no debe salir en la caja.
 *
 * Espejo en el escritorio: `ProductDto.UnidadesDeVenta` / `UnidadesDeCompra` (mismos casos en
 * `UnidadesQueSeCompranYSeVendenTests.cs`).
 */
import type { ProductUnitPrimitives } from './primitives/index.js';

/** Una unidad que se puede elegir. `nombre` nulo = la base (así viaja en el renglón: `unitName` nulo). */
export interface OpcionDeUnidad {
    readonly nombre: string | null;
    readonly etiqueta: string;
    readonly factor: number;
    /** Precio propio de la presentación; nulo = el de la base × factor (o el de la lista de precios). */
    readonly precio: number | null;
}

export interface ProductoConUnidades {
    readonly baseUnitSellable?: boolean;
    readonly baseUnitPurchasable?: boolean;
    readonly units?: readonly Pick<ProductUnitPrimitives, 'name' | 'factor' | 'price' | 'sellable' | 'purchasable'>[] | null;
}

function opciones(
    conBase: boolean,
    etiquetaBase: string,
    alternas: ProductoConUnidades['units'],
): OpcionDeUnidad[] {
    const r: OpcionDeUnidad[] = [];
    if (conBase) r.push({ nombre: null, etiqueta: etiquetaBase, factor: 1, precio: null });
    for (const u of alternas ?? []) r.push({ nombre: u.name, etiqueta: u.name, factor: u.factor, precio: u.price ?? null });
    return r;
}

/** Las que ofrece la caja, en orden: la base (si se vende) y las alternas que se venden. */
export function unidadesDeVenta(p: ProductoConUnidades, etiquetaBase: string): OpcionDeUnidad[] {
    return opciones(p.baseUnitSellable !== false, etiquetaBase, (p.units ?? []).filter((u) => u.sellable !== false));
}

/** Las que ofrecen las compras: la base (si se compra) y las alternas que se compran. */
export function unidadesDeCompra(p: ProductoConUnidades, etiquetaBase: string): OpcionDeUnidad[] {
    return opciones(p.baseUnitPurchasable !== false, etiquetaBase, (p.units ?? []).filter((u) => u.purchasable !== false));
}

/** Por qué no se puede guardar esa combinación, o nulo si está bien. Misma regla que `Product.SetUnits`. */
export function faltaUnidad(p: ProductoConUnidades & { canBeSold?: boolean; canBePurchased?: boolean }): string | null {
    if (p.canBeSold !== false && unidadesDeVenta(p, '').length === 0) return 'Marca al menos una unidad que se venda.';
    if (p.canBePurchased !== false && unidadesDeCompra(p, '').length === 0) return 'Marca al menos una unidad que se compre.';
    return null;
}
