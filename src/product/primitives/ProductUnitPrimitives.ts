/**
 * Unidad alterna del producto (del desktop; la nube la guarda en `product_units`).
 *
 * U-T1 (2.121.0): `sellable` / `purchasable` dicen si la caja y las compras la ofrecen. Ausentes =
 * `true` (lo de antes de 2.121.0 se vendía y se compraba en todas sus unidades).
 */
export interface ProductUnitPrimitives {
  readonly id: string;
  readonly name: string;
  readonly factor: number;
  readonly price: number | null;
  readonly barcode: string | null;
  readonly sellable?: boolean;
  readonly purchasable?: boolean;
}
