/**
 * @fileoverview Primitivas de la dirección del proveedor.
 *
 * Misma forma que CustomerAddressPrimitives (el desktop reusa el VO Address
 * de Customer en el agregado Supplier). Se declara aparte para que el módulo
 * supplier no dependa del módulo customer en contracts.
 *
 * @module Contracts/Supplier
 */

export interface SupplierAddressPrimitives {
  /** Linea 1: calle y numero */
  readonly street: string;
  /** Linea 2: colonia, interior, referencia (opcional) */
  readonly street2: string | null;
  /** Ciudad */
  readonly city: string;
  /** Estado/Provincia/Departamento */
  readonly state: string;
  /** Codigo postal */
  readonly postalCode: string;
  /** Pais */
  readonly country: string;
}
