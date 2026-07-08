/**
 * @fileoverview DTO de respuesta para Register (caja registradora — sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.Register.Register (la caja registradora
 * física / terminal de punto de venta: una PosSession se abre sobre una caja). Shape
 * que ambos lados serializan/parsean: el desktop lo produce en su Describe (push) y lo
 * consume en ApplyRegisterAsync (pull); la nube lo emite desde RegisterResponseMapper.
 *
 * Es un agregado PLANO (sin colecciones hijas): nombre + estado + ubicación/descripción
 * opcionales viven en la propia fila. El desktop NO modela tenantId (lo estampa el
 * backend por el JWT): no viaja.
 *
 * @module Contracts/Register
 */

/** Estado de la caja. Solo las ACTIVE pueden abrir sesiones de venta. */
export type RegisterStatus = 'ACTIVE' | 'INACTIVE';

/** DTO de respuesta para consultas/sync de cajas registradoras. */
export interface RegisterResponse {
    readonly id: string;
    readonly name: string;
    readonly status: RegisterStatus;

    /** Ubicación/sucursal asociada (texto libre, null = sin asignar). */
    readonly location: string | null;
    /** Descripción opcional (null = sin descripción). */
    readonly description: string | null;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
