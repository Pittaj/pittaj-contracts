/**
 * @fileoverview I10a · Etiquetas: qué se dibuja, dónde y con qué barras.
 * @module Contracts/Inventory/Schemas/ReglasDeEtiquetas
 *
 * La web (jsPDF) y el escritorio (QuestPDF) **no deciden nada**: piden aquí el diseño de cada
 * etiqueta (textos con su tamaño y posición, las barras módulo por módulo) y dónde va en la hoja,
 * y lo dibujan. Así la misma plantilla imprime la misma etiqueta en las dos puntas. Espejo exacto en
 * `Pittaj.Domain.Inventory.ReglasDeEtiquetas` con los mismos vectores de prueba.
 *
 * - Barras: Code 128 (B, o C si es puro número de largo par) y EAN-13 (si el código es un EAN
 *   válido; si no, Code 128). QR (I10b): `codigoQr.ts`, cuadrado al pie de la etiqueta.
 * - Precio: el **precio al público**, con sus impuestos (la ley pide el precio total en el anaquel):
 *   si el impuesto no viene incluido en el precio de venta, se suma.
 * - Todas las medidas en milímetros, redondeadas a centésimas; los tamaños de letra en puntos.
 */

import type { BarcodeSymbology, LabelField, LabelOutput, LabelPageSize } from './labelPrint.schema.js';
import { codigoQr } from './codigoQr.js';

// ── Barras ────────────────────────────────────────────────────────────────────────────────────

/** Anchos (barra, espacio, barra…) de los 107 símbolos de Code 128; el 106 es el alto (stop). */
const CODE128 = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
] as const;
export const CODE128_ANCHOS: readonly string[] = CODE128;

const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const STOP = 106;

const esDigito = (c: string) => c >= '0' && c <= '9';

/** Los anchos a módulos: '1' barra, '0' espacio. */
const aModulos = (anchos: string): string => {
    let r = '';
    for (let i = 0; i < anchos.length; i++) r += (i % 2 === 0 ? '1' : '0').repeat(Number(anchos[i]));
    return r;
};

/**
 * Los símbolos de Code 128 de un texto (sin el de control ni el alto). Puro número de dos o más
 * cifras: juego C de a pares (si es non, la última va en B). Lo demás, juego B (ASCII 32–126).
 * Nulo si hay un carácter que Code 128 B no tiene (acentos, ñ).
 */
export function simbolosCode128(texto: string): number[] | null {
    if (texto.length === 0) return null;
    const soloDigitos = [...texto].every(esDigito);
    if (soloDigitos && texto.length >= 2) {
        const r = [START_C];
        const pares = texto.length - (texto.length % 2);
        for (let i = 0; i < pares; i += 2) r.push(Number(texto.slice(i, i + 2)));
        if (pares < texto.length) r.push(CODE_B, texto.charCodeAt(pares) - 32);
        return r;
    }
    const r = [START_B];
    for (let i = 0; i < texto.length; i++) {
        const c = texto.charCodeAt(i);
        if (c < 32 || c > 126) return null;
        r.push(c - 32);
    }
    return r;
}

/** Code 128 completo en módulos (inicio, datos, control, alto), sin zona de silencio. Nulo si no se puede. */
export function barrasCode128(texto: string): string | null {
    const s = simbolosCode128(texto);
    if (!s) return null;
    let suma = s[0]!;
    for (let i = 1; i < s.length; i++) suma += s[i]! * i;
    return [...s, suma % 103, STOP].map((x) => aModulos(CODE128[x]!)).join('');
}

const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
/** Paridad de las seis cifras de la izquierda según la primera. */
const EAN_PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** El dígito verificador de las primeras 12 cifras de un EAN-13. */
export function digitoEan13(doce: string): number {
    let suma = 0;
    for (let i = 0; i < 12; i++) suma += Number(doce[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (suma % 10)) % 10;
}

/** El EAN-13 de 13 cifras (12 + el verificador calculado), o nulo si no es un EAN válido. */
export function normalizarEan13(codigo: string): string | null {
    const c = codigo.trim();
    if (!/^[0-9]{12,13}$/.test(c)) return null;
    const dv = digitoEan13(c);
    if (c.length === 12) return c + String(dv);
    return Number(c[12]) === dv ? c : null;
}

/** EAN-13 en módulos (95), o nulo si no es un EAN válido. */
export function barrasEan13(codigo: string): string | null {
    const c = normalizarEan13(codigo);
    if (!c) return null;
    const paridad = EAN_PARIDAD[Number(c[0])]!;
    let r = '101';
    for (let i = 1; i <= 6; i++) r += (paridad[i - 1] === 'L' ? EAN_L : EAN_G)[Number(c[i])]!;
    r += '01010';
    for (let i = 7; i <= 12; i++) r += EAN_R[Number(c[i])]!;
    return r + '101';
}

export interface BarrasDeEtiqueta {
    readonly simbologia: 'EAN13' | 'CODE128';
    /** Lo que se codifica (el EAN con su verificador). */
    readonly valor: string;
    readonly modulos: string;
}

/**
 * Las barras (1D) de un código: EAN-13 si lo es (si no, Code 128), Code 128 si se puede. Para QR
 * pide Code 128 (la etiqueta usa `codigoQr`). Nulo si no hay código o no se puede codificar.
 */
export function barrasDe(simbologia: BarcodeSymbology, codigo: string | null | undefined): BarrasDeEtiqueta | null {
    const valor = (codigo ?? '').trim();
    if (!valor) return null;
    if (simbologia === 'EAN13') {
        const ean = normalizarEan13(valor);
        if (ean) return { simbologia: 'EAN13', valor: ean, modulos: barrasEan13(ean)! };
    }
    const modulos = barrasCode128(valor);
    return modulos ? { simbologia: 'CODE128', valor, modulos } : null;
}

// ── Precio ────────────────────────────────────────────────────────────────────────────────────

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/**
 * El precio al público: el de venta con los impuestos que no trae incluidos (IEPS e IVA en cascada,
 * como la caja). Un impuesto incluido no se toca.
 */
export function precioDeEtiqueta(precio: number, impuestos: readonly { rate: number; isIncluded: boolean }[]): number {
    let factor = 1;
    for (const i of impuestos) if (!i.isIncluded && i.rate > 0) factor *= 1 + i.rate;
    return redondear2(precio * factor);
}

/** «$1,234.50» (y la moneda detrás si no es MXN: «$12.00 USD»). */
export function formatoDePrecio(n: number, moneda = 'MXN'): string {
    const centavos = Math.round(Math.abs(n) * 100);
    const enteros = String(Math.floor(centavos / 100));
    const dec = String(centavos % 100).padStart(2, '0');
    let miles = '';
    for (let i = 0; i < enteros.length; i++) {
        if (i > 0 && (enteros.length - i) % 3 === 0) miles += ',';
        miles += enteros[i];
    }
    return `${n < 0 ? '-' : ''}$${miles}.${dec}${moneda && moneda !== 'MXN' ? ` ${moneda}` : ''}`;
}

/** `2027-03-01` → `01/03/2027`. */
const fechaCorta = (iso: string | null): string | null => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : null);

// ── Una etiqueta ──────────────────────────────────────────────────────────────────────────────

/** Una etiqueta física: los datos del renglón con, si acaso, una serie. */
export interface DatosDeEtiqueta {
    readonly name: string;
    readonly code: string | null;
    readonly barcode: string | null;
    readonly price: number;
    readonly priceWholesale: number | null;
    readonly currency: string;
    readonly unitName: string | null;
    readonly categoryName: string | null;
    readonly lotNumber: string | null;
    readonly expiresAt: string | null;
    readonly variant: string | null;
    readonly serialNumber: string | null;
    readonly companyName: string | null;
    /** (2.82.0) La ubicación en la bodega (pasillo/anaquel). Opcional: quien no la sabe, no la pone. */
    readonly location?: string | null;
}

/** El texto de un campo (vacío = no va). BARCODE no es texto: son las barras. */
export function textoDeCampo(campo: LabelField, d: DatosDeEtiqueta): string {
    switch (campo) {
        case 'NAME': return d.name.trim();
        case 'CODE': return d.code ? d.code : '';
        case 'PRICE': return formatoDePrecio(d.price, d.currency);
        case 'PRICE_WHOLESALE': return d.priceWholesale !== null && d.priceWholesale > 0 ? `Mayoreo ${formatoDePrecio(d.priceWholesale, d.currency)}` : '';
        case 'UNIT': return d.unitName ?? '';
        case 'CATEGORY': return d.categoryName ?? '';
        case 'LOT': return d.lotNumber ? `Lote ${d.lotNumber}` : '';
        case 'EXPIRY': { const f = fechaCorta(d.expiresAt); return f ? `Cad. ${f}` : ''; }
        case 'SERIAL': return d.serialNumber ? `S/N ${d.serialNumber}` : '';
        case 'VARIANT': return d.variant ?? '';
        case 'COMPANY': return d.companyName ?? '';
        case 'LOCATION': return d.location ? `Ubic. ${d.location}` : '';
        case 'BARCODE': return '';
    }
}

/** Lo que pesa cada renglón de texto en la altura de la etiqueta. */
const PESO: Partial<Record<LabelField, number>> = { PRICE: 1.8, NAME: 1.2 };
const pesoDe = (c: LabelField) => PESO[c] ?? 0.9;
/** 1 pt = 0.3528 mm; la letra ocupa el 72 % de su renglón. */
const MM_POR_PT = 0.3528;
const LETRA_DEL_RENGLON = 0.72;
/** Un renglón de menos de esto no se lee: se quitan campos del final hasta que quepa. */
const RENGLON_MINIMO_MM = 1.6;
const RENGLON_MAXIMO_MM = 7;
/** Ancho medio de una letra respecto a su tamaño (Helvetica ≈ 0.5; se deja holgura). */
const ANCHO_DE_LETRA = 0.55;

export interface TextoDeEtiqueta {
    readonly tipo: 'texto';
    readonly campo: LabelField;
    readonly texto: string;
    /** Centro horizontal y borde superior del renglón. */
    readonly xMm: number;
    readonly yMm: number;
    readonly altoMm: number;
    readonly tamanoPt: number;
    readonly negrita: boolean;
}

export interface BarrasEnEtiqueta {
    readonly tipo: 'barras';
    readonly simbologia: 'EAN13' | 'CODE128';
    readonly valor: string;
    readonly modulos: string;
    /** Donde empieza la primera barra (ya con la zona de silencio a la izquierda) y su arriba. */
    readonly xMm: number;
    readonly yMm: number;
    readonly moduloMm: number;
    readonly altoMm: number;
    /** El código legible debajo (0 = no va, la etiqueta es muy chica). */
    readonly textoAltoMm: number;
    readonly textoPt: number;
}

/** I10b · Un QR: la matriz (sin silencio) y dónde empieza su primer módulo. */
export interface QrEnEtiqueta {
    readonly tipo: 'qr';
    readonly valor: string;
    readonly modulos: readonly string[];
    readonly xMm: number;
    readonly yMm: number;
    readonly moduloMm: number;
}

export type ElementoDeEtiqueta = TextoDeEtiqueta | BarrasEnEtiqueta | QrEnEtiqueta;

export interface PlantillaParaDibujar {
    readonly widthMm: number;
    readonly heightMm: number;
    readonly fields: readonly LabelField[];
    readonly symbology: BarcodeSymbology;
}

const r2 = redondear2;
const r1 = (n: number) => Math.round(n * 10) / 10;
const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Corta un texto a lo que cabe en un ancho con su tamaño de letra («…» al final). */
export function cortarAlAncho(texto: string, anchoMm: number, tamanoPt: number): string {
    const caben = Math.floor(anchoMm / (tamanoPt * MM_POR_PT * ANCHO_DE_LETRA));
    if (texto.length <= caben) return texto;
    return caben <= 1 ? '…' : `${texto.slice(0, caben - 1).trimEnd()}…`;
}

/**
 * El diseño de una etiqueta: textos de arriba abajo en el orden de la plantilla (centrados, el
 * precio más grande) y las barras abajo. Si no caben todos, se quitan los del final.
 */
export function disenoDeEtiqueta(t: PlantillaParaDibujar, d: DatosDeEtiqueta): ElementoDeEtiqueta[] {
    const w = t.widthMm;
    const h = t.heightMm;
    const pad = Math.min(w, h) < 20 ? 1 : 1.5;
    const ancho = w - 2 * pad;
    const elementos: ElementoDeEtiqueta[] = [];

    const codigo = (d.barcode ?? d.code ?? '').trim();
    const qr = t.fields.includes('BARCODE') && t.symbology === 'QR' && codigo ? codigoQr(codigo) : null;
    const barras = t.fields.includes('BARCODE') && !qr ? barrasDe(t.symbology, codigo) : null;
    let bloque = 0;
    if (qr) {
        // Cuadrado al pie, centrado, con dos módulos de silencio por lado.
        const lado = Math.min(r2(acotar((h - 2 * pad) * 0.4, 4, 25)) + (h >= 20 ? 2.5 : 0), ancho);
        bloque = lado;
        const modulo = Math.round((lado / (qr.modulos.length + 4)) * 10000) / 10000;
        elementos.push({
            tipo: 'qr',
            valor: codigo,
            modulos: qr.modulos,
            xMm: r2(w / 2 - (qr.modulos.length * modulo) / 2),
            yMm: r2(h - pad - lado + 2 * modulo),
            moduloMm: modulo,
        });
    } else if (barras) {
        const textoAlto = h >= 20 ? 2.5 : 0;
        const alto = r2(acotar((h - 2 * pad) * 0.4, 4, 25));
        bloque = alto + textoAlto;
        // Diez módulos de silencio a cada lado.
        const modulo = ancho / (barras.modulos.length + 20);
        elementos.push({
            tipo: 'barras',
            simbologia: barras.simbologia,
            valor: barras.valor,
            modulos: barras.modulos,
            xMm: r2(pad + 10 * modulo),
            yMm: r2(h - pad - bloque),
            moduloMm: Math.round(modulo * 10000) / 10000,
            altoMm: alto,
            textoAltoMm: textoAlto,
            textoPt: textoAlto > 0 ? r1((textoAlto * LETRA_DEL_RENGLON) / MM_POR_PT) : 0,
        });
    }

    let campos = t.fields.filter((c) => c !== 'BARCODE').map((c) => ({ campo: c, texto: textoDeCampo(c, d) })).filter((x) => x.texto.length > 0);
    const disponible = h - 2 * pad - bloque - (bloque > 0 ? 0.5 : 0);
    let unidad = 0;
    while (campos.length > 0) {
        const suma = campos.reduce((s, x) => s + pesoDe(x.campo), 0);
        unidad = Math.min(disponible / suma, RENGLON_MAXIMO_MM);
        if (unidad * 0.9 >= RENGLON_MINIMO_MM) break;
        campos = campos.slice(0, -1);
    }
    const usado = campos.reduce((s, x) => s + pesoDe(x.campo) * unidad, 0);
    let y = pad + Math.max(0, (disponible - usado) / 2);
    const textos: TextoDeEtiqueta[] = [];
    for (const x of campos) {
        const alto = pesoDe(x.campo) * unidad;
        const tamano = r1((alto * LETRA_DEL_RENGLON) / MM_POR_PT);
        textos.push({
            tipo: 'texto',
            campo: x.campo,
            texto: cortarAlAncho(x.texto, ancho, tamano),
            xMm: r2(w / 2),
            yMm: r2(y),
            altoMm: r2(alto),
            tamanoPt: tamano,
            negrita: x.campo === 'NAME' || x.campo === 'PRICE',
        });
        y += alto;
    }
    return [...textos, ...elementos];
}

// ── La hoja ───────────────────────────────────────────────────────────────────────────────────

export const TAMANOS_DE_HOJA: Readonly<Record<LabelPageSize, { readonly anchoMm: number; readonly altoMm: number; readonly nombre: string }>> = {
    LETTER: { anchoMm: 215.9, altoMm: 279.4, nombre: 'Carta' },
    A4: { anchoMm: 210, altoMm: 297, nombre: 'A4' },
};

export interface PlantillaDeHoja {
    readonly widthMm: number;
    readonly heightMm: number;
    readonly columns: number;
    readonly rows: number;
    readonly output: LabelOutput;
    readonly pageSize: LabelPageSize;
    readonly marginTopMm: number | null;
    readonly marginLeftMm: number | null;
    readonly gapXMm: number;
    readonly gapYMm: number;
}

export interface RejillaDeHoja {
    readonly paginaAnchoMm: number;
    readonly paginaAltoMm: number;
    readonly x0Mm: number;
    readonly y0Mm: number;
    readonly pasoXMm: number;
    readonly pasoYMm: number;
    readonly columnas: number;
    readonly filas: number;
    readonly porHoja: number;
}

/** La rejilla: en hoja (PDF_SHEET) columnas × renglones; en térmica, la página es la etiqueta. */
export function rejillaDe(t: PlantillaDeHoja): RejillaDeHoja {
    if (t.output !== 'PDF_SHEET') {
        return { paginaAnchoMm: t.widthMm, paginaAltoMm: t.heightMm, x0Mm: 0, y0Mm: 0, pasoXMm: t.widthMm, pasoYMm: t.heightMm, columnas: 1, filas: 1, porHoja: 1 };
    }
    const hoja = TAMANOS_DE_HOJA[t.pageSize];
    const anchoRejilla = t.columns * t.widthMm + (t.columns - 1) * t.gapXMm;
    const altoRejilla = t.rows * t.heightMm + (t.rows - 1) * t.gapYMm;
    return {
        paginaAnchoMm: hoja.anchoMm,
        paginaAltoMm: hoja.altoMm,
        x0Mm: r2(t.marginLeftMm ?? (hoja.anchoMm - anchoRejilla) / 2),
        y0Mm: r2(t.marginTopMm ?? (hoja.altoMm - altoRejilla) / 2),
        pasoXMm: r2(t.widthMm + t.gapXMm),
        pasoYMm: r2(t.heightMm + t.gapYMm),
        columnas: t.columns,
        filas: t.rows,
        porHoja: t.columns * t.rows,
    };
}

/** Si la rejilla no cabe en la hoja, por qué. Nulo = cabe. */
export function validarPlantilla(t: PlantillaDeHoja): string | null {
    if (t.output !== 'PDF_SHEET') return null;
    const g = rejillaDe(t);
    const hoja = TAMANOS_DE_HOJA[t.pageSize];
    const derecha = g.x0Mm + (t.columns - 1) * g.pasoXMm + t.widthMm;
    const abajo = g.y0Mm + (t.rows - 1) * g.pasoYMm + t.heightMm;
    if (g.x0Mm < 0 || derecha > hoja.anchoMm + 0.01) return `No caben ${t.columns} columnas de ${t.widthMm} mm en una hoja ${hoja.nombre}.`;
    if (g.y0Mm < 0 || abajo > hoja.altoMm + 0.01) return `No caben ${t.rows} renglones de ${t.heightMm} mm en una hoja ${hoja.nombre}.`;
    return null;
}

export interface PosicionEnHoja {
    readonly pagina: number;
    readonly columna: number;
    readonly fila: number;
    readonly xMm: number;
    readonly yMm: number;
}

/** Dónde va cada etiqueta. `saltar` deja vacías las primeras posiciones (hojas ya usadas a medias). */
export function posicionesEnHoja(t: PlantillaDeHoja, cuantas: number, saltar = 0): PosicionEnHoja[] {
    const g = rejillaDe(t);
    const s = t.output === 'PDF_SHEET' ? Math.max(0, Math.min(saltar, g.porHoja - 1)) : 0;
    const r: PosicionEnHoja[] = [];
    for (let i = 0; i < cuantas; i++) {
        const k = i + s;
        const enHoja = k % g.porHoja;
        const fila = Math.floor(enHoja / g.columnas);
        const columna = enHoja % g.columnas;
        r.push({ pagina: Math.floor(k / g.porHoja), columna, fila, xMm: r2(g.x0Mm + columna * g.pasoXMm), yMm: r2(g.y0Mm + fila * g.pasoYMm) });
    }
    return r;
}

// ── El trabajo ────────────────────────────────────────────────────────────────────────────────

export const MAX_ETIQUETAS_POR_TRABAJO = 5000;

export interface RenglonDeEtiquetas extends Omit<DatosDeEtiqueta, 'serialNumber' | 'companyName'> {
    readonly serialNumbers: readonly string[];
    readonly copies: number;
}

/** Cuántas etiquetas salen de un renglón: una por serie si las trae; si no, sus copias. */
export const etiquetasDelRenglon = (r: { serialNumbers: readonly string[]; copies: number }) => (r.serialNumbers.length > 0 ? r.serialNumbers.length : Math.max(0, Math.floor(r.copies)));

/** Si el trabajo pasa del tope, por qué. */
export function validarTrabajo(renglones: readonly { serialNumbers: readonly string[]; copies: number }[]): string | null {
    const total = renglones.reduce((s, r) => s + etiquetasDelRenglon(r), 0);
    if (total === 0) return 'No hay etiquetas que imprimir.';
    return total > MAX_ETIQUETAS_POR_TRABAJO ? `Son ${total} etiquetas; el tope por impresión es ${MAX_ETIQUETAS_POR_TRABAJO}.` : null;
}

/** Los renglones vueltos etiquetas, en orden. */
export function expandirEtiquetas(renglones: readonly RenglonDeEtiquetas[], companyName: string | null): DatosDeEtiqueta[] {
    const r: DatosDeEtiqueta[] = [];
    for (const x of renglones) {
        const { serialNumbers, copies, ...datos } = x;
        if (serialNumbers.length > 0) for (const s of serialNumbers) r.push({ ...datos, serialNumber: s, companyName });
        else for (let i = 0; i < etiquetasDelRenglon(x); i++) r.push({ ...datos, serialNumber: null, companyName });
        void copies;
    }
    return r;
}

// ── Plantillas de arranque ────────────────────────────────────────────────────────────────────

export interface PlantillaSugerida {
    readonly clave: string;
    readonly name: string;
    readonly widthMm: number;
    readonly heightMm: number;
    readonly columns: number;
    readonly rows: number;
    readonly pageSize: LabelPageSize;
    readonly marginTopMm: number | null;
    readonly marginLeftMm: number | null;
    readonly gapXMm: number;
    readonly gapYMm: number;
    readonly output: LabelOutput;
    readonly symbology: BarcodeSymbology;
    readonly fields: readonly LabelField[];
}

/** Para no empezar de cero: las hojas comunes y la térmica de 50 × 25. */
export const PLANTILLAS_SUGERIDAS: readonly PlantillaSugerida[] = [
    {
        clave: 'AVERY_5160', name: 'Hoja carta 30 por hoja (Avery 5160)', widthMm: 66.68, heightMm: 25.4, columns: 3, rows: 10,
        pageSize: 'LETTER', marginTopMm: 12.7, marginLeftMm: 4.76, gapXMm: 3.18, gapYMm: 0,
        output: 'PDF_SHEET', symbology: 'CODE128', fields: ['NAME', 'PRICE', 'BARCODE'],
    },
    {
        clave: 'ANAQUEL_A4_24', name: 'Anaquel A4, 24 por hoja (70 × 37)', widthMm: 70, heightMm: 37, columns: 3, rows: 8,
        pageSize: 'A4', marginTopMm: 0.5, marginLeftMm: 0, gapXMm: 0, gapYMm: 0,
        output: 'PDF_SHEET', symbology: 'CODE128', fields: ['NAME', 'VARIANT', 'PRICE', 'BARCODE'],
    },
    {
        // (2.82.0) La etiqueta de anaquel: dónde va, además de qué es y cuánto cuesta.
        clave: 'ANAQUEL_UBICACION', name: 'Anaquel con ubicación, A4 24 por hoja (70 × 37)', widthMm: 70, heightMm: 37, columns: 3, rows: 8,
        pageSize: 'A4', marginTopMm: 0.5, marginLeftMm: 0, gapXMm: 0, gapYMm: 0,
        output: 'PDF_SHEET', symbology: 'CODE128', fields: ['NAME', 'PRICE', 'LOCATION', 'BARCODE'],
    },
    {
        clave: 'TERMICA_50x25', name: 'Térmica 50 × 25', widthMm: 50, heightMm: 25, columns: 1, rows: 1,
        pageSize: 'LETTER', marginTopMm: null, marginLeftMm: null, gapXMm: 0, gapYMm: 0,
        output: 'ZPL', symbology: 'CODE128', fields: ['NAME', 'PRICE', 'BARCODE'],
    },
];

/** Nombres para la pantalla. */
export const LABEL_FIELD_LABELS: Readonly<Record<LabelField, string>> = {
    NAME: 'Nombre', CODE: 'Código', BARCODE: 'Código de barras', PRICE: 'Precio', PRICE_WHOLESALE: 'Precio de mayoreo',
    UNIT: 'Unidad', CATEGORY: 'Categoría', LOT: 'Lote', EXPIRY: 'Caducidad', SERIAL: 'Número de serie', VARIANT: 'Variante', COMPANY: 'Empresa',
    LOCATION: 'Ubicación',
};
export const LABEL_OUTPUT_LABELS: Readonly<Record<LabelOutput, string>> = { PDF_SHEET: 'Hoja (PDF)', ZPL: 'Térmica ZPL', EPL: 'Térmica EPL' };
export const BARCODE_SYMBOLOGY_LABELS: Readonly<Record<BarcodeSymbology, string>> = { CODE128: 'Code 128', EAN13: 'EAN-13', QR: 'QR' };
