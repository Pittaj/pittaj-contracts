/**
 * @fileoverview El puente Inventario → Contabilidad: qué cuenta toca cada movimiento.
 * @module Contracts/Inventory/Schemas/InventoryAccounting
 *
 * ── Quién postea qué (no cambia) ──
 *
 * Contabilidad lee `stock_movements` y postea sola `MERMA`, `ADJUSTMENT`, `COUNT` e `INITIAL`
 * (`accounting/domain/StockMovementPosting.ts`). La venta la postea el corte Z, la compra su
 * propia póliza, la producción la orden. Este archivo NO mueve esa frontera: dice qué **hueco**
 * de cuenta usa cada caso, para que las dos apps hablen del mismo concepto.
 *
 * ── Lo que resuelve (1.19.0) ──
 *
 * 1. **Una cuenta por motivo.** Hasta hoy toda salida iba a «Mermas y faltantes». El consumo
 *    interno es un gasto de operación, el robo es un faltante que se deduce con acta, la merma
 *    normal es costo. Cada motivo va a su hueco ({@link huecoDeAjuste}); el contador los reasigna
 *    en «Cuentas del motor» (mapeo `SLOT`), no aquí. Para eso el motivo **viaja en el movimiento**
 *    (`StockMovementResponse.reason`).
 * 2. **El tipo de bodega decide la cuenta de inventario** ({@link WAREHOUSE_INVENTORY_SLOT}).
 *    Pasar mercancía de un almacén a la bodega de producción es reclasificar a materia prima:
 *    el traspaso entre bodegas con hueco distinto sí se postea (reclasificación al costo).
 * 3. **Traspaso entre empresas.** Dos empresas son dos contribuyentes: mover mercancía de una a
 *    otra es una **venta**, con CFDI, no un traspaso. Por defecto se bloquea
 *    ({@link CROSS_COMPANY_TRANSFER_POLICIES}); la venta entre empresas es trabajo futuro.
 * 4. **Periodo cerrado.** Un ajuste o conteo con fecha de un mes cerrado no se aplica: el kárdex
 *    lo aceptaría, pero la póliza no tendría dónde caer y el libro dejaría de cuadrar con el
 *    inventario ({@link CLOSED_PERIOD_POLICIES}).
 * 5. **El documento enseña su póliza** ({@link InventoryPostingInfo}).
 */

import { z } from 'zod';
import type { StockAdjustmentKind, StockAdjustmentReason } from './stockAdjustment.schema.js';
import type { WarehouseType } from './warehouse.schema.js';

/**
 * Huecos del motor contable que usa Inventario. Los primeros tres ya existen en
 * `accounting/domain/AccountSlot.ts`; los marcados «nuevo» los agrega Contabilidad al construir
 * la fase (con su cuenta de la plantilla PyME), y mientras no existan caen en
 * `INVENTORY_SHRINKAGE`, que es lo que pasa hoy.
 */
export const INVENTORY_POSTING_SLOTS = [
    'INVENTORY',
    'INVENTORY_RAW',
    'INVENTORY_FINISHED',
    'INVENTORY_OPENING',
    'INVENTORY_SHRINKAGE',
    /** nuevo — robo y faltantes sin explicar. */
    'INVENTORY_THEFT',
    /** nuevo — consumo interno: gasto de operación, no costo de ventas. */
    'INVENTORY_INTERNAL_USE',
    /** nuevo — diferencias de conteo y correcciones de captura, en los dos sentidos. */
    'INVENTORY_ADJUSTMENT',
] as const;
export type InventoryPostingSlot = (typeof INVENTORY_POSTING_SLOTS)[number];

export const INVENTORY_POSTING_SLOT_LABELS: Readonly<Record<InventoryPostingSlot, string>> = {
    INVENTORY: 'Inventario (mercancía para venta)',
    INVENTORY_RAW: 'Inventario de materia prima',
    INVENTORY_FINISHED: 'Inventario de producto terminado',
    INVENTORY_OPENING: 'Contrapartida del inventario inicial',
    INVENTORY_SHRINKAGE: 'Mermas de inventario',
    INVENTORY_THEFT: 'Robos y faltantes de inventario',
    INVENTORY_INTERNAL_USE: 'Consumo interno de mercancía',
    INVENTORY_ADJUSTMENT: 'Diferencias de inventario',
};

/**
 * La contrapartida del inventario en un ajuste o conteo. **Espejo en Contabilidad**
 * (`StockMovementPosting.contrapartida`), que hoy solo distingue apertura de lo demás.
 *
 * - Conteo, corrección y otro → `INVENTORY_ADJUSTMENT`, entre o salga: una diferencia de
 *   inventario no es merma hasta que alguien dice por qué.
 * - Inventario inicial → `INVENTORY_OPENING` (capital, no resultados).
 * - Robo → `INVENTORY_THEFT`; consumo interno → `INVENTORY_INTERNAL_USE`.
 * - Merma, daño, caducado → `INVENTORY_SHRINKAGE`.
 */
export function huecoDeAjuste(kind: StockAdjustmentKind, reason: StockAdjustmentReason): InventoryPostingSlot {
    if (kind === 'COUNT') return 'INVENTORY_ADJUSTMENT';
    switch (reason) {
        case 'OPENING':
            return 'INVENTORY_OPENING';
        case 'THEFT':
            return 'INVENTORY_THEFT';
        case 'INTERNAL_USE':
            return 'INVENTORY_INTERNAL_USE';
        case 'SHRINKAGE':
        case 'DAMAGE':
        case 'EXPIRED':
            return 'INVENTORY_SHRINKAGE';
        default:
            return 'INVENTORY_ADJUSTMENT';
    }
}

/** La cuenta de inventario de cada tipo de bodega. Se puede corregir por bodega. */
export const WAREHOUSE_INVENTORY_SLOT: Readonly<
    Record<WarehouseType, Extract<InventoryPostingSlot, 'INVENTORY' | 'INVENTORY_RAW' | 'INVENTORY_FINISHED'>>
> = {
    STORE: 'INVENTORY',
    WAREHOUSE: 'INVENTORY',
    TRANSIT: 'INVENTORY',
    QUARANTINE: 'INVENTORY',
    PRODUCTION: 'INVENTORY_RAW',
};

/**
 * Qué hacer con un traspaso cuyo origen y destino pertenecen a empresas distintas.
 * `INTERCOMPANY_SALE` (futuro): el traspaso genera una venta en la empresa origen (con CFDI) y
 * una compra en la destino, al costo o con margen.
 */
export const CROSS_COMPANY_TRANSFER_POLICIES = ['BLOCK', 'INTERCOMPANY_SALE'] as const;
export type CrossCompanyTransferPolicy = (typeof CROSS_COMPANY_TRANSFER_POLICIES)[number];

/**
 * Un documento con fecha en un periodo contable cerrado.
 * - `BLOCK` (por defecto): no se aplica; se pide otra fecha.
 * - `POST_IN_OPEN`: el kárdex lleva la fecha real y la póliza cae el primer día del periodo
 *   abierto, con la fecha original en el concepto. Para quien cierra mes antes de contar.
 */
export const CLOSED_PERIOD_POLICIES = ['BLOCK', 'POST_IN_OPEN'] as const;
export type ClosedPeriodPolicy = (typeof CLOSED_PERIOD_POLICIES)[number];

/** Código de error que devuelven aplicar/enviar/recibir/armar cuando la fecha cae en un periodo cerrado. */
export const INVENTORY_PERIOD_CLOSED = 'INVENTORY_PERIOD_CLOSED' as const;
/** Código de error de un traspaso entre empresas con la política en `BLOCK`. */
export const INVENTORY_CROSS_COMPANY_TRANSFER = 'INVENTORY_CROSS_COMPANY_TRANSFER' as const;

/**
 * Soporte fiscal de una baja. Deducir mercancía destruida, robada o donada pide papeles que
 * el contador va a buscar: la baja los guarda junto al ajuste para que no se pierdan.
 */
export const WRITE_OFF_EVIDENCE_KINDS = [
    /** Aviso de destrucción de mercancía presentado al SAT. */
    'DESTRUCTION_NOTICE',
    /** Acta ante el Ministerio Público o denuncia (robo). */
    'POLICE_REPORT',
    /** Donación con su CFDI. */
    'DONATION',
    /** Acta interna, fotos, lo que haya. */
    'INTERNAL_RECORD',
] as const;
export type WriteOffEvidenceKind = (typeof WRITE_OFF_EVIDENCE_KINDS)[number];

export const writeOffEvidenceSchema = z
    .object({
        kind: z.enum(WRITE_OFF_EVIDENCE_KINDS),
        /** Folio del aviso, número de carpeta de investigación, UUID del CFDI… */
        reference: z.string().trim().min(1).max(120),
        date: z.coerce.date().nullish(),
        /** Id del archivo adjunto (almacenamiento de documentos), si se subió. */
        fileId: z.string().uuid().nullish(),
    })
    .strict();
export type WriteOffEvidenceInput = z.infer<typeof writeOffEvidenceSchema>;

/** Estado de la póliza de un documento de inventario. Lectura: lo escribe Contabilidad. */
export const INVENTORY_POSTING_STATUSES = [
    /** Todavía no pasa el barrido. */
    'PENDING',
    'POSTED',
    /** No había nada que asentar: costo cero, o cuentas iguales (traspaso, armado). */
    'SKIPPED',
    /** Cayó en excepciones: falta mapear una cuenta, periodo cerrado… */
    'EXCEPTION',
    /** La empresa no lleva contabilidad en Pittaj. */
    'NOT_APPLICABLE',
] as const;
export type InventoryPostingStatus = (typeof INVENTORY_POSTING_STATUSES)[number];

/** Lo que un documento de inventario sabe de su póliza, para enseñarla y abrirla. */
export interface InventoryPostingInfo {
    readonly status: InventoryPostingStatus;
    readonly journalEntryId: string | null;
    /** `P-2026-09-00412`: se enseña como enlace que abre la póliza en Contabilidad. */
    readonly journalEntryNumber: string | null;
    readonly postedAt: string | null;
    /** Por qué quedó en excepción, en cristiano. */
    readonly detail: string | null;
}
