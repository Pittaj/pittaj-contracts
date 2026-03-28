export interface SaleLineBasePrimitives {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productCode: string;
  readonly quantity: number;
  readonly unitPriceAmount: number;
  readonly unitPriceCurrency: string;
  readonly discountPercent: number;
  readonly taxPercent: number;
  readonly subtotalAmount: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
}
