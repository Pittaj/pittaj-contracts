/**
 * @fileoverview Response DTO canónico de Supplier
 * @module Contracts/Supplier/Responses/SupplierResponse
 * @version 1.0.0
 *
 * Contrato FIJADO con el desktop (agregado Pittaj.Domain.Supplier) y con la
 * web. No cambiar sin coordinar las tres puntas.
 */

import type { SupplierStatusValue } from '../constants/index.js';
import type { SupplierAddressPrimitives } from '../primitives/index.js';

export interface SupplierResponse {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly status: SupplierStatusValue;
    /**
     * Fusionado en otro proveedor: este era el repetido y aquel se quedó con todo.
     *
     * Viaja en el sync para que la otra plataforma haga su propio barrido.
     */
    readonly mergedIntoId: string | null;
    /** RFC/NIT del proveedor. */
    readonly taxId: string | null;
    /** Clave de régimen fiscal del SAT (para el CFDI de compra). */
    readonly regimenFiscal: string | null;
    readonly email: string | null;
    readonly phone: string | null;
    readonly address: SupplierAddressPrimitives | null;
    /** Días de crédito (condiciones de pago / CxP). 0 = contado. */
    readonly creditDays: number;
    /** Moneda de compra por defecto (ej. "MXN"). */
    readonly currency: string | null;
    readonly tenantId: string;
    readonly createdAt: Date;
    readonly createdBy: string | null;
    readonly updatedAt: Date | null;
    readonly updatedBy: string | null;
    readonly version: number;
}
