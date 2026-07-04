/**
 * @fileoverview Respuesta slim de POST /taxes (el cliente ya conoce el resto).
 * @module Contracts/Tax
 */

/** Respuesta de creación: solo el id confirmado. */
export interface CreateTaxResponse {
    readonly id: string;
}
