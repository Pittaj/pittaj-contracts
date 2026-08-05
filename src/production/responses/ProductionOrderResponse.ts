/**
 * @fileoverview DTO de ProductionOrder (orden de producción).
 *
 * Espejo del agregado desktop `Pittaj.Domain.Production.ProductionOrder`: consume componentes y
 * produce un producto. Nace en BORRADOR (consumos sugeridos por la receta pero ajustables a lo
 * real) y al terminar postea al inventario las salidas de insumos y la entrada del producto.
 *
 * ── La nube NO postea inventario ──
 * Cuando una orden llega por sync, el movimiento de inventario **ya ocurrió en el escritorio** y
 * viaja por su cuenta (`stock-movement`). Aplicar aquí los consumos otra vez descontaría el doble.
 * La nube guarda la orden como documento y nada más.
 *
 * ── Importes verbatim ──
 * `totalCost`, `unitCost` y el `unitCost` de cada línea vienen calculados por el escritorio con el
 * costo promedio vigente en el momento de terminar. **No se recalculan aquí**: el costo de un lote
 * depende de un promedio histórico que la nube no tiene, y recalcularlo daría otro número.
 *
 * Cantidades y dinero viajan como **string** (numeric de Postgres) para no perder decimales.
 *
 * @module Contracts/Production
 */

/** Estado de la orden: borrador editable → completada y bloqueada. */
export type ProductionOrderStatus = 'DRAFT' | 'COMPLETED';

/** Consumo de una orden de producción. */
export interface ProductionOrderLineResponse {
    readonly id: string;
    readonly componentProductId: string;
    /** Snapshot del nombre al capturar la orden. */
    readonly componentName: string;
    /** Snapshot del código/SKU al capturar la orden. */
    readonly componentCode: string;
    /** Lo que sugirió la receta. */
    readonly plannedQuantity: string;
    /** Lo realmente consumido (el peso tras un secado varía). */
    readonly consumedQuantity: string;
    /** Costo promedio vigente al TERMINAR la orden. Verbatim. */
    readonly unitCost: string;
}

/** DTO de respuesta para sync de órdenes de producción. */
export interface ProductionOrderResponse {
    readonly id: string;
    /** Folio interno (PROD-#). */
    readonly orderNumber: string;
    readonly productId: string;
    /** Snapshot del nombre del producto producido. */
    readonly productName: string;
    /** Bodega de la que salen los insumos y a la que entra el producto. */
    readonly warehouseId: string;
    /** Sucursal (la de la bodega); denormalizada para reportes. */
    readonly locationId: string | null;
    readonly status: ProductionOrderStatus;

    readonly plannedQuantity: string;
    /** Lo realmente obtenido; puede diferir de lo planeado. */
    readonly producedQuantity: string;
    /** Suma de consumos × costo promedio. Verbatim del escritorio. */
    readonly totalCost: string;
    /** Costo unitario del producto obtenido: total ÷ producido. Verbatim. */
    readonly unitCost: string;

    readonly notes: string | null;
    readonly completedAt: string | null;
    readonly lines: readonly ProductionOrderLineResponse[];

    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}
