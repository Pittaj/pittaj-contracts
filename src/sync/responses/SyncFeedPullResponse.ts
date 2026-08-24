/**
 * @fileoverview Response del CHANGE-FEED de sync (pull consolidado).
 * @module sync/responses/SyncFeedPullResponse
 * @version 1.0.0
 */

import type { SyncOperation } from '../schemas/syncSchemas.js';
import type { SyncTier } from '../schemas/feedSchemas.js';

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
    /**
     * Cuántos segundos esperar antes de volver a preguntar. **Lo decide el servidor.**
     *
     * ── Por qué el servidor y no la configuración del cliente ──
     *
     * Con cajas instaladas en negocios ajenos **no se puede cambiar la frecuencia de sondeo
     * redesplegando**: haría falta una campaña de actualización. Si el periodo viaja en cada
     * respuesta, la flota entera se ajusta desde la nube en el tiempo que tarda un despliegue.
     * Esa propiedad vale más que el ahorro concreto — es la diferencia entre corregir un problema
     * de costo en diez minutos o en semanas.
     *
     * ── Y por qué importa tanto el valor cuando no hay nada ──
     *
     * La base **suspende su cómputo tras unos minutos de inactividad**, y factura por horas
     * encendida. Un sondeo cada 60 s no es inactividad: la mantiene despierta 24/7 por una sola
     * caja encendida. Para que llegue a dormir, el periodo ocioso tiene que superar esa ventana
     * **con margen** — un latido de 5 minutos contra un umbral de 5 minutos no sirve de nada.
     *
     * El cliente **acota** el valor a un rango sano antes de usarlo: un servidor que conteste 0
     * convertiría la flota en un bucle cerrado, y uno que conteste un día dejaría cajas mudas.
     */
    readonly nextPollSeconds: number;
}
