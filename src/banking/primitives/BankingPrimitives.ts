/**
 * @fileoverview Primitivas serializables compartidas del módulo Banking.
 * Se usan en schemas, responses y en el dominio del backend.
 */

import type {
  AccountNatureValue,
  CounterpartyTypeValue,
  MatchOriginValue,
  PayableDocumentTypeValue,
  ReconciliationRuleActionValue,
  SummaryTermKindValue,
  TransactionSourceTypeValue,
} from '../constants/index.js';

/** Configuración de tarjeta de crédito (solo cuentas kind=CREDIT_CARD). */
export interface CreditCardConfigPrimitives {
  /** Día de corte del estado de cuenta (1-31). */
  readonly cutoffDay?: number | null;
  /** Día límite de pago (1-31). */
  readonly paymentDay?: number | null;
  /** Límite de crédito otorgado. */
  readonly creditLimit?: number | null;
}

/** Contraparte de un movimiento (proveedor, cliente, empleado u otro). */
export interface CounterpartyPrimitives {
  readonly type: CounterpartyTypeValue;
  /** Id del tercero cuando existe en el sistema (Supplier/Customer/User). */
  readonly id?: string | null;
  /** Nombre visible de la contraparte. */
  readonly name: string;
}

/** Documento de negocio que originó el movimiento. */
export interface TransactionSourcePrimitives {
  readonly type: TransactionSourceTypeValue;
  /** Id del documento origen (copia nube); uuid suelto, sin FK. */
  readonly id?: string | null;
}

// ── N2 · Conciliación ──────────────────────────────────────────────

/**
 * Una línea tal como viene del banco, ya extraída del archivo.
 *
 * Es la salida del puerto de extracción y la entrada del importador: el dominio
 * no sabe si vino de un PDF, de una foto o de un CSV.
 */
export interface ExtractedStatementLinePrimitives {
  /** Fecha de la operación (YYYY-MM-DD). */
  readonly date: string;
  /** Texto del banco, tal cual. Es el insumo de las reglas. */
  readonly description: string;
  /** Referencia bancaria si el estado la trae. */
  readonly reference?: string | null;
  /** Monto con signo: + abono, − cargo. */
  readonly amount: number;
}

/**
 * Cifras de control que el propio estado de cuenta imprime en su resumen.
 *
 * Todas opcionales porque no todos los bancos las publican, pero cada una que
 * llegue es una ecuación independiente más contra la cual comprobar la lectura.
 *
 * Importan por un punto ciego concreto: el cuadre neto
 * (`inicial + Σ movimientos = final`) **no detecta dos signos invertidos que se
 * cancelan**. Si un abono se lee como cargo y un cargo de monto parecido como
 * abono, el neto casi no se mueve y el cuadre pasa estando mal. Comparar la
 * suma de abonos y la de cargos por separado sí lo detecta.
 */
export interface StatementDeclaredTotalsPrimitives {
  /** Suma de abonos según el resumen del banco. */
  readonly totalCredits?: number | null;
  /** Suma de cargos según el resumen del banco (positiva). */
  readonly totalDebits?: number | null;
  /** Cuántos movimientos dice el banco que hay. */
  readonly movementCount?: number | null;
  /**
   * Últimos dígitos de la cuenta impresos en el documento.
   *
   * Sirven para confirmar que el estado pertenece a la cuenta que se está
   * conciliando: importar el de otro banco es un error trivial de cometer y
   * caro de descubrir tarde.
   */
  readonly accountNumberTail?: string | null;
}

/**
 * Un renglón de la ecuación que el banco imprime en su resumen.
 *
 * Existe porque **no hay una ecuación única**: Banorte declara siete términos y
 * deja las comisiones fuera de "retiros"; Banco Azteca declara dos niveles y las
 * mete dentro; Mercado Pago declara cuatro; una tarjeta declara ocho y al revés.
 * Imponerle a todos una forma de dos términos (`depósitos − retiros`) marca en
 * rojo lecturas perfectas.
 *
 * Capturando la ecuación tal como está impresa, la comprobación deja de
 * depender de conocer al banco.
 */
export interface StatementSummaryTermPrimitives {
  /** La etiqueta tal como la imprime el documento. */
  readonly label: string;
  /** Importe SIEMPRE en positivo: el sentido lo lleva `sign`. */
  readonly amount: number;
  /**
   * +1 suma al saldo, −1 resta.
   *
   * Lo normaliza el extractor, y es el dato más delicado de todo el resumen:
   * el signo puede venir **dentro del número** (`-$80,875.35`) o **fuera, como
   * operador de la tabla** (`−  $19,417.49`), y dos emisores con la MISMA tabla
   * estandarizada usan convenciones opuestas. Equivocarlo no descuadra por el
   * importe: descuadra por el doble, porque suma lo que debía restar.
   */
  readonly sign: 1 | -1;
  /** Clasificación best-effort, para casar movimientos. Nunca para cuadrar. */
  readonly kind: SummaryTermKindValue;
}

/**
 * El bloque de resumen del documento, como ecuación.
 *
 * `saldoInicial + Σ(signo × importe) = saldoFinal` debe cerrar. Que cierre no
 * dice que los movimientos estén bien leídos —dice que el RESUMEN se leyó
 * bien—, y son dos cosas distintas que conviene no confundir.
 */
export interface StatementDeclaredSummaryPrimitives {
  readonly openingBalance: number;
  readonly closingBalance: number;
  /** Deudora (el dinero es tuyo) o acreedora (es una deuda: TDC). */
  readonly nature: AccountNatureValue;
  readonly terms: readonly StatementSummaryTermPrimitives[];
}

/**
 * Lo que devuelve un extractor de estados de cuenta, sea cual sea el proveedor.
 *
 * Trae los saldos declarados **además** de las líneas porque son el verificador:
 * `saldo inicial + Σ montos = saldo final`. Si no cuadra al centavo la extracción
 * se rechaza, y es lo que permite escalar de un modelo barato a uno caro sin
 * arriesgar la contabilidad.
 */
export interface StatementExtractionPrimitives {
  /** Saldo inicial declarado por el banco. */
  readonly openingBalance: number;
  /** Saldo final declarado por el banco. */
  readonly closingBalance: number;
  /** Inicio del periodo (YYYY-MM-DD). */
  readonly periodStart: string;
  /** Fin del periodo (YYYY-MM-DD). */
  readonly periodEnd: string;
  /** Movimientos en el orden en que aparecen en el documento. */
  readonly lines: readonly ExtractedStatementLinePrimitives[];
  /** Cifras de control del resumen, cuando el documento las trae. */
  readonly declared?: StatementDeclaredTotalsPrimitives | null;
  /**
   * La ecuación del resumen tal como el documento la imprime.
   *
   * Es opcional porque hay documentos que no la traen —una tarjeta del lote
   * solo publica fechas, línea de crédito y una gráfica—. Ausente significa
   * "no comprobable", nunca "aprobado".
   */
  readonly summary?: StatementDeclaredSummaryPrimitives | null;
}

/**
 * Lo que costó una lectura, medido y estimado por separado.
 *
 * Los TOKENS son un hecho: los reporta el proveedor. El COSTO es una
 * derivación a partir de una tabla de precios que vive en el adaptador y que
 * puede quedar desfasada de la lista del proveedor. Se guardan los dos para
 * que un precio mal actualizado no borre el dato real: con los tokens siempre
 * se puede recalcular el costo hacia atrás.
 */
export interface ExtractionUsagePrimitives {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /**
   * Estimación en USD, o **null si no hay precio configurado** para ese modelo.
   *
   * Null es deliberado y no significa gratis: significa "no lo sé". Poner un
   * cero, o un precio inventado, produce un dato que se ve creíble y no lo es
   * — y el propósito de medir esto es dejar de estimar a ojo. Con los tokens
   * guardados, el costo se recalcula cuando el precio se configure.
   */
  readonly costUsd: number | null;
}

/** Resultado de una de las comprobaciones que se le hacen a la lectura. */
export interface ExtractionCheckPrimitives {
  /** Qué se comprobó. */
  readonly check:
    | 'NET_BALANCE'
    /** La ecuación que el banco imprime cierra consigo misma. */
    | 'SUMMARY_CLOSES'
    /** Lo leído casa con los términos que el banco declara. */
    | 'MOVEMENTS_MATCH_SUMMARY'
    | 'TOTAL_CREDITS'
    | 'TOTAL_DEBITS'
    | 'MOVEMENT_COUNT'
    | 'DATES_IN_PERIOD'
    | 'ACCOUNT_MATCH';
  /**
   * `true` pasó, `false` falló, **`null` no se comprobó** — y no siempre por el mismo motivo:
   *
   * - el documento no publica el dato (el banco no imprime cuántos movimientos trae), o
   * - la comprobación quedó **superada** por otra mejor (los totales sueltos de abonos y cargos,
   *   cuando el documento declara su ecuación completa).
   *
   * La diferencia importa al pintarlo: decir "no declarado" del segundo caso contradice la
   * explicación que va debajo, que dice justo lo contrario. `detail` lleva el motivo cuando lo hay.
   */
  readonly passed: boolean | null;
  /** Lo que dio la lectura. */
  readonly computed?: number | string | null;
  /** Lo que declara el documento. */
  readonly declared?: number | string | null;
  /** Explicación lista para mostrar cuando falla. */
  readonly detail?: string | null;
}

/**
 * Resultado de una corrida de extracción, con la trazabilidad de qué la produjo.
 *
 * `balanced` es la verdad aritmética, no una opinión del modelo: lo calcula el
 * dominio comparando los saldos declarados contra la suma de las líneas.
 */
export interface StatementExtractionAttemptPrimitives {
  /** Identificador del proveedor/modelo que la produjo, para auditoría y costo. */
  readonly extractor: string;
  /** Si la ecuación de saldos cuadró al centavo. */
  readonly balanced: boolean;
  /** Diferencia encontrada (0 cuando cuadra). Útil para mostrar el descuadre. */
  readonly difference: number;
  /**
   * Todas las comprobaciones que se le pudieron hacer a la lectura.
   *
   * `balanced` sigue siendo el veredicto que decide si la extracción entra —
   * es la ecuación que siempre se puede evaluar. Esto es el detalle que
   * permite mostrar *qué* se comprobó y qué no, en vez de un sí/no opaco.
   */
  readonly checks?: readonly ExtractionCheckPrimitives[];
  /** Consumo del intento, cuando el proveedor lo reporta. */
  readonly usage?: ExtractionUsagePrimitives | null;
  readonly extraction: StatementExtractionPrimitives;
}

/**
 * Esta cuenta empezó a necesitar un lector más caro que el que la venía resolviendo.
 *
 * Es la señal que faltaba. Cuando un banco cambia el formato de su PDF, la cascada hace lo
 * correcto —escalar al modelo que sí lo entiende— y devuelve una lectura buena, así que **nada
 * falla**: solo se paga más, en silencio, todos los meses. Lo que duele no es el importe, es que
 * un cambio de comportamiento del banco no se note hasta que alguien mire el recibo.
 *
 * Se compara contra el peldaño MÁS BARATO de las últimas importaciones de la cuenta, no contra la
 * anterior: comparar con la última convertiría el cambio en el nuevo normal a la primera y dejaría
 * de avisar justo en los seis meses siguientes, que es el caso que importa. Con una ventana móvil
 * el aviso se apaga solo cuando el peldaño nuevo ya es lo habitual de esa cuenta.
 */
export interface ExtractorDriftPrimitives {
  /** El extractor más barato que resolvió esta cuenta en la ventana. */
  readonly previous: string;
  /** El que la resolvió ahora. */
  readonly current: string;
  /** Cuántos peldaños subió. */
  readonly steps: number;
  /** Sobre cuántas importaciones previas se comparó. */
  readonly samples: number;
}

/**
 * Un peldaño de la cascada: qué extractor se probó y por qué no bastó.
 *
 * La cascada empieza por el modelo más barato y escala cuando la lectura no pasa el filtro. Sin
 * este rastro, la pantalla solo puede decir "leído por sonnet" — y quien ve eso después de que una
 * importación costara diez veces lo previsto no tiene forma de saber **qué falló abajo**, que es
 * justo el dato que decide si el prompt necesita ayuda o si ese banco simplemente no es para el
 * modelo barato.
 */
export interface StatementExtractionStepPrimitives {
  /** Proveedor y modelo del peldaño. */
  readonly extractor: string;
  /** Si su lectura cuadró. `null` cuando el extractor ni siquiera pudo leer. */
  readonly balanced: boolean | null;
  readonly difference: number | null;
  /** Nombres de las comprobaciones que falló. Vacío = ninguna. */
  readonly failedChecks?: readonly string[];
  /** Mensaje cuando el extractor no pudo leer el documento. */
  readonly error?: string;
  /** Lo que consumió este peldaño. */
  readonly usage?: ExtractionUsagePrimitives | null;
}

/** Condición de una regla de conciliación sobre una línea del banco. */
export interface ReconciliationMatchPrimitives {
  /** La descripción del banco debe contener este texto (case-insensitive). */
  readonly descriptionContains: string;
  /** Signo exigido: IN = abono, OUT = cargo. Null = cualquiera. */
  readonly sign?: 'IN' | 'OUT' | null;
  /** Monto mínimo en valor absoluto. */
  readonly amountMin?: number | null;
  /** Monto máximo en valor absoluto. */
  readonly amountMax?: number | null;
}

/** Desglose que produce el split TPV sobre una línea del banco (spec §6). */
export interface TpvSplitPrimitives {
  /** Venta bruta con tarjeta del lote. */
  readonly grossAmount: number;
  /** Comisión de la terminal (sin IVA). */
  readonly commissionAmount: number;
  /** IVA de la comisión — acreditable, por eso va separado. */
  readonly commissionTaxAmount: number;
  /** Cortes de caja que cubre el lote. */
  readonly cashClosureIds: readonly string[];
}

/** Por qué se propuso un emparejamiento, para poder auditarlo. */
export interface MatchSuggestionPrimitives {
  readonly origin: MatchOriginValue;
  /** Movimientos existentes que se proponen ligar. */
  readonly transactionIds: readonly string[];
  /** Regla que disparó la sugerencia, cuando el origen es RULE. */
  readonly ruleId?: string | null;
  /** Categoría propuesta cuando hay que crear el movimiento. */
  readonly categoryId?: string | null;
  /**
   * Cortes de caja que originan la línea. Los llena el match por corte
   * (un depósito de efectivo) y también el split TPV (un lote de tarjeta):
   * en ambos casos son el documento origen del movimiento que se va a crear.
   */
  readonly cashClosureIds?: readonly string[] | null;
  /** Desglose propuesto cuando el origen es TPV_SETTLEMENT. */
  readonly tpvSplit?: TpvSplitPrimitives | null;
  /** Diferencia en centavos entre la línea y lo propuesto (0 = exacto). */
  readonly differenceCents: number;
}

/** Acción de una regla, ya resuelta. */
export interface ReconciliationActionPrimitives {
  readonly type: ReconciliationRuleActionValue;
  /** Categoría a aplicar cuando la acción es SET_CATEGORY. */
  readonly categoryId?: string | null;
  /** Tasa de comisión propuesta para TPV_SPLIT (fracción: 0.025 = 2.5%). */
  readonly commissionRate?: number | null;
}

// ── N3 · Aplicación de pagos a documentos ──────────────────────────

/**
 * Un tramo de un movimiento aplicado a un documento de negocio.
 *
 * Es la pieza que convierte "salieron $12,000 de la cuenta" en "esos $12,000
 * pagaron estas tres facturas". Un pago puede repartirse entre varios
 * documentos y un documento puede recibir varios pagos, así que la relación
 * es N:M y el importe aplicado vive en el cruce, no en ninguno de los dos.
 *
 * El nombre y el folio son SNAPSHOT: el documento se sincroniza desde el
 * desktop y puede cambiar de proveedor o de folio; lo que se aplicó se aplicó
 * contra lo que decía en ese momento.
 */
export interface PaymentApplicationPrimitives {
  readonly id: string;
  /** PURCHASE (compra de inventario) o EXPENSE (gasto). */
  readonly documentType: PayableDocumentTypeValue;
  /** Id del documento en su propia tabla; uuid suelto, sin FK. */
  readonly documentId: string;
  /** Folio visible del documento al momento de aplicar (snapshot). */
  readonly documentNumber: string;
  /** Contraparte del documento al momento de aplicar (snapshot). */
  readonly counterpartyName: string;
  /** Importe de ESTE movimiento que se destina a ESE documento; > 0. */
  readonly appliedAmount: number;
}

/**
 * Un documento pagable con su saldo, tal como Bancos lo ve.
 *
 * El saldo NO vive en el documento: se deriva restándole al total lo ya
 * aplicado desde tesorería. El documento (una compra) es un espejo del
 * desktop y Bancos no lo escribe — si guardara ahí un "pagado" estaría
 * inventándole un campo a un dueño que no es él, y el ciclo CxP formal
 * (Etapa 3) llegaría a discutírselo.
 */
export interface PayableDocumentPrimitives {
  readonly documentType: PayableDocumentTypeValue;
  readonly documentId: string;
  readonly documentNumber: string;
  /** Fecha del documento (YYYY-MM-DD). */
  readonly date: string;
  readonly counterpartyId: string | null;
  readonly counterpartyName: string;
  /** RFC del proveedor cuando el documento lo trae. */
  readonly counterpartyTaxId: string | null;
  /** Folio fiscal del CFDI del proveedor, si lo hay. */
  readonly cfdiUuid: string | null;
  readonly currency: string;
  /** El total tal como lo trae el documento de Compras, sin tocar. */
  readonly grossAmount: number;
  /**
   * Efecto **firmado** de las notas de proveedor aplicadas a este documento.
   *
   * Negativo en devolución y nota de crédito, positivo en nota de débito. Va
   * aparte del total porque si se mezclaran, la pantalla mostraría una cifra
   * que no cuadra con la factura del proveedor y nadie sabría por qué. Aquí se
   * puede enseñar la resta.
   */
  readonly noteAdjustment: number;
  /**
   * Lo que el documento obliga HOY: `grossAmount + noteAdjustment`.
   *
   * Es el tope contra el que se comprueba el sobrepago. Puede quedar por
   * debajo del total impreso en la factura, y esa es justamente la corrección:
   * si el proveedor mandó una nota de crédito, pagar el total sería pagar de
   * más.
   */
  readonly totalAmount: number;
  /** Suma de lo aplicado desde tesorería (movimientos no anulados). */
  readonly appliedAmount: number;
  /** totalAmount − appliedAmount. Cero = saldado. */
  readonly balanceAmount: number;
}
