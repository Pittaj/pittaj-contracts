/**
 * @fileoverview El historial de solicitudes al SAT · **nada de esto está implementado todavía**.
 * @module Contracts/ReceivedCfdi/Schemas
 * @version 1.0.0
 *
 * ── Qué contesta, y por qué la marca de agua no basta ──
 *
 * `SatDownloadStatusResponse` dice **hasta qué día está cubierto** un equipo. Eso convierte un
 * fallo mudo en uno visible, y es lo que la web enseña hoy. Lo que **no** contesta es la siguiente
 * pregunta, que es la que hace alguien cuando ve el aviso: *«¿y por qué no bajó?»*.
 *
 * La respuesta vive en el escritorio, en `SatDownloadRequest`: qué periodo se pidió, qué contestó
 * el SAT, cuántos comprobantes trajo y **cuál se agotó para siempre**. Hoy esa entidad no tiene
 * pantalla en ninguna parte — ni en la web, que no la conoce, ni en el propio escritorio.
 *
 * ── Espejo del escritorio, que es quien manda ──
 *
 * Los tres vocabularios son copia literal de `Pittaj.Domain/Sat/SatDownloadEnums.cs`. Se escriben
 * aquí **antes** que el sync porque la pantalla se construye antes; cuando el escritorio empiece a
 * empujarlas, este archivo es el que dice qué forma tienen — no al revés.
 *
 * ⚠️ **Push-only, como la marca de agua.** Estas filas nacen en el equipo y la nube no las corrige
 * jamás: sin trigger y sin fuente en el feed de sync. Si alguien las cablea de vuelta, el
 * escritorio empezaría a recibir su propio historial editado por otro equipo.
 */

import { z } from 'zod';

/**
 * En qué punto está la solicitud.
 *
 * 🔴 **`AGOTADA` no es un rechazo más y por eso tiene estado propio.** Significa que el SAT
 * contestó que se acabaron las solicitudes **de por vida** para ese periodo exacto: no se puede
 * volver a pedir nunca, ni mañana ni el año que viene. Contarlo como error corriente invita a
 * reintentar, que es justo lo que quema la única solicitud que quedaba.
 */
export const SAT_DOWNLOAD_REQUEST_STATUSES = [
    /** Creada localmente; todavía no se ha pedido nada al SAT. */
    'PENDIENTE',
    /** El SAT la aceptó y dio folio de solicitud. Toca esperar. */
    'SOLICITADA',
    /** El SAT terminó de prepararla y hay paquetes que recoger. */
    'LISTA',
    /** Los paquetes se bajaron y sus comprobantes entraron al buzón. Fin. */
    'DESCARGADA',
    /** Credencial, periodo inválido o sin comprobantes. Fin. */
    'RECHAZADA',
    /** Se agotó el cupo de por vida de ese periodo. Fin irreversible. */
    'AGOTADA',
] as const;
export type SatDownloadRequestStatusValue = (typeof SAT_DOWNLOAD_REQUEST_STATUSES)[number];

/** Qué se pidió: lo que nos emitieron, o lo que emitimos. */
export const SAT_DOWNLOAD_KINDS = ['RECIBIDOS', 'EMITIDOS'] as const;
export type SatDownloadKindValue = (typeof SAT_DOWNLOAD_KINDS)[number];

/**
 * Cuánto se pidió.
 *
 * La diferencia **no es de tamaño, es de cupo**: `METADATA` (UUID, emisor, total) se puede repetir
 * cuantas veces haga falta; `CFDI` consume las dos solicitudes de por vida del periodo. Por eso el
 * barrido pregunta con metadata y solo baja XML cuando hay algo nuevo, y por eso la pantalla tiene
 * que distinguirlas: una lista donde las dos se ven igual sugiere reintentar la cara.
 */
export const SAT_DOWNLOAD_PAYLOADS = ['METADATA', 'CFDI'] as const;
export type SatDownloadPayloadValue = (typeof SAT_DOWNLOAD_PAYLOADS)[number];

/** Cuántas veces se puede pedir el MISMO periodo, en toda la vida del RFC. */
export const MAX_SOLICITUDES_POR_PERIODO = 2;

/**
 * 🆕 `GET /api/sat-download-requests` — **sin implementar**.
 *
 * `deviceId` filtra por equipo porque el historial solo tiene sentido junto a la marca de agua:
 * se llega aquí desde la ficha de una computadora concreta.
 */
export const listSatDownloadRequestsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    deviceId: z.string().uuid().optional(),
    status: z.enum(SAT_DOWNLOAD_REQUEST_STATUSES).optional(),
    kind: z.enum(SAT_DOWNLOAD_KINDS).optional(),
    payload: z.enum(SAT_DOWNLOAD_PAYLOADS).optional(),
    /** Acota por el periodo **solicitado**, no por cuándo se pidió. */
    periodFrom: z.string().datetime().optional(),
    periodTo: z.string().datetime().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListSatDownloadRequestsInput = z.infer<typeof listSatDownloadRequestsSchema>;

/**
 * Estados que **no** viajan a la nube: los que acabaron bien y no dejan nada que investigar.
 *
 * Ver `pushSatDownloadRequestsSchema` para el porqué. Se exporta para que el escritorio filtre
 * con la misma lista y no con una condición escrita a mano que se desincronice.
 */
export const SAT_REQUEST_STATUSES_NO_VIAJAN = ['DESCARGADA'] as const;

/** Lo que sí viaja: lo que está en curso o acabó mal. */
export const SAT_REQUEST_STATUSES_QUE_VIAJAN = [
    'PENDIENTE',
    'SOLICITADA',
    'LISTA',
    'RECHAZADA',
    'AGOTADA',
] as const;
export type SatRequestStatusQueViajaValue = (typeof SAT_REQUEST_STATUSES_QUE_VIAJAN)[number];

/**
 * Resumen de un día de barrido en un equipo.
 *
 * Es lo que sustituye a las filas que no viajan: una por día y equipo en vez de las ~2 diarias que
 * dicen «descargada, 14 comprobantes». Con esto la nube puede pintar «128 descargadas · 1,904
 * comprobantes» sin cargar 700 filas al año por máquina.
 */
export const satDownloadDaySummarySchema = z.object({
    /** `YYYY-MM-DD` del día barrido, en la zona del equipo. */
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Solicitudes que terminaron bien ese día. */
    downloaded: z.number().int().min(0),
    /** Comprobantes que entraron al buzón por ellas. */
    cfdiCount: z.number().int().min(0),
});

export type SatDownloadDaySummaryInput = z.infer<typeof satDownloadDaySummarySchema>;

/**
 * 🆕 Empuje del historial, del escritorio a la nube — **sin implementar**.
 *
 * Mismo patrón que `satDownloadStatus`: el equipo manda lo suyo y la nube lo guarda tal cual.
 *
 * 🔴 **No sube todo, y es decisión del dueño (2026-08-15).** Un barrido diario son ~700 filas al
 * año **por equipo**, y casi todas dicen «descargada, 14 comprobantes»: engordan el sync para algo
 * que solo se mira cuando algo falla. Así que viaja **lo que está en curso o acabó mal**
 * (`SAT_REQUEST_STATUSES_QUE_VIAJAN`) más un **resumen por día**; el detalle de lo que salió bien
 * se queda en la máquina, donde además se consulta sin nube.
 *
 * Consecuencia que la pantalla tiene que respetar: **la lista de filas no es el historial
 * completo**, así que sus contadores de «descargadas» y de comprobantes salen del resumen y no de
 * contar renglones. Contarlos daría siempre cero descargas y un buzón que parecería vacío.
 */
export const pushSatDownloadRequestsSchema = z.object({
    deviceId: z.string().uuid(),
    summaries: z.array(satDownloadDaySummarySchema).max(400).default([]),
    requests: z
        .array(
            z.object({
                id: z.string().uuid(),
                kind: z.enum(SAT_DOWNLOAD_KINDS),
                payload: z.enum(SAT_DOWNLOAD_PAYLOADS),
                periodStart: z.string().datetime(),
                periodEnd: z.string().datetime(),
                /** `DESCARGADA` no se acepta: esa va en el resumen del día. */
                status: z.enum(SAT_REQUEST_STATUSES_QUE_VIAJAN),
                /** Folio que dio el SAT. `null` mientras está `PENDIENTE`. */
                satRequestId: z.string().max(64).nullable(),
                packageIds: z.array(z.string().max(64)).default([]),
                checkCount: z.number().int().min(0),
                cfdiCount: z.number().int().min(0),
                lastError: z.string().max(1000).nullable(),
                requestedAt: z.string().datetime(),
                lastCheckedAt: z.string().datetime().nullable(),
                completedAt: z.string().datetime().nullable(),
            }),
        )
        .max(500),
});

export type PushSatDownloadRequestsInput = z.infer<typeof pushSatDownloadRequestsSchema>;
