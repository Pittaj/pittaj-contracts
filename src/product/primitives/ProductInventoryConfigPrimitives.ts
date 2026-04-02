export interface ProductInventoryConfigPrimitives {
  readonly trackInventory: boolean;
  readonly minStock: number;
  readonly maxStock: number;
  readonly reorderPoint: number;
  readonly valuationMethod: 'FIFO' | 'AVERAGE' | 'SPECIFIC';
  readonly unitOfMeasure: 'UNIT' | 'KG' | 'LT' | 'MT' | 'BOX' | 'PACK';
}
