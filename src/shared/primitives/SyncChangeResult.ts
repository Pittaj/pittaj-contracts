export interface SyncChangeResult {
  readonly id: string;
  readonly status: 'applied' | 'conflict' | 'error';
  readonly message?: string;
}
