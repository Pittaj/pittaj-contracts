import type { SyncChangeResult } from './SyncChangeResult.js';

/**
 * Lo que la nube contesta a un push: el veredicto de cada cambio, más el resumen.
 *
 * ── Este tipo es OBLIGATORIO para todo handler de push ──
 *
 * No es una recomendación. Hasta el 2026-08-24 este tipo existía y **nada obligaba a usarlo**:
 * cada módulo declaraba su propio `SyncPushItemResult` local, así que el compilador nunca enfrentó
 * a los 32 entre sí. El resultado fue que **31 módulos contestaban una forma y uno la otra**:
 *
 *     31 módulos → { id, success, operation, error }   +  { processed, succeeded, failed }
 *     category   → { id, status,  message }            +  { applied, conflicts, errors }
 *
 * El escritorio solo entendía la primera. Así que **un cambio de categoría que la nube guardaba
 * bien se leía en la caja como fallo**: se quedaba en la cola, se reintentaba y acababa en error.
 * La nube tenía el dato y la caja creía que no. Meses así, sin una sola alarma.
 *
 * Por eso los tipos locales se borraron: **si tu handler no importa este tipo, puede divergir, y
 * si puede divergir lo hará.** El compilador es lo único que lo impide de verdad.
 *
 * ── Los cuatro números ──
 *
 * `processed` es el total y los otros tres lo desglosan, así que
 * `applied + conflicts + errors === processed`. Se mandan aunque se puedan contar desde
 * `results`, porque son lo que se enseña y se registra sin recorrer el arreglo entero.
 */
export interface SyncBatchResult {
  readonly processed: number;
  readonly applied: number;
  readonly conflicts: number;
  readonly errors: number;
  readonly results: SyncChangeResult[];
}
