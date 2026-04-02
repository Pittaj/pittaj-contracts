export interface AuthClaimsPrimitives {
  readonly tenantId: string | undefined;
  readonly role: string | undefined;
  readonly permissions: readonly string[];
  readonly companyIds: readonly string[] | undefined;
}
