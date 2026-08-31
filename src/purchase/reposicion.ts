/**
 * @fileoverview Qué reponer, cuánto y por qué. Una sola cuenta para las dos plataformas.
 * @module Contracts/Purchase/Reposicion
 *
 * ── Por qué esto vive en contracts ──
 *
 * Espejo literal de `Pittaj.Domain.Purchasing.Reposicion` del escritorio, como `purchaseState` y
 * `cfdiComparison`. **Un número sugerido que cambia según dónde lo mires no se usa**: el dueño lo
 * pisa con el suyo y la función se vuelve decorativa.
 *
 * ── Y por qué la cuenta se puede explicar ──
 *
 * Porque un número que no se puede explicar tampoco se usa. `explicar()` devuelve la misma frase
 * que la pantalla enseña al pasar por encima del renglón: de dónde salen los 36 y no los 40.
 */

/** Lo que hace falta saber de un producto para decidir si hay que pedirlo. */
export interface ProductoAReponer {
    /** Existencia actual en la bodega que se está mirando. */
    readonly existencia: number;
    /** Mínimo definido en la ficha. `0` = no se vigila. */
    readonly minimo: number;
    /** Punto de reorden. `0` = no definido; entonces manda el mínimo. */
    readonly puntoDeReorden: number;
    /** Lo que se vende en una semana, promediado sobre las últimas. */
    readonly ventaSemanal: number;
    /** Cuántos días tarda el proveedor habitual. */
    readonly diasDeEntrega: number;
    /**
     * Cuántas piezas trae la unidad de compra (la caja).
     *
     * `1` cuando se compra por pieza. Nadie compra 44 piezas de aceite: se compran cajas, y
     * sugerir un número que el proveedor no vende obliga a corregirlo a mano cada vez.
     */
    readonly piezasPorCaja: number;
}

/** Cuántas semanas de venta se busca cubrir con cada pedido. */
export const SEMANAS_DE_COBERTURA = 2;

/**
 * Margen sobre el tiempo de entrega antes de que la urgencia baje de tono.
 *
 * Con existencia justo para lo que tarda el proveedor ya se va tarde; con el doble, hay holgura
 * para que alguien lo mire mañana.
 */
export const MARGEN_DE_HOLGURA = 2;

export type UrgenciaDeReposicion = 'CRITICO' | 'JUSTO' | 'HOLGADO';

/**
 * Para cuántos días alcanza la existencia.
 *
 * **Es la columna que decide**, y no está en ningún ERP de este tamaño: «te quedan 2 días y el
 * proveedor tarda 2» se entiende sin saber qué es un punto de reorden. Ordena la lista mejor que el
 * porcentaje sobre el mínimo, que trata igual a lo que vuela y a lo que no se mueve.
 *
 * `null` cuando no se vende nada: sin salidas no hay días que contar, y un infinito en una columna
 * numérica se lee como un error.
 */
export function diasQueAlcanza(p: ProductoAReponer): number | null {
    if (p.ventaSemanal <= 0) return null;
    return Math.floor(p.existencia / (p.ventaSemanal / 7));
}

/**
 * ¿Hay que pedirlo?
 *
 * Se mira contra el punto de reorden si está definido, y contra el mínimo si no. Un producto sin
 * mínimo ni reorden **queda fuera**: si entrara, todo el catálogo sin existencia aparecería bajo
 * mínimo y la alerta dejaría de decir nada. Es el mismo criterio que ya usa el Inicio de Inventario.
 */
export function hayQuePedir(p: ProductoAReponer): boolean {
    const umbral = p.puntoDeReorden > 0 ? p.puntoDeReorden : p.minimo;
    if (umbral <= 0) return false;
    return p.existencia <= umbral;
}

/** Con qué tono se enseña. */
export function urgencia(p: ProductoAReponer): UrgenciaDeReposicion {
    const dias = diasQueAlcanza(p);
    // Sin venta no hay urgencia por tiempo: está bajo mínimo, pero nada lo está vaciando.
    if (dias === null) return 'JUSTO';
    if (dias <= p.diasDeEntrega) return 'CRITICO';
    if (dias <= p.diasDeEntrega + MARGEN_DE_HOLGURA) return 'JUSTO';
    return 'HOLGADO';
}

/**
 * Cuánto pedir.
 *
 * Cubrir dos semanas de venta más el mínimo, menos lo que ya hay — y **redondeado a la baja** a la
 * unidad de compra. Baja y no alta a propósito: sobrar es dinero parado y faltar se arregla con
 * otro pedido.
 *
 * ⚠️ La única excepción al redondeo a la baja: cuando hace falta algo y la caja es más grande que
 * lo que falta, se pide **una caja**. Sugerir cero sobre un producto que está bajo mínimo sería
 * decirle a la pantalla que no haga su trabajo justo en el caso urgente.
 */
export function cantidadSugerida(p: ProductoAReponer): number {
    const objetivo = Math.ceil(p.ventaSemanal * SEMANAS_DE_COBERTURA) + p.minimo;
    const falta = objetivo - p.existencia;
    if (falta <= 0) return 0;

    const caja = p.piezasPorCaja > 0 ? p.piezasPorCaja : 1;
    const cajas = Math.floor(falta / caja);
    return cajas > 0 ? cajas * caja : caja;
}

/**
 * La cuenta, en palabras.
 *
 * Es lo que la pantalla enseña al pasar por encima del renglón. Sin esto el número no se usa: el
 * dueño lo pisa con el suyo y la columna se vuelve decorativa.
 */
export function explicar(p: ProductoAReponer, nombreProveedor?: string): string {
    const dias = diasQueAlcanza(p);
    const cobertura = Math.ceil(p.ventaSemanal * SEMANAS_DE_COBERTURA);
    const bruto = cobertura + p.minimo - p.existencia;
    const sugerido = cantidadSugerida(p);
    const caja = p.piezasPorCaja > 0 ? p.piezasPorCaja : 1;

    const quien = nombreProveedor ? `${nombreProveedor} tarda` : 'El proveedor tarda';

    const alcance =
        dias === null
            ? `No se ha vendido en las últimas semanas, así que no hay ritmo con el que calcular. `
            : `Con ${p.existencia} y ${p.ventaSemanal} a la semana, te alcanza para ${dias} ` +
              `día${dias === 1 ? '' : 's'} — ${quien} ${p.diasDeEntrega}. `;

    const cuenta =
        `Se sugiere cubrir ${SEMANAS_DE_COBERTURA} semanas de venta (${cobertura}) más el mínimo, ` +
        `menos lo que ya tienes: ${cobertura} + ${p.minimo} − ${p.existencia} = ${bruto}`;

    const redondeo =
        caja === 1
            ? '.'
            : bruto === sugerido
              ? `, que ya es múltiplo de la caja de ${caja}.`
              : `, redondeado a la caja de ${caja} → ${sugerido}. El redondeo baja, no sube: ` +
                'sobrar es dinero parado y faltar se arregla con otro pedido.';

    return alcance + cuenta + redondeo;
}

/**
 * Mínimo y máximo propuestos desde lo que ya se vendió.
 *
 * **Un mínimo sin definir es una alerta que nunca va a sonar**, y pedirle a alguien que teclee 340
 * mínimos a mano es pedirle que no use la función. Esto convierte una tarde de trabajo en una
 * revisión de diez minutos.
 *
 * El mínimo cubre el tiempo de entrega del proveedor; el máximo, ese tiempo más las semanas de
 * cobertura. Los dos redondean **hacia arriba**: aquí quedarse corto es quedarse sin vender.
 */
export function minimosSugeridos(
    ventaSemanal: number,
    diasDeEntrega: number
): { readonly minimo: number; readonly maximo: number } {
    const ventaDiaria = ventaSemanal / 7;
    // Un día de colchón sobre el tiempo de entrega: el pedido se hace por la mañana y llega por la
    // tarde del último día, no al amanecer.
    const minimo = Math.ceil(ventaDiaria * (diasDeEntrega + 1));
    const maximo = Math.ceil(minimo + ventaSemanal * SEMANAS_DE_COBERTURA);
    return { minimo, maximo };
}
