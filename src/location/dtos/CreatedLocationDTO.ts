/**
 * @fileoverview DTO de respuesta después de crear una ubicación.
 * 
 * Define la estructura de datos que el backend devuelve
 * después de crear exitosamente una ubicación (POST /locations).
 * 
 * @module Contracts/Location/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

import type { AddressDTO, CapabilitiesDTO } from './LocationDTO';

/**
 * DTO de respuesta después de POST /locations.
 * 
 * Contiene los datos esenciales de la ubicación recién creada.
 * 
 * @example
 * ```typescript
 * const createdLocation: CreatedLocationDTO = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   companyId: '660e8400-e29b-41d4-a716-446655440001',
 *   name: 'Sucursal Lima Centro',
 *   type: 'BRANCH',
 *   capabilities: {
 *     hasPointOfSale: true,
 *     hasInventory: true,
 *     hasProduction: false,
 *     hasShipping: true,
 *     isHeadquarters: false,
 *   },
 *   address: {
 *     street: 'Av. Javier Prado 123',
 *     city: 'Lima',
 *     state: 'Lima',
 *     country: 'Perú',
 *   },
 *   isDefault: false,
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   version: 1,
 * };
 * ```
 */
export interface CreatedLocationDTO {
  /**
   * ID único de la ubicación (UUID v4).
   */
  readonly id: string;

  /**
   * ID de la company propietaria (UUID v4).
   */
  readonly companyId: string;

  /**
   * Nombre de la ubicación.
   */
  readonly name: string;

  /**
   * Tipo de ubicación (BRANCH, WAREHOUSE, OFFICE, FACTORY).
   */
  readonly type: 'BRANCH' | 'WAREHOUSE' | 'OFFICE' | 'FACTORY';

  /**
   * Capacidades operativas de la ubicación.
   */
  readonly capabilities: CapabilitiesDTO;

  /**
   * Dirección física completa.
   */
  readonly address: AddressDTO;

  /**
   * Indica si es la ubicación por defecto de la company.
   */
  readonly isDefault: boolean;

  /**
   * Indica si la ubicación está activa.
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
