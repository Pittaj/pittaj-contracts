/**
 * @fileoverview Respuesta slim de POST /business-lines (el cliente ya conoce el resto).
 * @module Contracts/BusinessLine
 */

/** Respuesta de creación: solo el id confirmado. */
export interface CreateBusinessLineResponse {
    readonly id: string;
}
