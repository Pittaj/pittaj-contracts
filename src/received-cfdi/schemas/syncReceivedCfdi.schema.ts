/**
 * @fileoverview Schemas Zod para sincronización de ReceivedCfdi.
 * @module Contracts/ReceivedCfdi/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que purchase/tax/customer. NO se redefinen aquí.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync/index.js';

/** POST /api/received-cfdis/sync/push — deriva del canónico src/sync */
export const syncPushReceivedCfdiSchema = syncPushRequestSchema;

/** POST /api/received-cfdis/sync/pull — deriva del canónico src/sync */
export const syncPullReceivedCfdiSchema = syncPullRequestSchema;

/**
 * POST /api/sat-download-statuses/sync/push — la marca de agua del barrido.
 *
 * Mismo sobre canónico que el resto: lo que cambia es el `data` de cada change, que el dominio
 * valida al reconstruir. Va por el protocolo de sync y no por un endpoint propio para que herede
 * gratis el reintento, el cursor y la tolerancia a fallos por change.
 */
export const syncPushSatDownloadStatusSchema = syncPushRequestSchema;

/** POST /api/sat-download-statuses/sync/pull — el otro equipo se entera de quién descarga. */
export const syncPullSatDownloadStatusSchema = syncPullRequestSchema;
