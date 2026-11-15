/**
 * @fileoverview Constantes de validación para pos-session
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const POS_SESSION_CONSTANTS = {
  LIMITS: {
    /** Fondo de apertura minimo */
    MIN_OPENING_BALANCE: 0,
    /** Fondo de apertura maximo */
    MAX_OPENING_BALANCE: 999_999.99,
    /** Maximo de movimientos de efectivo por sesion */
    MAX_CASH_MOVEMENTS: 200,
    /** Longitud maxima de notas */
    MAX_NOTES: 1000,
    /** Longitud maxima de descripcion de movimiento */
    MAX_MOVEMENT_DESCRIPTION: 500,
    /** Maximo de sesiones abiertas por usuario */
    MAX_OPEN_SESSIONS_PER_USER: 1,
    /** Tiempo maximo de sesion abierta (24 horas en ms) */
    MAX_SESSION_DURATION_MS: 24 * 60 * 60 * 1000,
  },

  TYPES: ['CASH_IN', 'CASH_OUT'] as const,

  STATUSES: ['OPENING', 'OPEN', 'CLOSING', 'CLOSED'] as const,

  CURRENCIES: ['MXN', 'COP', 'ARS', 'USD'] as const,

  CASH_MOVEMENT_TYPES: ['CASH_IN', 'CASH_OUT'] as const,

  CASH_MOVEMENT_REASONS: [
    'OPENING_FUND',     // Fondo de apertura
    'SALE',             // Venta en efectivo
    'REFUND',           // Devolucion en efectivo
    'EXPENSE',          // Gasto menor
    'WITHDRAWAL',       // Retiro de caja
    'DEPOSIT',          // ⛔ Histórico: cambio o abono de apartado, sin distinguir (ver abajo)
    'CORRECTION',       // Correccion manual
    'TIP',              // Propina
    'OTHER',            // Otro motivo
    // E0 de plan-efectivo (2026-11-15): cada entrada y salida dice qué fue.
    'CHANGE_FUND',      // Entra cambio (morralla) al cajón
    'LAYAWAY_PAYMENT',  // Abono de un apartado: anticipo del cliente
    'SUPPLIER_PAYMENT', // Pago a proveedor desde el cajón
    'OWNER_DRAW',       // Retiro del dueño
    'CUSTOMER_PAYMENT', // Cobro de una cuenta por cobrar en el cajón
  ] as const,
} as const;

export type CashMovementReason = (typeof POS_SESSION_CONSTANTS.CASH_MOVEMENT_REASONS)[number];
export type CashMovementType = (typeof POS_SESSION_CONSTANTS.CASH_MOVEMENT_TYPES)[number];

/**
 * Los motivos que alguien captura a mano en «Movimientos de caja», por tipo.
 *
 * Los demás los escribe el documento que mueve el dinero —la venta, la devolución, el abono del
 * apartado, el pago al proveedor, el cobro— y capturarlos a mano dejaría un movimiento sin su
 * documento: el pago al proveedor no bajaría lo que se le debe, el cobro no bajaría la cuenta del
 * cliente.
 *
 * `DEPOSIT` ya no se ofrece: decía a la vez «meto cambio» y «abonan un apartado», que tienen
 * asientos opuestos. Ahora son `CHANGE_FUND` y `LAYAWAY_PAYMENT`. Se sigue leyendo en el histórico.
 */
export const MANUAL_CASH_MOVEMENT_REASONS = {
  CASH_IN: ['CHANGE_FUND', 'CORRECTION', 'OTHER'],
  CASH_OUT: ['WITHDRAWAL', 'EXPENSE', 'OWNER_DRAW', 'CORRECTION', 'OTHER'],
} as const satisfies Record<CashMovementType, readonly CashMovementReason[]>;

/** Los que solo nacen de un documento (la venta, el apartado, el pago, el cobro). */
export const DOCUMENT_CASH_MOVEMENT_REASONS = [
  'SALE',
  'REFUND',
  'LAYAWAY_PAYMENT',
  'SUPPLIER_PAYMENT',
  'CUSTOMER_PAYMENT',
] as const satisfies readonly CashMovementReason[];

/** ¿Se puede capturar a mano este motivo con este tipo? */
export function esMotivoManual(type: CashMovementType, reason: string): boolean {
  return (MANUAL_CASH_MOVEMENT_REASONS[type] as readonly string[]).includes(reason);
}

/** Cómo se lee cada motivo, igual en la web y en el escritorio. */
export const CASH_MOVEMENT_REASON_LABELS: Record<CashMovementReason, string> = {
  OPENING_FUND: 'Fondo de apertura',
  SALE: 'Venta',
  REFUND: 'Devolución',
  EXPENSE: 'Gasto',
  WITHDRAWAL: 'Retiro',
  DEPOSIT: 'Entrada (histórico)',
  CORRECTION: 'Corrección',
  TIP: 'Propina',
  OTHER: 'Otro',
  CHANGE_FUND: 'Cambio',
  LAYAWAY_PAYMENT: 'Abono de apartado',
  SUPPLIER_PAYMENT: 'Pago a proveedor',
  OWNER_DRAW: 'Retiro del dueño',
  CUSTOMER_PAYMENT: 'Cobro a cliente',
};
