import type { ActiveSessionPrimitives } from '../primitives/index.js';

/** Respuesta del endpoint GET /api/auth/sessions. */
export interface SessionListResponse {
    readonly sessions: readonly ActiveSessionPrimitives[];
    readonly total: number;
}
