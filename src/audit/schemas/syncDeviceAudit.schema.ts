/**
 * @fileoverview Schema Zod del push de la bitácora del escritorio.
 * @module Contracts/Audit/Schemas
 *
 * Deriva del protocolo canónico de src/sync. Solo push: la bitácora de una máquina no baja a las
 * demás — el archivo vive en la nube y se lee desde la web.
 */

import { z } from 'zod';
import { syncPushRequestSchema } from '../../sync';

/** POST /api/device-audit-logs/sync/push */
export const syncPushDeviceAuditSchema = syncPushRequestSchema;

/**
 * GET /api/device-audit-logs — filtros de la bitácora de instalaciones.
 *
 * `entityType` y `operation` son los dos ejes por los que alguien pregunta de verdad
 * ("qué le pasó a los productos", "qué se borró"). `deviceId` acota a una caja concreta,
 * que es la pregunta cuando algo cuadra mal en una tienda y no en las otras.
 */
export const getDeviceAuditLogsSchema = z.object({
    entityType: z.string().max(60).optional(),
    operation: z.enum(['create', 'update', 'delete']).optional(),
    deviceId: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type GetDeviceAuditLogsQuery = z.infer<typeof getDeviceAuditLogsSchema>;
