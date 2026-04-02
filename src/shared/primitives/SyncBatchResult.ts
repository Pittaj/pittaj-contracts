import type { SyncChangeResult } from './SyncChangeResult';

export interface SyncBatchResult {
  readonly applied: number;
  readonly conflicts: number;
  readonly errors: number;
  readonly results: SyncChangeResult[];
}
