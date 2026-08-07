/**
 * @fileoverview Response DTO canónico de BankAccount
 * @module BankAccountResponse
 * @version 1.0.0
 */

import type { CreditCardCyclePrimitives, CreditCardConfigPrimitives } from '../primitives/index.js';

export interface BankAccountResponse {
  readonly id: string;
  readonly name: string;
  /** BANK / CASH / CREDIT_CARD / PSP / TRANSIT (sistema). */
  readonly kind: string;
  readonly bankName: string | null;
  readonly accountNumber: string | null;
  readonly clabe: string | null;
  readonly currency: string;
  readonly openingBalance: number;
  /** Fecha ISO (YYYY-MM-DD); no se admiten movimientos anteriores. */
  readonly openingDate: string;
  readonly locationId: string | null;
  /** Cuenta contable — campo dormido hasta Contabilidad. */
  readonly ledgerAccountCode: string | null;
  /** Configuración TDC; solo kind=CREDIT_CARD. */
  readonly creditCard: CreditCardConfigPrimitives | null;
  /**
   * Cuándo corta y cuándo vence el pago de la tarjeta. `null` si no es TDC o no está configurada.
   *
   * Se calcula en el servidor y no en la pantalla para que la regla —el pago cae el mes siguiente
   * cuando el día de pago es menor que el de corte, los cortes se recortan a los días del mes—
   * exista una sola vez. `daysUntilDue` se mide contra la fecha del servidor: puede diferir en un
   * día del calendario del usuario, y sobre un aviso de cinco días eso no cambia ninguna decisión.
   */
  readonly creditCardCycle: CreditCardCyclePrimitives | null;
  /** Cuenta creada por el sistema (TRANSIT): oculta y no editable. */
  readonly isSystem: boolean;
  readonly status: string;
  /**
   * Saldo actual según libros: openingBalance + Σ(IN − OUT) de movimientos
   * no VOID. Derivado por query (SUM en SQL), nunca columna almacenada.
   */
  readonly currentBalance: number;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date | null;
  readonly updatedBy: string | null;
  readonly version: number;
}
