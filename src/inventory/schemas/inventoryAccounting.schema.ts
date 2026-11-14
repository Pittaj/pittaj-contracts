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
 *    ({@link CROSS_COMPANY_TRANSFER_POLICIES}); con `INTERCOMPANY_SALE` (2.86.0) el traspaso
 *    genera la venta y la compra ({@link precioEntreEmpresas}).
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

export type InventoryAccountSlot = (typeof WAREHOUSE_INVENTORY_SLOT)[WarehouseType];

/**
 * La cuenta de inventario de UNA bodega (I4b): la que se le corrigió (`inventoryAccountSlot`) o
 * la de su tipo. Sin tipo —una bodega anterior a I4— es la de mercancía. La usan Contabilidad al
 * postear el traspaso y el ajuste, y la ficha del traspaso para decir si habrá póliza.
 */
export function cuentaDeInventarioDeBodega(bodega: {
    readonly type?: WarehouseType | null;
    readonly inventoryAccountSlot?: InventoryAccountSlot | null;
}): InventoryAccountSlot {
    return bodega.inventoryAccountSlot ?? WAREHOUSE_INVENTORY_SLOT[bodega.type ?? 'STORE'] ?? 'INVENTORY';
}

/**
 * A dónde va lo que salió en un traspaso y no llegó (`missingQuantity`): merma en tránsito. No es
 * robo —eso pide acta y lo declara quien lo sabe, con un ajuste— ni diferencia de conteo.
 */
export const HUECO_FALTANTE_DE_TRASPASO: InventoryPostingSlot = 'INVENTORY_SHRINKAGE';

/**
 * (2.85.0) A dónde va la diferencia de un armado o desarmado de kits: lo que entró al kárdex vale
 * distinto de lo que salió. Al armar casi nunca pasa (el kit entra a la suma de sus componentes);
 * al desarmar sí: el kit sale a su promedio y los componentes entran a los suyos. Es una
 * diferencia de valuación, no una merma.
 */
export const HUECO_DIFERENCIA_DE_ARMADO: InventoryPostingSlot = 'INVENTORY_ADJUSTMENT';

/**
 * (2.85.0) La diferencia de un armado: lo que entró menos lo que salió, al costo de cada movimiento,
 * en centavos redondeados. Positiva = el inventario ganó valor. Cero = no hay póliza.
 */
export function diferenciaDeArmado(movimientos: readonly { direction: 'IN' | 'OUT'; quantity: number; unitCost: number }[]): number {
    const centavos = movimientos.reduce((s, m) => s + (m.direction === 'IN' ? 1 : -1) * m.quantity * m.unitCost, 0);
    return Math.round(centavos * 100) / 100;
}

/**
 * Qué hacer con un traspaso cuyo origen y destino pertenecen a empresas distintas.
 * - `BLOCK` (por defecto): no se envía (`INVENTORY_CROSS_COMPANY_TRANSFER`).
 * - `INTERCOMPANY_SALE` (2.86.0): se envía como cualquier traspaso y, al recibirlo, la nube genera
 *   una **venta sin caja** en la empresa origen (el CFDI lo timbra el usuario desde ahí) y una
 *   **compra recibida** en la destino, a {@link precioEntreEmpresas}. La mercancía la mueve el
 *   traspaso: ni la venta ni la compra vuelven a tocar el kárdex.
 */
export const CROSS_COMPANY_TRANSFER_POLICIES = ['BLOCK', 'INTERCOMPANY_SALE'] as const;
export type CrossCompanyTransferPolicy = (typeof CROSS_COMPANY_TRANSFER_POLICIES)[number];

// ── Venta entre empresas (2.86.0) ─────────────────────────────────────────────────────────────

/**
 * El precio unitario de la venta entre empresas: el costo promedio en origen más el margen, a cuatro
 * decimales (los del costo). Es también el costo con que la mercancía **entra** a la empresa destino:
 * para ella es una compra. Espejo: `VentaEntreEmpresas.Precio` en el escritorio.
 */
export function precioEntreEmpresas(costoUnitario: number, margenPorciento: number): number {
    const m = Number.isFinite(margenPorciento) && margenPorciento > 0 ? margenPorciento : 0;
    return Math.round(costoUnitario * (1 + m / 100) * 10000) / 10000;
}

/** Semilla del id de la venta sin caja que genera un traspaso entre empresas. */
export function semillaDeVentaEntreEmpresas(transferId: string): string {
    return `intercompany:sale:${transferId}`;
}

/** Semilla del id de la compra que genera un traspaso entre empresas en la empresa destino. */
export function semillaDeCompraEntreEmpresas(transferId: string): string {
    return `intercompany:purchase:${transferId}`;
}

/**
 * Lo que un traspaso entre empresas recuerda de sí mismo, estampado **al enviar** (el margen de ese
 * día, aunque luego cambie la configuración). Los ids de la venta y la compra se llenan al recibir.
 */
export interface IntercompanyTransferInfo {
    readonly fromCompanyId: string;
    readonly toCompanyId: string;
    readonly marginPercent: number;
    readonly saleId?: string | null;
    readonly saleNumber?: string | null;
    readonly purchaseId?: string | null;
    readonly purchaseNumber?: string | null;
    /** Si generar los documentos falló, por qué: se reintenta al volver a abrir el traspaso. */
    readonly error?: string | null;
}

/**
 * Un documento con fecha en un periodo contable cerrado.
 * - `BLOCK` (por defecto): no se aplica; se pide otra fecha.
 * - `POST_IN_OPEN`: el kárdex lleva la fecha real y la póliza cae el primer día del periodo
 *   abierto, con la fecha original en el concepto. Para quien cierra mes antes de contar.
 */
export const CLOSED_PERIOD_POLICIES = ['BLOCK', 'POST_IN_OPEN'] as const;
export type ClosedPeriodPolicy = (typeof CLOSED_PERIOD_POLICIES)[number];

// ── Los meses cerrados, para quien no tiene Contabilidad (2.87.0) ──────────────────────────────
//
// El escritorio no lleva los periodos contables (F6), pero tiene que respetar el candado del mes
// cerrado igual que la web. La nube publica los meses cerrados de cada empresa en el canal de
// configuración (`inventory.closedPeriods.<companyId>`), que ya baja al escritorio, cada vez que
// se cierra o reabre un mes. Sin red, el escritorio decide con lo último que bajó.

/** Prefijo de las claves de meses cerrados: `inventory.closedPeriods.<companyId>`. */
export const PREFIJO_MESES_CERRADOS = 'inventory.closedPeriods.' as const;

export function claveDeMesesCerrados(companyId: string): string {
    return `${PREFIJO_MESES_CERRADOS}${companyId}`;
}

/** Un mes cerrado: fechas civiles `YYYY-MM-DD`, los dos extremos incluidos. */
export interface MesCerrado {
    readonly start: string;
    readonly end: string;
}

/** El valor de la clave: los meses cerrados, en orden. */
export function escribirMesesCerrados(meses: readonly MesCerrado[]): string {
    return JSON.stringify([...meses].sort((a, b) => a.start.localeCompare(b.start)).map((m) => ({ start: m.start, end: m.end })));
}

const FECHA_CIVIL = /^\d{4}-\d{2}-\d{2}$/;

/** Lee el valor de la clave; lo que no se entienda no cierra nada. Espejo: `MesesCerrados.Leer`. */
export function leerMesesCerrados(json: string | null | undefined): MesCerrado[] {
    if (!json) return [];
    try {
        const v = JSON.parse(json) as unknown;
        if (!Array.isArray(v)) return [];
        return v.filter(
            (m): m is MesCerrado =>
                !!m && typeof m === 'object' && FECHA_CIVIL.test(String((m as MesCerrado).start)) && FECHA_CIVIL.test(String((m as MesCerrado).end))
        );
    } catch {
        return [];
    }
}

/** ¿La fecha civil `YYYY-MM-DD` cae en un mes cerrado? Espejo: `MesesCerrados.Cerrado`. */
export function fechaEnMesCerrado(meses: readonly MesCerrado[], fecha: string): boolean {
    return meses.some((m) => m.start <= fecha && fecha <= m.end);
}

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
        /** (2.85.0) Nombre del archivo, para enseñarlo y descargarlo con su nombre. */
        fileName: z.string().trim().max(200).nullish(),
    })
    .strict();
export type WriteOffEvidenceInput = z.infer<typeof writeOffEvidenceSchema>;

/**
 * (2.85.0) Las bajas que piden soporte fiscal cuando pasan del umbral
 * (`accounting.requireEvidenceAboveValue`): robo, caducidad y daño. Una merma ordinaria o un
 * consumo interno no: no hay aviso que presentar.
 */
export const MOTIVOS_QUE_PIDEN_EVIDENCIA = ['THEFT', 'EXPIRED', 'DAMAGE'] as const;

/** (2.85.0) Las etiquetas de cada tipo de soporte, para las dos pantallas. */
export const WRITE_OFF_EVIDENCE_LABELS: Readonly<Record<WriteOffEvidenceKind, string>> = {
    DESTRUCTION_NOTICE: 'Aviso de destrucción (SAT)',
    POLICE_REPORT: 'Denuncia o acta ante el MP',
    DONATION: 'Donación con CFDI',
    INTERNAL_RECORD: 'Acta interna o fotos',
};

/**
 * (2.85.0) Si a una baja le falta su soporte: un ajuste (no un conteo) por robo, caducidad o daño
 * cuya salida vale más que el umbral (`valorDeLaBaja` = Σ cantidad × costo promedio de lo que sale)
 * y no trae ningún soporte. Devuelve la frase para el usuario, o nulo. Umbral 0 = nunca se pide.
 */
export function evidenciaFaltante(p: {
    kind: 'ADJUSTMENT' | 'COUNT';
    reason: string;
    valorDeLaBaja: number;
    umbral: number;
    evidencias: number;
}): string | null {
    if (p.kind !== 'ADJUSTMENT' || !(p.umbral > 0) || p.evidencias > 0) return null;
    if (!(MOTIVOS_QUE_PIDEN_EVIDENCIA as readonly string[]).includes(p.reason)) return null;
    const valor = Math.round(p.valorDeLaBaja * 100) / 100;
    if (!(valor > p.umbral)) return null;
    return `Esta baja vale $${pesos(valor)} y la configuración pide soporte arriba de $${pesos(p.umbral)}: agrega el aviso de destrucción, la denuncia o el acta antes de aplicarla.`;
}

/** `1,500.00`: sin depender del `Intl` del entorno (el escritorio formatea igual). */
function pesos(n: number): string {
    const [ent, dec] = (Math.round(n * 100) / 100).toFixed(2).split('.');
    return `${ent!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

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
    /**
     * (1.21.0) Contabilidad postea **una póliza por renglón** de un ajuste: cada movimiento es una
     * decisión y así se contesta «¿por qué bajó el inventario?» sin abrir el almacén. Aquí va
     * cuántas lleva; `journalEntryId` es la primera.
     */
    readonly entryCount?: number;
    /** (1.21.0) Para abrir la póliza en Contabilidad: empresa y mes. */
    readonly companyId?: string | null;
    readonly fiscalPeriodId?: string | null;
}
