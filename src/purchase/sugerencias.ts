/**
 * @fileoverview Desvío E · lo que Pittaj sugiere de un comprobante recibido antes de que alguien
 * decida: qué es (E2), con qué concepto se registra (E2) y, si es equipo, qué tipo de activo (E3).
 * @module Contracts/Purchase
 *
 * Todo sale de la **clave de producto del SAT** (`c_ClaveProdServ`, que sigue la estructura de
 * UNSPSC: los dos primeros dígitos son el segmento) y de la descripción, que desempata. Muchos
 * emisores ponen la genérica `01010101`: por eso la descripción es el respaldo, y lo que el
 * proveedor ya aprendió (F6.3) gana siempre a esto.
 *
 * Son sugerencias: ninguna decide sola. Plan: docs `producto/plan-gastos-que-guian.md`.
 * Gemelo en el escritorio: `Pittaj.Domain/Purchasing/Sugerencias.cs`, con los mismos vectores.
 */

import type { FixedAssetTypeValue } from '../accounting/schemas/fixedAsset.schema.js';
import { pareceActivoFijo } from './activoDesdeCompra.js';

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clave8 = (c: string | null | undefined) => (c ?? '').trim();

/** La clave genérica del SAT: no dice nada del producto. */
export const CLAVE_GENERICA_SAT = '01010101';

/** ¿La clave es de un servicio? Segmentos 70 a 94 de UNSPSC (servicios); el 95 ya son terrenos y edificios. */
export function esClaveDeServicio(clave: string | null | undefined): boolean {
    const c = clave8(clave);
    if (c.length < 2 || c === CLAVE_GENERICA_SAT) return false;
    const segmento = Number(c.slice(0, 2));
    return segmento >= 70 && segmento <= 94;
}

interface ReglaDeConcepto {
    /** Prefijos de la clave (4 dígitos: segmento y familia). */
    readonly prefijos: readonly string[];
    /** `code` del concepto de la semilla. */
    readonly concepto: string;
    /** Si se da, la descripción tiene que contener alguna (sin acentos, minúsculas). */
    readonly palabras?: readonly string[];
}

/**
 * La tabla de E2. El orden importa: dentro de un mismo prefijo, la primera regla cuyas palabras
 * aparezcan gana; una regla sin palabras es el «si no» de su prefijo.
 */
const REGLAS: readonly ReglaDeConcepto[] = [
    // Financieros. Mercado Lending factura los intereses con 84101700.
    { prefijos: ['8410', '8414', '8412'], concepto: 'LOAN_INTEREST', palabras: ['interes'] },
    { prefijos: ['8412'], concepto: 'BANK_FEES' },
    { prefijos: ['8413'], concepto: 'INSURANCE' },
    // Servicios.
    { prefijos: ['8111'], concepto: 'CLOUD_SOFTWARE' },
    { prefijos: ['8311'], concepto: 'PHONE_INTERNET' },
    { prefijos: ['8310'], concepto: 'WATER', palabras: ['agua', 'alcantarillado'] },
    { prefijos: ['8310'], concepto: 'ELECTRICITY' },
    { prefijos: ['7810'], concepto: 'FREIGHT' },
    { prefijos: ['8210'], concepto: 'ADVERTISING' },
    { prefijos: ['7210', '7215'], concepto: 'MAINTENANCE' },
    { prefijos: ['7611'], concepto: 'CLEANING' },
    { prefijos: ['9212'], concepto: 'SECURITY' },
    { prefijos: ['8411', '8012', '8016'], concepto: 'FEES' },
    { prefijos: ['8013'], concepto: 'RENT' },
    { prefijos: ['8610', '8611'], concepto: 'TRAINING' },
    // Bienes que son gasto.
    { prefijos: ['1511'], concepto: 'GAS' },
    { prefijos: ['1510'], concepto: 'GAS', palabras: ['gas lp', 'gas l.p', 'gas natural', 'propano', 'butano'] },
    { prefijos: ['1510'], concepto: 'FUEL' },
    { prefijos: ['4412', '1411'], concepto: 'STATIONERY' },
    { prefijos: ['5310', '5311'], concepto: 'UNIFORMS', palabras: ['uniforme', 'filipina', 'mandil', 'delantal'] },
];

/**
 * El concepto (su `code` de la semilla) que sugiere la clave del SAT de un concepto del CFDI, o
 * `null` si la clave no dice nada útil.
 */
export function conceptoSugeridoPorClave(clave: string | null | undefined, descripcion?: string | null): string | null {
    const c = clave8(clave);
    if (c.length < 4 || c === CLAVE_GENERICA_SAT) return null;
    const familia = c.slice(0, 4);
    const d = sinAcentos(descripcion ?? '');
    for (const r of REGLAS) {
        if (!r.prefijos.includes(familia)) continue;
        if (r.palabras && !r.palabras.some((p) => d.includes(p))) continue;
        return r.concepto;
    }
    return null;
}

/** Lo que hace falta de cada concepto del CFDI. */
export interface ConceptoParaSugerir {
    readonly claveProdServ: string | null | undefined;
    readonly descripcion: string;
    /** Base sin IVA del concepto, en pesos. */
    readonly base: number;
}

/** El verbo principal de un comprobante recibido (E2). */
export type NaturalezaSugerida = 'COMPRA' | 'GASTO' | 'ACTIVO';

/**
 * Qué parece el comprobante, para poner su verbo principal:
 *
 * - **ACTIVO** si algún concepto parece equipo y pasa del umbral (`pareceActivoFijo`, D6);
 * - **GASTO** si todos los conceptos son servicios o tienen un concepto de gasto sugerido;
 * - **COMPRA** en cualquier otro caso, que es lo que se hacía antes (mercancía).
 */
export function naturalezaSugerida(conceptos: readonly ConceptoParaSugerir[]): NaturalezaSugerida {
    if (conceptos.length === 0) return 'COMPRA';
    if (conceptos.some((c) => pareceActivoFijo({ descripcion: c.descripcion, base: c.base }))) return 'ACTIVO';
    const todosGasto = conceptos.every(
        (c) => esClaveDeServicio(c.claveProdServ) || conceptoSugeridoPorClave(c.claveProdServ, c.descripcion) !== null,
    );
    return todosGasto ? 'GASTO' : 'COMPRA';
}

// ── E3 · El tipo de activo ───────────────────────────────────────────────────────────────────

const ACTIVO_POR_SEGMENTO: Readonly<Record<string, FixedAssetTypeValue>> = {
    '43': 'COMPUTER', // cómputo y telecomunicaciones
    '25': 'VEHICLE', // vehículos
    '56': 'STORE_EQUIPMENT', // muebles
    '52': 'STORE_EQUIPMENT', // electrodomésticos
    '48': 'MACHINERY', // equipo comercial de cocina y servicio: hornos, batidoras, vitrinas
    '23': 'MACHINERY', // maquinaria industrial
    '24': 'MACHINERY', // manejo de materiales, refrigeración
    '27': 'MACHINERY', // herramienta y maquinaria general
    '40': 'MACHINERY', // clima y distribución
    // Construcción: casi siempre se hace en un local rentado. Si el local es propio, «Edificios».
    '72': 'LEASEHOLD_IMPROVEMENT',
};

const ACTIVO_POR_PALABRA: readonly (readonly [readonly string[], FixedAssetTypeValue])[] = [
    [['computadora', 'laptop', 'portatil', 'impresora', 'servidor', 'monitor', 'tableta'], 'COMPUTER'],
    [['camioneta', 'automovil', 'vehiculo', 'motocicleta', 'camion'], 'VEHICLE'],
    [['horno', 'estufa', 'batidora', 'amasadora', 'rebanadora', 'molino', 'licuadora industrial', 'montacargas',
        'maquina', 'planta de luz', 'generador', 'aire acondicionado', 'minisplit', 'mini split'], 'MACHINERY'],
    [['refrigerador', 'congelador', 'enfriador', 'vitrina', 'anaquel', 'estante', 'mostrador', 'rack', 'mueble',
        'bascula', 'caja registradora', 'terminal punto de venta'], 'STORE_EQUIPMENT'],
];

/**
 * E3 · El tipo de activo que sugiere un concepto del CFDI: primero el segmento de la clave del SAT,
 * después la descripción. `null` si nada lo dice. La tasa de «Maquinaria» depende de la actividad
 * (LISR art. 35): esto llena el tipo, y la tasa la confirma quien da de alta.
 */
export function tipoDeActivoSugerido(clave: string | null | undefined, descripcion?: string | null): FixedAssetTypeValue | null {
    const c = clave8(clave);
    if (c.length >= 2 && c !== CLAVE_GENERICA_SAT) {
        const t = ACTIVO_POR_SEGMENTO[c.slice(0, 2)];
        if (t) return t;
    }
    const d = sinAcentos(descripcion ?? '');
    for (const [palabras, tipo] of ACTIVO_POR_PALABRA) if (palabras.some((p) => d.includes(p))) return tipo;
    return null;
}
