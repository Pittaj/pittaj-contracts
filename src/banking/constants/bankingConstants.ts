/**
 * @fileoverview Constantes del módulo Banking (app Bancos, Etapa 1 / N1).
 * Solo LIMITS, enums de API y seeds del sistema. La lógica de negocio vive en el dominio.
 */

export const BANKING_CONSTANTS = {
  LIMITS: {
    /** Longitud mínima del nombre de cuenta/categoría */
    MIN_NAME_LENGTH: 2,

    /** Longitud máxima del nombre de cuenta/categoría */
    MAX_NAME_LENGTH: 100,

    /** Longitud máxima del nombre del banco/pasarela */
    MAX_BANK_NAME_LENGTH: 100,

    /** Longitud máxima del número de cuenta */
    MAX_ACCOUNT_NUMBER_LENGTH: 30,

    /** Longitud exacta de la CLABE interbancaria */
    CLABE_LENGTH: 18,

    /** Longitud máxima de la referencia bancaria */
    MAX_REFERENCE_LENGTH: 100,

    /** Longitud máxima de las notas */
    MAX_NOTES_LENGTH: 500,

    /** Longitud máxima del nombre de contraparte */
    MAX_COUNTERPARTY_NAME_LENGTH: 150,

    /** Monto máximo por movimiento (guardrail de captura) */
    MAX_AMOUNT: 999_999_999.99,

    /** CFDIs máximos asociables a un movimiento */
    MAX_CFDI_UUIDS: 50,

    /** Tamaño de página por defecto en listados */
    DEFAULT_PAGE_SIZE: 20,

    /** Tamaño máximo de página en listados */
    MAX_PAGE_SIZE: 100,
  },

  /** Tipos de cuenta. TRANSIT = cuenta puente del sistema ("Fondos en tránsito"). */
  ACCOUNT_KINDS: ['BANK', 'CASH', 'CREDIT_CARD', 'PSP', 'TRANSIT'] as const,

  /** Estados de cuenta y de categoría. */
  STATUSES: ['ACTIVE', 'INACTIVE'] as const,

  /** Flujo que admite una categoría de movimiento. */
  CATEGORY_FLOWS: ['IN', 'OUT', 'BOTH'] as const,

  /** Dirección de un movimiento. */
  DIRECTIONS: ['IN', 'OUT'] as const,

  /** Estados de un movimiento (ledger append-only). */
  TRANSACTION_STATUSES: ['PENDING', 'CLEARED', 'VOID'] as const,

  /** Tipo de documento origen de un movimiento. */
  /**
   * De qué documento nace el movimiento.
   *
   * `REVERSAL` no es un documento de negocio como los demás: es el **movimiento que se corrige**.
   * Un movimiento ya conciliado es inmutable —el ledger es append-only— así que la única forma de
   * enmendarlo es un contramovimiento, y el original es literalmente su origen. Guardarlo aquí, en
   * las mismas columnas consultables que el resto, es lo que permite preguntar "¿esto ya se
   * corrigió?" sin una tabla nueva.
   */
  SOURCE_TYPES: [
    'CASH_CLOSURE',
    'PURCHASE',
    'EXPENSE',
    'TICKET_BATCH',
    'TRANSFER',
    'REVERSAL',
    'MANUAL',
  ] as const,

  /** Tipo de contraparte de un movimiento. */
  COUNTERPARTY_TYPES: ['SUPPLIER', 'CUSTOMER', 'EMPLOYEE', 'OTHER'] as const,

  /** Moneda por defecto de las cuentas. */
  DEFAULT_CURRENCY: 'MXN',

  /** Nombre de la cuenta puente del sistema (singleton por tenant). */
  TRANSIT_ACCOUNT_NAME: 'Fondos en tránsito',

  // ── N2 · Conciliación ────────────────────────────────────────────

  /** De dónde salieron las líneas del estado de cuenta. */
  STATEMENT_SOURCES: ['PDF', 'IMAGE', 'CSV', 'XLSX', 'OFX', 'MANUAL', 'FEED'] as const,

  /** Estados de la conciliación. RECONCILED es terminal (no se reabre). */
  STATEMENT_STATUSES: ['IMPORTED', 'IN_PROGRESS', 'RECONCILED'] as const,

  /** Estado de emparejamiento de una línea del banco. */
  MATCH_STATUSES: ['UNMATCHED', 'SUGGESTED', 'MATCHED', 'CREATED'] as const,

  /**
   * De dónde vino la sugerencia, en el orden de prioridad del spec (§5).
   * Se guarda en la línea para poder auditar por qué se propuso el match.
   */
  MATCH_ORIGINS: [
    'EXACT_REFERENCE',
    'AMOUNT_AND_DATE',
    'CASH_CLOSURE',
    'TPV_SETTLEMENT',
    'RULE',
    'MANUAL',
  ] as const,

  /** Acción de una regla de conciliación. */
  RULE_ACTIONS: ['SET_CATEGORY', 'TPV_SPLIT'] as const,

  RECONCILIATION_LIMITS: {
    /** Días de tolerancia al emparejar por monto + fecha (spec §5.2). */
    DATE_TOLERANCE_DAYS: 3,

    /**
     * Tolerancia en centavos para *sugerir* un match. Nunca aplica nada
     * automáticamente: por debajo de este umbral la línea se propone, no se concilia.
     */
    AMOUNT_TOLERANCE_CENTS: 2,

    /** Líneas máximas por estado de cuenta importado. */
    MAX_STATEMENT_LINES: 2000,

    /** Longitud máxima de la descripción que manda el banco. */
    MAX_LINE_DESCRIPTION_LENGTH: 300,

    /** Movimientos máximos ligados a una sola línea (cardinalidad 1:N). */
    MAX_MATCHED_TRANSACTIONS: 50,

    /** Reglas de conciliación máximas por tenant. */
    MAX_RULES: 200,

    /** Tasa de comisión TPV máxima aceptada (fracción, no porcentaje). */
    MAX_COMMISSION_RATE: 0.2,
  },

  /**
   * Naturaleza del saldo de la cuenta.
   *
   * DEBTOR (deudora) = el dinero es tuyo: el abono sube el saldo.
   * CREDITOR (acreedora) = es una deuda: el CARGO sube el saldo y el PAGO lo
   * baja. Las tarjetas de crédito son acreedoras, y no distinguirlo invierte
   * el estado de cuenta completo.
   */
  ACCOUNT_NATURES: ['DEBTOR', 'CREDITOR'] as const,

  /**
   * Clases de término del resumen que imprime un banco.
   *
   * NO se usan para cuadrar —para eso basta el signo— sino para casar los
   * movimientos leídos contra el término que les corresponde. `OTHER` existe
   * porque el noveno banco va a traer un renglón que nadie previó, y perder la
   * ecuación entera por no saber cómo llamarlo sería absurdo.
   */
  SUMMARY_TERM_KINDS: [
    'DEPOSITS',
    'WITHDRAWALS',
    'COMMISSIONS',
    'COMMISSIONS_TAX',
    'INTEREST_EARNED',
    'INTEREST_CHARGED',
    'TAX_WITHHELD',
    'PAYMENTS',
    'CHARGES',
    'INSTALLMENTS',
    'ADJUSTMENTS',
    'OTHER',
  ] as const,

  // ── N3 · Aplicación de pagos a documentos ────────────────────────

  /**
   * Documentos a los que un egreso se puede aplicar.
   *
   * Son los dos sabores de `Purchase` (kind INVENTORY / EXPENSE) y se
   * distinguen a propósito: la contabilidad futura no arma la misma póliza
   * pagando mercancía que pagando la luz. Coinciden con los `SOURCE_TYPES`
   * homónimos porque son el mismo documento visto desde el movimiento.
   */
  PAYABLE_DOCUMENT_TYPES: ['PURCHASE', 'EXPENSE'] as const,

  PAYMENT_APPLICATION_LIMITS: {
    /**
     * Documentos que un solo movimiento puede pagar.
     *
     * Un pago a proveedor que cubre 30 facturas es un caso real; 200 es un
     * error de captura o un intento de meter un lote entero como un pago.
     */
    MAX_APPLICATIONS: 30,

    /** Longitud máxima del folio del documento que se guarda como snapshot. */
    MAX_DOCUMENT_NUMBER_LENGTH: 50,
  },

  /**
   * Epsilon para comparar dinero.
   *
   * Los montos son decimales de 2 posiciones, así que medio centavo separa
   * "igual" de "distinto" sin que la aritmética de punto flotante genere
   * falsos descuadres (`0.1 + 0.2 !== 0.3` en binario).
   *
   * Vive en el contrato a propósito: backend y frontend deben coincidir en
   * qué cuenta como cuadrado. Si cada capa lo declarara por su cuenta,
   * podrían discrepar en silencio sobre si una conciliación puede cerrarse.
   */
  /**
   * Las comprobaciones de una lectura, y cuáles hablan de **cómo se leyó**.
   *
   * Viven en el contrato y no en cada capa por lo mismo que `MONEY_EPSILON`: el backend decide con
   * ellas si vale la pena pagar un peldaño más caro, y la web decide con ellas qué le dice al
   * usuario. **Ya discreparon una vez** — se añadieron `SUMMARY_CLOSES` y `MOVEMENTS_MATCH_SUMMARY`
   * al backend y la copia de la web se quedó con cinco, así que un fallo del neto de movimientos se
   * anunciaba como «el documento parece de otra cuenta» con la tarjeta de la cuenta diciendo
   * «coincide» justo debajo. Dos listas, dos verdades.
   */
  EXTRACTION_CHECKS: [
    'NET_BALANCE',
    'RUNNING_BALANCE',
    'SUMMARY_CLOSES',
    'MOVEMENTS_MATCH_SUMMARY',
    'TOTAL_CREDITS',
    'TOTAL_DEBITS',
    'MOVEMENT_COUNT',
    'DATES_IN_PERIOD',
    'ACCOUNT_MATCH',
  ] as const,

  /**
   * Las que un modelo mejor puede arreglar: si los totales no cuadran o falta un movimiento, volver
   * a leer con más capacidad tiene sentido.
   *
   * `ACCOUNT_MATCH` queda fuera **a propósito** y es la única: que el documento sea de otra cuenta
   * no lo arregla ningún modelo, y reintentarlo solo multiplica el costo. Es también la razón de que
   * esta lista exista — «el sistema leyó mal» y «subiste otro estado de cuenta» son problemas
   * distintos, con soluciones distintas y con mensajes distintos.
   */
  EXTRACTION_QUALITY_CHECKS: [
    'NET_BALANCE',
    'RUNNING_BALANCE',
    'SUMMARY_CLOSES',
    'MOVEMENTS_MATCH_SUMMARY',
    'TOTAL_CREDITS',
    'TOTAL_DEBITS',
    'MOVEMENT_COUNT',
    'DATES_IN_PERIOD',
  ] as const,

  MONEY_EPSILON: 0.005,
} as const;

export type BankAccountKindValue = (typeof BANKING_CONSTANTS.ACCOUNT_KINDS)[number];
export type BankingStatusValue = (typeof BANKING_CONSTANTS.STATUSES)[number];
export type CategoryFlowValue = (typeof BANKING_CONSTANTS.CATEGORY_FLOWS)[number];
export type TransactionDirectionValue = (typeof BANKING_CONSTANTS.DIRECTIONS)[number];
export type TransactionStatusValue = (typeof BANKING_CONSTANTS.TRANSACTION_STATUSES)[number];
export type TransactionSourceTypeValue = (typeof BANKING_CONSTANTS.SOURCE_TYPES)[number];
export type CounterpartyTypeValue = (typeof BANKING_CONSTANTS.COUNTERPARTY_TYPES)[number];
export type StatementSourceValue = (typeof BANKING_CONSTANTS.STATEMENT_SOURCES)[number];
export type StatementStatusValue = (typeof BANKING_CONSTANTS.STATEMENT_STATUSES)[number];
export type MatchStatusValue = (typeof BANKING_CONSTANTS.MATCH_STATUSES)[number];
export type MatchOriginValue = (typeof BANKING_CONSTANTS.MATCH_ORIGINS)[number];
export type ReconciliationRuleActionValue = (typeof BANKING_CONSTANTS.RULE_ACTIONS)[number];
export type PayableDocumentTypeValue = (typeof BANKING_CONSTANTS.PAYABLE_DOCUMENT_TYPES)[number];
export type ExtractionCheckName = (typeof BANKING_CONSTANTS.EXTRACTION_CHECKS)[number];

export type AccountNatureValue = (typeof BANKING_CONSTANTS.ACCOUNT_NATURES)[number];
export type SummaryTermKindValue = (typeof BANKING_CONSTANTS.SUMMARY_TERM_KINDS)[number];

/** Definición de una categoría de sistema (seed por tenant, estilo CONTPAQi). */
export interface SystemCategoryDef {
  /**
   * Código estable de la categoría. **Se persiste** desde la migración `0029`.
   *
   * Antes no, y era deuda: quien necesitaba reconocer una categoría concreta la buscaba **por el
   * nombre visible**, que es texto de interfaz. Mientras no hubo forma de renombrar una categoría
   * nadie se hizo daño; el día que la hubiera, un tenant que le cambiara el nombre a «Otro» dejaba
   * sin funcionar el ajuste de centavos de la conciliación, con un error que no habla de nombres.
   */
  readonly code: string;
  /** Nombre visible, único por tenant. Es la etiqueta, no la identidad. */
  readonly name: string;
  /** Flujo que admite: IN / OUT / BOTH. */
  readonly flow: CategoryFlowValue;
  /**
   * Cuenta contable con la que **nace** la categoría (`LedgerAccountCode`, código y no id: dos
   * empresas del mismo tenant tienen dos catálogos y el código es lo único que significa lo mismo
   * en los dos). `null` = se siembra sin cuenta, a propósito.
   *
   * **Está aquí y no en un documento porque un mapeo que hay que aplicar a mano no se aplica.**
   * Antes de esto, la tabla que Contabilidad mantiene era una lista de tareas: veinte llamadas a
   * `PUT /:id/ledger-account` por tenant, y la condición de disparo era «que alguien se acuerde».
   * Esa condición ya falló tres veces en una semana —la siembra del catálogo que se salía entera,
   * este seeder que solo inserta si no hay ninguna categoría, y este mapeo—. Con el código aquí,
   * el mapeo nace con la categoría y el documento pasa de lista de tareas a documentación.
   *
   * **El criterio contable de cada uno es de Contabilidad**, y está razonado cuenta por cuenta en
   * `arquitectura/categorias-bancarias-a-cuentas.md`. Aquí solo vive el dato.
   *
   * Sigue siendo un **valor por omisión**, no una atadura: el dueño lo cambia desde
   * `/bancos/categorias` y nada lo vuelve a pisar — el seeder solo corre cuando el tenant no tiene
   * ninguna categoría de sistema.
   */
  readonly ledgerAccountCode: string | null;
}

/**
 * Categorías del sistema (12, spec `bank-transaction.md` §2).
 * Se siembran por tenant: en onboarding y lazy en la primera lectura del catálogo.
 */
export const BANKING_SYSTEM_CATEGORIES: readonly SystemCategoryDef[] = [
  { code: 'DEPOSITO_VENTA', name: 'Depósito de efectivo', flow: 'IN', ledgerAccountCode: '103-01' },
  { code: 'LIQUIDACION_TPV', name: 'Liquidación TPV', flow: 'IN', ledgerAccountCode: '103-02' },
  /**
   * La categoría de la cuenta puente `103-04 Transferencias en tránsito`.
   *
   * **`BOTH` y «Transferencia» desde el 2026-08-09, con el reembolso por transferencia.** Antes
   * era `IN` y se llamaba «Cobro a cliente», y era correcto: la puente solo recibía cargos —cobro
   * de crédito, corte de caja, abono de apartado— porque no existía ninguna forma de que saliera
   * dinero por ella. Ahora una devolución la abona, y cerrarla exige un movimiento `OUT` que la
   * cargue; con `flow: 'IN'`, `CategoryFlow.admits()` lo rechazaba y el saldo se quedaba vivo
   * para siempre (BUG-040).
   *
   * El nombre acompaña al flujo por la misma razón que `TRASPASO` no se llama «Traspaso
   * recibido»: una cuenta, una categoría, las dos direcciones. Quien ve un «SPEI ENVIADO» no
   * puede elegir algo que se llame «cobro».
   */
  { code: 'COBRO_CLIENTE', name: 'Transferencia', flow: 'BOTH', ledgerAccountCode: '103-04' },
  { code: 'PAGO_PROVEEDOR', name: 'Pago a proveedor', flow: 'OUT', ledgerAccountCode: '201-01' },
  { code: 'GASTO', name: 'Gasto', flow: 'OUT', ledgerAccountCode: '601-09' },
  { code: 'COMISION_BANCARIA', name: 'Comisión bancaria', flow: 'OUT', ledgerAccountCode: '701-01' },

  /**
   * El IVA de una comisión bancaria. **No es un impuesto que se pague al SAT: es acreditable.**
   *
   * Lo usa el split del TPV, que parte el depósito en venta bruta, comisión e IVA de la comisión.
   * Vivía en `IMPUESTOS` y ahí estaba mal: `IMPUESTOS` es lo que le DEBES al SAT, y esto es un
   * saldo a tu favor. Mientras esa categoría no tuvo cuenta el error no se veía; al partirla en
   * cuatro pasivos concretos habría que elegir uno, y los cuatro serían falsos.
   */
  { code: 'IVA_ACREDITABLE', name: 'IVA acreditable', flow: 'OUT', ledgerAccountCode: '118-01' },

  /**
   * ── Los impuestos, en cuatro ──
   *
   * Era una sola categoría, `IMPUESTOS`, y se quedó sin cuenta a propósito porque IVA, ISR y las
   * dos retenciones son **cuatro pasivos distintos**: con una sola cuenta, tres quedan con saldo
   * falso y cuadrar la declaración contra el libro es imposible.
   *
   * Partirlas mueve la decisión de la **configuración** —una vez, quien montó el sistema— a la
   * **categorización** —por movimiento, quien mira el estado de cuenta y sabe qué pagó—. Aquí el
   * usuario sí lo sabe: la línea del banco dice qué impuesto es.
   */
  { code: 'IMPUESTO_IVA', name: 'Pago de IVA', flow: 'OUT', ledgerAccountCode: '208-01' },
  { code: 'IMPUESTO_ISR', name: 'Pago de ISR', flow: 'OUT', ledgerAccountCode: '213-01' },
  { code: 'RETENCION_IVA_ENTERADA', name: 'Entero de retenciones de IVA', flow: 'OUT', ledgerAccountCode: '216-01' },
  { code: 'RETENCION_ISR_ENTERADA', name: 'Entero de retenciones de ISR', flow: 'OUT', ledgerAccountCode: '216-02' },

  { code: 'NOMINA', name: 'Nómina', flow: 'OUT', ledgerAccountCode: '601-01' },
  { code: 'TRASPASO', name: 'Traspaso', flow: 'BOTH', ledgerAccountCode: '103-03' },

  /**
   * ── El dinero del socio, en seis ──
   *
   * `APORTACION_SOCIO` y `RETIRO_SOCIO` no se podían mapear porque **cambian de naturaleza entre
   * movimientos**: en marzo el socio saca dinero y es un préstamo, en diciembre saca dinero y es
   * un reparto con acta. Un mapeo guarda **una** respuesta para siempre, así que la mitad se
   * contabilizaría mal en silencio.
   *
   * Es el que más caro sale de equivocar: mandar un retiro a gastos **deduce algo que no es
   * deducible**.
   *
   * Aquí el usuario puede no saber cuál es, y por eso el texto de la pantalla pregunta en vez de
   * etiquetar (¿hay acta?, ¿está en nómina?). Si no lo sabe, `OTRO` — y el movimiento queda
   * visible en «Sin contabilizar» en vez de convertirse en un asiento equivocado.
   */
  { code: 'APORTACION_FUTUROS_AUMENTOS', name: 'Aportación para futuros aumentos', flow: 'IN', ledgerAccountCode: '301-02' },
  { code: 'PRESTAMO_DE_SOCIO', name: 'Préstamo del socio al negocio', flow: 'IN', ledgerAccountCode: '205-02' },
  { code: 'AUMENTO_CAPITAL_SOCIAL', name: 'Aumento de capital social', flow: 'IN', ledgerAccountCode: '301-01' },
  { code: 'PRESTAMO_A_SOCIO', name: 'Préstamo al socio', flow: 'OUT', ledgerAccountCode: '113-03' },
  { code: 'REPARTO_UTILIDADES', name: 'Reparto de utilidades', flow: 'OUT', ledgerAccountCode: '304-01' },
  { code: 'SUELDO_SOCIO', name: 'Sueldo del socio', flow: 'OUT', ledgerAccountCode: '601-01' },

  /**
   * El cajón de «no sé qué es esto», y **se queda sin cuenta a propósito**. Darle una convertiría
   * un «no sé» en un asiento, que es lo contrario de para lo que existe: aquí el movimiento cae en
   * «Sin contabilizar», que es una lista que se mira.
   */
  { code: 'OTRO', name: 'Otro', flow: 'BOTH', ledgerAccountCode: null },
] as const;

/**
 * Código de la categoría de sistema usada por los traspasos.
 *
 * Por **código** y no por nombre: ver `SystemCategoryDef.code`.
 */
export const TRANSFER_CATEGORY_CODE = 'TRASPASO';

/**
 * Categoría de sistema donde caen los ajustes de centavos de la conciliación.
 *
 * Es "Otro" a propósito y no una categoría nueva: un ajuste de dos centavos no es un concepto de
 * tesorería que alguien vaya a querer analizar por separado, y darle categoría propia lo ascendería
 * a algo que no es. Lo que sí importa es que **exista como movimiento** con su nota, no que tenga
 * su propio renglón en los reportes.
 */
export const ADJUSTMENT_CATEGORY_CODE = 'OTRO';
