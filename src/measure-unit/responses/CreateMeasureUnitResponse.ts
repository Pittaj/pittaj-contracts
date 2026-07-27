/**
 * @fileoverview Respuesta slim de POST /measure-units (el cliente ya conoce el resto).
 * @module Contracts/MeasureUnit
 */

/** Respuesta de creación: solo el id confirmado. */
export interface CreateMeasureUnitResponse {
    readonly id: string;
}
