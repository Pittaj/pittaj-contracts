/**
 * @fileoverview DTOs de lectura de Contabilidad.
 * @module Contracts/Accounting
 *
 * El módulo de contabilidad de la nube llevaba sus tipos **solo en el backend**: se podía
 * llamar a sus endpoints con `curl`, pero la web no tenía de dónde sacar las formas. Esto es
 * ese puente, y por eso nace con lo que consume la primera pantalla —excepciones y mapeos—
 * en vez de con todo el módulo de golpe.
 *
 * Contabilidad es **solo web** y **por empresa (RFC)**: todas las rutas cuelgan de
 * `/api/accounting/companies/:companyId/…`.
 */

/** Estado de una excepción del motor. */
export const ACCOUNTING_EXCEPTION_STATUSES = ['OPEN', 'RESOLVED'] as const;
export type AccountingExceptionStatusValue = (typeof ACCOUNTING_EXCEPTION_STATUSES)[number];

/**
 * Un documento que el motor no pudo contabilizar.
 *
 * **No es una bandeja de aprobación**: lo que se contabiliza bien nace posteado sin que nadie
 * confirme nada. Esta lista es lo que se atoró, con el motivo escrito para una persona.
 */
export interface AccountingExceptionResponse {
    readonly id: string;
    readonly companyId: string;
    /** Qué clase de documento es: `CASH_CLOSURE`, `PURCHASE`, `CUSTOMER_PAYMENT`… */
    readonly sourceType: string;
    /** El id del documento en su propio módulo. */
    readonly sourceDocId: string;
    /** Motivo corto y estable, para agrupar. */
    readonly reason: string;
    /** El detalle escrito para que alguien lo arregle. */
    readonly detail: string;
    readonly status: AccountingExceptionStatusValue;
    /** Fecha del documento (`YYYY-MM-DD`), no la del fallo. */
    readonly documentDate: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}

/** De dónde sale la cuenta que el motor está usando para un concepto. */
export const ACCOUNT_MAPPING_ORIGINS = ['MAPPED', 'TEMPLATE', 'MISSING'] as const;
export type AccountMappingOrigin = (typeof ACCOUNT_MAPPING_ORIGINS)[number];

/** Qué clase de cosa se está mapeando. */
export const ACCOUNT_MAPPING_KINDS = ['SLOT', 'PAYMENT_METHOD', 'TAX', 'PRODUCT_CATEGORY'] as const;
export type AccountMappingKind = (typeof ACCOUNT_MAPPING_KINDS)[number];

/**
 * Un concepto del motor y la cuenta que ocupa su hueco.
 *
 * Vienen **todos** los conceptos, no solo los mapeados, y cada uno dice si su cuenta la eligió
 * alguien (`MAPPED`) o la puso la plantilla PyME (`TEMPLATE`). Sin esa distinción la pantalla
 * no puede explicar por qué el motor usa una cuenta que nadie escogió — que es justo lo que
 * pregunta un contador la primera vez que la abre.
 */
export interface AccountMappingResponse {
    readonly kind: AccountMappingKind;
    readonly key: string;
    /** Cómo se lee el concepto: "Efectivo en caja", "IVA trasladado cobrado"… */
    readonly label: string;
    readonly origin: AccountMappingOrigin;
    readonly ledgerAccountId: string | null;
    readonly ledgerAccountCode: string | null;
    readonly ledgerAccountName: string | null;
    /** Por qué la cuenta que hay no sirve para postear, cuando no sirve. */
    readonly problem: string | null;
}

/** Una cuenta del catálogo, como la ve el árbol y el selector de cuenta. */
export interface LedgerAccountNodeResponse {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly parentId: string | null;
    readonly nature: string;
    /** `D` | `A`, tal como lo pide el XML de catálogo del Anexo 24. */
    readonly satNature: 'D' | 'A';
    readonly satGroupingCode: string | null;
    readonly level: number;
    readonly isLeaf: boolean;
    /** Puede recibir partidas: hoja + activa + con agrupador. */
    readonly isPostable: boolean;
    /** Por qué no puede postear, cuando no puede. Se enseña, no se adivina. */
    readonly notPostableReason: string | null;
    readonly isSystemManaged: boolean;
    readonly status: string;
    readonly children: readonly LedgerAccountNodeResponse[];
}

export interface ChartOfAccountsResponse {
    readonly companyId: string;
    readonly accountCount: number;
    readonly postableCount: number;
    readonly roots: readonly LedgerAccountNodeResponse[];
}

/** Lo que un documento dejó al pasar por el motor. */
export interface PostingExceptionSummary {
    readonly reason: string;
    readonly detail: string;
}

/**
 * El resultado de un barrido.
 *
 * `skipped` no es un fallo: hay documentos que **no tienen nada que asentar** —costo cero,
 * importe cero, o una producción cuyas dos cuentas son la misma— y saltarlos es lo correcto.
 * Se cuenta aparte justamente para que no se lea como un error ni se confunda con lo posteado.
 */
export interface PostingRunResponse {
    readonly posted: number;
    readonly failed: number;
    readonly skipped?: number;
    readonly exceptions: readonly PostingExceptionSummary[];
}
