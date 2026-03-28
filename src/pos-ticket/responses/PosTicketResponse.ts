/**
 * @fileoverview Response DTO principal para PosTicket
 * @module PosTicketResponse
 * @version 1.0.0
 *
 * DTO completo del ticket POS. Co-ubicado con get-by-id query.
 * Usado como base por todos los mapeos de respuesta.
 */

import type { PosTicketLinePrimitives } from '../../primitives';
import type { PosTicketPaymentPrimitives } from '../../primitives';

/**
 * Response DTO para ticket POS individual.
 *
 * @interface PosTicketResponse
 * @since 1.0.0
 */
export interface PosTicketResponse {
  readonly id: string;
  readonly ticketNumber: string;
  readonly status: string;
  readonly posSessionId: string;
  readonly locationId: string;
  readonly userId: string;
  readonly customerId: string | null;
  readonly lines: PosTicketLinePrimitives[];
  readonly payments: PosTicketPaymentPrimitives[];
  readonly subtotalAmount: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly changeAmount: number;
  readonly currency: string;
  readonly itemCount: number;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly version: number;
}
