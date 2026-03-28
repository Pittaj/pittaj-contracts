export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly avatarUrl?: string;
}
