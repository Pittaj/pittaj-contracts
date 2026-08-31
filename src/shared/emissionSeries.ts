/**
 * @fileoverview La serie de folios por PUNTO DE EMISIÓN. **ADR-018, generalizado.**
 * **Espejo exacto del escritorio** (`Pittaj.Domain/Shared/EmissionSeries.cs`).
 * @module Contracts/Shared
 *
 * ── El problema que resuelve, otra vez ──
 *
 * `COMP-{max+1}` sobre la base local hacía que dos instalaciones emitieran el mismo folio, y en
 * agosto costó dos documentos distintos llamados igual. Se arregló para compras con ADR-018… y
 * `NOTA-{max+1}` se quedó exactamente con el mismo defecto, porque la regla se implementó dentro
 * de Compras en vez de como regla.
 *
 * Así que aquí está la regla, una sola vez, con la **letra del documento** como parámetro:
 *
 * | Documento        | Letra | Emisor            | Folio       |
 * |------------------|-------|-------------------|-------------|
 * | Compra           | `C`   | Sucursal S1       | `CS1-00001` |
 * | Compra           | `C`   | Web (la nube)     | `CW-00001`  |
 * | Nota a proveedor | `N`   | Sucursal S1       | `NS1-00001` |
 * | Nota a proveedor | `N`   | Web (la nube)     | `NW-00001`  |
 *
 * **Cada serie tiene exactamente un asignador**, y el consecutivo se cuenta **dentro de su serie,
 * nunca sobre el total**.
 *
 * ── Lo que NO se toca ──
 *
 * Los `COMP-#####` y los `NOTA-#####` ya emitidos se quedan como están. Renumerar documentos
 * existentes es peor que convivir con dos formatos, y por eso el índice único de compras es
 * parcial.
 */

/** Serie de todo lo que se crea desde la web: una sola por tenant, porque la nube es un asignador. */
export const WEB_SERIES = 'W';

/**
 * Serie de respaldo cuando no se puede resolver el código de la sucursal.
 *
 * Cae a una serie **propia** y nunca a la de otra: un folio feo se arregla, dos documentos con el
 * mismo folio no.
 */
export const FALLBACK_SERIES = 'X';

/** Dígitos del consecutivo (`CW-00001`). */
export const FOLIO_PADDING = 5;

/** La letra con la que empieza el folio de cada documento. */
export const DOCUMENT_LETTERS = {
    /** Órdenes de compra. */
    PURCHASE: 'C',
    /** Devoluciones y notas a proveedor. */
    SUPPLIER_NOTE: 'N',
} as const;

export type DocumentLetter = (typeof DOCUMENT_LETTERS)[keyof typeof DOCUMENT_LETTERS];

/**
 * Normaliza el código de una sucursal para usarlo como serie.
 *
 * Solo letras y dígitos, en mayúsculas: el folio se imprime y viaja en el sync, y un espacio o un
 * signo dentro rompe el corte del consecutivo al leerlo de vuelta.
 */
export function normalizeSeries(code: string | null | undefined): string {
    const limpio = (code ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return limpio.length > 0 ? limpio : FALLBACK_SERIES;
}

/**
 * Prefijo completo (con guion) de una serie.
 *
 * @example seriesPrefix('C', 'W')  // 'CW-'
 * @example seriesPrefix('N', 'S1') // 'NS1-'
 */
export function seriesPrefix(letter: string, series: string): string {
    return `${letter}${series.trim().toUpperCase()}-`;
}

/** Arma el folio: `('N', 'W', 42)` → `'NW-00042'`. */
export function formatDocumentNumber(letter: string, series: string, sequence: number): string {
    return `${seriesPrefix(letter, series)}${String(sequence).padStart(FOLIO_PADDING, '0')}`;
}
