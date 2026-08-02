/**
 * @fileoverview Primitivas serializables compartidas del módulo Banking.
 * Se usan en schemas, responses y en el dominio del backend.
 */

import type {
  CounterpartyTypeValue,
  TransactionSourceTypeValue,
} from '../constants';

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
