/**
 * @fileoverview Respuestas del emparejado de conceptos y del alta desde el comprobante.
 * @module Contracts/Purchase/Responses
 */

import type { PurchaseResponse } from './PurchaseResponse.js';
import type { CfdiMatchSource } from '../cfdiMatching.js';

/** Un concepto del CFDI ya emparejado contra el catálogo. */
export interface CfdiMatchedConceptoResponse {
    /** Clave estable del concepto dentro del proveedor. */
    readonly conceptoKey: string;
    readonly claveProdServ: string;
    readonly claveUnidad: string | null;
    readonly noIdentificacion: string | null;
    readonly descripcion: string;
    readonly cantidad: number;
    readonly valorUnitario: number;
    readonly importe: number;
    /** Descuento del CFDI: importe, no porcentaje. */
    readonly descuento: number;
    /** Traslado del concepto como fracción (0.16). */
    readonly taxRate: number;

    readonly matchedProductId: string | null;
    readonly matchedProductName: string | null;
    /**
     * Por dónde emparejó. La pantalla lo usa para explicar: un emparejado `LEARNED` es
     * una decisión que alguien ya tomó, y uno `NAME` es una coincidencia que conviene
     * mirar.
     */
    readonly matchedBy: CfdiMatchSource;
    /** El concepto parece un cargo del documento (flete, maniobras). Sugerencia. */
    readonly suggestedDocumentCharge: boolean;
}

/** POST /api/purchases/cfdi-match. */
export interface CfdiMatchResponse {
    readonly conceptos: readonly CfdiMatchedConceptoResponse[];
    /** Cuántos emparejaron, cuántos no y cuántos son cargo del documento. */
    readonly matched: number;
    readonly unmatched: number;
    readonly documentCharges: number;
}

/** POST /api/purchases/from-cfdi. */
export interface CreatePurchaseFromCfdiResponse {
    readonly purchase: PurchaseResponse;
    /** Productos dados de alta en el lote (distintos). */
    readonly productsCreated: number;
    /** Equivalencias guardadas o reapuntadas para la próxima factura. */
    readonly linksRemembered: number;
}

/** Una equivalencia aprendida: concepto del proveedor → producto del catálogo. */
export interface SupplierProductLinkResponse {
    readonly conceptoKey: string;
    readonly productId: string;
    readonly description: string;
}

/** GET /api/purchases/supplier-links?rfc= */
export interface SupplierProductLinksResponse {
    readonly items: readonly SupplierProductLinkResponse[];
}
