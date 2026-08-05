/**
 * @fileoverview Schema Zod del push de la bitácora del escritorio.
 * @module Contracts/Audit/Schemas
 *
 * Deriva del protocolo canónico de src/sync. Solo push: la bitácora de una máquina no baja a las
 * demás — el archivo vive en la nube y se lee desde la web.
 */

import { syncPushRequestSchema } from '../../sync';

/** POST /api/device-audit-logs/sync/push */
export const syncPushDeviceAuditSchema = syncPushRequestSchema;
