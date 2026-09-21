/**
 * @fileoverview Emparejado de conceptos de un CFDI de proveedor contra el catálogo.
 * **Espejo exacto del escritorio** (`Pittaj.Domain/Purchasing/CfdiMatching.cs`).
 * @module Contracts/Purchase
 *
 * ── Por qué las reglas viven aquí y no en cada punta ──
 *
 * El emparejado existía solo en el escritorio (`ImportCfdiPreviewHandler`), y la web
 * necesita lo mismo. La regla del producto es que **el mismo XML del mismo proveedor da
 * el mismo emparejado en las dos pantallas**; si cada punta escribe su propia
 * precedencia, el día que difieran nadie lo va a notar hasta que un producto se dé de
 * alta dos veces con dos nombres.
 *
 * Así que las **reglas** viven una sola vez —aquí, como funciones puras, igual que
 * `purchaseMath` y `purchaseState`— y se replican al centavo en C#. Lo que NO se
 * comparte es la **lectura del XML**: el escritorio la hace con `XDocument` porque
 * trabaja sin red, y la web con `DOMParser`; la nube no parsea XML (corre en Workers y
 * no tiene parser). Las dos lecturas desembocan en el mismo `CfdiConceptoInput`, que es
 * donde empieza todo lo de este archivo.
 *
 * ── Y la memoria de equivalencias es UNA ──
 *
 * La precedencia arranca por el mapeo aprendido (`supplier_product_links`), que **ya
 * sincroniza** entre las dos plataformas. No hay una memoria de la web y otra del
 * escritorio: hay una, y cada factura del mismo proveedor cuesta menos que la anterior
 * se capture donde se capture.
 */

import { roundHalfEven } from './purchaseMath.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Lo que entra: un concepto ya leído del XML
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un concepto (renglón) de un CFDI, ya extraído del XML.
 *
 * Espejo de `CfdiConcepto` del escritorio. Los importes vienen **como los trae el
 * comprobante**: `descuento` es un IMPORTE (no un porcentaje) y `taxRate` es una
 * FRACCIÓN (0.16), que es como el SAT escribe `TasaOCuota`.
 */
export interface CfdiConceptoInput {
    /** ClaveProdServ del SAT (8 dígitos). */
    readonly claveProdServ: string;
    /** ClaveUnidad del SAT (H87, KGM, E48…). */
    readonly claveUnidad: string | null;
    /** SKU del proveedor. Es la clave estable del concepto cuando viene. */
    readonly noIdentificacion: string | null;
    readonly descripcion: string;
    readonly cantidad: number;
    readonly valorUnitario: number;
    readonly importe: number;
    /** Descuento del CFDI: un IMPORTE, no un porcentaje. */
    readonly descuento: number;
    /** Traslado del concepto como fracción (0.16). 0 = exento o sin traslado. */
    readonly taxRate: number;
}

/**
 * Cómo te lo factura un proveedor: un alias del producto.
 *
 * Es la memoria de equivalencias (`supplier_product_links`) leída **desde el producto**: cada
 * enlace aprendido dice «este proveedor lo llama así». Un concepto nuevo, de cualquier proveedor,
 * se compara contra todos los alias del producto y no solo contra tu nombre — que es lo que hace
 * que «AZUCAR EST. 25 KG» de La Costeña encuentre el «Azucar Moreno» que Bimbo te factura como
 * «AZUCAR ESTANDAR DE 25KG».
 */
export interface CfdiProductAlias {
    readonly text: string;
    readonly supplierRfc: string;
}

/** Un producto del catálogo, reducido a lo que el emparejado necesita mirar. */
export interface CfdiCatalogProduct {
    readonly id: string;
    readonly name: string;
    /** Clave ProdServ del SAT capturada en el producto (null = sin capturar). */
    readonly satProductCode: string | null;
    /** Código de barras del producto: el único dato que es el mismo en todos los proveedores. */
    readonly barcode?: string | null;
    /** Cómo te lo facturan (ver `CfdiProductAlias`). Vacío si nadie te lo ha facturado aún. */
    readonly aliases?: readonly CfdiProductAlias[];
}

/**
 * El catálogo contra el que se empareja.
 *
 * `learned` es el mapeo aprendido del proveedor: `conceptoKey → productId`. Viene de
 * `supplier_product_links`, filtrado por el RFC del emisor.
 */
export interface CfdiMatchCatalog {
    readonly products: readonly CfdiCatalogProduct[];
    readonly learned: Readonly<Record<string, string>>;
}

/**
 * Por dónde emparejó un concepto. Es diagnóstico: la UI explica, no solo marca.
 *
 * Los cuatro primeros **emparejan** (el producto queda puesto); `SUGGESTED` no: es un candidato
 * con porcentaje que la pantalla prellena y la persona acepta. `SAT` desapareció el 2026-09-21:
 * era la única regla que se equivocaba sin avisar (dos azúcares llevan la misma clave y ganaba
 * «el primero»); la clave SAT ahora solo desempata entre parecidos.
 */
export const CFDI_MATCH_SOURCES = ['LEARNED', 'BARCODE', 'NAME', 'ALIAS', 'SUGGESTED', 'NONE'] as const;
export type CfdiMatchSource = (typeof CFDI_MATCH_SOURCES)[number];

/** Desde qué parecido se prellena una sugerencia (0–100). Por debajo, no se sugiere nada. */
export const CFDI_SUGGESTION_THRESHOLD = 70;
/** Dos candidatos más cerca que esto son un empate: no se sugiere ninguno (salvo desempate SAT). */
export const CFDI_SUGGESTION_MARGIN = 10;

/** Un concepto ya conciliado contra el catálogo. */
export interface CfdiMatchedConcepto extends CfdiConceptoInput {
    /** Clave estable del concepto dentro del proveedor (ver `conceptoKeyFor`). */
    readonly conceptoKey: string;
    /** Puesto solo cuando emparejó (LEARNED · BARCODE · NAME · ALIAS). Nulo si es sugerencia. */
    readonly matchedProductId: string | null;
    readonly matchedProductName: string | null;
    readonly matchedBy: CfdiMatchSource;
    /** El candidato, cuando `matchedBy` es SUGGESTED. La persona lo acepta o lo cambia. */
    readonly suggestedProductId: string | null;
    readonly suggestedProductName: string | null;
    /** Parecido 0–100 (NAME/ALIAS/BARCODE = 100; LEARNED y NONE = null). */
    readonly matchScore: number | null;
    /** El alias por el que pegó (ALIAS o SUGGESTED por alias): el nombre en la factura de otro proveedor. */
    readonly matchedAlias: string | null;
    readonly matchedAliasSupplierRfc: string | null;
    /**
     * El concepto **parece** un cargo del documento (flete, maniobras) y no un producto.
     * Es una SUGERENCIA: quien captura la confirma o la quita. Ver `suggestsDocumentCharge`.
     */
    readonly suggestedDocumentCharge: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  La clave del concepto
// ─────────────────────────────────────────────────────────────────────────────

/** Normaliza un texto para comparar: recorta y sube a mayúsculas. */
export function normalizeConceptoText(value: string): string {
    return value.trim().toUpperCase();
}

/**
 * Clave estable de un concepto dentro de un proveedor.
 *
 * El `NoIdentificacion` (el SKU del proveedor) si viene, y la descripción normalizada si
 * no. Con prefijo para que las dos familias no colisionen: un proveedor que factura
 * `FLETE` como SKU y otro que lo pone solo en la descripción no deben compartir memoria.
 *
 * ⚠️ Espejo literal de `SupplierProductLink.KeyFor` del escritorio. Si esto cambia, la
 * memoria aprendida deja de encontrarse a sí misma y todas las facturas vuelven a
 * emparejarse a mano.
 */
export function conceptoKeyFor(noIdentificacion: string | null | undefined, descripcion: string): string {
    const sku = (noIdentificacion ?? '').trim();
    return sku.length > 0 ? `ID:${sku.toUpperCase()}` : `DESC:${normalizeConceptoText(descripcion)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Cargo del documento
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Claves ProdServ del SAT que casi siempre son un cargo del documento y no mercancía.
 *
 * Se comparan por los 4 primeros dígitos (la CLASE del SAT), que es el nivel donde el
 * concepto deja de ser ambiguo: `7810` transporte de carga, `7812` manejo y maniobras,
 * `8010`/`8014` servicios de gestión, `9212` servicios de embalaje.
 */
const CLASES_SAT_DE_CARGO = ['7810', '7812', '7814', '9212'] as const;

/** Palabras que delatan un cargo del documento en la descripción del concepto. */
const PALABRAS_DE_CARGO = [
    'FLETE',
    'MANIOBRA',
    'ACARREO',
    'ENVIO',
    'ENVÍO',
    'PAQUETERIA',
    'PAQUETERÍA',
    'EMBALAJE',
    'SEGURO DE CARGA',
    'GASTO DE ENTREGA',
    'CARGO POR ENTREGA',
] as const;

/**
 * ¿Este concepto huele a cargo del documento (flete, maniobras) y no a producto?
 *
 * Es lo que evita que «FLETE Y MANIOBRAS» acabe de alta en el catálogo como si fuera
 * mercancía —que es lo que pasa hoy— y de paso deja el costo de los productos corto por
 * el importe del flete.
 *
 * **Es una sugerencia, no un veredicto.** Una transportista SÍ vende fletes, y ahí el
 * concepto es su producto. Por eso la pantalla lo marca y deja cambiarlo; nada se decide
 * en silencio.
 */
export function suggestsDocumentCharge(concepto: CfdiConceptoInput): boolean {
    const clave = (concepto.claveProdServ ?? '').trim();
    if (clave.length >= 4 && (CLASES_SAT_DE_CARGO as readonly string[]).includes(clave.slice(0, 4))) {
        return true;
    }
    const descripcion = normalizeConceptoText(concepto.descripcion);
    return PALABRAS_DE_CARGO.some((palabra) => descripcion.includes(palabra));
}

// ─────────────────────────────────────────────────────────────────────────────
//  El emparejado
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  El parecido entre dos nombres
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Palabras que no dicen nada del producto y solo estorban al comparar.
 *
 * Corta a propósito: quitar de más («CAJA», «PAQUETE») borraría lo que distingue «Coca 600 ml
 * caja 24» de la pieza suelta.
 */
const PALABRAS_DE_RELLENO = new Set([
    'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'SIN', 'PARA', 'POR', 'EN', 'Y', 'O', 'A', 'AL', 'UN', 'UNA',
    'PZA', 'PZAS', 'PIEZA', 'PIEZAS', 'PZ', 'PZS', 'UNIDAD', 'UNIDADES',
]);

/** Unidades que se pegan al número que las precede: «25 KG» y «25KG» son el mismo token. */
const UNIDADES: Readonly<Record<string, string>> = {
    KG: 'KG', KGS: 'KG', KILO: 'KG', KILOS: 'KG', KILOGRAMO: 'KG', KILOGRAMOS: 'KG',
    G: 'G', GR: 'G', GRS: 'G', GRAMO: 'G', GRAMOS: 'G',
    L: 'L', LT: 'L', LTS: 'L', LITRO: 'L', LITROS: 'L',
    ML: 'ML', MLS: 'ML',
    OZ: 'OZ', LB: 'LB', LBS: 'LB',
    M: 'M', MT: 'M', MTS: 'M', CM: 'CM', MM: 'MM',
};

/**
 * Los tokens con los que se compara un nombre: sin acentos, en mayúsculas, sin relleno, y con
 * la cantidad pegada a su unidad («25KG», «680G», «1L»). El «C/24» de «caja con 24» queda como
 * «24»: el número es lo que distingue el cartón de la pieza.
 *
 * Espejo literal de `CfdiMatching.Tokens` del escritorio.
 */
export function conceptoTokens(value: string): string[] {
    const plano = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();
    if (plano.length === 0) return [];

    const crudos = plano.split(' ');
    const tokens: string[] = [];
    for (let i = 0; i < crudos.length; i++) {
        let t = crudos[i]!;
        if (t.length === 0) continue;
        // «25KG» pegado: separar número y unidad para normalizar la unidad.
        const pegado = /^(\d+(?:\.\d+)?)([A-Z]+)$/.exec(t);
        if (pegado && UNIDADES[pegado[2]!]) {
            t = `${normalizarNumero(pegado[1]!)}${UNIDADES[pegado[2]!]}`;
        } else if (/^\d+(?:\.\d+)?$/.test(t)) {
            // «25 KG» separado: si lo que sigue es una unidad, se pegan.
            const siguiente = crudos[i + 1];
            if (siguiente && UNIDADES[siguiente]) {
                t = `${normalizarNumero(t)}${UNIDADES[siguiente]}`;
                i += 1;
            } else {
                t = normalizarNumero(t);
            }
        } else if (PALABRAS_DE_RELLENO.has(t)) {
            continue;
        } else if (t.length < 2) {
            continue;
        }
        if (!tokens.includes(t)) tokens.push(t);
    }
    return tokens;
}

function normalizarNumero(n: string): string {
    // «1.000» y «1» son lo mismo; «0.5» se queda.
    const num = Number(n);
    return Number.isFinite(num) ? String(num) : n;
}

/** ¿El token es una cantidad con unidad («25KG», «600ML»)? Es lo que no admite discrepancia. */
function esCantidad(t: string): boolean {
    return /^\d+(?:\.\d+)?(?:KG|G|L|ML|OZ|LB|M|CM|MM)$/.test(t);
}

/** Crédito por token: exacto = 1; uno es prefijo del otro (≥ 3 letras) = 0.7 («EST» ~ «ESTANDAR»). */
function creditoDeToken(t: string, otros: readonly string[]): number {
    if (otros.includes(t)) return 1;
    if (t.length < 3 || esCantidad(t)) return 0;
    for (const o of otros) {
        if (o.length < 3 || esCantidad(o)) continue;
        const corto = t.length <= o.length ? t : o;
        const largo = t.length <= o.length ? o : t;
        if (largo.startsWith(corto)) return 0.7;
    }
    return 0;
}

/**
 * Parecido entre dos nombres, 0–100.
 *
 * Es una intersección de tokens en las dos direcciones (para que un nombre largo no gane solo por
 * largo), con crédito parcial por prefijo. Si los dos traen cantidad con unidad y no coinciden
 * («25KG» contra «1KG»), el parecido se recorta a la mitad: el azúcar refinada de 1 kg no es el
 * saco de 25 por mucho que las palabras se parezcan.
 *
 * Espejo literal de `CfdiMatching.Similarity` del escritorio.
 */
export function conceptoSimilarity(a: string, b: string): number {
    const ta = conceptoTokens(a);
    const tb = conceptoTokens(b);
    if (ta.length === 0 || tb.length === 0) return 0;

    let puntos = 0;
    for (const t of ta) puntos += creditoDeToken(t, tb);
    for (const t of tb) puntos += creditoDeToken(t, ta);
    let score = puntos / (ta.length + tb.length);

    const ca = ta.filter(esCantidad);
    const cb = tb.filter(esCantidad);
    if (ca.length > 0 && cb.length > 0 && !ca.some((c) => cb.includes(c))) score *= 0.5;

    return Math.round(score * 100);
}

/** ¿La clave del proveedor parece un código de barras (EAN-8/UPC/EAN-13/GTIN-14)? */
export function looksLikeBarcode(value: string | null | undefined): boolean {
    const v = (value ?? '').trim();
    return /^\d+$/.test(v) && [8, 12, 13, 14].includes(v.length);
}

// ─────────────────────────────────────────────────────────────────────────────
//  El emparejado
// ─────────────────────────────────────────────────────────────────────────────

interface Candidato {
    readonly product: CfdiCatalogProduct;
    readonly score: number;
    readonly alias: CfdiProductAlias | null;
}

/**
 * Empareja los conceptos de un CFDI contra el catálogo.
 *
 * **Precedencia, y el orden importa:**
 * 1. **Mapeo aprendido** del proveedor (LEARNED) — es trabajo humano ya hecho y manda sobre
 *    cualquier heurística. Si alguien corrigió una vez que `CC600-24` es la Coca-Cola de 600 y
 *    no la de 355, no se le vuelve a preguntar ni se le contradice.
 * 2. **Código de barras** (BARCODE) — la clave del proveedor es un EAN y un producto lo tiene:
 *    el único dato que es el mismo en todos los proveedores. Seguro, no pide clic.
 * 3. **Nombre o alias idéntico** (NAME · ALIAS) — al 100 % se da por emparejado, como hasta hoy
 *    el nombre exacto; el alias exacto de otro proveedor vale lo mismo.
 * 4. **Parecido** (SUGGESTED) — el mejor candidato por encima del umbral, comparando contra el
 *    nombre y contra los alias de todos los proveedores. **No empareja: sugiere**, con
 *    porcentaje y con el alias por el que pegó, y la persona acepta. Con dos candidatos a menos
 *    de 10 puntos, no se sugiere ninguno… salvo que solo uno comparta la clave SAT del concepto,
 *    que es el único papel que le queda a la clave SAT: desempatar.
 *
 * Un concepto que sugiere cargo del documento **no se empareja por nombre ni se sugiere**: un
 * flete no es un producto del catálogo. La memoria aprendida y el código de barras sí ganan.
 */
export function matchCfdiConceptos(
    conceptos: readonly CfdiConceptoInput[],
    catalog: CfdiMatchCatalog
): CfdiMatchedConcepto[] {
    const byId = new Map<string, CfdiCatalogProduct>();
    const byBarcode = new Map<string, CfdiCatalogProduct>();
    for (const product of catalog.products) {
        byId.set(product.id, product);
        const barcode = (product.barcode ?? '').trim();
        if (barcode.length > 0 && !byBarcode.has(barcode)) byBarcode.set(barcode, product);
    }

    return conceptos.map((concepto) => {
        const conceptoKey = conceptoKeyFor(concepto.noIdentificacion, concepto.descripcion);
        const suggestedDocumentCharge = suggestsDocumentCharge(concepto);
        const sinMatch: CfdiMatchedConcepto = {
            ...concepto,
            conceptoKey,
            matchedProductId: null,
            matchedProductName: null,
            matchedBy: 'NONE',
            suggestedProductId: null,
            suggestedProductName: null,
            matchScore: null,
            matchedAlias: null,
            matchedAliasSupplierRfc: null,
            suggestedDocumentCharge,
        };

        const learnedId = catalog.learned[conceptoKey];
        const learned = learnedId ? byId.get(learnedId) : undefined;
        if (learned) {
            return { ...sinMatch, matchedProductId: learned.id, matchedProductName: learned.name, matchedBy: 'LEARNED' };
        }

        const sku = (concepto.noIdentificacion ?? '').trim();
        const porBarcode = looksLikeBarcode(sku) ? byBarcode.get(sku) : undefined;
        if (porBarcode) {
            return { ...sinMatch, matchedProductId: porBarcode.id, matchedProductName: porBarcode.name, matchedBy: 'BARCODE', matchScore: 100 };
        }

        if (suggestedDocumentCharge) return sinMatch;

        const mejor = mejoresCandidatos(concepto, catalog.products);
        const top = mejor[0];
        if (!top || top.score < CFDI_SUGGESTION_THRESHOLD) return sinMatch;

        // Empate: dos productos distintos a menos de 10 puntos (también dos con el mismo nombre).
        // La clave SAT desempata si solo uno la comparte; si no, no se pone nada — prellenar un
        // parecido flojo es la forma más rápida de mezclar dos productos.
        const segundo = mejor.find((c) => c.product.id !== top.product.id);
        let elegido: Candidato | null = top;
        if (segundo && top.score - segundo.score < CFDI_SUGGESTION_MARGIN) {
            const clave = (concepto.claveProdServ ?? '').trim();
            const empatados = mejor.filter((c) => top.score - c.score < CFDI_SUGGESTION_MARGIN);
            const conSat = clave.length > 0 ? empatados.filter((c) => (c.product.satProductCode ?? '').trim() === clave) : [];
            const ids = new Set(conSat.map((c) => c.product.id));
            elegido = ids.size === 1 ? conSat[0]! : null;
        }
        if (!elegido) return sinMatch;

        if (elegido.score === 100) {
            return {
                ...sinMatch,
                matchedProductId: elegido.product.id,
                matchedProductName: elegido.product.name,
                matchedBy: elegido.alias ? 'ALIAS' : 'NAME',
                matchScore: 100,
                matchedAlias: elegido.alias?.text ?? null,
                matchedAliasSupplierRfc: elegido.alias?.supplierRfc ?? null,
            };
        }

        return {
            ...sinMatch,
            matchedBy: 'SUGGESTED',
            suggestedProductId: elegido.product.id,
            suggestedProductName: elegido.product.name,
            matchScore: elegido.score,
            matchedAlias: elegido.alias?.text ?? null,
            matchedAliasSupplierRfc: elegido.alias?.supplierRfc ?? null,
        };
    });
}

/** Los candidatos ordenados por parecido (el mejor primero), uno por producto. */
function mejoresCandidatos(concepto: CfdiConceptoInput, products: readonly CfdiCatalogProduct[]): Candidato[] {
    const candidatos: Candidato[] = [];
    for (const product of products) {
        let mejor: Candidato = { product, score: conceptoSimilarity(concepto.descripcion, product.name), alias: null };
        for (const alias of product.aliases ?? []) {
            const score = conceptoSimilarity(concepto.descripcion, alias.text);
            if (score > mejor.score) mejor = { product, score, alias };
        }
        if (mejor.score > 0) candidatos.push(mejor);
    }
    // Estable: a igual parecido gana el que va primero en el catálogo, como siempre.
    return candidatos.sort((a, b) => b.score - a.score);
}

/** El recuento del pie de la pantalla: emparejados · sin emparejar · cargos. */
export interface CfdiMatchSummary {
    readonly matched: number;
    readonly unmatched: number;
    readonly documentCharges: number;
}

/**
 * Cuenta el resultado del emparejado tal como lo enseña el pie de la pantalla.
 *
 * `documentCharges` son los que van como cargo del documento (no se cuentan como
 * pendientes: ya están resueltos, solo que no como producto).
 */
export function summarizeCfdiMatch(
    conceptos: readonly CfdiMatchedConcepto[],
    documentCharge: (concepto: CfdiMatchedConcepto) => boolean = (c) => c.suggestedDocumentCharge
): CfdiMatchSummary {
    let matched = 0;
    let unmatched = 0;
    let documentCharges = 0;
    // Una sugerencia NO cuenta como emparejado: pide un clic, y el lote no sigue sin él.
    for (const concepto of conceptos) {
        if (documentCharge(concepto)) documentCharges += 1;
        else if (concepto.matchedProductId) matched += 1;
        else unmatched += 1;
    }
    return { matched, unmatched, documentCharges };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Del concepto al renglón / al producto nuevo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * El descuento del concepto, en PORCENTAJE.
 *
 * El CFDI trae el descuento como importe y la compra lo guarda como porcentaje, así que
 * la conversión ocurre en algún sitio; que ocurra aquí es lo que evita que la web y el
 * escritorio conviertan distinto. Se protege la división: un concepto de importe cero
 * —una bonificación al 100 %— haría estallar el importador entero por una línea.
 *
 * Espejo de `ImportCfdiDraftHandler.DiscountPct`.
 */
export function discountPercentFromCfdi(descuento: number, importe: number): number {
    if (!(importe > 0)) return 0;
    return roundHalfEven((descuento / importe) * 100, 2);
}

/**
 * ClaveUnidad del SAT → unidad base del dominio.
 *
 * Espejo de `CreateProductsFromCfdiHandler.MapSatUnit`. Lo que no está en la tabla cae a
 * `UNIT`: H87 (pieza), E48 (unidad de servicio) y ACT (actividad) son piezas para todos
 * los efectos del inventario.
 */
export function satUnitToBaseUnit(claveUnidad: string | null | undefined): string {
    switch ((claveUnidad ?? '').trim().toUpperCase()) {
        case 'KGM':
            return 'KG';
        case 'LTR':
            return 'LT';
        case 'MTR':
            return 'MT';
        case 'XBX':
            return 'BOX';
        case 'XPK':
            return 'PACK';
        default:
            return 'UNIT';
    }
}

/** Las unidades que admiten cantidad fraccionaria en el punto de venta. */
export function allowsFractionalQuantity(baseUnit: string): boolean {
    return baseUnit === 'KG' || baseUnit === 'LT' || baseUnit === 'MT';
}

/**
 * Precio de venta de un producto dado de alta desde el comprobante: costo × (1 + margen).
 *
 * Redondeo al par, como todo el dinero de la compra: si la web calculara el precio con
 * `Math.round` y el escritorio con `decimal.Round`, el mismo alta masiva dejaría precios
 * distintos según dónde se hiciera.
 */
export function salePriceFromMargin(unitCost: number, marginPercent: number): number {
    const cost = unitCost > 0 ? unitCost : 0;
    const margin = marginPercent > 0 ? marginPercent : 0;
    return roundHalfEven(cost * (1 + margin / 100), 2);
}
