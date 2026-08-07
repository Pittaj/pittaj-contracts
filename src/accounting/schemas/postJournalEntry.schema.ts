/**
 * @fileoverview Zod schema de la póliza manual y de la reversa.
 * @module Contracts/Accounting
 *
 * La captura manual es **el escape, no el camino**: nómina externa, depreciación y los ajustes
 * del contador. Todo lo que la suite produce como documento se contabiliza solo.
 *
 * **Una póliza cerrada no se edita: se revierte.** Corregir es una póliza nueva en el periodo
 * abierto, igual que cualquier estado terminal de la suite.
 */

import { z } from 'zod';
import { JOURNAL_ENTRY_TYPES } from '../responses/AccountingResponses.js';

/** Una partida. O carga o abona, nunca las dos ni ninguna. */
export const journalLineSchema = z
    .object({
        ledgerAccountId: z.string().uuid('La cuenta debe ser un UUID'),
        description: z.string().max(300).optional(),
        debit: z.number().min(0).default(0),
        credit: z.number().min(0).default(0),
        locationId: z.string().max(36).nullable().optional(),
    })
    .refine((l) => (l.debit > 0) !== (l.credit > 0), {
        message: 'Cada partida carga o abona, no las dos ni ninguna',
    });

export const postJournalEntrySchema = z
    .object({
        type: z.enum(JOURNAL_ENTRY_TYPES),
        /** `YYYY-MM-DD`. Si el mes está cerrado, cae en el primer periodo abierto. */
        entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
        concept: z.string().min(3, 'El concepto es obligatorio').max(300),
        lines: z.array(journalLineSchema).min(2, 'Una póliza necesita al menos dos partidas'),
    })
    .refine(
        (e) => {
            const cargos = Math.round(e.lines.reduce((s, l) => s + (l.debit ?? 0), 0) * 100);
            const abonos = Math.round(e.lines.reduce((s, l) => s + (l.credit ?? 0), 0) * 100);
            return cargos === abonos;
        },
        { message: 'La póliza no cuadra: los cargos y los abonos tienen que ser iguales' },
    );

export type PostJournalEntryBody = z.infer<typeof postJournalEntrySchema>;

/** Body de POST /journal-entries/:id/reverse. */
export const reverseJournalEntrySchema = z.object({
    /** Por qué se revierte. Sin motivo, la reversa no se puede auditar. */
    reason: z.string().min(3, 'El motivo es obligatorio').max(300),
});

export type ReverseJournalEntryBody = z.infer<typeof reverseJournalEntrySchema>;

/** Body de POST /companies/:companyId/fiscal-years. */
export const openFiscalYearSchema = z.object({
    year: z.number().int().min(2000).max(2100),
});

export type OpenFiscalYearBody = z.infer<typeof openFiscalYearSchema>;
