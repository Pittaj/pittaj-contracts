/**
 * @fileoverview Respuesta del comando SyncPush de productos
 * @module SyncPushProductResponse
 * @version 1.0.0
 */

/**
 * Resultado de una operación individual de sync push.
 *
 * @interface SyncPushItemResult
 * @since 1.0.0
 */
export interface SyncPushItemResult {
    /** ID de la entidad procesada. */
    readonly id: string;

    /** Si la operación fue exitosa. */
    readonly success: boolean;

    /** Tipo de operación aplicada. */
    readonly operation: 'create' | 'update' | 'delete' | 'upsert';

    /** Error descriptivo si falló. */
    readonly error?: string;
}

/**
 * Resultado del lote de sincronización push.
 *
 * @interface SyncPushProductResponse
 * @since 1.0.0
 */
export interface SyncPushProductResponse {
    /** Total de cambios procesados. */
    readonly processed: number;

    /** Total de cambios exitosos. */
    readonly succeeded: number;

    /** Total de cambios fallidos. */
    readonly failed: number;

    /** Detalle por cada operación. */
    readonly results: SyncPushItemResult[];
}
