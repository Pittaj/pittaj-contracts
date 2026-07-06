/**
 * @fileoverview Schemas Zod del CHANGE-FEED de sync (pull consolidado).
 * @module sync/schemas/feed
 * @version 1.0.0
 *
 * Rediseño de sync (2026-07): en vez de un pull por entidad (que no escala a
 * las ~120 entidades de la suite), un ÚNICO endpoint de feed por tenant. El
 * cliente lo drena con un CURSOR OPACO en una sola llamada, sin importar
 * cuántos tipos de entidad existan.
 *
 * El cursor es opaco A PROPÓSITO: hoy el servidor lo implementa fusionando las
 * tablas por `coalesce(updated_at, created_at)` (cursor = timestamp); mañana
 * puede ser un `seq` de una tabla outbox dedicada. El cliente lo trata como
 * caja negra (lo guarda y lo reenvía), así el transporte del servidor puede
 * evolucionar sin tocar cliente ni contrato.
 *
 * El `tier` es una etiqueta de PRIORIDAD sobre el mismo feed (no un transporte
 * separado): HOT = cambia a cada rato (precios, existencias), COLD = casi nunca
 * (impuestos, config). El cliente puede filtrar por tier para drenar la vía
 * rápida sin arrastrar una importación masiva fría.
 */

import { z } from 'zod';

/** Nivel de frecuencia/prioridad de cambio de una entidad. */
export const syncTierEnum = z.enum(['hot', 'warm', 'cold']);

/**
 * POST /api/sync/pull — request del feed consolidado.
 *
 * - `cursor` = checkpoint opaco devuelto por la llamada anterior. Ausente/""
 *   → desde el inicio (primer pull / re-sync completo del tenant).
 * - `tiers` = filtro opcional; ausente → todos los tiers.
 * - `limit` = tamaño de página; el cliente reitera con el `nextCursor` devuelto
 *   mientras `hasMore` sea true.
 */
export const syncFeedPullRequestSchema = z.object({
    tenantId: z.string().uuid(),
    cursor: z.string().max(200).optional(),
    tiers: z.array(syncTierEnum).nonempty().optional(),
    limit: z.number().int().min(1).max(500).default(200),
});

// ============================================================
// Tipos inferidos
// ============================================================

export type SyncTier = z.infer<typeof syncTierEnum>;
export type SyncFeedPullRequest = z.infer<typeof syncFeedPullRequestSchema>;
