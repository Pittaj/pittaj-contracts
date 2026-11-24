/**
 * @fileoverview U-T3 · Cambiar la unidad de inventario de un producto, sin perder un centavo.
 *
 * El huevo se llevaba en kilos y ahora se quiere contar en tapas. No se «convierte» la existencia
 * con un factor (el de kilo↔tapa ni siquiera es fijo): se **cuenta** en la unidad nueva. Por cada
 * bodega sale toda la existencia en la unidad vieja a su costo, y entra lo contado en la nueva al
 * **mismo valor** (valor ÷ contado). El kárdex anterior queda como estaba; desde ese momento todo
 * va en la unidad nueva. Espejo: `CambioDeUnidad.cs` (escritorio).
 */

export interface UnidadAlterna {
    readonly name: string;
    readonly factor: number;
    readonly price?: number | null;
    readonly barcode?: string | null;
    readonly sellable?: boolean;
    readonly purchasable?: boolean;
    readonly variable?: boolean;
}

export interface ExistenciaEnBodega {
    readonly warehouseId: string;
    /** En la unidad VIEJA. */
    readonly quantity: number;
    /** Costo promedio por unidad vieja. */
    readonly averageCost: number;
}

export interface EntradaDelCambio {
    /** Nombre con que la unidad vieja queda como alterna («Kilo»). */
    readonly etiquetaVieja: string;
    /** La alterna que pasa a ser la base («Tapa»). */
    readonly nuevaBase: string;
    readonly unidades: readonly UnidadAlterna[];
    /** Precio de venta de la base vieja. */
    readonly precioBase: number;
    readonly baseVendible: boolean;
    readonly baseComprable: boolean;
    readonly existencias: readonly ExistenciaEnBodega[];
    /** Lo contado en la unidad NUEVA, por bodega. Toda bodega con existencia necesita su conteo. */
    readonly contado: Readonly<Record<string, number>>;
}

export interface MovimientoDelCambio {
    readonly warehouseId: string;
    /** Sale en la unidad vieja. */
    readonly salida: number;
    readonly costoSalida: number;
    /** Entra en la unidad nueva, al mismo valor. */
    readonly entrada: number;
    readonly costoEntrada: number;
    /** Valor que se traslada (redondeado a centavos). */
    readonly valor: number;
}

export interface ResultadoDelCambio {
    readonly unidades: UnidadAlterna[];
    readonly precioBase: number;
    readonly baseVendible: boolean;
    readonly baseComprable: boolean;
    readonly movimientos: MovimientoDelCambio[];
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Error con lo que falta, para decirlo tal cual en la pantalla. */
export class CambioDeUnidadInvalido extends Error {}

export function cambiarUnidadDeInventario(e: EntradaDelCambio): ResultadoDelCambio {
    const nueva = e.unidades.find((u) => u.name === e.nuevaBase);
    if (!nueva) throw new CambioDeUnidadInvalido(`«${e.nuevaBase}» no es una unidad de este producto.`);
    if (!e.etiquetaVieja.trim()) throw new CambioDeUnidadInvalido('Ponle nombre a la unidad de ahora: quedará como alterna.');
    if (e.unidades.some((u) => u.name !== e.nuevaBase && u.name.trim().toLowerCase() === e.etiquetaVieja.trim().toLowerCase())) {
        throw new CambioDeUnidadInvalido(`Ya hay una unidad «${e.etiquetaVieja}».`);
    }
    // f = unidades viejas por 1 nueva (1 tapa = 1.8 kg → f = 1.8). Estimado si la alterna es variable.
    const f = nueva.factor;

    const unidades: UnidadAlterna[] = [
        // La base vieja queda como alterna: 1 kilo = 1/f tapas (estimado si era variable).
        {
            name: e.etiquetaVieja.trim(),
            factor: r4(1 / f),
            price: e.precioBase > 0 ? e.precioBase : null,
            barcode: null,
            sellable: e.baseVendible,
            purchasable: e.baseComprable,
            variable: nueva.variable ?? false,
        },
        ...e.unidades
            .filter((u) => u.name !== e.nuevaBase)
            .map((u) => ({ ...u, factor: r4(u.factor / f) })),
    ];

    const movimientos: MovimientoDelCambio[] = [];
    for (const ex of e.existencias) {
        if (!(ex.quantity > 0)) continue;
        const contado = e.contado[ex.warehouseId];
        if (!(contado != null && contado > 0)) {
            throw new CambioDeUnidadInvalido('Cuenta la existencia en la unidad nueva en cada bodega que tiene.');
        }
        const valor = ex.quantity * ex.averageCost;
        movimientos.push({
            warehouseId: ex.warehouseId,
            salida: ex.quantity,
            costoSalida: ex.averageCost,
            entrada: contado,
            costoEntrada: r4(valor / contado),
            valor: r2(valor),
        });
    }

    return {
        unidades,
        precioBase: nueva.price != null && nueva.price > 0 ? nueva.price : r2(e.precioBase * f),
        baseVendible: nueva.sellable !== false,
        baseComprable: nueva.purchasable !== false,
        movimientos,
    };
}
