/**
 * @fileoverview Response del CHANGE-FEED de sync (pull consolidado).
 * @module sync/responses/SyncFeedPullResponse
 * @version 1.0.0
 */

import type { SyncOperation } from '../schemas/syncSchemas';
import type { SyncTier } from '../schemas/feedSchemas';

/**
 * Una entrada del feed = un hecho de cambio en la nube.
 *
 * `data` carga el snapshot PLANO de la entidad (mismo shape que el pull
 * per-entidad que ya aplica el desktop) para que el pull sea UN solo round
 * trip: el cliente despacha por `entityType` al applier correspondiente.
 * En `delete` va null.
 */
export interface SyncFeedChange {
    /** Tipo de entidad (customer, product, tax, ...). */
    readonly entityType: string;
    /** ID de la entidad afectada. */
    readonly entityId: string;
    /** Operación aplicada. */
    readonly operation: SyncOperation;
    /** Nivel de prioridad de la entidad. */
    readonly tier: SyncTier;
    /** Snapshot plano de la entidad (null en delete). */
    readonly data: Record<string, unknown> | null;
    /** Momento del cambio (reloj del servidor); base del orden del feed. */
    readonly occurredAt: Date;
    /**
     * Dispositivo que originó el cambio (o null si nació en la web). El cliente
     * salta las filas cuyo `originDeviceId` es el suyo (ya las tiene).
     */
    readonly originDeviceId: string | null;
}

/** Response de POST /api/sync/pull. */
export interface SyncFeedPullResponse {
    /** Cambios de esta página, en orden de aplicación. */
    readonly changes: SyncFeedChange[];
    /**
     * Checkpoint OPACO para la siguiente llamada. El cliente lo guarda y lo
     * reenvía como `cursor`; no debe interpretar su contenido.
     */
    readonly nextCursor: string;
    /** Hay más páginas después de `nextCursor`. */
    readonly hasMore: boolean;
}
