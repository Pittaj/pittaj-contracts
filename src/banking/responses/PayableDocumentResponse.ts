/**
 * @fileoverview Response DTO del documento por pagar visto desde Tesorería
 * @module PayableDocumentResponse
 * @version 1.0.0
 *
 * Bancos no es dueño de estos documentos: son compras (`purchases`), espejo
 * de la app Compras del desktop. Lo único que Bancos aporta es el saldo, y lo
 * aporta derivándolo — nunca escribiendo en el documento ajeno.
 */

import type { PayableDocumentPrimitives } from '../primitives/index.js';

export interface PayableDocumentResponse extends PayableDocumentPrimitives {}

/** Página de documentos por pagar (GetPayableDocuments). */
export interface PayableDocumentPageResponse {
  readonly items: readonly PayableDocumentResponse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
