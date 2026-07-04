/**
 * @fileoverview DTO de respuesta para Department (GET/PUT endpoints).
 * @module Contracts/Department
 */

import type { DepartmentStatus } from '../schemas/createDepartment.schema';

/** DTO de respuesta para consultas de departamentos. */
export interface DepartmentResponse {
    /** ID único (UUID v4). */
    readonly id: string;

    /** Nombre del departamento (único por tenant). */
    readonly name: string;

    /** Descripción libre. */
    readonly description: string | null;

    /** Estado: ACTIVE | INACTIVE. */
    readonly status: DepartmentStatus;

    /** Versión para optimistic locking. */
    readonly version: number;

    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;

    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
