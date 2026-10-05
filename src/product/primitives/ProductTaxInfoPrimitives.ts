export interface ProductTaxInfoPrimitives {
  /** FK al catálogo de impuestos (Tax). La tasa/isIncluded/kind viven en el Tax. */
  readonly taxId: string;
  /** D7b · IEPS del producto además del IVA (impuesto del catálogo de tipo IEPS); null = no lleva. */
  readonly iepsTaxId?: string | null;
  readonly satProductCode: string | null;
  readonly satUnitCode: string | null;
}
