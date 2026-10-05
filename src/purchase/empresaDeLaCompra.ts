/**
 * @fileoverview D4 · De qué empresa es una compra, y si su bodega es de su sucursal.
 * @module Contracts/Purchase
 *
 * Hasta D4 la empresa de una compra salía **solo** de su sucursal (o de la sucursal de su bodega),
 * así que un gasto global —la gasolina, el teléfono del dueño— no se podía registrar sin inventarle
 * una sucursal. Ahora la compra guarda su empresa (`purchases.company_id`):
 *
 * 1. Si hay sucursal, la de la sucursal. Manda: una sucursal es de una sola empresa.
 * 2. Si no, la de la sucursal de la bodega, si la bodega es de una sucursal.
 * 3. Si no, la que se eligió.
 * 4. Si no, y el negocio tiene **una sola** empresa, esa: no se pregunta lo que no tiene respuesta.
 * 5. Si el negocio no tiene ninguna empresa (a medio dar de alta), ninguna: no hay qué elegir.
 * 6. Si no, falta: hay que elegirla.
 *
 * Y la bodega tiene que ser **de la sucursal elegida o general** (sin sucursal). Huehuetlán no
 * recibe mercancía en la bodega de Tehuacán.
 */

export interface SucursalDeLaCompra {
    readonly id: string;
    readonly companyId: string;
    readonly name?: string;
}

export interface BodegaDeLaCompra {
    readonly id: string;
    /** `null` = bodega general, de ninguna sucursal. */
    readonly locationId: string | null;
    /** La empresa de la sucursal de la bodega (si tiene). */
    readonly companyId: string | null;
    readonly name?: string;
}

export type EmpresaDeLaCompra =
    /** `companyId` nulo solo si el negocio no tiene ninguna empresa: no hay nada que elegir. */
    | { readonly ok: true; readonly companyId: string | null }
    | { readonly ok: false; readonly campo: 'empresa' | 'bodega'; readonly motivo: string };

export function empresaDeLaCompra(e: {
    readonly sucursal: SucursalDeLaCompra | null;
    readonly bodega: BodegaDeLaCompra | null;
    /** La empresa que eligió quien captura (gasto global). */
    readonly elegida?: string | null;
    /** Las empresas del negocio. */
    readonly empresas: readonly string[];
}): EmpresaDeLaCompra {
    const { sucursal, bodega } = e;
    if (sucursal && bodega && bodega.locationId && bodega.locationId !== sucursal.id) {
        return {
            ok: false,
            campo: 'bodega',
            motivo: `La bodega ${bodega.name ?? ''} es de otra sucursal: elige una de ${sucursal.name ?? 'la sucursal'} o una general.`.replace('  ', ' '),
        };
    }
    const deLaSucursal = sucursal?.companyId ?? bodega?.companyId ?? null;
    if (deLaSucursal) {
        if (e.elegida && e.elegida !== deLaSucursal) {
            return { ok: false, campo: 'empresa', motivo: 'La sucursal elegida es de otra empresa.' };
        }
        return { ok: true, companyId: deLaSucursal };
    }
    if (e.elegida) {
        if (!e.empresas.includes(e.elegida)) return { ok: false, campo: 'empresa', motivo: 'Esa empresa no es de este negocio.' };
        return { ok: true, companyId: e.elegida };
    }
    if (e.empresas.length === 1) return { ok: true, companyId: e.empresas[0]! };
    // Sin empresas (un negocio a medio dar de alta) no hay a quién preguntarle: no se bloquea.
    if (e.empresas.length === 0) return { ok: true, companyId: null };
    return { ok: false, campo: 'empresa', motivo: 'Elige de qué empresa es: sin sucursal, la compra no lo dice.' };
}

/** Las bodegas que se ofrecen para una sucursal: las suyas y las generales. Sin sucursal, todas. */
export function bodegasDeLaSucursal<T extends { readonly locationId: string | null }>(
    bodegas: readonly T[],
    locationId: string | null | undefined
): T[] {
    if (!locationId) return [...bodegas];
    return bodegas.filter((b) => b.locationId === null || b.locationId === locationId);
}
