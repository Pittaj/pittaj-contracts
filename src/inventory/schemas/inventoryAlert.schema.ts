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
