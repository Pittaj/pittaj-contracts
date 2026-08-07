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

// ============================================================
// BALANZA DE COMPROBACIÓN (C3)
// ============================================================

/**
 * Una cuenta en la balanza.
 *
 * **Los saldos van con signo en la dirección natural de la cuenta**: positivo significa «del lado
 * que le toca» —deudor en una cuenta deudora, acreedor en una acreedora— y negativo, del contrario.
 * Se hace así y no con dos columnas `saldoDeudor`/`saldoAcreedor` porque con dos columnas hay que
 * decidir en el servidor de qué lado cae cada cifra, y esa decisión depende de la naturaleza: una
 * cuenta de clientes con saldo acreedor —un cliente que pagó de más— es una anomalía que hay que
 * poder VER, no una cifra que se cambia de columna en silencio.
 *
 * `debits` y `credits` son movimientos del periodo y **siempre son positivos**.
 */
export interface TrialBalanceRowResponse {
    readonly accountId: string;
    readonly code: string;
    readonly name: string;
    readonly nature: string;
    readonly satGroupingCode: string | null;
    /** 1 a 4. Sirve para sangrar el árbol sin recalcularlo. */
    readonly level: number;
    /** Puede recibir partidas. Las de mayor solo acumulan a sus hijas. */
    readonly isPostable: boolean;
    /** Saldo al día anterior al inicio del rango. */
    readonly initial: number;
    readonly debits: number;
    readonly credits: number;
    /** `initial` más los movimientos del rango, con el mismo criterio de signo. */
    readonly final: number;
    /**
     * La cuenta tiene partidas **propias** en el rango, no solo de sus hijas.
     *
     * Distingue una cuenta de mayor que solo acumula de una hoja con movimiento real, que es lo
     * que hay que mirar cuando una rama no cuadra.
     */
    readonly hasOwnMovements: boolean;
}

export interface TrialBalanceTotalsResponse {
    /** Suma de cargos y de abonos del rango. **Tienen que ser iguales**: es la comprobación. */
    readonly debits: number;
    readonly credits: number;
    /** Suma de los saldos finales que quedaron del lado deudor y del acreedor. */
    readonly finalDebit: number;
    readonly finalCredit: number;
}

export interface TrialBalanceResponse {
    readonly companyId: string;
    /** `YYYY-MM-DD`, ambos inclusive. */
    readonly from: string;
    readonly to: string;
    /** De la cuenta de mayor a la última hoja, en orden de código. */
    readonly rows: readonly TrialBalanceRowResponse[];
    readonly totals: TrialBalanceTotalsResponse;
    /**
     * `true` cuando cargos y abonos coinciden al centavo.
     *
     * En un libro sano es **siempre** `true` —la póliza no puede nacer descuadrada— así que un
     * `false` no es un aviso al usuario: es que algo escribió en la base sin pasar por el agregado.
     */
    readonly balanced: boolean;
}

// ============================================================
// LIBRO MAYOR / AUXILIAR DE CUENTA (C3)
// ============================================================

/**
 * Una partida en el auxiliar de una cuenta, con el saldo corrido.
 *
 * **Trae con qué llegar al documento origen, no solo su id.** El `documentLabel` es el folio
 * impreso (`CLS-000123`) y los `cfdiUuids` los comprobantes que amparan la operación: es el
 * recorrido póliza → documento → CFDI que pide un contador cuando revisa un movimiento raro, y sin
 * él el auxiliar es una lista de cifras sin dónde comprobarlas.
 */
export interface LedgerDetailRowResponse {
    readonly entryId: string;
    /** `YYYY-MM-DD`, la del periodo donde quedó el asiento. */
    readonly entryDate: string;
    /** La real del documento si entró tarde; `null` si coinciden. */
    readonly originalDate: string | null;
    readonly isLate: boolean;
    readonly type: JournalEntryTypeValue;
    readonly folio: number | null;
    /** El concepto de la póliza. */
    readonly concept: string;
    /** La descripción de esta partida, que puede ser más específica que el concepto. */
    readonly description: string;
    readonly debit: number;
    readonly credit: number;
    /**
     * Saldo acumulado **hasta esta partida inclusive**, con el signo en la dirección natural de
     * la cuenta. Arranca del saldo inicial del rango, no de cero: un auxiliar que empieza en cero
     * a mitad del ejercicio no dice cuánto había.
     */
    readonly running: number;
    readonly sourceType: string;
    readonly sourceDocId: string | null;
    /** El folio impreso del documento origen. `null` si no lleva o ya no existe. */
    readonly documentLabel: string | null;
    /** UUIDs de los CFDI que amparan la operación. */
    readonly cfdiUuids: readonly string[];
}

export interface LedgerDetailResponse {
    readonly companyId: string;
    readonly accountId: string;
    readonly code: string;
    readonly name: string;
    readonly nature: string;
    readonly from: string;
    readonly to: string;
    /** Saldo al día anterior al rango. Es de donde arranca el `running` de la primera fila. */
    readonly initial: number;
    /** De la más vieja a la más nueva: es el orden en que se lee un auxiliar. */
    readonly rows: readonly LedgerDetailRowResponse[];
    readonly debits: number;
    readonly credits: number;
    /** `initial` más los movimientos. Coincide con el `final` de esta cuenta en la balanza. */
    readonly final: number;
    /**
     * Hay más partidas de las que caben en la respuesta.
     *
     * El auxiliar de una cuenta de bancos con un año de movimiento son miles de filas; se corta y
     * **se dice que se cortó**, porque un saldo corrido que termina antes de tiempo parece un
     * saldo final y no lo es.
     */
    readonly truncated: boolean;
}

// ============================================================
// ESTADOS FINANCIEROS
// ============================================================

/** Las familias del agrupador SAT, que es lo que decide en qué estado cae una cuenta. */
export type AccountClassResponse =
    | 'ACTIVO'
    | 'PASIVO'
    | 'CAPITAL'
    | 'INGRESO'
    | 'COSTO'
    | 'GASTO'
    | 'RESULTADO_FINANCIERO'
    | 'ORDEN'
    /**
     * No se pudo saber. Solo aparece en `unclassified`.
     *
     * En un catálogo sano no sale nunca: una cuenta no puede postear sin agrupador SAT
     * (`LedgerAccount.canPost`), así que toda cuenta con movimiento es clasificable. Existe para
     * que un agrupador fuera de las familias `1`–`8` se **vea**, en vez de repartirse a ojo entre
     * los estados —que descuadra uno y cuadra el otro, y ahí ya no se nota—.
     */
    | 'DESCONOCIDA';

/** Un renglón de cualquiera de los dos estados. Siempre es una cuenta que puede postear. */
export interface FinancialStatementLineResponse {
    readonly accountId: string;
    readonly code: string;
    readonly name: string;
    readonly satGroupingCode: string | null;
    readonly accountClass: AccountClassResponse;
    /**
     * `DEUDORA` o `ACREEDORA`.
     *
     * Va en el renglón porque **es lo que decide si la cuenta suma o resta** dentro del estado, y
     * la clase no basta: la familia `7` lleva dentro gastos financieros (deudora, restan) y
     * productos financieros (acreedora, suman).
     */
    readonly nature: string;
    /**
     * Saldo **con signo en la dirección natural de la cuenta**, igual que en la balanza.
     *
     * En resultados eso significa que una devolución sobre ventas llega negativa y disminuye el
     * ingreso, en vez de sumarse a él por venir en valor absoluto.
     */
    readonly amount: number;
}

/** Un bloque del estado (Ingresos, Costo de ventas…) con sus cuentas y su subtotal. */
export interface FinancialStatementGroupResponse {
    readonly accountClass: AccountClassResponse;
    readonly label: string;
    readonly lines: readonly FinancialStatementLineResponse[];
    /** Suma de las cuentas del bloque, ya con el signo que le toca dentro del estado. */
    readonly subtotal: number;
}

/**
 * Estado de resultados de un rango.
 *
 * **No necesita el cierre de ejercicio.** La utilidad se deriva de las cuentas de resultados del
 * periodo; el traspaso a capital es un asiento que se hace al cerrar el año y que aquí no hace
 * falta para nada.
 */
export interface IncomeStatementResponse {
    readonly companyId: string;
    readonly from: string;
    readonly to: string;
    readonly groups: readonly FinancialStatementGroupResponse[];
    /** Ingresos menos costos. Sin gastos todavía. */
    readonly grossProfit: number;
    /** Utilidad de operación: bruta menos gastos, antes del resultado financiero. */
    readonly operatingProfit: number;
    /** Lo que suma el bloque financiero: positivo si se ganó más de lo que se pagó. */
    readonly financialResult: number;
    /** Utilidad **antes de impuestos**: la app no calcula ISR ni PTU. */
    readonly netProfit: number;
    /** Cuentas con movimiento que no se pudieron clasificar. Vacío en un catálogo sano. */
    readonly unclassified: readonly FinancialStatementLineResponse[];
}

/**
 * Balance general a una fecha.
 *
 * El **resultado del ejercicio** entra como un renglón calculado dentro del capital: es lo que
 * permite que cuadre a mitad de año, cuando el traspaso todavía no se ha hecho. No se guarda ni
 * se asienta: se deriva igual que todo lo demás.
 */
export interface BalanceSheetResponse {
    readonly companyId: string;
    /** Fecha de corte. El saldo es acumulado desde el principio, no de un rango. */
    readonly asOf: string;
    /** Desde dónde se acumuló el resultado del ejercicio (inicio del ejercicio en curso). */
    readonly fiscalYearStart: string;
    readonly assets: FinancialStatementGroupResponse;
    readonly liabilities: FinancialStatementGroupResponse;
    readonly equity: FinancialStatementGroupResponse;
    /** Resultado del periodo, ya incluido en el subtotal de capital. */
    readonly profitForPeriod: number;
    readonly totalAssets: number;
    /** Pasivo más capital, con el resultado del ejercicio dentro. */
    readonly totalLiabilitiesAndEquity: number;
    /**
     * `true` cuando activo iguala pasivo más capital al centavo.
     *
     * En un libro sano es **siempre** `true`. Un `false` no es un aviso al usuario: o hay cuentas
     * sin clasificar (van en `unclassified`) o algo escribió en la base sin pasar por el agregado.
     */
    readonly balanced: boolean;
    readonly unclassified: readonly FinancialStatementLineResponse[];
}
