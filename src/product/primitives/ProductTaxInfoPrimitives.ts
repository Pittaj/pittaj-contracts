export interface ProductTaxInfoPrimitives {
  readonly taxType: 'IVA_16' | 'IVA_8' | 'IVA_0' | 'EXENTO' | 'IEPS';
  readonly taxIncluded: boolean;
  readonly satProductCode: string | null;
  readonly satUnitCode: string | null;
}
