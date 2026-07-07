/**
 * Unidad de venta alterna del producto (del desktop; la nube la almacena como
 * passthrough en el jsonb `units`, no la razona).
 */
export interface ProductUnitPrimitives {
  readonly id: string;
  readonly name: string;
  readonly factor: number;
  readonly price: number | null;
  readonly barcode: string | null;
}
