/**
 * @fileoverview Lo que contesta «Importar CFDI»: qué es cada archivo y qué se puede hacer con él.
 * @module Contracts/Purchase/Responses/CfdiImport
 */

import type { CfdiFileState, CfdiLinkOutcome, CfdiPurchaseCandidate } from '../cfdiImport.js';
import type { PurchaseResponse } from './PurchaseResponse.js';

export interface ImportedCfdiFileResponse {
    readonly fileName: string | null;
    readonly uuid: string | null;
    readonly estado: CfdiFileState;
    /** Se puede marcar para convertir (o enlazar, si `candidata`). */
    readonly convertible: boolean;
    /** Sale marcado de fábrica. */
    readonly marcado: boolean;
    /** Por qué, en palabras del dueño. */
    readonly motivo: string;
    /** Id en el Buzón (`received_cfdi`), cuando entró o ya estaba. */
    readonly cfdiId: string | null;
    readonly issuerRfc: string | null;
    readonly issuerName: string | null;
    /** El proveedor ya existe en tu catálogo (si no, Convertir lo dará de alta). */
    readonly supplierId: string | null;
    readonly folioDisplay: string | null;
    readonly issuedAt: string | null;
    readonly total: number;
    /** Compra a la que ya pertenece (`YA_CAPTURADO`). */
    readonly linkedDocumentId: string | null;
    readonly linkedDocumentNumber: string | null;
    /** La compra que parece ser (`PARECE_LA_COMPRA`), con la diferencia CFDI − compra. */
    readonly candidata: (CfdiPurchaseCandidate & { readonly diferencia: number }) | null;
    /** Compras cercanas que no cuadran o entre las que hay que elegir. */
    readonly pistas: ReadonlyArray<CfdiPurchaseCandidate & { readonly diferencia: number }>;
}

export interface ImportCfdiFilesResponse {
    readonly items: readonly ImportedCfdiFileResponse[];
    /** La tolerancia de redondeo del negocio (setting `purchases.cfdi-tolerance`). */
    readonly tolerance: number;
}

/** Un ajuste por redondeo: la diferencia entre lo que pagaste y lo que ampara el CFDI, explicada. */
export interface PurchaseCfdiAdjustmentResponse {
    readonly id: string;
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly cfdiId: string;
    readonly cfdiUuid: string;
    readonly cfdiFolio: string | null;
    /** CFDI − compra, con signo: positivo si el comprobante ampara más de lo que capturaste. */
    readonly amount: number;
    readonly reason: 'ROUNDING';
    readonly createdBy: string | null;
    readonly createdAt: string;
    /** Revertido: no se borra, se apaga con fecha y motivo. */
    readonly reversedAt: string | null;
    readonly reversedBy: string | null;
    readonly reversalReason: string | null;
}

export interface LinkCfdiToPurchaseResponse {
    readonly purchase: PurchaseResponse;
    readonly outcome: CfdiLinkOutcome;
    /** CFDI − compra. */
    readonly diferencia: number;
    readonly adjustment: PurchaseCfdiAdjustmentResponse | null;
}
