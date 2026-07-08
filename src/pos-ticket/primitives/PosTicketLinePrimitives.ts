import type { SaleLineBasePrimitives } from '../../shared';

export interface PosTicketLinePrimitives extends SaleLineBasePrimitives {
  readonly notes: string | null;
  // --- Campos fiscales/unidad nativo-only del desktop (fidelidad fiscal en el round-trip). ---
  /** SKU del producto (snapshot al vender). null si el producto no lo tiene. */
  readonly productSku: string | null;
  /** Unidad de venta de la linea (null = unidad base del producto). Ej. "Caja". */
  readonly unitName: string | null;
  /** Unidades base por cada unidad vendida (para convertir a inventario). Base = 1. */
  readonly unitFactor: number;
  /** Codigo SAT del impuesto: "002"=IVA, "003"=IEPS; null para exento. */
  readonly taxCode: string | null;
  /** Factor SAT: "Tasa" | "Cuota" | "Exento". Cadena, no numero. */
  readonly taxFactor: string | null;
  /** El precio unitario ya incluia el impuesto (true) o se suma aparte (false). */
  readonly taxIncluded: boolean;
  /** ClaveProdServ del producto (SAT). */
  readonly satProductCode: string | null;
  /** ClaveUnidad del producto (SAT). */
  readonly satUnitCode: string | null;
  /** Base imponible (subtotal - descuento, neta de impuesto si venia incluido). null si no aplica. */
  readonly taxBaseAmount: number | null;
}
