/**
 * @fileoverview Schemas Zod para validacion HTTP del modulo SalesOrder
 * @module infrastructure/api/schemas
 * @version 1.0.0
 */

import { z } from 'zod';
import { SALES_ORDER_CONSTANTS } from '../constants';


const { LIMITS } = SALES_ORDER_CONSTANTS;

// ============================================================
// PARAMS
// ============================================================

/** Validacion de parametro :id en la URL. */
export const orderIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID valido'),
});

/** Parametros de linea :lineId. */
export const lineIdParamSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID valido'),
  lineId: z.string().uuid('El lineId debe ser un UUID valido'),
});

// ============================================================
// COMMANDS
// ============================================================

/** Esquema de direccion de entrega. */
const deliveryAddressSchema = z.object({
  street: z.string().min(1).max(200),
  exteriorNumber: z.string().max(20),
  interiorNumber: z.string().max(20).nullable().optional(),
  neighborhood: z.string().max(100).nullable().optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  reference: z.string().max(500).nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
});

/** POST /api/sales-orders — Crear orden de venta. */
export const createSalesOrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().min(1).max(50),
  customerId: z.string().min(1).max(36),
  locationId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable().optional(),
  deliveryAddress: deliveryAddressSchema.nullable().optional(),
  estimatedDeliveryDate: z.coerce.date().nullable().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(500).nullable().optional(),
  deviceId: z.string().optional(),
});

/** POST /api/sales-orders/:id/lines — Agregar linea. */
export const addLineSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200),
  productCode: z.string().max(50).nullable().optional(),
  productSku: z.string().max(50).nullable().optional(),
  quantity: z.number().min(LIMITS.MIN_QUANTITY).max(LIMITS.MAX_QUANTITY),
  unitPrice: z.number().min(0).max(LIMITS.MAX_UNIT_PRICE),
  discountPercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(200).nullable().optional(),
  version: z.number().int().min(0),
});

/** PUT /api/sales-orders/:id/lines/:lineId — Actualizar linea. */
export const updateLineSchema = z.object({
  quantity: z.number().min(LIMITS.MIN_QUANTITY).max(LIMITS.MAX_QUANTITY).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  version: z.number().int().min(0),
});

/** DELETE /api/sales-orders/:id/lines/:lineId — Eliminar linea. */
export const removeLineSchema = z.object({
  version: z.coerce.number().int().min(0),
});

/** POST /api/sales-orders/:id/payments — Agregar pago. */
export const addPaymentSchema = z.object({
  paymentMethodId: z.string().uuid(),
  paymentMethodName: z.string().min(1).max(100),
  paymentMethodType: z.enum(['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'OTHER']),
  amountPaid: z.number().min(0.01),
  currency: z.string().length(3).optional(),
  reference: z.string().max(200).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/quote — Cotizar orden. */
export const quoteOrderSchema = z.object({
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/confirm — Confirmar orden. */
export const confirmOrderSchema = z.object({
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/advance — Avanzar estado de fulfillment. */
export const advanceStatusSchema = z.object({
  targetStatus: z.enum(['PREPARING', 'READY', 'SHIPPED', 'DELIVERED']),
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/complete — Completar orden. */
export const completeOrderSchema = z.object({
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/cancel — Cancelar orden. */
export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
  version: z.number().int().min(0),
});

/** POST /api/sales-orders/:id/return — Devolver orden. */
export const returnOrderSchema = z.object({
  reason: z.string().min(1).max(500),
  version: z.number().int().min(0),
});

// ============================================================
// QUERIES
// ============================================================

const salesOrderStatusEnum = z.enum([
  'DRAFT', 'QUOTED', 'CONFIRMED', 'PREPARING', 'READY',
  'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED',
]);
const salesOrderSortFieldEnum = z.enum([
  'createdAt', 'totalAmount', 'orderNumber', 'status', 'estimatedDeliveryDate', 'balanceDue',
]);
const sortDirectionEnum = z.enum(['asc', 'desc']);

/** GET /api/sales-orders — Listar ordenes. */
export const getSalesOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: salesOrderStatusEnum.optional(),
  customerId: z.string().max(36).optional(),
  assignedTo: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  orderNumber: z.string().max(50).optional(),
  minTotal: z.coerce.number().min(0).optional(),
  maxTotal: z.coerce.number().min(0).optional(),
  hasBalance: z.coerce.boolean().optional(),
  sortBy: salesOrderSortFieldEnum.optional(),
  sortOrder: sortDirectionEnum.optional(),
});

/** GET /api/sales-orders/customer/:customerId — Ordenes por cliente. */
export const customerIdParamSchema = z.object({
  customerId: z.string().min(1, 'El customerId es requerido'),
});

/** GET /api/sales-orders/assigned/:assignedTo — Ordenes por vendedor. */
export const assignedToParamSchema = z.object({
  assignedTo: z.string().uuid('El assignedTo debe ser un UUID valido'),
});

/** GET /api/sales-orders/pipeline — Resumen del pipeline. */
export const pipelineSummarySchema = z.object({
  locationId: z.string().uuid().optional(),
});
