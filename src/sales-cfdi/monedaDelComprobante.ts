/**
 * @fileoverview D7d · Moneda y tipo de cambio del CFDI de venta.
 * @module Contracts/SalesCfdi
 *
 * Anexo 20, atributos `Moneda` y `TipoCambio`:
 *
 * - `MXN`: el tipo de cambio puede omitirse (o ser 1). Pittaj lo omite.
 * - `XXX` (sin moneda) solo es para los comprobantes de pago y traslado: una venta nunca.
 * - Cualquier otra (`USD`, `EUR`, `COP`, `ARS`…): `TipoCambio` es **obligatorio**, mayor que 0 y
 *   con hasta 6 decimales; el SAT lo compara con el FIX publicado por Banxico (DOF) para el día
 *   de la operación, con un margen. Quien timbra lo captura; el sistema propone el último que usó
 *   para esa moneda.
 *
 * El negocio puede operar en otra moneda (el escritorio la elige en Configuración → General):
 * el ticket guarda su moneda y el comprobante sale en esa misma moneda, con su tipo de cambio.
 */

export const MONEDA_NACIONAL = 'MXN';

export type MonedaDelComprobante =
    | { readonly ok: true; readonly moneda: string; readonly tipoCambio?: number }
    | { readonly ok: false; readonly motivo: string };

/** La moneda y el tipo de cambio con que se timbra, o por qué no se puede. */
export function monedaDelComprobante(moneda: string | null | undefined, tipoCambio?: number | null): MonedaDelComprobante {
    const m = (moneda ?? MONEDA_NACIONAL).trim().toUpperCase() || MONEDA_NACIONAL;
    if (!/^[A-Z]{3}$/.test(m)) return { ok: false, motivo: `La moneda «${m}» no es una clave del catálogo c_Moneda.` };
    if (m === 'XXX') return { ok: false, motivo: 'Una venta no puede timbrarse sin moneda (XXX).' };
    if (m === MONEDA_NACIONAL) return { ok: true, moneda: m };
    if (tipoCambio === null || tipoCambio === undefined || !Number.isFinite(tipoCambio) || tipoCambio <= 0) {
        return { ok: false, motivo: `La venta está en ${m}: captura el tipo de cambio (pesos por 1 ${m}) del día de la operación.` };
    }
    return { ok: true, moneda: m, tipoCambio: Math.round(tipoCambio * 1_000_000) / 1_000_000 };
}

/** `true` si la moneda pide tipo de cambio. */
export const requiereTipoCambio = (moneda: string | null | undefined): boolean =>
    ((moneda ?? MONEDA_NACIONAL).trim().toUpperCase() || MONEDA_NACIONAL) !== MONEDA_NACIONAL;
