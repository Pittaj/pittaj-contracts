/**
 * @fileoverview DTO de respuesta de POST /api/sales-returns/process.
 * @module Contracts/SalesReturn
 *
 * Devuelve la devolución creada (con su folio DEV-###### y las líneas), tal cual queda
 * persistida tras la orquestación (reingreso de inventario + resolución del importe).
 */

import type { SalesReturnResponse } from './SalesReturnResponse';

/** Respuesta de POST /api/sales-returns/process. */
export type ProcessReturnResponse = SalesReturnResponse;
