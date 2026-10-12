/**
 * @fileoverview Renglones de los reportes de Inventario (formato `json`).
 * @module Contracts/Inventory/Responses/InventoryReports
 *
 * Cada reporte devuelve `InventoryReportResponse<Renglón, Totales>`: los renglones de la tabla y
 * los totales del pie. Los exportables (`xlsx`/`csv`/`pdf`) llevan las mismas columnas.
 */

import type { InventoryReportKind } from '../schemas/inventoryReports.schema.js';
import type { AbcClass } from '../schemas/countPlan.schema.js';
import type { StockAdjustmentReason } from '../schemas/stockAdjustment.schema.js';
import type { StockSourceType } from './StockMovementResponse.js';

export interface InventoryReportResponse<Row, Totals = Record<string, number>> {
    readonly kind: InventoryReportKind;
    readonly generatedAt: string;
    /** Los filtros tal como se aplicaron (con sus defaults), para imprimirlos en el encabezado. */
    readonly filters: Readonly<Record<string, unknown>>;
    readonly rows: readonly Row[];
    readonly totals: Totals;
}

/** STOCK_AT_DATE y VALUATION (esta agrupada). */
export interface StockValuationRow {
    readonly groupKey: string;
    readonly groupLabel: string;
    readonly productId: string | null;
    readonly productCode: string | null;
    readonly productName: string | null;
    readonly warehouseName: string | null;
    readonly unit: string | null;
    readonly onHand: number;
    readonly averageCost: number;
    readonly value: number;
    /** % del valor total. */
    readonly share: number;
}

/** KARDEX: un renglón por movimiento, con saldo corrido. */
export interface KardexRow {
    readonly movementId: string;
    readonly occurredAt: string;
    readonly sourceType: StockSourceType;
    readonly sourceDocId: string | null;
    readonly warehouseName: string;
    readonly lotNumber: string | null;
    readonly quantityIn: number;
    readonly quantityOut: number;
    readonly unitCost: number;
    readonly balanceQuantity: number;
    readonly balanceAverageCost: number;
    readonly balanceValue: number;
    readonly userName: string | null;
}

/** MOVEMENT_SUMMARY: la ecuación del periodo por producto (o grupo). */
export interface MovementSummaryRow {
    readonly groupKey: string;
    readonly groupLabel: string;
    readonly openingQuantity: number;
    readonly openingValue: number;
    /** Entradas y salidas por tipo, en cantidad. */
    readonly inBySource: Readonly<Partial<Record<StockSourceType, number>>>;
    readonly outBySource: Readonly<Partial<Record<StockSourceType, number>>>;
    readonly closingQuantity: number;
    readonly closingValue: number;
}

export interface NoMovementRow {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly value: number;
    readonly lastMovementAt: string | null;
    readonly lastSaleAt: string | null;
    readonly daysIdle: number;
}

export interface ExpiryRow {
    readonly lotId: string;
    readonly lotNumber: string;
    readonly productId: string;
    readonly productName: string;
    readonly warehouseName: string;
    readonly expiresAt: string;
    readonly daysToExpiry: number;
    readonly onHand: number;
    readonly value: number;
}

export interface ShrinkageRow {
    readonly groupKey: string;
    readonly groupLabel: string;
    readonly reason: StockAdjustmentReason | null;
    readonly quantity: number;
    readonly value: number;
    /** % sobre el costo de venta del periodo (lo que la industria mide). */
    readonly pctOfCogs: number | null;
    readonly documents: number;
}

export interface RotationAbcRow {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly abcClass: AbcClass;
    /** Costo de lo vendido en el periodo. */
    readonly cogs: number;
    readonly averageInventoryValue: number;
    readonly turnover: number | null;
    readonly daysOfInventory: number | null;
    /** % acumulado del consumo, que es lo que decide la clase. */
    readonly cumulativeShare: number;
}

export interface CountAccuracyRow {
    readonly countId: string;
    readonly countNumber: string;
    readonly appliedAt: string;
    readonly warehouseName: string;
    readonly linesCounted: number;
    readonly linesMatched: number;
    readonly accuracy: number;
    readonly differenceValue: number;
    readonly absoluteDifferenceValue: number;
}

export interface ReplenishmentRow {
    readonly productId: string;
    readonly productCode: string | null;
    readonly productName: string;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly reserved: number;
    readonly incoming: number;
    readonly minStock: number;
    readonly reorderPoint: number;
    readonly maxStock: number;
    readonly suggestedQuantity: number;
    readonly preferredSupplierId: string | null;
    readonly preferredSupplierName: string | null;
    readonly lastCost: number | null;
}

export interface TraceabilityRow {
    readonly occurredAt: string;
    readonly direction: 'IN' | 'OUT';
    readonly sourceType: StockSourceType;
    readonly sourceDocId: string | null;
    readonly warehouseName: string;
    readonly counterpartyName: string | null;
    readonly quantity: number;
    readonly balanceAfter: number;
}

/**
 * ACCOUNTING_RECONCILIATION: una fila por cuenta de inventario. `difference` debe ser cero; si
 * no, las columnas de la derecha dicen de dónde sale, y lo que no explican es `unexplained`.
 */
export interface AccountingReconciliationRow {
    readonly slot: 'INVENTORY' | 'INVENTORY_RAW' | 'INVENTORY_FINISHED';
    readonly ledgerAccountCode: string | null;
    readonly ledgerAccountName: string | null;
    /** Σ existencia × costo del kárdex en las bodegas que usan esta cuenta, a la fecha. */
    readonly inventoryValue: number;
    /** Saldo de la cuenta en la balanza a la fecha. */
    readonly ledgerBalance: number;
    readonly difference: number;
    /** Movimientos posteables que todavía no pasan el barrido (valor). */
    readonly pendingPostingValue: number;
    /** Movimientos que cayeron en excepción (valor). */
    readonly exceptionValue: number;
    /** Pólizas capturadas a mano contra la cuenta (valor): el motor no las explica. */
    readonly manualEntriesValue: number;
    readonly unexplained: number;
}
