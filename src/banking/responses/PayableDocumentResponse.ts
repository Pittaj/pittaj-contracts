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
  /**
   * Efecto firmado de las notas de proveedor que **no cuelgan de ningún
   * documento** (nacieron a nivel de proveedor, sin compra de referencia).
   *
   * No se reparten entre los documentos abiertos porque repartirlas sería
   * inventarse un criterio de imputación que nadie pidió: dos notas iguales
   * podrían acabar en facturas distintas según el orden de la página. Se
   * reportan aparte para que la pantalla pueda decirlo en voz alta —"hay
   * $X en notas sin documento"— en lugar de callarlo, que es lo único
   * claramente peor.
   *
   * Respeta el filtro por contraparte: si se pidió un proveedor, es el suyo.
   */
  readonly unassignedNoteAdjustment: number;
}
