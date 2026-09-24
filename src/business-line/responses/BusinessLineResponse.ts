/**
 * @fileoverview DTO de respuesta para BusinessLine (GET/PUT endpoints y sync pull).
 * @module Contracts/BusinessLine
 */

import type { BusinessLineStatus } from '../schemas/createBusinessLine.schema.js';

/** DTO de respuesta para consultas de líneas de negocio. */
export interface BusinessLineResponse {
    /** ID único (UUID v4, generado en origen). */
    readonly id: string;

    /** Nombre del giro (único por tenant). */
    readonly name: string;

    /** Descripción libre. */
    readonly description: string | null;

    /** Estado: ACTIVE | INACTIVE. */
    readonly status: BusinessLineStatus;

    /** Versión para optimistic locking. */
    readonly version: number;

    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;

    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
