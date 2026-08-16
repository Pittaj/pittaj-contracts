/**
 * @fileoverview Lo que el SAT dice de MIS comprobantes · fase 1 de la conciliación.
 * @module Contracts/SalesCfdi/Schemas
 * @version 1.0.0
 *
 * ── La pregunta ──
 *
 * *«¿Alguien canceló algo mío sin que Pittaj se enterara?»* Pasa cuando la cancelación se hace desde
 * el portal del PAC o del SAT, por fuera del producto. Y es el caso caro: para entonces el
 * comprobante **ya está en una póliza y en una declaración**.
 *
 * ── 🔴 Por qué esto NO se escribe en `cancelledAt` ──
 *
 * Las tablas de comprobantes ya tienen `cancelledAt`, y significa **«yo lo cancelé»**. Lo que este
 * barrido descubre es otra cosa: **«el SAT dice que está cancelado y yo no lo sabía»**. Escribirlo
 * en la misma columna hace desaparecer la diferencia justo cuando importa — el comprobante se vería
 * «cancelado», que parece correcto, y el problema contable se volvería invisible.
 *
 * Es la misma decisión que ya se tomó en el buzón para los comprobantes **recibidos**: la
 * cancelación del SAT es **un campo aparte**, no un estado.
 *
 * ── Corre en la nube, y esto es lo que lo permite ──
 *
 * La consulta de estatus es el **servicio público de verificación**: le basta emisor, receptor,
 * total y UUID. **No necesita la e.firma y no consume el cupo** de dos solicitudes por periodo —ese
 * límite es del servicio de descarga masiva, que es otro—. Por eso este barrido puede vivir en la
 * nube y ser **el primer trozo del ciclo fiscal que no depende de que alguien encienda una
 * computadora**. Decisión del dueño, 2026-08-16.
 */

import { z } from 'zod';

/**
 * Lo que contesta el servicio en el campo `Estado`.
 *
 * Se guarda **el texto tal cual lo manda el SAT**, no un enum nuestro: si mañana añaden un valor,
 * un enum lo convertiría en un error de validación y perderíamos la respuesta entera. Lo que sí es
 * nuestro es cómo se interpreta, y eso vive en `esCanceladoSegunSat`.
 */
export const SAT_ESTADOS_CONOCIDOS = ['Vigente', 'Cancelado', 'No Encontrado'] as const;
export type SatEstadoConocido = (typeof SAT_ESTADOS_CONOCIDOS)[number];

/**
 * `ValidacionEFOS = 100` significa **que NO está en la lista** del 69-B.
 *
 * El valor positivo es el bueno, que es justo al revés de lo que uno supone leyendo el número.
 * Aquí importa menos que en el buzón —el emisor somos nosotros— pero viaja igual: si nuestro propio
 * RFC apareciera ahí, es lo primero que habría que saber.
 */
export const EFOS_LIMPIO = '100';

/** ¿El SAT lo da por cancelado? Una función y no una comparación suelta, para que no se repita mal. */
export function esCanceladoSegunSat(estado: string | null | undefined): boolean {
    return (estado ?? '').trim().toLowerCase().startsWith('cancel');
}

/**
 * `POST /api/sales-cfdi/sat-status/refresh` — una pasada del barrido.
 *
 * `limit` topa cuántos se consultan de una vez: el SAT es un servicio público y lento, y la pasada
 * corre dentro de una petición. Se recorre por lotes, como el barrido del buzón.
 */
export const refreshSatEmittedStatusSchema = z.object({
    limit: z.coerce.number().int().positive().max(500).default(100),
    /**
     * Vuelve a preguntar por los que ya se consultaron hace menos de estas horas.
     *
     * Por omisión **no**: preguntar dos veces al día por el mismo comprobante no descubre nada y
     * multiplica las llamadas por el histórico entero.
     */
    minHoursSinceCheck: z.coerce.number().int().min(0).max(720).default(24),
});

export type RefreshSatEmittedStatusInput = z.infer<typeof refreshSatEmittedStatusSchema>;
