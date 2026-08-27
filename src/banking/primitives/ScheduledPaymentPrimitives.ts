/**
 * @fileoverview Primitivas de la programación de pagos (app Bancos, N4).
 * @module banking/primitives/ScheduledPayment
 *
 * Una **obligación con fecha**: lo que sale (o entra) y qué día. Es la pieza
 * que responde «¿cuántos días tengo para juntar el dinero?».
 *
 * ── Dos fechas, no una ──
 *
 * `dueDate` es **caja** (cuándo sale la plata) y `accrualDate` es **devengo**
 * (a qué periodo pertenece el gasto). La luz de agosto que se paga el 5 de
 * septiembre devenga en agosto y sale de caja en septiembre. Con una sola
 * fecha se puede tener el calendario correcto o el resultado correcto, nunca
 * los dos.
 *
 * ── Sin estado guardado ──
 *
 * No hay campo `status`. El estado se deriva de `settledTransactionId`,
 * `cancelledAt` y el reloj (ver `SCHEDULED_PAYMENT_STATES`). Es la §4 del
 * mandato de paridad aplicada: dos plataformas pueden emitir a la vez sin
 * coordinarse porque los hechos son conmutativos e idempotentes, mientras que
 * un estado almacenado es justo el campo que se pisa en silencio.
 */

import type {
  ScheduledPaymentSourceTypeValue,
  ScheduledPaymentStateValue,
  TransactionDirectionValue,
} from '../constants/index.js';

/** Documento o mecanismo del que nació la obligación. */
export interface ScheduledPaymentSourcePrimitives {
  readonly type: ScheduledPaymentSourceTypeValue;
  /**
   * Id del documento origen. Uuid **suelto, sin FK cruzada** — mismo patrón
   * que `bank_transactions.source_id`: apunta a la copia en nube de la compra
   * y no puede bloquear su borrado.
   */
  readonly id?: string | null;
}

/**
 * Obligación programada, tal como viaja entre capas.
 *
 * `id` se genera **en origen** (sync-ready con `deviceId`) para que el upsert
 * sea idempotente cuando la app tenga escritorio (F6.1 del plan de paridad).
 */
export interface ScheduledPaymentPrimitives {
  readonly id: string;
  readonly tenantId: string;

  /** `OUT` = pago; `IN` = cobro esperado (el lado de entradas llega en F3). */
  readonly direction: TransactionDirectionValue;

  /** Categoría del catálogo de tesorería. Obligatoria, como en el ledger. */
  readonly categoryId: string;

  /**
   * Cuenta prevista de salida. **Nullable a propósito**: «todavía no sé de
   * dónde sale» es un estado legítimo del día a día, y obligar a elegirla
   * convertiría una nota rápida en un trámite.
   */
  readonly bankAccountId: string | null;

  /** Caja: qué día sale el dinero (YYYY-MM-DD). Es el eje del calendario. */
  readonly dueDate: string;

  /** Devengo: a qué periodo pertenece (YYYY-MM-DD). */
  readonly accrualDate: string;

  /** Siempre > 0; el signo lo da `direction`. */
  readonly amount: number;
  readonly currency: string;

  /** El concepto que escribe el usuario: «Renta del local». */
  readonly description: string;

  readonly source: ScheduledPaymentSourcePrimitives;

  /**
   * Movimiento de tesorería que la liquidó. No nulo ⟺ pagada.
   *
   * Es el cierre del círculo: a partir de aquí manda el ledger append-only y
   * no hay dos verdades sobre el mismo pago.
   */
  readonly settledTransactionId: string | null;

  /** Fecha ISO de cancelación. No nula ⟺ cancelada. */
  readonly cancelledAt: string | null;

  /** Plantilla recurrente de la que nació (F2). */
  readonly templateId: string | null;

  /** Estado **derivado**, calculado contra la fecha de la consulta. */
  readonly state: ScheduledPaymentStateValue;

  /**
   * Días de hoy al vencimiento. Negativo = ya pasó.
   *
   * Viaja calculado porque depende del reloj del servidor: dejar que cada
   * punta lo compute con el suyo hace que un teléfono con la hora mal puesta
   * enseñe «vencido» sobre algo que no lo está.
   */
  readonly daysUntilDue: number;

  /** Control de concurrencia optimista para lo editable. */
  readonly version: number;
}
