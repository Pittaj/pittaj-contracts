/**
 * @fileoverview DTO de respuesta para MeasureUnit (GET/PUT endpoints).
 *
 * Espejo del MeasureUnitDto desktop. Contrato FIJADO con el lado
 * desktop: id, name, abbreviation, status, createdAt, updatedAt.
 *
 * @module Contracts/MeasureUnit
 */

import type { MeasureUnitStatus } from '../schemas/createMeasureUnit.schema';

/** DTO de respuesta para consultas de unidades de medida. */
export interface MeasureUnitResponse {
    /** ID único (UUID v4). */
    readonly id: string;

    /** Nombre de la unidad (único por tenant). */
    readonly name: string;

    /** Abreviatura opcional (ej. "kg", "pz", "L"). */
    readonly abbreviation: string | null;

    /** Estado: ACTIVE | INACTIVE. */
    readonly status: MeasureUnitStatus;
    /**
     * Versión OCC. El escritorio la lee como campo REQUERIDO al aplicar el pull
     * (`GetProperty("version")`), así que omitirla tumba el sync del catálogo
     * entero con "The given key was not present in the dictionary".
     */
    readonly version: number;

    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;

    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
