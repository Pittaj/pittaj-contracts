import type { SaleLineBasePrimitives } from '../../shared/index.js';

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
  /**
   * D7b · El IEPS del renglón cuando el producto lleva IVA **e** IEPS (`taxCode` es el IVA). Por
   * tasa, fracción (0.08; tabaco 1.6); por cuota, pesos por unidad base. El IVA (`taxAmount`) ya va
   * sobre la base más este IEPS. Ausentes = no lleva.
   */
  readonly iepsPercent?: number | null;
  readonly iepsFactor?: 'Tasa' | 'Cuota' | null;
  readonly iepsAmount?: number | null;
  /**
   * D7c · La clase de retención del producto al vender (`CLASES_DE_RETENCION`). El CFDI calcula
   * con ella las retenciones según quién lo recibe. Null = bienes o servicios en general.
   */
  readonly retentionClass?: string | null;
  /**
   * D7d · Impuesto local trasladado del renglón (hospedaje…): nombre, tasa (fracción) e importe.
   * No entra en la base del IVA. Ausentes = no lleva.
   */
  readonly localTaxName?: string | null;
  readonly localTaxRate?: number | null;
  readonly localTaxAmount?: number | null;
  /** D7e · Objeto de impuesto forzado del producto al vender ('03' | '04' | '05'); null = automático. */
  readonly objetoImp?: string | null;
  /**
   * Línea de negocio estampada al confirmar el ticket (F1.7): producto → categoría → sucursal con
   * el catálogo de ese momento. Opcional: si no viene, la nube la estampa al guardar.
   */
  readonly businessLineId?: string | null;
}
