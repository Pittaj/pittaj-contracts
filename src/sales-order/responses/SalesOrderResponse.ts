/**
 * @fileoverview Response DTO principal para SalesOrder
 * @module SalesOrderResponse
 * @version 1.0.0
 *
 * DTO completo de la orden de venta. Co-ubicado con get-by-id query.
 * Usado como base por todos los mapeos de respuesta.
 */

import type { SalesOrderLinePrimitives } from '../../primitives';
import type { SalesOrderPaymentPrimitives } from '../../primitives';
import type { DeliveryAddressPrimitives } from '../../primitives';

/**
 * Response DTO para orden de venta individual.
 *
 * @interface SalesOrderResponse
 * @since 1.0.0
 */
export interface SalesOrderResponse {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: string;
  readonly customerId: string;
  readonly locationId: string;
  readonly userId: string;
  readonly assignedTo: string | null;
  readonly lines: SalesOrderLinePrimitives[];
  readonly payments: SalesOrderPaymentPrimitives[];
  readonly subtotalAmount: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly balanceDue: number;
  readonly currency: string;
  readonly itemCount: number;
  readonly deliveryAddress: DeliveryAddressPrimitives | null;
  readonly estimatedDeliveryDate: Date | null;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly returnReason: string | null;
  readonly quotedAt: Date | null;
  readonly confirmedAt: Date | null;
  readonly preparingAt: Date | null;
  readonly readyAt: Date | null;
  readonly shippedAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly returnedAt: Date | null;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly version: number;
}
