/**
 * U-T2 · En qué unidad del producto entra un concepto del CFDI.
 *
 * El proveedor factura en SU unidad (KGM, XBX, H87…) y el producto tiene la suya de inventario y sus
 * alternas. Sin esto, todo entraba en la base: el huevo facturado por kilo entraba bien mientras la
 * base era el kilo, pero en cuanto el inventario se lleva en tapas, 540 «kilos» serían 540 tapas.
 *
 * Orden: lo que ya se recordó para ese proveedor y concepto → la base si la clave SAT es la suya →
 * una alterna cuyo nombre corresponde a la clave (KGM → «Kilo») → la base, marcada para revisar.
 *
 * Espejo en el escritorio: `UnidadDelConcepto.cs` (mismos casos de prueba).
 */
import { satUnitToBaseUnit } from './cfdiMatching.js';

export type UnidadDelConceptoPor = 'RECORDADA' | 'BASE' | 'NOMBRE' | 'SIN_DATO';

export interface UnidadDelConcepto {
    /** Nulo = la base. */
    readonly unitName: string | null;
    readonly unitFactor: number;
    /** Por dónde se decidió; `SIN_DATO` = cayó en la base sin que nada lo dijera: conviene revisarlo. */
    readonly por: UnidadDelConceptoPor;
}

export interface ProductoParaUnidadDelConcepto {
    /** `inventoryConfig.unitOfMeasure` (UNIT, KG, LT…). */
    readonly unitOfMeasure: string;
    /** ClaveUnidad SAT capturada en el producto (`taxInfo.satUnitCode`). */
    readonly satUnitCode?: string | null;
    readonly units?: readonly { readonly name: string; readonly factor: number }[] | null;
}

/** Cómo suele llamarse en la ficha la unidad de cada clave SAT común. */
const NOMBRES_DE_LA_CLAVE: Readonly<Record<string, readonly string[]>> = {
    KGM: ['kilo', 'kilos', 'kg', 'kgs', 'kilogramo', 'kilogramos'],
    GRM: ['gramo', 'gramos', 'g', 'gr', 'grs'],
    LTR: ['litro', 'litros', 'l', 'lt', 'lts'],
    MTR: ['metro', 'metros', 'm', 'mt', 'mts'],
    XBX: ['caja', 'cajas', 'cja'],
    XPK: ['paquete', 'paquetes', 'paq', 'pqt'],
    H87: ['pieza', 'piezas', 'pza', 'pzas', 'pz'],
    XUN: ['unidad', 'unidades'],
    DPC: ['docena', 'docenas'],
};

const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/**
 * @param recordada `undefined` = nada recordado; `null` = se recordó la base; texto = esa alterna.
 */
export function unidadDelConcepto(
    claveUnidad: string | null | undefined,
    producto: ProductoParaUnidadDelConcepto,
    recordada?: string | null,
): UnidadDelConcepto {
    const alternas = producto.units ?? [];
    const base: UnidadDelConcepto = { unitName: null, unitFactor: 1, por: 'BASE' };

    if (recordada !== undefined) {
        if (recordada === null) return { ...base, por: 'RECORDADA' };
        const u = alternas.find((a) => norm(a.name) === norm(recordada));
        if (u) return { unitName: u.name, unitFactor: u.factor, por: 'RECORDADA' };
        // La recordada ya no existe en la ficha: se decide como si no hubiera memoria.
    }

    const clave = (claveUnidad ?? '').trim().toUpperCase();
    if (!clave) return { ...base, por: 'SIN_DATO' };

    const satDeLaBase = (producto.satUnitCode ?? '').trim().toUpperCase();
    if (satDeLaBase ? satDeLaBase === clave : satUnitToBaseUnit(clave) === producto.unitOfMeasure && clave !== 'E48' && clave !== 'ACT') {
        return base;
    }

    const nombres = NOMBRES_DE_LA_CLAVE[clave] ?? [];
    const u = alternas.find((a) => nombres.includes(norm(a.name)));
    if (u) return { unitName: u.name, unitFactor: u.factor, por: 'NOMBRE' };

    return { ...base, por: 'SIN_DATO' };
}
