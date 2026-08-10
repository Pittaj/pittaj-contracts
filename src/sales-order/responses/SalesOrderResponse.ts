/**
 * @fileoverview Response DTO principal para SalesOrder
 * @module SalesOrderResponse
 * @version 1.0.0
 *
 * DTO completo de la orden de venta. Co-ubicado con get-by-id query.
 * Usado como base por todos los mapeos de respuesta.
 */

import type { SalesOrderLinePrimitives } from '../primitives/index.js';
import type { SalesOrderPaymentPrimitives } from '../primitives/index.js';
import type { DeliveryAddressPrimitives } from '../primitives/index.js';

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

  /**
   * Desde cuándo este pedido es DEUDA. `null` = todavía no lo es.
   *
   * Lo sella el pedido cuando ocurre el hecho que manda según el ajuste del tenant (al confirmar o
   * al entregar). **Cuentas por cobrar lee este sello, no el ajuste** — ver
   * `SALES_ORDER_RECEIVABLE_POLICY_KEY` para el porqué.
   */
  readonly receivableFrom: Date | null;

  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly version: number;
}
