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
    /**
     * Cuentas de la plantilla que el motor tuvo que crear durante el barrido.
     *
     * El motor crea la cuenta que la plantilla define para un concepto **solo cuando un
     * documento la necesita de verdad** — sembrar de más le cambiaría a la empresa el XML de
     * catálogo del Anexo 24 por una cuenta que quizá no use nunca. Pero eso **no puede pasar en
     * silencio**: su catálogo cambió, y quien lo mira tiene que poder ir a remapear el concepto
     * si esperaba que cayera en una cuenta suya.
     */
    readonly provisionedAccounts?: readonly { readonly code: string; readonly name: string }[];
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
    /**
     * Resultado de ejercicios anteriores que **nadie traspasó todavía**, ya incluido en el
     * subtotal de capital.
     *
     * Es utilidad vieja que sigue viva en las cuentas de resultados porque el asiento de cierre de
     * ejercicio (C4) aún no existe. Va aparte porque **no es del periodo** y sumarla ahí inflaría
     * el resultado del año; y se enseña porque, si no, las cuentas de capital no suman a su propio
     * subtotal y el reporte parece roto.
     *
     * Vale `0` en cuanto el traspaso exista: entonces su importe estará asentado en `3xx` y
     * aparecerá como una cuenta más.
     */
    readonly retainedFromPriorYears: number;
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

// ============================================================
// IVA (C4)
// ============================================================

/** Una de las cuentas que alimentan la declaración, con lo que aportó. */
export interface VatReportLineResponse {
    /** El hueco del motor: `VAT_TRANSFERRED_COLLECTED`, `VAT_CREDITABLE_PAID`… */
    readonly slot: string;
    readonly label: string;
    /** `null` cuando el hueco no tiene cuenta: se dice, no se calla. */
    readonly accountId: string | null;
    readonly code: string | null;
    readonly name: string | null;
    /**
     * Movimiento **del periodo** en la dirección natural de la cuenta, salvo en las dos de
     * pendiente, donde es el **saldo acumulado** al corte — que es lo que de verdad está
     * pendiente, no lo que se movió este mes.
     */
    readonly amount: number;
}

/**
 * Los números con los que se prepara la declaración mensual de IVA.
 *
 * **Prepara, no declara.** Pittaj no presenta nada ante el SAT: esto es para que el contador
 * llegue con las cifras cuadradas y con de dónde salió cada una.
 *
 * **Se mira el MOVIMIENTO del mes, no el saldo.** Lo que se declara es lo que se cobró y se pagó
 * en el periodo; el saldo de la cuenta arrastra meses anteriores mientras nadie asiente el pago
 * del impuesto, y leerlo daría una cifra que crece sola.
 */
export interface VatReportResponse {
    readonly companyId: string;
    readonly year: number;
    readonly month: number;
    readonly from: string;
    readonly to: string;

    /** IVA que se cobró en el periodo. Es lo que se causa por flujo. */
    readonly transferredCollected: number;
    /** IVA que se pagó en el periodo y por tanto se acredita. */
    readonly creditablePaid: number;
    /**
     * IVA retenido a proveedores en el periodo.
     *
     * **Va aparte y NO se resta de la diferencia**: es una obligación distinta —dinero de un
     * tercero que el negocio entera— y mezclarla con el IVA propio da un número que no
     * corresponde a ningún renglón de la declaración.
     */
    readonly withheld: number;
    /** Cobrado menos pagado. **Positivo es a cargo**; negativo, saldo a favor. */
    readonly balance: number;

    /** Saldo al corte de lo que se cobrará: IVA de ventas a crédito aún sin cobrar. */
    readonly transferredPending: number;
    /** Saldo al corte de lo que se acreditará: IVA de compras a crédito aún sin pagar. */
    readonly creditablePending: number;

    readonly lines: readonly VatReportLineResponse[];
    /** Huecos sin cuenta resoluble. Con esto, alguna cifra está incompleta y hay que decirlo. */
    readonly missing: readonly string[];

    /**
     * ⚠️ IVA que se acreditó y **la ley no permite acreditar**, por la forma de pago.
     *
     * LISR art. 27 fr. III deja el efectivo fuera de los medios que hacen deducible
     * un pago de más de $2 000, y LIVA art. 5 fr. I ata lo acreditable a lo
     * deducible. Encadenados: ese IVA no se acredita.
     *
     * **Está aquí y no en una pantalla aparte** porque el sitio donde importa es
     * justo antes de declarar. `creditablePaid` **incluye** este importe: lo que
     * se enseña es cuánto habría que quitarle a mano — el sistema todavía no lo
     * mueve de cuenta (BUG-045).
     */
    readonly nonCreditableVat: {
        /** Cuántas compras del periodo tropiezan. `0` = la lista está limpia. */
        readonly count: number;
        /** El IVA acreditado de más, sumado. */
        readonly amount: number;
        readonly rows: readonly NonCreditableVatRowResponse[];
    };
}

/** Una compra cuyo IVA se acreditó contra lo que dice la ley. */
export interface NonCreditableVatRowResponse {
    readonly purchaseId: string;
    readonly purchaseNumber: string;
    readonly date: string;
    readonly supplierName: string;
    readonly total: number;
    readonly vatAmount: number;
    /** Por qué, en una línea y con el artículo. */
    readonly detail: string;
}

// ============================================================
// DIOT (C4)
// ============================================================

/**
 * Tipo de tercero del catálogo del SAT.
 *
 * `04` proveedor nacional · `05` proveedor extranjero · `15` proveedor global (las operaciones
 * con quien no dio RFC, que se declaran en un solo renglón).
 */
export type DiotThirdPartyType = '04' | '05' | '15';

/** Un proveedor con lo que se le pagó en el mes. */
export interface DiotRowResponse {
    readonly supplierName: string;
    /** RFC. `null` cuando el proveedor no lo tiene capturado. */
    readonly taxId: string | null;
    readonly thirdPartyType: DiotThirdPartyType;
    /**
     * Tipo de operación del SAT: `03` servicios · `06` arrendamiento · `85` otros.
     *
     * **Siempre sale `85`, y hay que revisarlo.** El dato para distinguir un arrendamiento de un
     * servicio no existe en la compra —`kind` solo dice si es inventario o gasto—, y adivinarlo
     * pondría una clasificación fiscal falsa que nadie verificaría.
     */
    readonly operationType: '85';
    /** Valor de los actos **pagados en el mes** que llevaron IVA. */
    readonly paidBase: number;
    /** IVA acreditable pagado en el mes a ese proveedor. */
    readonly creditableVat: number;
    /**
     * Valor de los actos pagados **sin IVA**.
     *
     * La DIOT distingue **tasa 0% de exento** y el dato no: la compra guarda un solo importe de
     * impuesto. Va junto y se marca para que el contador lo parta.
     */
    readonly paidBaseWithoutVat: number;
    /** IVA retenido a ese proveedor en las operaciones pagadas. */
    readonly withheldVat: number;
}

/**
 * La DIOT del mes: a quién se le pagó y cuánto IVA se acreditó por ello.
 *
 * **Se declara por lo PAGADO, no por lo facturado**, igual que el IVA acreditable: una factura a
 * crédito entra en la DIOT del mes en que se paga.
 */
export interface DiotReportResponse {
    readonly companyId: string;
    readonly year: number;
    readonly month: number;
    readonly from: string;
    readonly to: string;
    readonly rows: readonly DiotRowResponse[];
    readonly totals: {
        readonly paidBase: number;
        readonly creditableVat: number;
        readonly paidBaseWithoutVat: number;
        readonly withheldVat: number;
    };
    /**
     * Cuadre contra el libro: el IVA acreditable de la DIOT tiene que ser **el mismo** que el del
     * reporte de IVA del mismo mes.
     *
     * Los dos salen de sitios distintos —la DIOT de las compras y sus pagos, el libro de la cuenta
     * `118-01`— así que una diferencia significa que algo no está contabilizado, y descubrirlo al
     * presentar la declaración sale caro.
     */
    readonly reconciliation: {
        /** Lo que dice el libro (movimiento del mes en IVA acreditable pagado). */
        readonly ledgerCreditableVat: number;
        /** Lo que suma la DIOT. */
        readonly diotCreditableVat: number;
        readonly difference: number;
        readonly matches: boolean;
    };
}

/**
 * Un activo fijo tal como lo ve la pantalla.
 *
 * **`accumulatedDepreciation` y `bookValue` son derivados, no columnas.** Salen
 * del MOI, la tasa y la fecha de servicio, igual que todo saldo en esta app: un
 * contador guardado en dos sitios se desincroniza, y el día que alguien cancele
 * una póliza de depreciación la columna mentiría sin que nada proteste.
 */
export interface FixedAssetResponse {
    readonly id: string;
    readonly companyId: string;
    readonly name: string;
    readonly description: string | null;
    readonly assetType: string;
    /** Cómo se llama el tipo en la pantalla, ya traducido. */
    readonly assetTypeLabel: string;
    /** Monto original de la inversión: precio + fletes + instalación, sin IVA. */
    readonly moi: number;
    /** Tasa anual en tanto por uno. `0.30` = 30 %. */
    readonly annualRate: number;
    /**
     * Qué artículo de la LISR da esa tasa. Va a la pantalla a propósito: una tasa
     * sin procedencia es un número que nadie se atreve a cambiar ni a defender.
     */
    readonly rateBasis: string;
    /**
     * `true` cuando la tasa la fija la **actividad del negocio** y no el bien
     * (LISR art. 35). El valor por defecto es el residual del 10 %, correcto para
     * una tienda y **equivocado para un restaurante**, que son 20 %. La pantalla
     * tiene que decirlo: nadie corrige un número que no sabe que está mal.
     */
    readonly rateDependsOnActivity: boolean;
    readonly acquisitionDate: string;
    readonly inServiceDate: string;
    /** `YYYY-MM` del primer mes que deprecia. `null` si el activo no deprecia. */
    readonly firstDepreciationPeriod: string | null;
    readonly purchaseCfdiUuid: string | null;
    readonly locationId: string | null;
    readonly status: string;
    /** Lo depreciado hasta hoy. Derivado. */
    readonly accumulatedDepreciation: number;
    /** MOI menos lo depreciado. Es contra esto que se mide una baja. */
    readonly bookValue: number;
    /** Cuántos meses de depreciación quedan. `null` si no deprecia. */
    readonly remainingMonths: number | null;
    /** Las cinco cuentas contra las que postea, para que se puedan mirar. */
    readonly accounts: {
        readonly asset: string;
        readonly accumulated: string | null;
        readonly expense: string | null;
        readonly disposalLoss: string;
        readonly disposalGain: string;
    };
    readonly disposal: {
        readonly kind: string;
        readonly date: string;
        readonly proceeds: number;
        /** Contra el valor en libros, no contra el MOI. Negativo = pérdida. */
        readonly result: number;
    } | null;
    /**
     * ⚠️ Avisos que no bloquean pero conviene ver: un automóvil por encima del
     * tope deducible del art. 36, o una tasa que depende de la actividad.
     */
    readonly warnings: readonly string[];
}

/** Un renglón de la tabla de depreciación de un activo. */
export interface DepreciationScheduleRowResponse {
    readonly period: string;
    readonly amount: number;
    readonly accumulated: number;
    readonly bookValue: number;
    /** `true` si ese mes ya está asentado en el libro. */
    readonly posted: boolean;
}

export interface FixedAssetDetailResponse extends FixedAssetResponse {
    readonly schedule: readonly DepreciationScheduleRowResponse[];
}

export interface FixedAssetListResponse {
    readonly items: readonly FixedAssetResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Los totales de la lista, que es lo que va al balance. */
    readonly totals: {
        readonly moi: number;
        readonly accumulatedDepreciation: number;
        readonly bookValue: number;
    };
}

/** Lo que devuelve el barrido mensual de depreciación. */
export interface DepreciationRunResponse {
    readonly companyId: string;
    readonly period: string;
    readonly posted: number;
    readonly skipped: number;
    readonly failed: number;
    readonly totalDepreciated: number;
    readonly exceptions: readonly { readonly assetId: string; readonly reason: string }[];
    /** Cuentas de plantilla creadas al vuelo para poder postear. */
    readonly provisionedAccounts: readonly { readonly code: string; readonly name: string }[];
}
