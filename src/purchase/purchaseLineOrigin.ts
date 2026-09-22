/**
 * @fileoverview De dónde salió el producto de un renglón de compra: la marca de procedencia.
 * @module Contracts/Purchase/LineOrigin
 *
 * Regla del 2026-09-22 («todo lo automático se deshace»): ningún automatismo sin marca. Cada renglón
 * que nació solo —por memoria del proveedor, por código de barras, por una sugerencia aceptada— dice
 * por qué, quién y cuándo, como un campo del renglón y no como bitácora aparte. Es lo que permite que
 * «Corregir producto» sepa qué memoria reescribir, y lo que le enseña al dueño por qué el renglón
 * dice Huevo Tehuacán cuando el CFDI decía HUEVO BLANCO.
 *
 * Espejo en el escritorio: `Pittaj.Domain.Purchasing.PurchaseLineOrigin`.
 */

/**
 * - `LEARNED`: la memoria del proveedor (RFC + clave del concepto → producto) lo emparejó sola.
 * - `BARCODE`: el `NoIdentificacion` del CFDI es el código de barras de un producto tuyo.
 * - `NAME` / `ALIAS`: coincidencia exacta con tu nombre, o con cómo te lo factura otro proveedor.
 * - `SUGGESTED`: el motor lo sugirió con porcentaje y alguien lo aceptó (uno a uno o en lote).
 * - `CREATED`: el producto se dio de alta desde este mismo CFDI.
 * - `CHARGE`: se tomó como cargo del documento (flete, maniobras), no como producto.
 * - `MANUAL`: lo eligió una persona (en Emparejar o al capturar la compra a mano).
 */
export const PURCHASE_LINE_ORIGINS = [
    'LEARNED',
    'BARCODE',
    'NAME',
    'ALIAS',
    'SUGGESTED',
    'CREATED',
    'CHARGE',
    'MANUAL',
] as const;

export type PurchaseLineOrigin = (typeof PURCHASE_LINE_ORIGINS)[number];

/** Los que hizo el sistema solo o de un clic masivo: los que merecen enseñar su marca en color. */
export const AUTOMATIC_LINE_ORIGINS: readonly PurchaseLineOrigin[] = [
    'LEARNED',
    'BARCODE',
    'NAME',
    'ALIAS',
    'SUGGESTED',
    'CREATED',
    'CHARGE',
];

export function isAutomaticLineOrigin(origin: PurchaseLineOrigin | null | undefined): boolean {
    return origin != null && AUTOMATIC_LINE_ORIGINS.includes(origin);
}
