/**
 * @fileoverview Comparación **recibido ↔ facturado**, renglón a renglón.
 * **Espejo exacto del escritorio** (`Pittaj.Domain/Purchasing/CfdiComparison.cs`).
 * @module Contracts/Purchase
 *
 * Es el *three-way match* de los ERP grandes sin su ceremonia: lo que entró contra lo que te
 * facturaron, y **se marca solo lo que difiere**. Las dos salidas son las dos que existen en la
 * vida real — tragarse la diferencia, o pedirle al proveedor su nota de crédito.
 *
 * ── Por qué vive aquí ──
 *
 * Las dos puntas enseñan la misma tabla y ofrecen las mismas dos salidas. Si cada una calculara la
 * diferencia por su cuenta, la misma factura sería aceptable en una pantalla y reclamable en la
 * otra, y nadie lo notaría hasta que el proveedor discutiera el importe.
 *
 * ── Qué se compara contra qué ──
 *
 * La referencia es lo **recibido**, no lo pedido: una factura ampara lo que el proveedor entregó.
 * Un renglón pedido y nunca recibido no es una diferencia con la factura — es mercancía que no ha
 * llegado, y eso lo cuenta el otro eje.
 */

import { roundHalfEven } from './purchaseMath.js';

/** Medio centavo: por debajo de eso, dos costos son el mismo costo. */
const EPS_COSTO = 0.005;

/**
 * Un peso: la tolerancia del documento entero, la misma que usa la conciliación
 * (`ReconcileCfdiHandler`) y el `totalNoCuadra` del buzón.
 */
export const EPS_DOCUMENTO = 1;

/** Lo que hace falta de un renglón de la compra: lo que se recibió y a qué costo se pactó. */
export interface ComparableLinea {
    readonly productId: string | null;
    readonly productName: string;
    /** Recibido acumulado, en unidad de compra. */
    readonly qtyReceived: number;
    /** Costo pactado por unidad de compra (el del documento). */
    readonly unitCost: number;
}

/** Lo que hace falta de un concepto del CFDI: lo que te facturaron y a qué precio. */
export interface ComparableConcepto {
    /** Producto con el que emparejó el concepto (null = no emparejó con ninguno). */
    readonly productId: string | null;
    readonly descripcion: string;
    readonly cantidad: number;
    readonly valorUnitario: number;
}

/** Un renglón de la comparación. `differs` es lo que la pantalla pinta en rojo. */
export interface ComparacionLinea {
    readonly productId: string | null;
    readonly productName: string;
    readonly qtyReceived: number;
    readonly qtyInvoiced: number;
    /** Costo pactado (el de la compra). 0 si el concepto no corresponde a nada recibido. */
    readonly unitCostAgreed: number;
    /** Costo facturado (el del CFDI). 0 si se recibió y no se facturó. */
    readonly unitCostInvoiced: number;
    /**
     * Lo facturado de más, en importe. **Positivo = en tu contra**; negativo = a tu favor.
     * Es `facturado − recibido` valorado a su propio costo, que es como lo discute el proveedor.
     */
    readonly differenceAmount: number;
    /** ¿Difiere en cantidad o en costo? Solo esto se marca. */
    readonly differs: boolean;
}

/** El resultado completo, con el pie de cuadre. */
export interface ComparacionRecibidoFacturado {
    readonly lines: readonly ComparacionLinea[];
    /** Valor de lo recibido, a costo pactado. */
    readonly receivedValue: number;
    /** Total facturado de los conceptos comparados. */
    readonly invoicedValue: number;
    /** `facturado − recibido`. Positivo = en tu contra. */
    readonly difference: number;
    /** Dentro de la tolerancia del documento (un peso). */
    readonly cuadra: boolean;
    /** Cuántos renglones difieren. Es lo que decide si la pantalla enseña la tabla. */
    readonly differingCount: number;
}

/**
 * Compara lo recibido contra lo facturado, renglón a renglón.
 *
 * **Cómo se aparean:** por `productId`. Un concepto que no emparejó con ningún producto, o que
 * empareja con uno que no está en la compra, sale como **facturado y no recibido** (`qtyReceived`
 * 0); un renglón recibido que ningún concepto ampara sale como **recibido y no facturado**. Las dos
 * son diferencias reales y las dos hay que verlas — la primera es lo que se reclama, la segunda es
 * lo que falta por facturar.
 *
 * Los importes van sin impuesto: se compara la mercancía, no el IVA, que es una consecuencia.
 */
export function compararRecibidoFacturado(
    lineas: readonly ComparableLinea[],
    conceptos: readonly ComparableConcepto[]
): ComparacionRecibidoFacturado {
    // Los conceptos se agrupan por producto: una factura puede traer el mismo artículo en dos
    // renglones (dos lotes, dos precios), y compararlos por separado contra un solo renglón de la
    // compra daría dos diferencias falsas.
    const facturadoPorProducto = new Map<string, { cantidad: number; importe: number; descripcion: string }>();
    const sinEmparejar: ComparableConcepto[] = [];

    for (const concepto of conceptos) {
        if (!concepto.productId) {
            sinEmparejar.push(concepto);
            continue;
        }
        const previo = facturadoPorProducto.get(concepto.productId);
        const importe = concepto.cantidad * concepto.valorUnitario;
        if (previo) {
            previo.cantidad += concepto.cantidad;
            previo.importe += importe;
        } else {
            facturadoPorProducto.set(concepto.productId, {
                cantidad: concepto.cantidad,
                importe,
                descripcion: concepto.descripcion,
            });
        }
    }

    const lines: ComparacionLinea[] = [];
    const vistos = new Set<string>();

    for (const linea of lineas) {
        const facturado = linea.productId ? facturadoPorProducto.get(linea.productId) : undefined;
        if (linea.productId && facturado) vistos.add(linea.productId);

        const qtyInvoiced = facturado?.cantidad ?? 0;
        // El costo facturado se deriva del importe agrupado: con dos renglones del mismo producto
        // a precios distintos, el que importa es el promedio de lo que te cobraron.
        const unitCostInvoiced =
            facturado && facturado.cantidad > 0 ? facturado.importe / facturado.cantidad : 0;

        lines.push(
            construirLinea(
                linea.productId,
                linea.productName,
                linea.qtyReceived,
                qtyInvoiced,
                linea.unitCost,
                unitCostInvoiced
            )
        );
    }

    // Lo facturado que no corresponde a ningún renglón recibido.
    for (const [productId, facturado] of facturadoPorProducto) {
        if (vistos.has(productId)) continue;
        lines.push(
            construirLinea(
                productId,
                facturado.descripcion,
                0,
                facturado.cantidad,
                0,
                facturado.cantidad > 0 ? facturado.importe / facturado.cantidad : 0
            )
        );
    }
    for (const concepto of sinEmparejar) {
        lines.push(
            construirLinea(null, concepto.descripcion, 0, concepto.cantidad, 0, concepto.valorUnitario)
        );
    }

    const receivedValue = roundHalfEven(
        lines.reduce((acc, l) => acc + l.qtyReceived * l.unitCostAgreed, 0)
    );
    const invoicedValue = roundHalfEven(
        lines.reduce((acc, l) => acc + l.qtyInvoiced * l.unitCostInvoiced, 0)
    );
    const difference = roundHalfEven(invoicedValue - receivedValue);

    return {
        lines,
        receivedValue,
        invoicedValue,
        difference,
        cuadra: Math.abs(difference) <= EPS_DOCUMENTO,
        differingCount: lines.filter((l) => l.differs).length,
    };
}

function construirLinea(
    productId: string | null,
    productName: string,
    qtyReceived: number,
    qtyInvoiced: number,
    unitCostAgreed: number,
    unitCostInvoiced: number
): ComparacionLinea {
    const difiereCantidad = qtyInvoiced !== qtyReceived;
    // El costo solo se compara cuando hay las dos puntas: contra un cero no hay nada que comparar,
    // y marcarlo pintaría de rojo un renglón cuya diferencia real ya es la cantidad.
    const difiereCosto =
        qtyReceived > 0 &&
        qtyInvoiced > 0 &&
        Math.abs(unitCostInvoiced - unitCostAgreed) > EPS_COSTO;

    // Lo facturado de más se valora al costo facturado; el resto del renglón, al pactado. Es como
    // lo plantea el proveedor cuando se le reclama: «me cobraste 12 piezas de más a tu precio».
    const differenceAmount = roundHalfEven(
        qtyInvoiced * unitCostInvoiced - qtyReceived * unitCostAgreed
    );

    return {
        productId,
        productName,
        qtyReceived,
        qtyInvoiced,
        unitCostAgreed,
        unitCostInvoiced,
        differenceAmount,
        differs: difiereCantidad || difiereCosto,
    };
}
