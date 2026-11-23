/**
 * @fileoverview U-T4 · El precio desde el costo real: margen por unidad, regla «costo + %» y precio
 * propuesto. Espejo: `PrecioDesdeCosto.cs` (escritorio), mismos casos.
 *
 * El costo de cada unidad sale del costo real de la base (lo que de verdad costó la tapa al
 * recibir, U-T3) por su factor. El margen es sobre el PRECIO —(precio − costo) ÷ precio—, que es
 * como lo lee el comerciante: de cada $100 que cobra, cuánto le queda. La regla «costo + %» es el
 * recargo sobre el costo, que es como lo dice al poner precio: «le gano el 30 %».
 */

/** Margen sobre el precio, en % con un decimal. Nulo sin precio. */
export function margenSobrePrecio(precio: number, costo: number): number | null {
    if (!(precio > 0)) return null;
    return Math.round(((precio - costo) / precio) * 1000) / 10;
}

/**
 * Costo + %: el precio que deja ese recargo sobre el costo, redondeado HACIA ARRIBA al múltiplo de
 * `redondeo` (0.01 = al centavo; 0.5 = a los 50 centavos). Hacia arriba para no quedar por
 * debajo del recargo pedido. Nulo sin costo o sin recargo.
 */
export function precioPropuesto(costo: number, recargoPorciento: number | null | undefined, redondeo = 0.01): number | null {
    if (!(costo > 0) || recargoPorciento == null || recargoPorciento < 0) return null;
    const exacto = costo * (1 + recargoPorciento / 100);
    const paso = redondeo > 0 ? redondeo : 0.01;
    // El épsilon evita que 54.000000001 suba un escalón entero por ruido de punto flotante.
    return Math.round(Math.ceil(exacto / paso - 1e-9) * paso * 100) / 100;
}

export interface UnidadConPrecio {
    readonly name: string;
    readonly factor: number;
    readonly price?: number | null;
    readonly sellable?: boolean;
}

export interface MargenDeUnidad {
    /** Nulo = la base. */
    readonly nombre: string | null;
    readonly etiqueta: string;
    readonly factor: number;
    /** Precio vigente: el propio, o el de la base × factor. */
    readonly precio: number;
    /** El precio es el de la base × factor (no tiene precio propio). */
    readonly proporcional: boolean;
    /** Costo real de esta unidad: costo base × factor. */
    readonly costo: number;
    readonly margen: number | null;
    /** Con la regla «costo + %»: lo que debería costar. Nulo sin regla. */
    readonly propuesto: number | null;
}

/** El margen de cada unidad que se vende, y su precio propuesto con la regla. */
export function margenesPorUnidad(
    p: {
        readonly precioBase: number;
        readonly costoBase: number;
        readonly etiquetaBase: string;
        readonly baseUnitSellable?: boolean;
        readonly units?: readonly UnidadConPrecio[] | null;
    },
    recargoPorciento?: number | null,
    redondeo = 0.01
): MargenDeUnidad[] {
    const r: MargenDeUnidad[] = [];
    const fila = (nombre: string | null, etiqueta: string, factor: number, propio: number | null | undefined): MargenDeUnidad => {
        const proporcional = !(propio != null && propio > 0);
        const precio = proporcional ? Math.round(p.precioBase * factor * 100) / 100 : propio!;
        const costo = Math.round(p.costoBase * factor * 10000) / 10000;
        return { nombre, etiqueta, factor, precio, proporcional, costo, margen: margenSobrePrecio(precio, costo), propuesto: precioPropuesto(costo, recargoPorciento, redondeo) };
    };
    if (p.baseUnitSellable !== false) r.push(fila(null, p.etiquetaBase, 1, p.precioBase));
    for (const u of p.units ?? []) if (u.sellable !== false) r.push(fila(u.name, u.name, u.factor, u.price));
    return r;
}

/** Costo real de la base: el promedio de la existencia si hay, si no el último costo de la ficha. */
export function costoRealDeLaBase(existencias: readonly { onHand: number; averageCost: number }[], costoDeLaFicha: number): number {
    const con = existencias.filter((e) => e.onHand > 0);
    const cantidad = con.reduce((s, e) => s + e.onHand, 0);
    if (cantidad <= 0) return costoDeLaFicha;
    return Math.round((con.reduce((s, e) => s + e.onHand * e.averageCost, 0) / cantidad) * 10000) / 10000;
}
