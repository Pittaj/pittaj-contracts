/**
 * @fileoverview DTO de respuesta para Tax (GET/PUT endpoints).
 *
 * Espejo del TaxDto desktop. rate es fracción 0-1; el cliente
 * deriva el porcentaje para mostrar (rate * 100).
 *
 * @module Contracts/Tax
 */

import type { TaxKind, TaxStatus } from '../schemas/createTax.schema';

/** DTO de respuesta para consultas de impuestos. */
export interface TaxResponse {
    /** ID único (UUID v4). */
    readonly id: string;

    /** Nombre del impuesto (único por tenant). */
    readonly name: string;

    /** Estado: ACTIVE | INACTIVE. */
    readonly status: TaxStatus;

    /** Tasa como fracción 0-1 (0.16 = 16%). */
    readonly rate: number;

    /** Tipo: IVA | IEPS | ZERO | EXEMPT. */
    readonly kind: TaxKind;

    /** Si va incluido en el precio del producto. */
    readonly isIncluded: boolean;

    /** Factor SAT ("Tasa" / "Cuota" / "Exento"). */
    readonly satFactor: string | null;

    /** Código SAT ("002" IVA, "003" IEPS). */
    readonly satCode: string | null;

    /** Si es el impuesto predeterminado del tenant. */
    readonly isDefault: boolean;

    /** Versión para optimistic locking. */
    readonly version: number;

    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;

    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
