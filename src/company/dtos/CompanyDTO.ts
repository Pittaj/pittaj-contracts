/**
 * @fileoverview DTO de respuesta para Company (GET endpoints).
 * 
 * Define la estructura de datos que el backend envía al frontend
 * cuando se consulta información de empresas.
 * 
 * @module Contracts/Company/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta para consultas de empresas.
 * 
 * Usado en:
 * - GET /companies (lista)
 * - GET /companies/:id (detalle)
 * - PUT /companies/:id (respuesta después de update)
 * 
 * @example
 * ```typescript
 * const company: CompanyDTO = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Tienda El Sol',
 *   legalName: 'Comercializadora El Sol S.A.',
 *   taxId: '1792146739001',
 *   isDefault: true,
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   version: 1,
 * };
 * ```
 */
export interface CompanyDTO {
  /**
   * ID único de la empresa (UUID v4).
   */
  readonly id: string;

  /**
   * Nombre comercial de la empresa.
   */
  readonly name: string;

  /**
   * Nombre legal completo (Razón Social).
   */
  readonly legalName: string;

  /**
   * Identificación fiscal (RUC, NIF, RFC, EIN).
   */
  readonly taxId: string;

  /**
   * Indica si es la empresa por defecto del tenant.
   */
  readonly isDefault: boolean;

  /**
   * Indica si la empresa está activa.
   */
  readonly isActive: boolean;

  /**
   * Fecha de creación (ISO 8601).
   */
  readonly createdAt: string;

  /**
   * ID del usuario que creó este registro (UUID).
   */
  readonly createdBy?: string;

  /**
   * Fecha de última actualización (ISO 8601).
   */
  readonly updatedAt?: string;

  /**
   * ID del usuario que actualizó este registro (UUID).
   */
  readonly updatedBy?: string;

  /**
   * Versión para optimistic locking.
   */
  readonly version: number;
}
