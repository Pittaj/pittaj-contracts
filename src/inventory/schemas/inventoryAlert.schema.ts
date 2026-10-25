/**
 * @fileoverview Alertas de Inventario: lo que pide atención hoy.
 * @module Contracts/Inventory/Schemas/InventoryAlert
 *
 * ── Derivadas, no capturadas ──
 *
 * Una alerta no se crea a mano: sale de comparar la proyección (existencia, lotes) con la
 * configuración (niveles, días de aviso). Se recalcula al escribir movimientos y en un proceso
 * nocturno (caducidades, sin movimiento). Lo único que se guarda es **el acuse**: quién la vio
 * y hasta cuándo no quiere volver a verla. Si la condición desaparece, la alerta se cierra sola.
 *
 * ── Por qué «Revisado» y no «Resolver» ──
 *
 * Una existencia baja se resuelve comprando, no con un botón. El botón dice lo que sí hace:
 * «ya la vi». El atajo que resuelve de verdad (pedir, contar, mermar) va al lado.
 */

import { z } from 'zod';

export const INVENTORY_ALERT_KINDS = [
    'LOW_STOCK',
    'NEGATIVE',
    'EXPIRING',
    'EXPIRED',
    'OVERSTOCK',
    'NO_MOVEMENT',
    /** Un traspaso enviado que lleva más de N días sin recibirse. */
    'TRANSFER_STALE',
    /** Un conteo en borrador que lleva más de N días sin aplicarse. */
    'COUNT_STALE',
] as const;
export type InventoryAlertKind = (typeof INVENTORY_ALERT_KINDS)[number];

export const INVENTORY_ALERT_KIND_LABELS: Readonly<Record<InventoryAlertKind, string>> = {
    LOW_STOCK: 'Existencia baja',
    NEGATIVE: 'En negativo',
    EXPIRING: 'Por caducar',
    EXPIRED: 'Caducado con existencia',
    OVERSTOCK: 'Sobreinventario',
    NO_MOVEMENT: 'Sin movimiento',
    TRANSFER_STALE: 'Traspaso sin recibir',
    COUNT_STALE: 'Conteo sin aplicar',
};

export const INVENTORY_ALERT_SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type InventoryAlertSeverity = (typeof INVENTORY_ALERT_SEVERITIES)[number];

/** GET /api/inventory-alerts */
export const getInventoryAlertsSchema = z.object({
    kind: z.enum(INVENTORY_ALERT_KINDS).optional(),
    warehouseId: z.string().uuid().optional(),
    severity: z.enum(INVENTORY_ALERT_SEVERITIES).optional(),
    /** Por defecto solo las no revisadas. */
    includeAcknowledged: z.coerce.boolean().optional().default(false),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

/** POST /api/inventory-alerts/acknowledge — una o varias a la vez. */
export const acknowledgeInventoryAlertsSchema = z.object({
    alertIds: z.array(z.string().min(1).max(120)).min(1).max(500),
    /** No volver a avisar de esto hasta esta fecha (si la condición sigue). Nulo = hasta que cambie. */
    snoozeUntil: z.coerce.date().nullish(),
    note: z.string().trim().max(500).nullish(),
});

export type GetInventoryAlertsQuery = z.infer<typeof getInventoryAlertsSchema>;
export type AcknowledgeInventoryAlertsRequest = z.infer<typeof acknowledgeInventoryAlertsSchema>;

// ── La regla (I2): qué alerta sale de qué, con qué severidad y con qué id ─────────────────────
//
// Una sola definición para las dos puntas: la nube la usa sobre lo que lee en SQL y el escritorio la
// espeja en `AlertasDeInventario.cs` (mismos casos en `alertasDeInventario.test.ts` y
// `AlertasDeInventarioTests.cs`). Caducidades (`EXPIRING`, `EXPIRED`) llegan con los lotes (I8).

/** La parte de la configuración que decide las alertas (`InventorySettings['alerts']`). */
export interface ConfiguracionDeAlertas {
    readonly lowStock: boolean;
    readonly negative: boolean;
    readonly overstock: boolean;
    readonly noMovementDays: number;
    readonly transferStaleDays: number;
    readonly countStaleDays: number;
}

/** Una alerta recién derivada: la respuesta sin lo del acuse, más cuándo cambió su condición. */
export interface AlertaDerivada {
    readonly id: string;
    readonly kind: InventoryAlertKind;
    readonly severity: InventoryAlertSeverity;
    readonly message: string;
    readonly productId: string | null;
    readonly productName: string | null;
    readonly productCode: string | null;
    readonly warehouseId: string | null;
    readonly warehouseName: string | null;
    readonly docId: string | null;
    readonly docNumber: string | null;
    readonly onHand: number | null;
    readonly threshold: number | null;
    readonly daysWithoutMovement: number | null;
    readonly valueAtRisk: number;
    /**
     * Desde cuándo la condición es la que es: el último movimiento del par producto × bodega, o la
     * última edición del documento. Un acuse anterior a esto ya no la oculta (ver {@link estaRevisada}).
     */
    readonly changedAt: string;
}

/** Lo que se sabe de un par producto × bodega para derivar sus alertas. */
export interface ExistenciaParaAlertas {
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly averageCost: number;
    /** El nivel que manda (el de la bodega o, sin él, el del producto). */
    readonly minStock: number;
    readonly reorderPoint: number;
    readonly maxStock: number;
    /** ISO; nulo si el par no tiene movimientos. */
    readonly lastMovementAt: string | null;
}

const DIA_MS = 86_400_000;
const EPOCA = new Date(0).toISOString();
const redondear = (n: number) => Math.round(n * 100) / 100;
const cifra = (n: number) => String(Math.round(n * 1000) / 1000);

/** Días completos entre `desde` y `ahora`. */
export function diasDesde(desde: string | Date, ahora: Date): number {
    return Math.floor((ahora.getTime() - new Date(desde).getTime()) / DIA_MS);
}

/** `LOW_STOCK:{producto}:{bodega}`, `TRANSFER_STALE:{traspaso}`… La misma condición es la misma alerta. */
export function idDeAlerta(kind: InventoryAlertKind, ...partes: string[]): string {
    return [kind, ...partes].join(':');
}

/**
 * Las alertas de un par producto × bodega. Excluyentes entre sí salvo «sin movimiento», que puede
 * acompañar a un sobreinventario (es el mismo dinero dormido visto de dos lados).
 *
 * - `NEGATIVE` (alta): existencia bajo cero.
 * - `LOW_STOCK`: con mínimo o punto de reorden, la existencia está en o bajo él. Agotado = alta; bajo = media.
 *   Sin nivel no hay «bajo»: un producto en cero sin nivel no es alerta (sería ruido).
 * - `OVERSTOCK` (baja): sobre el máximo.
 * - `NO_MOVEMENT` (baja): con existencia y sin movimiento en `noMovementDays` días.
 */
export function alertasDeExistencia(e: ExistenciaParaAlertas, cfg: ConfiguracionDeAlertas, ahora: Date): AlertaDerivada[] {
    const base = {
        productId: e.productId,
        productName: e.productName,
        productCode: e.productCode,
        warehouseId: e.warehouseId,
        warehouseName: e.warehouseName,
        docId: null,
        docNumber: null,
        onHand: e.onHand,
        changedAt: e.lastMovementAt ?? EPOCA,
    } as const;
    const id = (kind: InventoryAlertKind) => idDeAlerta(kind, e.productId, e.warehouseId);
    const r: AlertaDerivada[] = [];

    if (e.onHand < 0) {
        if (cfg.negative)
            r.push({
                ...base,
                id: id('NEGATIVE'),
                kind: 'NEGATIVE',
                severity: 'HIGH',
                message: `${e.productName}: ${cifra(e.onHand)} en ${e.warehouseName}`,
                threshold: 0,
                daysWithoutMovement: null,
                valueAtRisk: redondear(-e.onHand * e.averageCost),
            });
        return r;
    }

    const umbral = e.minStock > 0 ? e.minStock : e.reorderPoint;
    const bajo = (e.minStock > 0 && e.onHand < e.minStock) || (e.reorderPoint > 0 && e.onHand <= e.reorderPoint);
    if (bajo && cfg.lowStock) {
        r.push({
            ...base,
            id: id('LOW_STOCK'),
            kind: 'LOW_STOCK',
            severity: e.onHand === 0 ? 'HIGH' : 'MEDIUM',
            message:
                e.onHand === 0
                    ? `${e.productName}: agotado en ${e.warehouseName} (mínimo ${cifra(umbral)})`
                    : `${e.productName}: ${cifra(e.onHand)} en ${e.warehouseName}, mínimo ${cifra(umbral)}`,
            threshold: umbral,
            daysWithoutMovement: null,
            valueAtRisk: redondear(Math.max(0, umbral - e.onHand) * e.averageCost),
        });
    }
    if (e.maxStock > 0 && e.onHand > e.maxStock && cfg.overstock) {
        r.push({
            ...base,
            id: id('OVERSTOCK'),
            kind: 'OVERSTOCK',
            severity: 'LOW',
            message: `${e.productName}: ${cifra(e.onHand)} en ${e.warehouseName}, máximo ${cifra(e.maxStock)}`,
            threshold: e.maxStock,
            daysWithoutMovement: null,
            valueAtRisk: redondear((e.onHand - e.maxStock) * e.averageCost),
        });
    }
    if (cfg.noMovementDays > 0 && e.onHand > 0 && e.lastMovementAt) {
        const dias = diasDesde(e.lastMovementAt, ahora);
        if (dias >= cfg.noMovementDays) {
            r.push({
                ...base,
                id: id('NO_MOVEMENT'),
                kind: 'NO_MOVEMENT',
                severity: 'LOW',
                message: `${e.productName}: ${cifra(e.onHand)} en ${e.warehouseName} sin moverse en ${dias} días`,
                threshold: cfg.noMovementDays,
                daysWithoutMovement: dias,
                valueAtRisk: redondear(e.onHand * e.averageCost),
            });
        }
    }
    return r;
}

/** Un traspaso enviado (en tránsito) que lleva `transferStaleDays` días sin recibirse: media. */
export function alertaDeTraspaso(
    t: {
        readonly id: string;
        readonly number: string;
        readonly toWarehouseId: string;
        readonly toWarehouseName: string;
        readonly fromWarehouseName: string;
        readonly sentAt: string;
        readonly updatedAt: string;
    },
    cfg: ConfiguracionDeAlertas,
    ahora: Date,
): AlertaDerivada | null {
    if (cfg.transferStaleDays <= 0) return null;
    const dias = diasDesde(t.sentAt, ahora);
    if (dias < cfg.transferStaleDays) return null;
    return {
        id: idDeAlerta('TRANSFER_STALE', t.id),
        kind: 'TRANSFER_STALE',
        severity: 'MEDIUM',
        message: `Traspaso ${t.number} de ${t.fromWarehouseName} a ${t.toWarehouseName}: ${dias} días sin recibirse`,
        productId: null,
        productName: null,
        productCode: null,
        warehouseId: t.toWarehouseId,
        warehouseName: t.toWarehouseName,
        docId: t.id,
        docNumber: t.number,
        onHand: null,
        threshold: cfg.transferStaleDays,
        daysWithoutMovement: dias,
        valueAtRisk: 0,
        changedAt: t.updatedAt,
    };
}

/** Un conteo en borrador que lleva `countStaleDays` días sin aplicarse: baja. */
export function alertaDeConteo(
    c: {
        readonly id: string;
        readonly number: string;
        readonly warehouseId: string;
        readonly warehouseName: string;
        readonly createdAt: string;
        readonly updatedAt: string;
    },
    cfg: ConfiguracionDeAlertas,
    ahora: Date,
): AlertaDerivada | null {
    if (cfg.countStaleDays <= 0) return null;
    const dias = diasDesde(c.createdAt, ahora);
    if (dias < cfg.countStaleDays) return null;
    return {
        id: idDeAlerta('COUNT_STALE', c.id),
        kind: 'COUNT_STALE',
        severity: 'LOW',
        message: `Conteo ${c.number} en ${c.warehouseName}: ${dias} días sin aplicarse`,
        productId: null,
        productName: null,
        productCode: null,
        warehouseId: c.warehouseId,
        warehouseName: c.warehouseName,
        docId: c.id,
        docNumber: c.number,
        onHand: null,
        threshold: cfg.countStaleDays,
        daysWithoutMovement: dias,
        valueAtRisk: 0,
        changedAt: c.updatedAt,
    };
}

/** Lo que se guarda al marcar «Revisado» (una fila por alerta, id determinista). */
export interface AcuseDeAlerta {
    readonly acknowledgedAt: string;
    readonly snoozeUntil: string | null;
}

/**
 * ¿El acuse oculta la alerta? Pospuesta: hasta la fecha, aunque algo cambie. Sin posponer: hasta
 * que la condición cambie (un movimiento del par, una edición del documento después del acuse).
 * Así una existencia que se repuso y volvió a bajar avisa otra vez, sin que nadie borre acuses.
 */
export function estaRevisada(acuse: AcuseDeAlerta | null | undefined, changedAt: string, ahora: Date): boolean {
    if (!acuse) return false;
    if (acuse.snoozeUntil) return ahora.getTime() < new Date(acuse.snoozeUntil).getTime();
    return new Date(acuse.acknowledgedAt).getTime() >= new Date(changedAt).getTime();
}

/** Semilla del id del acuse: el mismo en la nube y en el escritorio, para que dos acuses sin red no choquen. */
export function semillaDeAcuse(alertId: string): string {
    return `inventory-alert-ack:${alertId}`;
}

/** Orden de la lista: severidad, luego lo que más duele. */
export const SEVERIDAD_ORDEN: Readonly<Record<InventoryAlertSeverity, number>> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
