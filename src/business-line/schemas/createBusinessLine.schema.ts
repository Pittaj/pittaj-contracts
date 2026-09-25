/**
 * @fileoverview Zod schemas para crear/actualizar una línea de negocio.
 *
 * Línea de negocio = **giro** (abarrotes, panadería, SaaS). Es una dimensión
 * analítica del **tenant**, no de la empresa: parte ventas, costos y resultados,
 * y **nunca** separa libros ni declaraciones — eso es de la empresa (RFC).
 * Es del tenant porque se hereda del producto, y el catálogo de productos es del
 * tenant: una línea de una sola empresa dejaría a un producto compartido
 * apuntando a una línea ajena en la otra.
 *
 * Plan: docs `producto/plan-empresas-y-lineas-de-negocio.md` (F1). Contrato de
 * las dos plataformas (web y escritorio); id generado en origen.
 *
 * @module Contracts/BusinessLine
 */

import { z } from 'zod';

/** Estados de la línea de negocio. */
export const BUSINESS_LINE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type BusinessLineStatus = (typeof BUSINESS_LINE_STATUSES)[number];

const ERROR_MESSAGES = {
    ID_INVALID_UUID: 'El ID debe ser un UUID válido',
    NAME_REQUIRED: 'El nombre de la línea de negocio es requerido',
    NAME_TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
    NAME_TOO_LONG: 'El nombre no puede exceder 80 caracteres',
    DESCRIPTION_TOO_LONG: 'La descripción no puede exceder 200 caracteres',
} as const;

const baseBusinessLineFields = {
    /** Nombre del giro (único por tenant, case-insensitive). */
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
 * Schema para crear una línea de negocio.
 * El id lo genera el cliente (offline-first, crypto.randomUUID()).
 */
export const createBusinessLineSchema = z
    .object({
        id: z.string().uuid({ message: ERROR_MESSAGES.ID_INVALID_UUID }),
        ...baseBusinessLineFields,
    })
    .strict();

export type CreateBusinessLineRequest = z.infer<typeof createBusinessLineSchema>;

/**
 * Schema para actualizar una línea de negocio.
 * Update NO cambia status (para eso están /activate y /deactivate).
 */
export const updateBusinessLineSchema = z
    .object({
        ...baseBusinessLineFields,
        /** Versión actual para optimistic locking. */
        version: z.number().int().min(1),
    })
    .strict();

export type UpdateBusinessLineRequest = z.infer<typeof updateBusinessLineSchema>;

/**
 * Referencia opcional a una línea de negocio en otra entidad (producto,
 * categoría, sucursal). `null` = sin línea propia: hereda la siguiente en el
 * orden de resolución (renglón → producto → categoría → sucursal → «Sin línea»).
 */
export const businessLineRefSchema = z
    .preprocess(
        (val) => (val === '' ? null : val),
        z.union([z.string().uuid('La línea de negocio debe ser un UUID válido'), z.null()]),
    )
    .optional();
