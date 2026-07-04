/**
 * @fileoverview Respuesta slim de POST /departments (el cliente ya conoce el resto).
 * @module Contracts/Department
 */

/** Respuesta de creación: solo el id confirmado. */
export interface CreateDepartmentResponse {
    readonly id: string;
}
