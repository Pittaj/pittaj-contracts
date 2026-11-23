/**
 * @fileoverview U-T4 · «Peso real por proveedor»: lo que de verdad trae cada proveedor por unidad.
 *
 * Con una unidad variable cada recepción mide la equivalencia (540 kg facturados → 300 tapas). Juntas
 * por proveedor dicen quién te da más tapas por kilo —y por lo tanto más barato por tapa—, que es la
 * comparación que el precio por kilo de la factura esconde. Espejo: `PesoRealPorProveedor.cs`.
 */

export interface MedicionDeRecepcion {
    readonly supplierId: string;
    readonly supplierName: string;
    readonly fecha: string;
    /** Facturado, en la unidad de compra (kilos). */
    readonly cantidad: number;
    /** Contado, en la unidad de inventario (tapas). */
    readonly contada: number;
    /** Importe neto de lo recibido (sin impuestos). */
    readonly importe: number;
}

export interface PesoRealDeProveedor {
    readonly supplierId: string;
    readonly supplierName: string;
    readonly entregas: number;
    readonly facturado: number;
    readonly contado: number;
    /** Unidades de inventario por unidad de compra, ponderado (contado ÷ facturado). */
    readonly factor: number;
    /** Lo inverso, que es como se dice: «kilos por tapa». */
    readonly inverso: number;
    readonly minimo: number;
    readonly maximo: number;
    readonly ultimo: number;
    readonly ultimaFecha: string;
    /** Costo real por unidad de inventario: importe ÷ contado. */
    readonly costoPorUnidad: number;
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

export function pesoRealPorProveedor(mediciones: readonly MedicionDeRecepcion[]): PesoRealDeProveedor[] {
    const grupos = new Map<string, MedicionDeRecepcion[]>();
    for (const m of mediciones) {
        if (!(m.cantidad > 0) || !(m.contada > 0)) continue;
        const g = grupos.get(m.supplierId) ?? [];
        g.push(m);
        grupos.set(m.supplierId, g);
    }
    const r: PesoRealDeProveedor[] = [];
    for (const [supplierId, g] of grupos) {
        const ordenadas = [...g].sort((a, b) => a.fecha.localeCompare(b.fecha));
        const facturado = g.reduce((s, m) => s + m.cantidad, 0);
        const contado = g.reduce((s, m) => s + m.contada, 0);
        const importe = g.reduce((s, m) => s + m.importe, 0);
        const factores = g.map((m) => m.contada / m.cantidad);
        const ultima = ordenadas[ordenadas.length - 1]!;
        r.push({
            supplierId,
            supplierName: ultima.supplierName,
            entregas: g.length,
            facturado: r4(facturado),
            contado: r4(contado),
            factor: r4(contado / facturado),
            inverso: r4(facturado / contado),
            minimo: r4(Math.min(...factores)),
            maximo: r4(Math.max(...factores)),
            ultimo: r4(ultima.contada / ultima.cantidad),
            ultimaFecha: ultima.fecha,
            costoPorUnidad: r4(importe / contado),
        });
    }
    // El que da más por lo mismo, primero.
    return r.sort((a, b) => a.costoPorUnidad - b.costoPorUnidad);
}
