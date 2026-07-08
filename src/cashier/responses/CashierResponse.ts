/**
 * @fileoverview DTO de respuesta para Cashier (cajero — sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.Cashier.Cashier (la proyección operativa
 * de un usuario de la organización que opera la Estación de Venta). Shape que ambos
 * lados serializan/parsean: el desktop lo produce en su Describe (push) y lo consume en
 * ApplyCashierAsync (pull); la nube lo emite desde CashierResponseMapper.
 *
 * Es un agregado PLANO (sin colecciones hijas): nombre + estado + permisos + vínculo a
 * usuario viven en la propia fila. El desktop NO modela tenantId (lo estampa el backend
 * por el JWT): no viaja.
 *
 * SEGURIDAD — el PIN NO viaja: el cajero autentica por PIN (hash SHA-256) que es una
 * credencial LOCAL de la Estación (offline-first). El hash del PIN NUNCA sincroniza a la
 * nube ni aparece en este contrato; solo viaja la identidad/estado del cajero (nombre,
 * estado, permisos, vínculo a usuario). El applier del pull en el desktop PRESERVA el PIN
 * local (nativo-only). La nube nunca conoce el PIN.
 *
 * @module Contracts/Cashier
 */

/** Estado del cajero. Solo los ACTIVE pueden autenticarse y operar la Estación. */
export type CashierStatus = 'ACTIVE' | 'INACTIVE';

/** DTO de respuesta para consultas/sync de cajeros. */
export interface CashierResponse {
    readonly id: string;
    readonly name: string;
    readonly status: CashierStatus;

    /**
     * Permisos POS del cajero, separados por comas ('' = sin permisos). Espejo 1:1 de
     * la propiedad Cashier.Permissions del desktop (almacenamiento canónico).
     */
    readonly permissions: string;

    /** Vínculo opcional al usuario de Organización (UserId; null = sin vincular). */
    readonly userId: string | null;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;

    // NOTA: NO existe columna de PIN/hash — es credencial local de la Estación y jamás viaja.
}
