/**
 * @fileoverview Schemas Zod para sincronización de Department
 * @module Contracts/Department/Schemas/Sync
 * @version 1.0.0
 *
 * Derivan del protocolo canónico de src/sync (fuente única de verdad),
 * igual que company/customer. NO se redefinen aquí.
 *
 * NOTA: department en la nube es tenant-scoped SIN companyId; si el
 * snapshot del desktop trae companyId extra en `data`, el schema
 * canónico lo permite (data es record) y el backend lo ignora.
 */

import { syncPushRequestSchema, syncPullRequestSchema } from '../../sync';

/** POST /api/departments/sync/push — deriva del canónico src/sync */
export const syncPushDepartmentSchema = syncPushRequestSchema;

/** POST /api/departments/sync/pull — deriva del canónico src/sync */
export const syncPullDepartmentSchema = syncPullRequestSchema;
