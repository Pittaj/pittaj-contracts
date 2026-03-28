/**
 * @fileoverview Schemas Zod para validación HTTP del módulo Product
 * @module infrastructure/api/schemas
 * @version 1.0.0
 *
 * Los schemas viven dentro del módulo para máxima cohesión.
 * Pueden importar constantes de dominio directamente sin dependencias cruzadas.
 *
 * @see PRODUCT_CONSTANTS para límites y valores por defecto
 */

import { z } from 'zod';
import { PRODUCT_CONSTANTS } from '../constants';


const { LIMITS } = PRODUCT_CONSTANTS;

// ============================================================
// SUB-SCHEMAS (objetos complejos reutilizables)
// ============================================================

/**
 * Schema de precios del producto.
 * Todos los campos son requeridos (o con default) para coincidir con ProductPricePrimitives.
 */
const productPriceSchema = z.object({
    salePrice: z.number().min(LIMITS.MIN_PRICE).max(LIMITS.MAX_PRICE),
    costPrice: z.number().min(LIMITS.MIN_PRICE).max(LIMITS.MAX_PRICE),
    wholesalePrice: z.number().min(LIMITS.MIN_PRICE).max(LIMITS.MAX_PRICE).default(0),
    minSalePrice: z.number().min(LIMITS.MIN_PRICE).max(LIMITS.MAX_PRICE).default(0),
    currency: z.string().length(3).default('MXN'),
});

/**
 * Schema de configuración de inventario.
 * Campos con defaults para coincidir con ProductInventoryConfigPrimitives.
 */
const productInventoryConfigSchema = z.object({
    trackInventory: z.boolean().default(true),
    minStock: z.number().min(0).default(0),
    maxStock: z.number().min(0).default(0),
    reorderPoint: z.number().min(0).default(0),
    unitOfMeasure: z.enum(['UNIT', 'KG', 'LT', 'MT', 'BOX', 'PACK']).default('UNIT'),
    valuationMethod: z.enum(['FIFO', 'AVERAGE', 'SPECIFIC']).default('AVERAGE'),
});

/**
 * Schema de información fiscal.
 * Campos con defaults para coincidir con ProductTaxInfoPrimitives.
 */
const productTaxInfoSchema = z.object({
    taxType: z.enum(['IVA_16', 'IVA_8', 'IVA_0', 'EXENTO', 'IEPS']).default('IVA_16'),
    taxIncluded: z.boolean().default(true),
    satProductCode: z.string().nullable().default(null),
    satUnitCode: z.string().nullable().default(null),
});

/**
 * Schema de configuración de punto de venta.
 * Campos con defaults para coincidir con ProductPosConfigPrimitives.
 */
const productPosConfigSchema = z.object({
    showInPos: z.boolean().default(true),
    posColor: z.string().nullable().default(null),
    posIcon: z.string().nullable().default(null),
    posOrder: z
        .number()
        .int()
        .min(LIMITS.MIN_POS_ORDER)
        .max(LIMITS.MAX_POS_ORDER)
        .default(0),
    allowFractional: z.boolean().default(false),
    allowPriceEdit: z.boolean().default(false),
});

/**
 * Schema para cambios de sincronización.
 * Coincide con SyncChange<unknown> de @pittaj/module-shared.
 */
const syncChangeSchema = z.object({
    id: z.string().uuid(),
    entityType: z.string().min(1),
    operation: z.enum(['create', 'update', 'delete', 'upsert']),
    data: z.record(z.unknown()).optional(),
    version: z.number().int(),
    localTimestamp: z.coerce.date(),
    deviceId: z.string().optional(),
    tenantId: z.string().uuid(),
});

/**
 * Schema para atributos de producto.
 * Coincide con Record<string, AttributeValue> del dominio.
 */
const attributeValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
]);

// ============================================================
// ENUMS compartidos
// ============================================================

const productTypeEnum = z.enum([
    'SIMPLE',
    'VARIABLE',
    'COMBO',
    'KIT',
    'SERVICE',
]);

const productStatusEnum = z.enum([
    'DRAFT',
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED',
]);

const productSortFieldEnum = z.enum([
    'name',
    'code',
    'price',
    'createdAt',
    'updatedAt',
]);

const sortDirectionEnum = z.enum(['asc', 'desc']);

// ============================================================
// PARAMS
// ============================================================

/**
 * Validación de parámetro :id en la URL.
 * Mejora de seguridad: valida formato UUID en path params.
 */
export const productIdParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido'),
});

// ============================================================
// COMMANDS - Schemas de escritura
// ============================================================

/**
 * POST /api/products
 * Crear un nuevo producto.
 */
export const createProductSchema = z.object({
    id: z.string().uuid(),
    name: z
        .string()
        .min(LIMITS.MIN_NAME_LENGTH)
        .max(LIMITS.MAX_NAME_LENGTH),
    type: productTypeEnum,
    price: productPriceSchema,
    code: z
        .string()
        .min(LIMITS.MIN_CODE_LENGTH)
        .max(LIMITS.MAX_CODE_LENGTH)
        .optional(),
    sku: z
        .string()
        .min(LIMITS.MIN_SKU_LENGTH)
        .max(LIMITS.MAX_SKU_LENGTH)
        .nullable()
        .optional(),
    barcode: z
        .string()
        .max(LIMITS.MAX_BARCODE_LENGTH)
        .nullable()
        .optional(),
    description: z
        .string()
        .max(LIMITS.MAX_DESCRIPTION_LENGTH)
        .nullable()
        .optional(),
    tags: z
        .array(z.string().max(LIMITS.MAX_TAG_LENGTH))
        .max(LIMITS.MAX_TAGS)
        .optional(),
    weight: z
        .number()
        .min(0)
        .max(LIMITS.MAX_WEIGHT)
        .nullable()
        .optional(),
    attributes: z.record(attributeValueSchema).optional(),
    inventoryConfig: productInventoryConfigSchema.optional(),
    taxInfo: productTaxInfoSchema.optional(),
    posConfig: productPosConfigSchema.optional(),
    categoryId: z.string().uuid().nullable().optional(),
    deviceId: z.string().optional(),
});

/**
 * PUT /api/products/:id
 * Actualizar un producto existente.
 */
export const updateProductSchema = z.object({
    version: z.number().int().min(1),
    name: z
        .string()
        .min(LIMITS.MIN_NAME_LENGTH)
        .max(LIMITS.MAX_NAME_LENGTH)
        .optional(),
    sku: z
        .string()
        .min(LIMITS.MIN_SKU_LENGTH)
        .max(LIMITS.MAX_SKU_LENGTH)
        .nullable()
        .optional(),
    barcode: z
        .string()
        .max(LIMITS.MAX_BARCODE_LENGTH)
        .nullable()
        .optional(),
    price: productPriceSchema.optional(),
    description: z
        .string()
        .max(LIMITS.MAX_DESCRIPTION_LENGTH)
        .nullable()
        .optional(),
    tags: z
        .array(z.string().max(LIMITS.MAX_TAG_LENGTH))
        .max(LIMITS.MAX_TAGS)
        .optional(),
    weight: z
        .number()
        .min(0)
        .max(LIMITS.MAX_WEIGHT)
        .nullable()
        .optional(),
    attributes: z.record(attributeValueSchema).optional(),
    inventoryConfig: productInventoryConfigSchema.optional(),
    taxInfo: productTaxInfoSchema.optional(),
    posConfig: productPosConfigSchema.optional(),
    categoryId: z.string().uuid().nullable().optional(),
});

/**
 * DELETE /api/products/:id (query params)
 * version se recibe como query string → z.coerce para parsear string→number.
 */
export const deleteProductSchema = z.object({
    version: z.coerce.number().int().min(1),
});

/**
 * POST /api/products/:id/activate
 */
export const activateProductSchema = z.object({
    version: z.number().int().min(1),
});

/**
 * POST /api/products/:id/deactivate
 */
export const deactivateProductSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().max(500).nullable().optional(),
});

/**
 * POST /api/products/:id/discontinue
 */
export const discontinueProductSchema = z.object({
    version: z.number().int().min(1),
    reason: z.string().max(500).nullable().optional(),
    replacementProductId: z.string().uuid().nullable().optional(),
});

// ============================================================
// QUERIES - Schemas de lectura (query params, converidos con coerce)
// ============================================================

/**
 * GET /api/products
 * Lista paginada con filtros (offset pagination).
 */
export const getProductsSchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(LIMITS.MAX_PAGE_SIZE)
        .optional(),
    q: z.string().max(200).optional(),
    status: productStatusEnum.optional(),
    type: productTypeEnum.optional(),
    categoryId: z.string().uuid().optional(),
    uncategorized: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    showInPos: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    trackInventory: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    hasPositiveMargin: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    tags: z.string().optional(),
    unitOfMeasure: z.string().optional(),
    taxType: z.string().optional(),
    sortBy: productSortFieldEnum.optional(),
    sortOrder: sortDirectionEnum.optional(),
});

/**
 * GET /api/products/cursor
 * Lista paginada con cursor (infinite scroll).
 */
export const getProductsCursorSchema = z.object({
    cursor: z.string().nullable().optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(LIMITS.MAX_PAGE_SIZE)
        .optional(),
    q: z.string().max(200).optional(),
    status: productStatusEnum.optional(),
    type: productTypeEnum.optional(),
    categoryId: z.string().uuid().optional(),
    uncategorized: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    showInPos: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    trackInventory: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    hasPositiveMargin: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    tags: z.string().optional(),
    unitOfMeasure: z.string().optional(),
    taxType: z.string().optional(),
    sortBy: productSortFieldEnum.optional(),
    sortDir: sortDirectionEnum.optional(),
});

// ============================================================
// SYNC - Schemas de sincronización
// ============================================================

/**
 * POST /api/products/sync/push
 * Envía cambios locales al servidor.
 */
export const syncPushProductSchema = z.object({
    tenantId: z.string().uuid(),
    deviceId: z.string().min(1),
    changes: z.array(syncChangeSchema).min(1),
});

/**
 * POST /api/products/sync/pull
 * Obtiene cambios del servidor.
 */
export const syncPullProductSchema = z.object({
    tenantId: z.string().uuid(),
    lastSyncedAt: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
});
