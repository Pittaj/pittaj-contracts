/**
 * @fileoverview D6 · El activo fijo nace en Compras.
 * @module Contracts/Purchase
 *
 * Una compra marcada como activo fijo dice **qué tipo** de activo es y **cuándo empieza a usarse**;
 * con eso Contabilidad propone la ficha. El MOI propuesto es lo que costó sin IVA: la base de los
 * renglones (que ya trae el IEPS que no se acredita) más los impuestos locales trasladados (LISR
 * art. 31: el MOI incluye los impuestos pagados que no se acreditan). El flete o la instalación
 * que llegan en otra factura se suman después («Sumar al activo»).
 *
 * El aviso «¿es un activo?» es una **sugerencia**, no una regla de la ley: la ley no fija un monto
 * a partir del cual algo es activo; lo que la fija es que se use en el negocio por más de un
 * ejercicio. Pittaj pregunta cuando un gasto parece equipo y pasa del umbral; no reclasifica solo.
 */

/** MOI propuesto: base sin IVA (con el IEPS que es costo) + impuestos locales trasladados. */
export function moiPropuesto(c: {
    readonly subtotalAmount: number;
    readonly discountAmount: number;
    readonly trasladoLocal?: number | null;
}): number {
    return Math.round((c.subtotalAmount - c.discountAmount + (c.trasladoLocal ?? 0)) * 100) / 100;
}

/** Umbral del aviso. Criterio de Pittaj, no de la ley: por debajo casi nunca vale la pena preguntar. */
export const UMBRAL_DEL_AVISO_DE_ACTIVO = 5000;

const PALABRAS_DE_EQUIPO = [
    'refrigerador', 'congelador', 'enfriador', 'vitrina', 'refrigeradora',
    'computadora', 'laptop', 'portatil', 'portátil', 'impresora', 'servidor', 'monitor',
    'horno', 'estufa', 'batidora', 'amasadora', 'rebanadora', 'molino', 'licuadora industrial',
    'bascula', 'báscula', 'caja registradora', 'terminal punto de venta',
    'aire acondicionado', 'minisplit', 'mini split',
    'camioneta', 'automovil', 'automóvil', 'vehiculo', 'vehículo', 'motocicleta',
    'anaquel', 'estante', 'mostrador', 'rack', 'mueble',
    'maquina', 'máquina', 'montacargas', 'planta de luz', 'generador',
];

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * ¿Este gasto parece un activo fijo? Un renglón de más del umbral cuya descripción nombra equipo.
 * Devuelve la palabra que lo delató, o null.
 */
export function pareceActivoFijo(c: { readonly descripcion: string; readonly base: number }): string | null {
    if (!(c.base >= UMBRAL_DEL_AVISO_DE_ACTIVO)) return null;
    const d = sinAcentos(c.descripcion ?? '');
    for (const p of PALABRAS_DE_EQUIPO) if (d.includes(sinAcentos(p))) return p;
    return null;
}
