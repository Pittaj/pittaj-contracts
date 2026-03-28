/**
 * @fileoverview Response DTO para GetCategoryMetadata query
 * @module queries/get-metadata
 * @version 1.0.0
 *
 * Define la estructura de metadata para sincronización inteligente.
 * Co-ubicado con la query y handler para cohesión.
 */

/**
 * Response DTO para metadata de categorías.
 *
 * Usado por Smart Cache System para detectar cambios sin descargar datos completos.
 * Permite sincronización eficiente comparando hash/version.
 *
 * @interface CategoryMetadataResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const metadata: CategoryMetadataResponse = {
 *   lastModified: '2025-11-26T10:30:00Z',
 *   totalCount: 1247,
 *   hash: 'a3f5c89d2b1e4567890abcdef1234567',
 *   version: 15234
 * };
 * ```
 */
export interface CategoryMetadataResponse {
    /**
     * Timestamp de última modificación (ISO 8601).
     */
    readonly lastModified: string;

    /**
     * Total de categorías del tenant.
     */
    readonly totalCount: number;

    /**
     * Hash SHA256 de todos los datos (detecta cambios).
     */
    readonly hash: string;

    /**
     * Suma de versiones (incrementa con cada cambio).
     */
    readonly version: number;
}
