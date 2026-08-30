/**
 * @fileoverview Zod schema para query params del listado de compras.
 * @module Contracts/Purchase
 *
 * GET /api/purchases — lista paginada (orden createdAt desc) con filtros
 * opcionales de estado, naturaleza (kind), proveedor y rango de fechas. Espejo
 * (lectura) de la lista de Órdenes de Compra del desktop (ComprasPage).
 */

import { z } from 'zod';

/**
 * Estados GUARDADOS de la compra (espejo de PurchaseStatus).
 *
 * ⚠️ `RECEIVED` se retiró (F5.1c): lo que se guarda es solo Borrador / Vigente /
 * Cancelada. El filtro por el eje de mercancía (recibida, en parte…) se sirve
 * derivado; aquí solo viaja lo que se persiste.
 */
export const PURCHASE_STATUSES = ['DRAFT', 'ACTIVE', 'CANCELLED'] as const;

/**
 * Naturaleza del documento (espejo de `PurchaseKind` del escritorio).
 *
 * - `INVENTORY` — mercancía para revender: postea existencias al recibirse.
 * - `EXPENSE` — flete, renta, servicios: no toca inventario y se deduce entero.
 * - `FIXED_ASSET` — lo que se compra **para usar**: no toca inventario, se
 *   capitaliza contra `15x` y se deprecia mes a mes (LISR art. 34).
 *
 * **Inventario es lo que compras para revender; activo es lo que compras para
 * usar.** La misma computadora es `INVENTORY` en una tienda de cómputo y
 * `FIXED_ASSET` en una de abarrotes, así que el tipo lo decide quien captura.
 *
 * ⚠️ **`FIXED_ASSET` son once caracteres** y la columna `kind` era `varchar(10)`
 * en Postgres, que sí enforza el largo: el sync moría con *value too long*. Se
 * ensanchó a 20 en las dos puntas (migración `0039` en la nube,
 * `WidenPurchaseKind` en el escritorio). Un valor nuevo más largo vuelve a
 * necesitar las dos — y el fallo se vería **solo al sincronizar**, porque SQLite
 * ignora el largo de un varchar.
 */
export const PURCHASE_KINDS = ['INVENTORY', 'EXPENSE', 'FIXED_ASSET'] as const;

export type PurchaseKindValue = (typeof PURCHASE_KINDS)[number];

/**
 * Query params de GET /api/purchases.
 *
 * `search` y `locationId` entraron con el editor web (F5.1): el buscador no existía
 * en ninguna de las dos plataformas y la sucursal no se mostraba aunque `locationId`
 * ya viajaba en el contrato.
 */
export const getPurchasesSchema = z.object({
    /** Folio, proveedor, folio del comprobante o UUID del CFDI (contiene, sin distinguir mayúsculas). */
    search: z.string().trim().max(100).optional(),
    status: z.enum(PURCHASE_STATUSES).optional(),
    kind: z.enum(PURCHASE_KINDS).optional(),
    supplierId: z.string().uuid().optional(),
    /** Sucursal de la compra. */
    locationId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetPurchasesQuery = z.infer<typeof getPurchasesSchema>;
