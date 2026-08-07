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
    /**
     * El folio impreso del documento (`CLS-000123`, `COM-0045`), para poder ir a
     * buscarlo. `sourceDocId` es un UUID y no se busca en ninguna pantalla.
     *
     * `null` cuando el documento no lleva folio por diseño —un movimiento de
     * inventario o de caja es un apunte, no un documento—, cuando lo tiene vacío,
     * o cuando ya no existe (que es justo el motivo `SOURCE_NOT_FOUND`).
     */
    readonly documentLabel: string | null;
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

// ============================================================
// EJERCICIOS Y PERIODOS
// ============================================================

/** Un mes contable. Se cierra y se puede reabrir; cerrado, no admite pólizas. */
export interface FiscalPeriodResponse {
    readonly id: string;
    /** 1–12. */
    readonly month: number;
    readonly startDate: string;
    readonly endDate: string;
    readonly status: 'OPEN' | 'CLOSED';
    readonly closedAt: string | null;
    /**
     * Quién cerró el mes (su correo). `null` en los meses abiertos: al reabrir se
     * borra, porque un nombre junto a un mes abierto se lee como si aún lo
     * estuviera. El rastro completo de cierres y reaperturas vive en la bitácora.
     */
    readonly closedBy: string | null;
    /**
     * Pólizas posteadas del mes. Es lo que distingue un mes que nadie ha trabajado
     * de uno cerrado a conciencia — y esa es la pregunta antes de cerrarlo.
     *
     * Los borradores no cuentan; una póliza reversada y su reversa cuentan dos,
     * igual que se ven al abrir el mes.
     */
    readonly entryCount: number;
}

export interface FiscalYearResponse {
    readonly id: string;
    readonly year: number;
    readonly status: 'OPEN' | 'CLOSED';
    readonly closedAt: string | null;
    readonly closingEntryId: string | null;
    readonly periods: readonly FiscalPeriodResponse[];
}

// ============================================================
// PÓLIZAS
// ============================================================

/** Tipo de póliza. El folio corre por tipo y por mes. */
export const JOURNAL_ENTRY_TYPES = ['INGRESO', 'EGRESO', 'DIARIO'] as const;
export type JournalEntryTypeValue = (typeof JOURNAL_ENTRY_TYPES)[number];

export interface JournalLineResponse {
    readonly ordinal: number;
    readonly ledgerAccountId: string;
    readonly description: string;
    readonly debit: number;
    readonly credit: number;
    /** Sucursal como dimensión del asiento. */
    readonly locationId: string | null;
}

/** Referencia al CFDI que ampara la operación. Es la trazabilidad que pide el SAT. */
export interface CfdiRefResponse {
    readonly uuid: string;
    readonly kind?: string;
}

export interface JournalEntryResponse {
    readonly id: string;
    readonly companyId: string;
    readonly fiscalPeriodId: string;
    readonly type: JournalEntryTypeValue;
    /** `YYYY-MM-DD`. La del periodo donde quedó el asiento. */
    readonly entryDate: string;
    /** La del documento, si entró tarde. `null` si coinciden. */
    readonly originalDate: string | null;
    /**
     * El documento entró después de que su mes cerrara.
     *
     * No es un error: se asienta en el primer periodo abierto y **conserva su fecha real**,
     * que es lo que permite explicarle a un contador por qué una compra de marzo aparece en
     * la póliza de abril.
     */
    readonly isLate: boolean;
    readonly folio: number | null;
    readonly concept: string;
    readonly status: string;
    readonly sourceType: string;
    readonly sourceDocId: string | null;
    /** Si es la reversa de otra póliza, cuál. */
    readonly reversalOfId: string | null;
    readonly cfdiRefs: readonly CfdiRefResponse[];
    readonly createdBy: string;
    readonly version: number;
    readonly lines: readonly JournalLineResponse[];
}
