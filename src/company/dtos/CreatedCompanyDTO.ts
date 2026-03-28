/**
 * @fileoverview DTO de respuesta después de crear una empresa.
 * 
 * Define la estructura de datos que el backend devuelve
 * después de crear exitosamente una empresa (POST /companies).
 * 
 * @module Contracts/Company/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de respuesta después de POST /companies.
 * 
 * Contiene los datos esenciales de la empresa recién creada.
 * 
 * @example
 * ```typescript
 * const createdCompany: CreatedCompanyDTO = {
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
export interface CreatedCompanyDTO {
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
   * 
   * Por defecto es true al crear.
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
   * Versión para optimistic locking.
   * 
   * Siempre es 1 al crear.
   */
  readonly version: number;
}
