/**
 * @fileoverview DTO de respuesta para Promotion (sync).
 *
 * Espejo del agregado desktop Pittaj.Domain.Promotion.Promotion (la promoción del
 * catálogo comercial: define un descuento sobre un alcance con vigencia opcional).
 * Shape que ambos lados serializan/parsean: el desktop lo produce en su Describe
 * (push) y lo consume en ApplyPromotionAsync (pull); la nube lo emite desde
 * PromotionResponseMapper.
 *
 * Es un agregado PLANO (sin colecciones hijas): todos los parámetros del descuento
 * viven en la propia fila. Solo el parámetro relevante al `type` es no nulo.
 *
 * @module Contracts/Promotion
 */

/** Tipo de descuento: % / monto por unidad / lleva-N-paga-M / precio especial. */
export type PromotionType = 'PERCENT' | 'AMOUNT' | 'NXM' | 'SPECIAL_PRICE';

/** Alcance: producto específico / categoría / total del ticket. */
export type PromotionScope = 'PRODUCT' | 'CATEGORY' | 'TICKET';

/** Estado de la promoción. Solo las ACTIVE participan en el motor. */
export type PromotionStatus = 'ACTIVE' | 'INACTIVE';

/** DTO de respuesta para consultas/sync de promociones. */
export interface PromotionResponse {
    readonly id: string;
    readonly name: string;
    readonly status: PromotionStatus;
    readonly type: PromotionType;
    readonly scope: PromotionScope;

    /** Id del producto o categoría destino. Null cuando el alcance es TICKET. */
    readonly scopeTargetId: string | null;

    // --- Parámetros del descuento (según type). Solo el relevante es no nulo. ---
    /** PERCENT: porcentaje (0-100]. */
    readonly percent: number | null;
    /** AMOUNT: monto de descuento por unidad. */
    readonly amount: number | null;
    /** NXM: N (lleva). */
    readonly buyQuantity: number | null;
    /** NXM: M (paga). */
    readonly payQuantity: number | null;
    /** SPECIAL_PRICE: precio especial por unidad. */
    readonly specialPrice: number | null;

    /** Vigencia: inicio (ISO 8601, null = sin límite). */
    readonly startDate: string | null;
    /** Vigencia: fin (ISO 8601, null = sin límite). */
    readonly endDate: string | null;

    /** Prioridad para el desempate determinista (mayor primero). Default 0. */
    readonly priority: number;

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
