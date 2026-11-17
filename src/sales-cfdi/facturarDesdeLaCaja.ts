/**
 * @fileoverview C6 de plan-caja-sin-salir · Cuándo una venta del turno ya no se puede facturar por separado.
 * @module Contracts/SalesCfdi
 *
 * Lo usan la nube (que bloquea el timbrado) y las dos cajas (que apagan el botón con la razón a la vista):
 *
 * - **Ya va en una global timbrada.** Facturarla aparte la declararía dos veces. Hay que cancelar o sustituir la
 *   global, que es trabajo de Fiscal, no de la caja.
 * - **Es de otro mes.** La factura de una venta a público en general se hace dentro del mes en que se cobró; pasado
 *   el mes, esa venta corresponde a la global del periodo. El mes se cuenta en la zona del SAT, no en UTC: a las
 *   19:00 del último día en México, UTC ya es el mes siguiente.
 */

import { fechaCivilDe, hoyEn, ZONA_POR_OMISION } from '../shared/fechas.js';

export type MotivoParaNoFacturar = 'en-global-timbrada' | 'de-otro-mes';

export const MOTIVOS_PARA_NO_FACTURAR: Record<MotivoParaNoFacturar, string> = {
    'en-global-timbrada':
        'Esta venta ya va en una factura global timbrada. Para facturarla aparte hay que cancelar o sustituir la global desde Fiscal.',
    'de-otro-mes':
        'La venta es de un mes anterior: ya no se puede facturar por separado. Corresponde a la global de su periodo.',
};

/** `null` si se puede facturar; si no, el motivo. */
export function motivoParaNoFacturar(
    venta: { completedAt: Date | string | null; enGlobalTimbrada: boolean },
    ahora: Date = new Date(),
    zona: string = ZONA_POR_OMISION,
): MotivoParaNoFacturar | null {
    if (venta.enGlobalTimbrada) return 'en-global-timbrada';
    if (venta.completedAt) {
        const mesDeLaVenta = fechaCivilDe(venta.completedAt, zona).slice(0, 7);
        const mesDeHoy = hoyEn(zona, ahora).slice(0, 7);
        if (mesDeLaVenta !== mesDeHoy) return 'de-otro-mes';
    }
    return null;
}
