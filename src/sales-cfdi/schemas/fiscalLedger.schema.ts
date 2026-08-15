/**
 * @fileoverview Consultas de lo emitido: el libro fiscal y las dos listas que aún no existen.
 * @module Contracts/SalesCfdi/Schemas
 * @version 1.0.0
 *
 * ── Dos lectores con necesidades distintas ──
 *
 * **El motor de posteo** pide un periodo entero de una vez y no pagina: necesita *todo* o su
 * póliza sale coja. Ése es `getFiscalLedgerSchema`, y ya está desplegado.
 *
 * **Una persona** pide una pantalla: pagina, filtra y busca. Ése es `listEmittedCfdiSchema`, que
 * **todavía no existe en el backend** — se escribe aquí primero, a propósito, porque la pantalla
 * se construye antes que él.
 */

import { z } from 'zod';
import { FISCAL_SOURCE_TYPES, SALE_CFDI_STATUSES } from './saleCfdi.schema.js';

/**
 * Tope de la ventana del libro fiscal, en días.
 *
 * Un año cubre el ejercicio completo, que es el caso extremo real (el cierre anual). Más que eso
 * no es una consulta: es una exportación, y tiene otro camino.
 */
export const MAX_DIAS_LEDGER = 366;

/**
 * `GET /api/sales-cfdi/fiscal-ledger` — lo timbrado de un periodo, para el motor de posteo.
 *
 * Devuelve **solo `STAMPED` y `CANCELLED`**: los `PENDING` y `FAILED` no existen ante el SAT y no
 * tienen UUID que declarar. Los cancelados sí salen — una cancelación es un hecho contable y la
 * póliza que usó el comprobante tiene que poder enterarse.
 */
export const getFiscalLedgerSchema = z
    .object({
        from: z.string().datetime(),
        to: z.string().datetime(),
    })
    .superRefine((v, ctx) => {
        const from = new Date(v.from);
        const to = new Date(v.to);
        if (to < from) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['to'],
                message: 'El fin del periodo no puede ser anterior al inicio',
            });
            return;
        }
        if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_DIAS_LEDGER) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['to'],
                message: `El periodo no puede exceder ${MAX_DIAS_LEDGER} días`,
            });
        }
    });

export type GetFiscalLedgerInput = z.infer<typeof getFiscalLedgerSchema>;

/**
 * 🆕 `GET /api/sales-cfdi/emitted` — **sin implementar todavía**.
 *
 * El panel del emisor: qué facturé, qué cancelé y qué se quedó en el intento. Es la pantalla que
 * hoy no existe en ningún lado — lo emitido solo se ve **ticket por ticket**, así que nadie puede
 * mirar un mes entero.
 *
 * A diferencia del libro fiscal, aquí **sí** entran `PENDING` y `FAILED`, y ésa es la mitad del
 * valor: un timbrado que falló y nadie reintentó es una venta cobrada y no facturada, y el único
 * sitio donde eso se ve es una lista que los incluya.
 */
export const listEmittedCfdiSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    sourceType: z.enum(FISCAL_SOURCE_TYPES).optional(),
    status: z.enum(SALE_CFDI_STATUSES).optional(),
    /** RFC del receptor, exacto. */
    receiverRfc: z.string().trim().min(12).max(13).optional(),
    /** Folio fiscal, serie-folio o nombre del receptor. */
    search: z.string().trim().max(120).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListEmittedCfdiInput = z.infer<typeof listEmittedCfdiSchema>;

/**
 * 🆕 `GET /api/sales-cfdi/pending-reps` — **sin implementar todavía**.
 *
 * Las ventas a crédito (PPD) con abonos cobrados y sin complemento timbrado. Es una **obligación
 * con fecha**: el SAT exige el REP a más tardar el día 5 del mes siguiente al pago, y hoy esa
 * lista no existe en ninguna pantalla — hay que abrir ticket por ticket para encontrarla.
 *
 * `dueBefore` deja pedir «lo que vence este mes» sin que la pantalla recalcule el día 5.
 */
export const listPendingRepsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    /** Solo los abonos cobrados hasta esta fecha (ISO). */
    paidUntil: z.string().datetime().optional(),
    /** Solo lo que vence antes de esta fecha (ISO): la lista de «se me pasa este mes». */
    dueBefore: z.string().datetime().optional(),
    /** Incluye también los ya vencidos. Por omisión sí: esconderlos no los quita. */
    includeOverdue: z.coerce.boolean().default(true),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListPendingRepsInput = z.infer<typeof listPendingRepsSchema>;
