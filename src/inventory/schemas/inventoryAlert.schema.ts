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
import type { InventoryHomeResponse } from '../responses/InventoryAlertResponse.js';

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
// `AlertasDeInventarioTests.cs`). Caducidades (`EXPIRING`, `EXPIRED`): `alertaDeCaducidad` (I8b).

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
    /** I8b · Caducidades: el lote, su número y los días que le quedan (negativo = ya caducó). */
    readonly lotId?: string | null;
    readonly lotNumber?: string | null;
    readonly daysToExpiry?: number | null;
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

/** I8b · Un lote con saldo en una bodega, para avisar de su caducidad. */
export interface LoteParaAlertas {
    readonly lotId: string;
    readonly lotNumber: string;
    /** `AVAILABLE` · `QUARANTINE` · `RECALLED` (el guardado; «caducado» lo dice la fecha). */
    readonly status: string;
    /** `YYYY-MM-DD` o nulo. */
    readonly expiresAt: string | null;
    readonly productId: string;
    readonly productName: string;
    readonly productCode: string | null;
    readonly warehouseId: string;
    readonly warehouseName: string;
    readonly onHand: number;
    readonly averageCost: number;
}

/**
 * I8b · La caducidad de un lote con saldo en una bodega.
 *
 * - `EXPIRED` (alta): ya pasó su fecha y sigue ahí. Hay que darlo de baja.
 * - `EXPIRING` (media): caduca dentro de `expiringDays` días (hoy cuenta). Con 0 no se avisa.
 * - Un lote retirado no avisa: ya se sabe que no sirve, y su alerta es el retiro mismo.
 *
 * `changedAt` es el día en que la condición empezó (el aviso, el día siguiente a la fecha): un
 * «Revisado» de «por caducar» no tapa el «caducado», que es otra alerta con otro id.
 */
export function alertaDeCaducidad(l: LoteParaAlertas, expiringDays: number, hoy: string): AlertaDerivada | null {
    if (!(l.onHand > 0) || !l.expiresAt || l.status === 'RECALLED') return null;
    const exp = l.expiresAt.slice(0, 10);
    const dias = Math.round((Date.parse(`${exp}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA_MS);
    const caducado = dias < 0;
    if (!caducado && (expiringDays <= 0 || dias > expiringDays)) return null;
    const kind: InventoryAlertKind = caducado ? 'EXPIRED' : 'EXPIRING';
    const desde = new Date(Date.parse(`${exp}T00:00:00Z`) + (caducado ? DIA_MS : -expiringDays * DIA_MS)).toISOString();
    return {
        id: idDeAlerta(kind, l.lotId, l.warehouseId),
        kind,
        severity: caducado ? 'HIGH' : 'MEDIUM',
        message: caducado
            ? `${l.productName}, lote ${l.lotNumber}: ${cifra(l.onHand)} en ${l.warehouseName}, caducó el ${exp}`
            : dias === 0
              ? `${l.productName}, lote ${l.lotNumber}: ${cifra(l.onHand)} en ${l.warehouseName}, caduca hoy`
              : `${l.productName}, lote ${l.lotNumber}: ${cifra(l.onHand)} en ${l.warehouseName}, caduca en ${dias} ${dias === 1 ? 'día' : 'días'}`,
        productId: l.productId,
        productName: l.productName,
        productCode: l.productCode,
        warehouseId: l.warehouseId,
        warehouseName: l.warehouseName,
        docId: null,
        docNumber: null,
        onHand: l.onHand,
        threshold: caducado ? 0 : expiringDays,
        daysWithoutMovement: null,
        valueAtRisk: redondear(l.onHand * l.averageCost),
        lotId: l.lotId,
        lotNumber: l.lotNumber,
        daysToExpiry: dias,
        changedAt: desde,
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

// ── El tablero de Inicio (I2b) ────────────────────────────────────────────────────────────────
//
// Las cifras de `InventoryHomeResponse` que salen de sumar, armadas en un solo lugar para que la web
// y el escritorio redondeen y ordenen igual. Espejo: `TableroDeInventario.Armar` (C#).
//
// Lo que necesita el costo de venta (rotación, días de inventario, merma como % del costo de venta)
// sale de `costoDeVenta30` (I5b, `consumoDelPar`: las ventas se escriben con costo 0 y se costean al
// promedio móvil). Sin él, nulo. Caducidades: `cajones.expiringSoon` (I8b). Reservas por vencer, en 0.

/** Ventanas del tablero, en días. */
export const VENTANAS_DEL_TABLERO = { valor: 30, exactitud: 90, merma: 30 } as const;

export interface EntradaDelTablero {
    readonly asOf: string;
    /** Un renglón por par producto × bodega de la proyección (`stock_items`), ya recortado al alcance. */
    readonly existencias: ReadonlyArray<{
        readonly productId: string;
        readonly warehouseId: string;
        readonly warehouseName: string;
        readonly onHand: number;
        readonly averageCost: number;
    }>;
    /** Σ existencia × costo promedio hace `VENTANAS_DEL_TABLERO.valor` días (kárdex a esa fecha). */
    readonly valorHace30: number;
    readonly cajones: {
        readonly lowStock: number;
        readonly negative: number;
        readonly transfersInTransit: number;
        readonly transfersToReceive: number;
        readonly countsOpen: number;
        readonly adjustmentsDraft: number;
        /** I8b · Pares lote × bodega con saldo que caducan en `expiringDays` o ya caducaron. */
        readonly expiringSoon?: number;
    };
    /** Renglones contados en conteos aplicados en la ventana, y cuántos cuadraron (contado = teórico). */
    readonly renglonesContados: number;
    readonly renglonesCuadrados: number;
    /** Valor de las salidas por merma (`MERMA`) en la ventana. */
    readonly merma: number;
    /**
     * I5b · Costo de lo vendido en los últimos `VENTANAS_DEL_TABLERO.valor` días. Nulo = no se sabe
     * (y la rotación, los días y el % de merma van nulos).
     */
    readonly costoDeVenta30?: number | null;
}

const centavos = (n: number) => Math.round(n * 100) / 100;

/** Porcentaje con un decimal; nulo sin renglones contados (no es 100 %, es «no se sabe»). */
export function exactitudDeConteos(contados: number, cuadrados: number): number | null {
    return contados > 0 ? Math.round((cuadrados / contados) * 1000) / 10 : null;
}

/** Rotación, días de inventario y merma como % del costo de venta de la ventana. Nulos sin venta. */
function indicadoresDelTablero(cogs: number | null, promedio: number, merma: number) {
    const hay = cogs != null && cogs > 0;
    return {
        shrinkage30d: { value: centavos(merma), pctOfCogs: hay ? centavos((merma / cogs!) * 100) : null },
        turnover: hay && promedio > 0 ? centavos(cogs! / promedio) : null,
        daysOfInventory: hay ? Math.round((promedio / cogs!) * VENTANAS_DEL_TABLERO.valor * 10) / 10 : null,
    };
}

export function armarTablero(e: EntradaDelTablero): InventoryHomeResponse {
    let total = 0;
    const conExistencia = new Set<string>();
    const porBodega = new Map<string, { warehouseId: string; warehouseName: string; value: number; products: Set<string> }>();
    for (const x of e.existencias) {
        const valor = x.onHand * x.averageCost;
        total += valor;
        if (x.onHand > 0) conExistencia.add(x.productId);
        const b = porBodega.get(x.warehouseId) ?? { warehouseId: x.warehouseId, warehouseName: x.warehouseName, value: 0, products: new Set() };
        b.value += valor;
        if (x.onHand > 0) b.products.add(x.productId);
        porBodega.set(x.warehouseId, b);
    }
    return {
        asOf: e.asOf,
        totalValue: centavos(total),
        totalValueDelta30d: centavos(total - e.valorHace30),
        productsWithStock: conExistencia.size,
        cajones: { ...e.cajones, expiringSoon: e.cajones.expiringSoon ?? 0, reservationsExpiring: 0 },
        countAccuracy90d: exactitudDeConteos(e.renglonesContados, e.renglonesCuadrados),
        // Inventario promedio de la ventana = (hace 30 días + hoy) / 2; misma regla que la rotación (I5b).
        ...indicadoresDelTablero(e.costoDeVenta30 ?? null, (e.valorHace30 + total) / 2, e.merma),
        byWarehouse: [...porBodega.values()]
            .map((b) => ({ warehouseId: b.warehouseId, warehouseName: b.warehouseName, value: centavos(b.value), products: b.products.size }))
            .sort((a, b) => b.value - a.value || a.warehouseName.localeCompare(b.warehouseName)),
    };
}

// ── Por correo (2.82.0) ───────────────────────────────────────────────────────────────────────

/** Lo que el correo necesita de una alerta sin revisar. */
export interface AlertaParaCorreo {
    readonly id: string;
    readonly kind: InventoryAlertKind;
    readonly severity: InventoryAlertSeverity;
    readonly message: string;
    readonly valueAtRisk: number;
    /** Desde cuándo está así (ISO). */
    readonly since: string;
}

/** Un correo de alertas: su asunto y sus renglones, ya en texto. */
export interface AvisoPorCorreo {
    readonly asunto: string;
    readonly renglones: readonly string[];
    /** Alertas que cubre (para «y N más»). */
    readonly total: number;
}

/** Renglones que entran en un resumen; lo demás se dice como «y N más». */
export const RENGLONES_DEL_RESUMEN = 25;

/**
 * (2.82.0) Los correos de alertas de un negocio (`inventory.alerts.emailUserIds` / `dailyDigest`).
 *
 * - **Resumen diario** (`dailyDigest`): un correo con todo lo que sigue sin revisar, primero lo más
 *   grave y lo que más vale; nada si no hay nada.
 * - **Uno por alerta**: un correo por cada alerta que **apareció en las últimas 24 horas** (lo que
 *   ya se avisó ayer no se repite). Como mucho `RENGLONES_DEL_RESUMEN`.
 *
 * Lo revisado no llega aquí: se filtra antes con `estaRevisada`.
 */
export function avisosPorCorreo(alertas: readonly AlertaParaCorreo[], dailyDigest: boolean, ahora: Date): AvisoPorCorreo[] {
    const orden = [...alertas].sort(
        (x, y) => SEVERIDAD_ORDEN[x.severity] - SEVERIDAD_ORDEN[y.severity] || y.valueAtRisk - x.valueAtRisk || x.id.localeCompare(y.id)
    );
    if (!dailyDigest) {
        const hace24 = ahora.getTime() - 86_400_000;
        return orden
            .filter((a) => Date.parse(a.since) > hace24)
            .slice(0, RENGLONES_DEL_RESUMEN)
            .map((a) => ({ asunto: `Inventario: ${a.message}`, renglones: [a.message], total: 1 }));
    }
    if (orden.length === 0) return [];
    const altas = orden.filter((a) => a.severity === 'HIGH').length;
    const porTipo = INVENTORY_ALERT_KINDS.map((k) => [k, orden.filter((a) => a.kind === k).length] as const)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${INVENTORY_ALERT_KIND_LABELS[k]}: ${n}`)
        .join(' · ');
    const renglones = [porTipo, ...orden.slice(0, RENGLONES_DEL_RESUMEN).map((a) => a.message)];
    if (orden.length > RENGLONES_DEL_RESUMEN) renglones.push(`y ${orden.length - RENGLONES_DEL_RESUMEN} más`);
    const n = orden.length;
    return [{
        asunto: `Inventario: ${n} ${n === 1 ? 'alerta' : 'alertas'} sin revisar${altas > 0 ? ` (${altas} ${altas === 1 ? 'grave' : 'graves'})` : ''}`,
        renglones,
        total: n,
    }];
}
