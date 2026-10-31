/**
 * @fileoverview Alta y edición de bodegas (hasta hoy solo se creaban en el escritorio).
 * @module Contracts/Inventory/Schemas/Warehouse
 *
 * ── Tipo de bodega ──
 *
 * No todas las bodegas son iguales para quien vende: la de mercancía en tránsito no se vende, la
 * de cuarentena tampoco, y la de producción guarda materia prima que el POS no debe ofrecer. El
 * tipo decide los defaults de `allowsSale`/`countsInAvailable`; los dos se pueden corregir a mano.
 *
 * ── Ubicaciones dentro de la bodega (pasillo, anaquel, nivel) ──
 *
 * **Todavía no.** Queda documentado como F-futura en `producto/plan-inventario-completo.md` (docs):
 * `usesBins` existe para que el día que se active no haya que cambiar la forma de la bodega, pero
 * hoy el servidor solo acepta `false`.
 */

import { z } from 'zod';
import { WAREHOUSE_STATUSES } from './getWarehouses.schema.js';

export const WAREHOUSE_TYPES = [
    /** Piso de venta: lo que el POS descuenta. */
    'STORE',
    /** Almacén de respaldo. */
    'WAREHOUSE',
    /** Mercancía en camino (virtual): la usan los traspasos enviados. */
    'TRANSIT',
    /** Materia prima y producto en proceso. */
    'PRODUCTION',
    /** Retenido por calidad, devoluciones por revisar, dañado. */
    'QUARANTINE',
] as const;
export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];

export const WAREHOUSE_TYPE_LABELS: Readonly<Record<WarehouseType, string>> = {
    STORE: 'Piso de venta',
    WAREHOUSE: 'Almacén',
    TRANSIT: 'En tránsito',
    PRODUCTION: 'Producción',
    QUARANTINE: 'Cuarentena',
};

/** Defaults por tipo: se proponen al elegir el tipo y se pueden corregir. */
export const WAREHOUSE_TYPE_DEFAULTS: Readonly<
    Record<WarehouseType, { readonly allowsSale: boolean; readonly countsInAvailable: boolean }>
> = {
    STORE: { allowsSale: true, countsInAvailable: true },
    WAREHOUSE: { allowsSale: false, countsInAvailable: true },
    TRANSIT: { allowsSale: false, countsInAvailable: false },
    PRODUCTION: { allowsSale: false, countsInAvailable: false },
    QUARANTINE: { allowsSale: false, countsInAvailable: false },
};

const warehouseBody = z.object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().max(20).nullish(),
    locationId: z.string().uuid().nullish(),
    type: z.enum(WAREHOUSE_TYPES).optional().default('STORE'),
    /** El POS puede descontar de ella. */
    allowsSale: z.boolean().optional(),
    /** Su existencia suma en el «disponible» que ven ventas y pedidos. */
    countsInAvailable: z.boolean().optional(),
    isDefault: z.boolean().optional().default(false),
    address: z.string().trim().max(300).nullish(),
    responsibleUserId: z.string().uuid().nullish(),
    /**
     * Cuenta de inventario de la bodega (1.19.0). Ausente = la del tipo
     * (`WAREHOUSE_INVENTORY_SLOT`): producción usa materia prima; las demás, mercancía.
     */
    inventoryAccountSlot: z.enum(['INVENTORY', 'INVENTORY_RAW', 'INVENTORY_FINISHED']).nullish(),
    /** Reservado para ubicaciones (pasillo/anaquel). Hoy solo `false`. */
    usesBins: z.literal(false).optional().default(false),
});

/**
 * `TRANSIT` es la bodega virtual de los traspasos enviados: la crea y la usa el sistema (I4c), no
 * se da de alta a mano. Los otros cuatro sí.
 */
export const WAREHOUSE_TYPES_ELEGIBLES = WAREHOUSE_TYPES.filter((t) => t !== 'TRANSIT') as readonly Exclude<WarehouseType, 'TRANSIT'>[];

const sinTransito = <T extends { type: WarehouseType }>(v: T) => v.type !== 'TRANSIT';
const MENSAJE_TRANSITO = { message: 'La bodega en tránsito la maneja el sistema: no se da de alta a mano.', path: ['type'] };

/** POST /api/warehouses */
export const createWarehouseSchema = warehouseBody.extend({ id: z.string().uuid() }).refine(sinTransito, MENSAJE_TRANSITO);

/** PUT /api/warehouses/:id */
export const updateWarehouseSchema = warehouseBody
    .extend({
        status: z.enum(WAREHOUSE_STATUSES),
        version: z.number().int().min(1),
    })
    .refine(sinTransito, MENSAJE_TRANSITO);

export type CreateWarehouseRequest = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseRequest = z.infer<typeof updateWarehouseSchema>;

// ── Las reglas (I4) ───────────────────────────────────────────────────────────────────────────
//
// Una sola definición para las dos puntas; espejo en el escritorio: `ReglasDeBodega` (C#), mismos
// casos en `reglasDeBodega.test.ts` y `ReglasDeBodegaTests.cs`.

/** Lo que importa de una bodega para decidir de dónde se vende. */
export interface BodegaParaVenta {
    readonly id: string;
    readonly locationId: string | null;
    readonly status: 'ACTIVE' | 'INACTIVE';
    readonly allowsSale: boolean;
}

/** Las banderas efectivas: lo capturado o, si no se dijo, lo del tipo. */
export function reglasDeBodega(
    type: WarehouseType,
    allowsSale?: boolean | null,
    countsInAvailable?: boolean | null
): { allowsSale: boolean; countsInAvailable: boolean } {
    const d = WAREHOUSE_TYPE_DEFAULTS[type];
    return { allowsSale: allowsSale ?? d.allowsSale, countsInAvailable: countsInAvailable ?? d.countsInAvailable };
}

const vende = (b: BodegaParaVenta) => b.status === 'ACTIVE' && b.allowsSale;

/**
 * ¿El cambio deja a una sucursal (o a las bodegas sin sucursal) sin ninguna bodega activa de venta,
 * cuando antes tenía al menos una? Así una caja nunca se queda sin de dónde descontar por una
 * edición: la venta seguiría y la salida de existencia no tendría bodega.
 *
 * Devuelve la sucursal que se quedaría sin venta (`null` = las bodegas sin sucursal), o `undefined`
 * si el cambio no deja a nadie sin venta.
 */
export function sucursalQueSeQuedaSinVenta(
    bodegas: readonly BodegaParaVenta[],
    cambiada: BodegaParaVenta
): string | null | undefined {
    const antes = bodegas.find((b) => b.id === cambiada.id);
    if (!antes || !vende(antes)) return undefined;
    const despues = bodegas.map((b) => (b.id === cambiada.id ? cambiada : b));
    const sucursal = antes.locationId;
    const seguia = despues.some((b) => b.locationId === sucursal && vende(b));
    return seguia ? undefined : sucursal;
}

// ── La bodega de tránsito (I4c) ───────────────────────────────────────────────────────────────
//
// Lo enviado y no recibido tiene que estar en ALGÚN kárdex: si sale de la origen y no entra a
// ningún lado hasta recibirse, a fin de mes el inventario vale menos que la balanza y nadie sabe
// por qué. Enviar lo pasa a la bodega de tránsito de la sucursal de origen; recibir lo saca de ahí
// a la destino; cancelar lo regresa a la origen.
//
// Hay **una por sucursal** y su id es **determinista**: la nube y el escritorio que la creen sin
// red llegan al mismo id, y el sync las funde en vez de duplicarlas. El traspaso guarda cuál usó
// (`transitWarehouseId`): uno enviado antes de I4c no la tiene y se recibe como antes.

/** Semilla del id de la bodega de tránsito de una sucursal (`IdDeterminista` / `deterministicUuidV4`). */
export function semillaDeBodegaDeTransito(locationId: string): string {
    return `warehouse:transit:${locationId}`;
}

/** Nombre de la bodega de tránsito. El nombre de bodega es único: lleva el de la sucursal. */
export function nombreDeBodegaDeTransito(nombreDeSucursal: string): string {
    return `En tránsito · ${nombreDeSucursal.trim()}`.slice(0, 100);
}

/** ¿Se puede elegir como origen o destino de un traspaso, ajuste, compra o venta? Tránsito no. */
export function esBodegaElegible(bodega: { readonly type?: WarehouseType | null }): boolean {
    return bodega.type !== 'TRANSIT';
}
