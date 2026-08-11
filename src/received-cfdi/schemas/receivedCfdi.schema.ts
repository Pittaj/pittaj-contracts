/**
 * @fileoverview Vocabulario del buzón de comprobantes recibidos.
 * @module Contracts/ReceivedCfdi/Schemas
 * @version 1.0.0
 *
 * Espejo del agregado `ReceivedCfdi` del escritorio
 * (`Pittaj.Domain/Cfdi/ReceivedCfdi.cs`), que es quien manda: los comprobantes los
 * baja el escritorio del SAT —ahí vive la e.firma— y la nube los recibe por sync.
 */

import { z } from 'zod';

/**
 * Estado en la bandeja.
 *
 * ⚠️ **Son tres y no cuatro a propósito.** La cancelación en el SAT NO es un estado:
 * un comprobante ya vinculado a una compra que el emisor cancela después es el caso
 * caro —dedujiste algo que dejó de existir— y meterlo aquí borraría el vínculo que lo
 * hace visible. Viaja aparte, en `cancelledAtSat`.
 */
export const RECEIVED_CFDI_STATUSES = ['NUEVO', 'VINCULADO', 'IGNORADO'] as const;
export type ReceivedCfdiStatusValue = (typeof RECEIVED_CFDI_STATUSES)[number];

/** De dónde salió: lo subió una persona, o lo trajo la descarga masiva del SAT. */
export const RECEIVED_CFDI_ORIGINS = ['MANUAL', 'SAT'] as const;
export type ReceivedCfdiOriginValue = (typeof RECEIVED_CFDI_ORIGINS)[number];

/** Qué clase de documento nuestro quedó ligado al comprobante. */
export const RECEIVED_CFDI_LINK_KINDS = ['PURCHASE', 'SUPPLIER_NOTE'] as const;
export type ReceivedCfdiLinkKindValue = (typeof RECEIVED_CFDI_LINK_KINDS)[number];

/**
 * Tope del XML que se acepta por comprobante.
 *
 * Un CFDI real ronda los 5–15 KB; 512 KB deja aire de sobra para uno con cientos de
 * conceptos. El tope existe porque el XML viaja **entero** en el payload del sync, y sin
 * él un archivo corrupto de 40 MB tumbaría la página de sincronización de una tienda.
 */
export const RECEIVED_CFDI_MAX_XML_BYTES = 512 * 1024;

/** Query params de GET /api/received-cfdis. */
export const getReceivedCfdisSchema = z.object({
    status: z.enum(RECEIVED_CFDI_STATUSES).optional(),
    origin: z.enum(RECEIVED_CFDI_ORIGINS).optional(),
    issuerRfc: z.string().max(13).optional(),
    /** Texto libre: emisor, RFC, UUID o folio. */
    search: z.string().max(100).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    /** Solo los que el emisor canceló en el SAT. Es la lista que hay que revisar. */
    onlyCancelledAtSat: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetReceivedCfdisQuery = z.infer<typeof getReceivedCfdisSchema>;

/** Param de ruta `:id`. */
export const receivedCfdiIdParamSchema = z.object({
    id: z.string().uuid(),
});
