/**
 * @fileoverview Qué acciones de la Caja piden autorización de supervisor, y con qué permiso.
 * @module Contracts/Checkout
 *
 * Es la MISMA tabla que `CheckActionAuthorizationHandler` (escritorio, `Pittaj.Application/
 * Authorization`). Hasta el 2026-09-20 la web tenía dos `if` propios —precio manual o cualquier
 * descuento → `checkout.supervisor`; cancelar → `checkout.cancel`— y para retiro, devolución, corte
 * y cierre no preguntaba nada: o tenías el permiso o te comías el 403. Un cajero pedía el PIN al
 * encargado en el mostrador y no podía pedirlo en el navegador, y un 5 % de descuento que en el
 * escritorio pasa solo, en la web pedía supervisor.
 *
 * La regla es una por acción. El descuento es la única con umbral: hasta el porcentaje configurado
 * (`checkout.discount-threshold-percent`, 10 % si no está) es operación normal con
 * `checkout.discount.apply`; por encima pide `checkout.discount-total.apply`. Quien tenga el
 * permiso pasa directo; quien no, con la autorización de alguien que lo tenga — en el escritorio
 * un PIN, en la web sus credenciales.
 *
 * ⚠️ Si cambias una fila, cambia la del escritorio en el mismo cambio. `ActionAuthorizationTests`
 * (escritorio) y `autorizacion.test.ts` (web) fijan las dos copias con los mismos casos.
 */

/** Acciones sensibles de la Caja. Mismos nombres que `PosAction` en el escritorio. */
export const ACCIONES_DE_CAJA = [
    'descuento',
    'precio-manual',
    'cancelar-venta',
    'devolucion',
    'retiro-efectivo',
    'corte-parcial',
    'cierre-caja',
    'credito-sobre-limite',
] as const;

export type AccionDeCaja = (typeof ACCIONES_DE_CAJA)[number];

/** Clave de configuración (tenant-settings, sincroniza con el escritorio) del umbral de descuento. */
export const CLAVE_UMBRAL_DE_DESCUENTO = 'checkout.discount-threshold-percent';

/** Umbral cuando la clave no está, no es número o está fuera de 0–100. */
export const UMBRAL_DE_DESCUENTO_POR_OMISION = 10;

/** El permiso que autoriza CUALQUIER acción sensible de otro cajero. */
export const PERMISO_SUPERVISOR = 'checkout.supervisor';

export interface ReglaDeAutorizacion {
    /** Permiso que hace la acción normal para quien lo tiene. */
    readonly permiso: string;
    /** Cómo se llama la acción en el diálogo («Precio manual», «Descuento del 15%»). */
    readonly etiqueta: string;
    /** Por qué se pide, en español llano. */
    readonly motivo: string;
}

/**
 * Convierte lo guardado en la configuración al umbral que manda, con la misma tolerancia que el
 * escritorio: vacío, no numérico o fuera de 0–100 → el valor por omisión.
 */
export function umbralDeDescuento(guardado: string | null | undefined): number {
    if (guardado === null || guardado === undefined) return UMBRAL_DE_DESCUENTO_POR_OMISION;
    const limpio = guardado.trim();
    if (limpio === '') return UMBRAL_DE_DESCUENTO_POR_OMISION;
    const pct = Number(limpio);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return UMBRAL_DE_DESCUENTO_POR_OMISION;
    return pct;
}

function porcentaje(valor: number): string {
    return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * La regla de una acción: qué permiso la hace normal, y cómo se explica si falta.
 *
 * @param descuentoPct Solo para `descuento`: el porcentaje que se quiere aplicar.
 * @param umbralPct Solo para `descuento`: hasta dónde se puede dar sin autorización.
 */
export function reglaDeAutorizacion(
    accion: AccionDeCaja,
    { descuentoPct = 0, umbralPct = UMBRAL_DE_DESCUENTO_POR_OMISION }: { descuentoPct?: number; umbralPct?: number } = {},
): ReglaDeAutorizacion {
    switch (accion) {
        case 'precio-manual':
            return { permiso: 'checkout.manual-price.apply', etiqueta: 'Precio manual', motivo: 'Cambiar el precio de un producto necesita autorización.' };
        case 'cancelar-venta':
            return { permiso: 'checkout.cancel', etiqueta: 'Cancelar la venta', motivo: 'Cancelar una venta necesita autorización.' };
        case 'devolucion':
            return { permiso: 'checkout.returns.view', etiqueta: 'Devolución', motivo: 'Procesar una devolución necesita autorización.' };
        case 'retiro-efectivo':
            return { permiso: 'checkout.withdrawal', etiqueta: 'Retiro de efectivo', motivo: 'Sacar efectivo de la caja necesita autorización.' };
        case 'corte-parcial':
            return { permiso: 'checkout.partial-cut.view', etiqueta: 'Corte parcial (X)', motivo: 'El corte parcial necesita autorización.' };
        case 'cierre-caja':
            return { permiso: 'checkout.cash-closures.view', etiqueta: 'Cierre de caja (Z)', motivo: 'Cerrar la caja necesita autorización.' };
        case 'credito-sobre-limite':
            return { permiso: 'checkout.credit-beyond-limit.apply', etiqueta: 'Fiar por encima del límite', motivo: 'El cliente se pasa de su línea de crédito con esta venta.' };
        case 'descuento': {
            const etiqueta = `Descuento del ${porcentaje(descuentoPct)}%`;
            return descuentoPct > umbralPct
                ? { permiso: 'checkout.discount-total.apply', etiqueta, motivo: `El descuento pasa del ${porcentaje(umbralPct)}% que se puede dar sin autorización.` }
                : { permiso: 'checkout.discount.apply', etiqueta, motivo: 'Este cajero no tiene permiso para aplicar descuentos.' };
        }
    }
}

export interface VeredictoDeAutorizacion extends ReglaDeAutorizacion {
    /** True = hay que pedir autorización antes de ejecutar. */
    readonly requiereAutorizacion: boolean;
}

/**
 * ¿Esta persona puede hacer la acción sola? `tiene` es el predicado de permisos del que pregunta
 * (el comodín `*` cuenta como tenerlo todo).
 */
export function veredictoDeAutorizacion(
    tiene: (permiso: string) => boolean,
    accion: AccionDeCaja,
    opciones?: { descuentoPct?: number; umbralPct?: number },
): VeredictoDeAutorizacion {
    const regla = reglaDeAutorizacion(accion, opciones);
    const requiereAutorizacion = !(tiene('*') || tiene(regla.permiso));
    return { ...regla, requiereAutorizacion };
}
