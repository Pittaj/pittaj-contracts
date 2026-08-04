import type { SyncChangeResult } from './SyncChangeResult.js';

export interface SyncBatchResult {
  readonly applied: number;
  readonly conflicts: number;
  readonly errors: number;
  readonly results: SyncChangeResult[];
}
