import type { ActiveSessionPrimitives } from '../primitives';

/** Respuesta del endpoint GET /api/auth/sessions. */
export interface SessionListResponse {
    readonly sessions: readonly ActiveSessionPrimitives[];
    readonly total: number;
}
