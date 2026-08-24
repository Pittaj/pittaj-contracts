/**
 * @fileoverview Respuesta del push de sincronización.
 *
 * **Es el tipo canónico de `shared`, no uno propio.** Antes cada módulo declaraba aquí su
 * `SyncPushItemResult` con `{ id, success, operation, error }` y su propio agregado
 * `{ processed, succeeded, failed }`. Al no compartirlos, `category` quedó con otra forma
 * — `{ id, status, message }` — y el escritorio, que solo entendía la primera, leía como
 * **fallo** los cambios de categoría que la nube había guardado bien.
 *
 * El alias existe para que el nombre por módulo siga funcionando; la forma es una sola.
 */
import type { SyncBatchResult } from '../../shared/index.js';

export type SyncPushPosTicketResponse = SyncBatchResult;
