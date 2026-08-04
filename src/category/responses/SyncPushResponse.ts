import type { SyncBatchResult } from '../../shared/index.js';

/**
 * Re-exportar el tipo de dominio como Response del Application Layer.
 * Esto mantiene la separación de capas mientras reutiliza el tipo.
 */
export type SyncPushResponse = SyncBatchResult;
