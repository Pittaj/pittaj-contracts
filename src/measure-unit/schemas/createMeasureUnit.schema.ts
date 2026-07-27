/**
 * @fileoverview Zod schema para crear una unidad de medida.
 *
 * Réplica del dominio desktop (MeasureUnit):
 * - name obligatorio con trim (1-50 caracteres)
 * - abbreviation opcional (máx 10 caracteres)
 *
 * @module Contracts/MeasureUnit
 */

import { z } from 'zod';

/** Estados de la unidad de medida (VO MeasureUnitStatus). */
export const MEASURE_UNIT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type MeasureUnitStatus = (typeof MEASURE_UNIT_STATUSES)[number];

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    NAME_REQUIRED: 'El nombre de la unidad de medida es requerido',
    NAME_TOO_SHORT: 'El nombre debe tener al menos 1 carácter',
    NAME_TOO_LONG: 'El nombre no puede exceder 50 caracteres',
    ABBREVIATION_TOO_LONG: 'La abreviatura no puede exceder 10 caracteres',
} as const;

const baseMeasureUnitFields = {
    /** Nombre de la unidad (único por tenant, case-insensitive). */
    name: z
        .string({ required_error: ERROR_MESSAGES.NAME_REQUIRED })
        .trim()
        .min(1, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
        .max(50, { message: ERROR_MESSAGES.NAME_TOO_LONG }),

    /** Abreviatura opcional (ej. "kg", "pz", "L"). */
    abbreviation: z
        .string()
        .trim()
        .max(10, { message: ERROR_MESSAGES.ABBREVIATION_TOO_LONG })
        .nullish(),
};

/**
 * Schema para crear una unidad de medida.
 * El id lo genera el cliente (offline-first, crypto.randomUUID()).
 */
export const createMeasureUnitSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...baseMeasureUnitFields,
    })
    .strict();

export type CreateMeasureUnitRequest = z.infer<typeof createMeasureUnitSchema>;

/**
 * Schema para actualizar una unidad de medida.
 * Como en tax, Update NO cambia status (para eso están /activate y /deactivate).
 */
export const updateMeasureUnitSchema = z
    .object({
        ...baseMeasureUnitFields,
    })
    .strict();

export type UpdateMeasureUnitRequest = z.infer<typeof updateMeasureUnitSchema>;
