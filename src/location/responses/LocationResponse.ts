/**
 * @fileoverview DTO de respuesta para Location (GET endpoints).
 * 
 * Define la estructura de datos que el backend envía al frontend
 * cuando se consulta información de ubicaciones físicas.
 * 
 * @module Contracts/Location/DTOs
 * @version 1.0.0
 * @since 11-11-2025
 */

/**
 * DTO de dirección física.
 */
export interface LocationAddress {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly zipCode?: string;
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

/**
 * DTO de capacidades operativas.
 */
export interface LocationCapabilities {
  readonly hasPointOfSale: boolean;
  readonly hasInventory: boolean;
  readonly hasProduction: boolean;
  readonly hasShipping: boolean;
  readonly isHeadquarters: boolean;
}

/**
 * DTO de respuesta para consultas de ubicaciones.
 * 
 * Usado en:
 * - GET /locations (lista)
 * - GET /locations/:id (detalle)
 * - PUT /locations/:id (respuesta después de update)
 * 
 * @example
 * ```typescript
 * const location: LocationResponse = {
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
 *     zipCode: '15036',
 *   },
 *   isDefault: false,
 *   isActive: true,
 *   createdAt: '2025-11-11T10:00:00Z',
 *   version: 1,
 * };
 * ```
 */
export interface LocationResponse {
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
  readonly capabilities: LocationCapabilities;

  /**
   * Dirección física completa.
   */
  readonly address: LocationAddress;

  /**
   * Indica si es la ubicación por defecto de la company.
   */
  readonly isDefault: boolean;

  /**
   * Indica si la ubicación está activa.
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
