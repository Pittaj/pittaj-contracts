/**
 * @fileoverview DTO de Recipe (receta / lista de materiales).
 *
 * Espejo del agregado desktop `Pittaj.Domain.Production.Recipe`: qué componentes y en qué
 * cantidad se consumen para obtener `outputQuantity` unidades base del producto. Cubre por igual
 * una mezcla, una transformación con rendimiento (1 kg seco = 1.786 kg fresco) y un lote de
 * panadería; las cantidades del pedido se escalan proporcionalmente.
 *
 * Los nombres y códigos de componente son **snapshot**: se congelan como estaban al capturar la
 * receta. Si mañana se renombra un producto, la receta vieja sigue diciendo lo que decía.
 *
 * Las cantidades viajan como **string** (numeric de Postgres) para no perder decimales al pasar
 * por el punto flotante de JavaScript — misma convención que compras e inventario.
 *
 * @module Contracts/Production
 */

/** Componente de una receta. */
export interface RecipeLineResponse {
    readonly id: string;
    readonly componentProductId: string;
    /** Snapshot del nombre al capturar la receta. */
    readonly componentName: string;
    /** Snapshot del código/SKU al capturar la receta. */
    readonly componentCode: string;
    /** Cantidad en unidad BASE del componente. */
    readonly quantity: string;
}

/** DTO de respuesta para sync de recetas. */
export interface RecipeResponse {
    readonly id: string;
    readonly productId: string;
    /** Snapshot del nombre del producto que se produce. */
    readonly productName: string;
    /** Unidades base que rinde la receta (el lote). Las líneas consumen esto. */
    readonly outputQuantity: string;
    readonly notes: string | null;
    readonly isActive: boolean;
    readonly lines: readonly RecipeLineResponse[];

    readonly version: number;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}
