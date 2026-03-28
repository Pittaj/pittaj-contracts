/**
 * @fileoverview Schema Zod para validación de creación de ubicación.
 * 
 * Define las reglas de validación para el endpoint POST /locations:
 * - Nombre (2-100 caracteres)
 * - Tipo (BRANCH, WAREHOUSE, OFFICE, FACTORY)
 * - Capacidades operativas (hasPointOfSale, hasInventory, etc.)
 * - Dirección completa (street, city, state, country)
 * - ID opcional para PWA offline-first
 * 
 * @module Contracts/Location
 * @version 1.0.0
 * @since 11-11-2025
 */

import { z } from 'zod';

/**
 * Enum para los tipos de ubicaciones físicas.
 * 
 * @enum {string}
 */
const LocationTypeEnum = z.enum(['BRANCH', 'WAREHOUSE', 'OFFICE', 'FACTORY']);

/**
 * Schema Zod para dirección física.
 * 
 * Incluye campos obligatorios (street, city, state, country) y opcionales (zipCode, coordinates).
 */
const AddressSchema = z.object({
  /**
   * Calle/dirección principal.
   * 
   * @example "Av. Javier Prado 123"
   */
  street: z.string()
    .min(5, 'La calle debe tener al menos 5 caracteres')
    .max(200, 'La calle no puede exceder 200 caracteres')
    .trim(),

  /**
   * Ciudad.
   * 
   * @example "Lima"
   */
  city: z.string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim(),

  /**
   * Estado/provincia/departamento.
   * 
   * @example "Lima"
   */
  state: z.string()
    .min(2, 'El estado debe tener al menos 2 caracteres')
    .max(100, 'El estado no puede exceder 100 caracteres')
    .trim(),

  /**
   * País.
   * 
   * @example "Perú"
   */
  country: z.string()
    .min(2, 'El país debe tener al menos 2 caracteres')
    .max(100, 'El país no puede exceder 100 caracteres')
    .trim(),

  /**
   * Código postal (opcional).
   * 
   * @example "15036"
   */
  zipCode: z.string()
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .trim()
    .optional(),

  /**
   * Coordenadas GPS (opcional).
   * 
   * Útil para mapas y rutas de entrega.
   * 
   * @example { latitude: -12.0464, longitude: -77.0428 }
   */
  coordinates: z.object({
    latitude: z.number()
      .min(-90, 'Latitud debe estar entre -90 y 90')
      .max(90, 'Latitud debe estar entre -90 y 90'),
    longitude: z.number()
      .min(-180, 'Longitud debe estar entre -180 y 180')
      .max(180, 'Longitud debe estar entre -180 y 180'),
  }).optional(),
});

/**
 * Schema Zod para capacidades operativas.
 * 
 * Define qué operaciones puede realizar la ubicación.
 */
const CapabilitiesSchema = z.object({
  /**
   * Si tiene punto de venta (retail).
   * 
   * Permite operaciones de venta directa al cliente.
   */
  hasPointOfSale: z.boolean(),

  /**
   * Si maneja inventario.
   * 
   * Permite almacenar y gestionar productos.
   */
  hasInventory: z.boolean(),

  /**
   * Si tiene capacidad de producción/manufactura.
   * 
   * Permite transformar materias primas en productos.
   */
  hasProduction: z.boolean(),

  /**
   * Si tiene capacidad de envío/despacho.
   * 
   * Permite preparar y despachar pedidos.
   */
  hasShipping: z.boolean(),

  /**
   * Si es la sede principal/matriz.
   * 
   * Solo una ubicación por company debe tener esto en true.
   */
  isHeadquarters: z.boolean(),
});

/**
 * Schema Zod para crear una ubicación.
 * 
 * Usado en POST /locations para validar el body del request.
 * 
 * @example
 * ```typescript
 * import { CreateLocationSchema } from '@pittaj/lib-contracts';
 * 
 * const result = CreateLocationSchema.safeParse(body);
 * if (!result.success) {
 *   return c.json({ errors: result.error.errors }, 400);
 * }
 * ```
 */
export const CreateLocationSchema = z.object({
  /**
   * ID opcional de la ubicación (UUID v4).
   * 
   * Para soporte PWA offline-first:
   * - Cliente genera UUID offline
   * - Servidor respeta el ID del cliente
   * - Si no se proporciona, servidor genera uno nuevo
   */
  id: z.string().uuid().optional(),

  /**
   * ID de la company propietaria (UUID v4).
   * 
   * Cada location pertenece a una company específica.
   * 
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  companyId: z.string().uuid('Company ID debe ser un UUID válido'),

  /**
   * Nombre de la ubicación.
   * 
   * Requisitos:
   * - Longitud: 2-100 caracteres
   * - Descriptivo del lugar
   * 
   * @example "Sucursal Lima Centro"
   */
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  /**
   * Tipo de ubicación.
   * 
   * Valores válidos:
   * - BRANCH: Sucursal con punto de venta
   * - WAREHOUSE: Almacén/bodega
   * - OFFICE: Oficina administrativa
   * - FACTORY: Planta de producción
   * 
   * @example "BRANCH"
   */
  type: LocationTypeEnum,

  /**
   * Capacidades operativas de la ubicación.
   * 
   * Define qué operaciones puede realizar.
   */
  capabilities: CapabilitiesSchema,

  /**
   * Dirección física completa.
   * 
   * Incluye calle, ciudad, estado, país y opcionalmente código postal y coordenadas GPS.
   */
  address: AddressSchema,

  /**
   * Indica si es la ubicación por defecto de la company.
   * 
   * Solo puede haber UNA ubicación default por company.
   * Si se marca otra como default, se desmarca la anterior.
   * 
   * @default false
   */
  isDefault: z.boolean().optional().default(false),
});

/**
 * Tipo inferido del schema.
 */
export type CreateLocationRequest = z.infer<typeof CreateLocationSchema>;
