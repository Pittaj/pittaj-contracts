/**
 * @fileoverview Respuesta de sincronización Pull de productos
 * @module SyncPullProductResponse
 * @version 1.0.0
 */

import type { ProductResponse } from './ProductResponse';

/**
 * Resultado de sincronización Pull de productos.
 *
 * @interface SyncPullProductResponse
 * @since 1.0.0
 */
export interface SyncPullProductResponse {
    /** Productos modificados desde el último sync. */
    readonly changes: ProductResponse[];

    /** Timestamp del sync actual. */
    readonly lastSyncedAt: Date;

    /** Indica si hay más cambios pendientes (paginación). */
    readonly hasMore: boolean;
}
