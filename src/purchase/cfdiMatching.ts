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

/** Un producto del catálogo, reducido a lo que el emparejado necesita mirar. */
export interface CfdiCatalogProduct {
    readonly id: string;
    readonly name: string;
    /** Clave ProdServ del SAT capturada en el producto (null = sin capturar). */
    readonly satProductCode: string | null;
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

/** Por dónde emparejó un concepto. Es diagnóstico: la UI explica, no solo marca. */
export const CFDI_MATCH_SOURCES = ['LEARNED', 'SAT', 'NAME', 'NONE'] as const;
export type CfdiMatchSource = (typeof CFDI_MATCH_SOURCES)[number];

/** Un concepto ya conciliado contra el catálogo. */
export interface CfdiMatchedConcepto extends CfdiConceptoInput {
    /** Clave estable del concepto dentro del proveedor (ver `conceptoKeyFor`). */
    readonly conceptoKey: string;
    readonly matchedProductId: string | null;
    readonly matchedProductName: string | null;
    readonly matchedBy: CfdiMatchSource;
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

/**
 * Empareja los conceptos de un CFDI contra el catálogo.
 *
 * **Precedencia, y el orden importa:**
 * 1. **Mapeo aprendido** del proveedor — es trabajo humano ya hecho y manda sobre
 *    cualquier heurística. Si alguien corrigió una vez que `CC600-24` es la Coca-Cola de
 *    600 y no la de 355, no se le vuelve a preguntar ni se le contradice.
 * 2. **Clave SAT ProdServ** del producto — es la identidad fiscal del artículo.
 * 3. **Nombre exacto** normalizado — el último recurso, y por eso va al final: dos
 *    productos pueden llamarse igual y solo uno es el bueno.
 *
 * Un concepto que sugiere cargo del documento **no se empareja por nombre ni por SAT**:
 * un flete no es un producto del catálogo, y emparejarlo con uno sería peor que dejarlo
 * sin emparejar. La memoria aprendida sí gana: si alguien lo mapeó a un producto a
 * propósito (una transportista), esa decisión manda.
 */
export function matchCfdiConceptos(
    conceptos: readonly CfdiConceptoInput[],
    catalog: CfdiMatchCatalog
): CfdiMatchedConcepto[] {
    const byId = new Map<string, CfdiCatalogProduct>();
    const bySat = new Map<string, CfdiCatalogProduct>();
    const byName = new Map<string, CfdiCatalogProduct>();

    for (const product of catalog.products) {
        byId.set(product.id, product);
        const sat = (product.satProductCode ?? '').trim();
        // `first wins`: con dos productos de la misma clave SAT gana el primero del
        // catálogo, igual que el `g.First()` del escritorio. Es arbitrario a propósito y
        // por eso el mapeo aprendido corrige encima.
        if (sat.length > 0 && !bySat.has(sat)) bySat.set(sat, product);
        const name = normalizeConceptoText(product.name);
        if (!byName.has(name)) byName.set(name, product);
    }

    return conceptos.map((concepto) => {
        const conceptoKey = conceptoKeyFor(concepto.noIdentificacion, concepto.descripcion);
        const suggestedDocumentCharge = suggestsDocumentCharge(concepto);

        let match: CfdiCatalogProduct | undefined;
        let matchedBy: CfdiMatchSource = 'NONE';

        const learnedId = catalog.learned[conceptoKey];
        if (learnedId) {
            match = byId.get(learnedId);
            if (match) matchedBy = 'LEARNED';
        }

        if (!match && !suggestedDocumentCharge) {
            const clave = (concepto.claveProdServ ?? '').trim();
            if (clave.length > 0) {
                match = bySat.get(clave);
                if (match) matchedBy = 'SAT';
            }
            if (!match) {
                match = byName.get(normalizeConceptoText(concepto.descripcion));
                if (match) matchedBy = 'NAME';
            }
        }

        return {
            ...concepto,
            conceptoKey,
            matchedProductId: match?.id ?? null,
            matchedProductName: match?.name ?? null,
            matchedBy: match ? matchedBy : 'NONE',
            suggestedDocumentCharge,
        };
    });
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
