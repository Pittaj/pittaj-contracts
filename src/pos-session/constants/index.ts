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
    'DEPOSIT',          // Deposito adicional
    'CORRECTION',       // Correccion manual
    'TIP',              // Propina
    'OTHER',            // Otro motivo
  ] as const,
} as const;
