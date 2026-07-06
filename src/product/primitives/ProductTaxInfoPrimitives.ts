export interface ProductTaxInfoPrimitives {
  /** FK al catálogo de impuestos (Tax). La tasa/isIncluded/kind viven en el Tax. */
  readonly taxId: string;
  readonly satProductCode: string | null;
  readonly satUnitCode: string | null;
}
