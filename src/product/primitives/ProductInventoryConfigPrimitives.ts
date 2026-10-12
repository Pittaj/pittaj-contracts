export interface ProductInventoryConfigPrimitives {
  readonly trackInventory: boolean;
  /**
   * Niveles del PRODUCTO: desde 1.18.0 son la **plantilla** que se propone por bodega. El nivel
   * que manda es el de `stock-level` (producto × bodega); sin él, se usa este.
   */
  readonly minStock: number;
  readonly maxStock: number;
  readonly reorderPoint: number;
  /**
   * Solo `AVERAGE` está implementado (en las dos puntas, misma regla). Los otros valores quedan
   * por compatibilidad de forma; el costo que se calcula es siempre promedio ponderado.
   */
  readonly valuationMethod: 'FIFO' | 'AVERAGE' | 'SPECIFIC';
  readonly unitOfMeasure: 'UNIT' | 'KG' | 'LT' | 'MT' | 'BOX' | 'PACK';

  /**
   * Rastreo (1.18.0, opcionales hasta que las dos puntas los guarden; ausente = `NONE`).
   * Ver `inventory/schemas/stockLot.schema.ts`.
   */
  readonly tracking?: 'NONE' | 'LOT' | 'SERIAL';
  /** Por lote: pedir caducidad al recibir. */
  readonly requiresExpiry?: boolean;
  /** Días de vida útil desde la fabricación: propone la caducidad si el proveedor no la trae. */
  readonly shelfLifeDays?: number | null;
  /** Por serie: meses de garantía que se cuentan desde la venta. */
  readonly warrantyMonths?: number | null;
  /** Clase ABC calculada (solo lectura; la escribe el proceso nocturno). */
  readonly abcClass?: 'A' | 'B' | 'C' | null;
}
