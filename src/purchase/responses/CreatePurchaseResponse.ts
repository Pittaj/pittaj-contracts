/**
 * @fileoverview DTO de respuesta de la creación/duplicado de una compra.
 * @module Contracts/Purchase
 *
 * Devuelve el documento completo, no solo el id: quien crea necesita ver de
 * inmediato el **folio que asignó la nube** (`CW-#####`) y los importes que derivó
 * de los renglones, sin una segunda petición.
 */

import type { PurchaseResponse } from './PurchaseResponse.js';

/** Respuesta de POST /api/purchases y de POST /api/purchases/:id/duplicate. */
export type CreatePurchaseResponse = PurchaseResponse;
