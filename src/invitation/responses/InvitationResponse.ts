export interface InvitationResponse {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
  readonly invitedBy: string;
  readonly invitedByName?: string;
  readonly token?: string;
  readonly expiresAt: string;
  readonly acceptedAt: string | null;
  readonly acceptedBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string | null;
  readonly version: number;
}
