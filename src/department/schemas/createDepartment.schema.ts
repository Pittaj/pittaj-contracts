/**
 * @fileoverview Zod schemas para crear/actualizar un departamento.
 *
 * Departamento = unidad organizativa del tenant (catálogo simple,
 * hermano de Empresas/Sucursales en la app Organización).
 * No existe modelo desktop todavía; la web define el contrato
 * y desktop lo replicará (nombre único por tenant, case-insensitive).
 *
 * @module Contracts/Department
 */

import { z } from 'zod';

/** Estados del departamento. */
export const DEPARTMENT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    NAME_REQUIRED: 'El nombre del departamento es requerido',
    NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
    NAME_TOO_LONG: 'El nombre no puede exceder 80 caracteres',
    DESCRIPTION_TOO_LONG: 'La descripción no puede exceder 200 caracteres',
} as const;

const baseDepartmentFields = {
    /** Nombre del departamento (único por tenant, case-insensitive). */
    name: z
        .string({ required_error: ERROR_MESSAGES.NAME_REQUIRED })
        .trim()
        .min(2, { message: ERROR_MESSAGES.NAME_TOO_SHORT })
        .max(80, { message: ERROR_MESSAGES.NAME_TOO_LONG }),

    /** Descripción libre (opcional). */
    description: z
        .string()
        .trim()
        .max(200, { message: ERROR_MESSAGES.DESCRIPTION_TOO_LONG })
        .nullish(),
};

/**
 * Schema para crear un departamento.
 * El id lo genera el cliente (offline-first, crypto.randomUUID()).
 */
export const createDepartmentSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...baseDepartmentFields,
    })
    .strict();

export type CreateDepartmentRequest = z.infer<typeof createDepartmentSchema>;

/**
 * Schema para actualizar un departamento.
 * Update NO cambia status (para eso están /activate y /deactivate).
 */
export const updateDepartmentSchema = z
    .object({
        ...baseDepartmentFields,
        /** Versión actual para optimistic locking. */
        version: z.number().int().min(1),
    })
    .strict();

export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentSchema>;
