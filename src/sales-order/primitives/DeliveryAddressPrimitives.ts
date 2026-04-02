export interface DeliveryAddressPrimitives {
  readonly street: string;
  readonly exteriorNumber: string;
  readonly interiorNumber: string | null;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
  readonly reference: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
}
