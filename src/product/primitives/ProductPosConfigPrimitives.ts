export interface ProductPosConfigPrimitives {
  readonly showInPos: boolean;
  readonly posColor: string | null;
  readonly posIcon: string | null;
  readonly posOrder: number;
  readonly allowFractional: boolean;
  readonly allowPriceEdit: boolean;
}
