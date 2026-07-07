/**
 * @fileoverview Primitivas de una promoción aplicada a un ticket POS
 * @module PosTicketPromotionPrimitives
 * @version 1.0.0
 *
 * Espejo del TicketPromotion del desktop (entidad hija del agregado PosTicket que
 * genera el motor de promociones). `lineId` es null cuando el descuento es a nivel
 * ticket. Viaja anidada en el DTO del ticket (tabla hija pos_ticket_promotions).
 */

export interface PosTicketPromotionPrimitives {
  readonly id: string;
  readonly promotionId: string;
  readonly promotionName: string;
  /** null = descuento a nivel ticket; con valor = descuento sobre una línea. */
  readonly lineId: string | null;
  readonly discountAmount: number;
  readonly description: string;
}
