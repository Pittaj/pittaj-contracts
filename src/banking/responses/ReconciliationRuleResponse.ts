/**
 * @fileoverview Response DTO canónico de ReconciliationRule
 * @module ReconciliationRuleResponse
 * @version 1.0.0
 */

import type { BankingStatusValue } from '../constants';
import type {
  ReconciliationActionPrimitives,
  ReconciliationMatchPrimitives,
} from '../primitives';

/**
 * Regla automática de conciliación, estilo Odoo.
 *
 * Ejemplo: "la descripción contiene COMISION y es cargo → crear el movimiento
 * con la categoría Comisión bancaria".
 */
export interface ReconciliationRuleResponse {
  readonly id: string;
  readonly name: string;
  /** Cuenta a la que aplica; null = todas las cuentas del tenant. */
  readonly accountId: string | null;
  readonly match: ReconciliationMatchPrimitives;
  readonly action: ReconciliationActionPrimitives;
  /** Menor gana: la primera regla que empareja es la que se aplica. */
  readonly priority: number;
  readonly status: BankingStatusValue;
  readonly tenantId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly createdBy: string | null;
  readonly version: number;
}
