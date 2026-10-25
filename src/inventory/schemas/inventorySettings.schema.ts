/**
 * @fileoverview Configuración de Inventario de la cuenta.
 * @module Contracts/Inventory/Schemas/InventorySettings
 *
 * Un solo documento por cuenta, pero **no se guarda como documento**: viaja como claves
 * `inventory.<sección>.<campo>` del canal de settings de la cuenta (`tenant_settings`), el mismo
 * que ya llevan `purchases.*` o `ticket.*` entre la nube y el escritorio sin red. Las reglas que
 * deciden si se puede vender en negativo o qué lote sale primero tienen que ser las mismas en las
 * dos puntas, y ese canal ya resuelve el sync (último en escribir gana, **por clave**: dos personas
 * que cambian campos distintos no se pisan). Por eso no hay `version` ni `entityType` propio.
 *
 * {@link aClavesDeInventario} y {@link deClavesDeInventario} son la única traducción: el escritorio
 * las espeja en `ConfiguracionDeInventario.cs`. Un campo que falte o no valide toma su valor por
 * omisión — un escritorio viejo que no conoce un campo nuevo no rompe el documento.
 *
 * ── Costeo ──
 *
 * Solo **promedio ponderado** está implementado, en las dos puntas y con la misma regla
 * (`(occurred_at, id)`). `valuationMethod` se deja en el contrato para que el día que exista PEPS
 * no haya que migrar la forma, pero hoy el único valor aceptado es `AVERAGE`. Cambiar de método con
 * movimientos ya escritos obliga a reproyectar todo el costo: no es un interruptor.
 */

import { z } from 'zod';
import { ABC_CLASSES } from './countPlan.schema.js';
import { CLOSED_PERIOD_POLICIES, CROSS_COMPANY_TRANSFER_POLICIES } from './inventoryAccounting.schema.js';

export const INVENTORY_VALUATION_METHODS = ['AVERAGE'] as const;

/** Qué pasa cuando una salida deja la existencia bajo cero. */
export const NEGATIVE_STOCK_POLICIES = [
    /** Se permite (el POS nunca se detiene; el conteo lo corrige). Lo de hoy. */
    'ALLOW',
    /** Se permite y se avisa: alerta `NEGATIVE` y aviso en el POS. */
    'WARN',
    /** No se permite: la venta o el traspaso se detienen. No aplica al escritorio sin red. */
    'BLOCK',
] as const;
export type NegativeStockPolicy = (typeof NEGATIVE_STOCK_POLICIES)[number];

export const LOT_PICKING_POLICIES = [
    /** El que caduca primero. Lo correcto para lo perecedero. */
    'FEFO',
    /** El que entró primero. */
    'FIFO',
    /** Siempre se elige a mano. */
    'MANUAL',
] as const;
export type LotPickingPolicy = (typeof LOT_PICKING_POLICIES)[number];

export const inventorySettingsSchema = z.object({
    costing: z
        .object({
            valuationMethod: z.enum(INVENTORY_VALUATION_METHODS).default('AVERAGE'),
            /** Decimales del costo unitario (el valor total siempre a 2). */
            costDecimals: z.number().int().min(2).max(6).default(4),
        })
        .default({}),
    negativeStock: z
        .object({
            policy: z.enum(NEGATIVE_STOCK_POLICIES).default('ALLOW'),
        })
        .default({}),
    lots: z
        .object({
            pickingPolicy: z.enum(LOT_PICKING_POLICIES).default('FEFO'),
            /** Días antes de la caducidad en que un lote deja de venderse (vida útil mínima al cliente). */
            blockSaleDaysBeforeExpiry: z.number().int().min(0).max(365).default(0),
            /** Cómo se propone el número de un lote nuevo si el proveedor no trae uno. */
            autoNumberPattern: z.string().trim().max(40).default('L{AAMMDD}-{n}'),
        })
        .default({}),
    alerts: z
        .object({
            lowStock: z.boolean().default(true),
            negative: z.boolean().default(true),
            overstock: z.boolean().default(false),
            /** Avisar de caducidad con estos días de anticipación. */
            expiringDays: z.number().int().min(0).max(365).default(30),
            /** Sin movimiento en N días = inventario muerto. 0 = no avisar. */
            noMovementDays: z.number().int().min(0).max(730).default(90),
            /** A quién le llegan por correo, además de la campana. Diez: el valor de una clave cabe en 500. */
            emailUserIds: z.array(z.string().uuid()).max(10).default([]),
            /** Resumen diario en vez de uno por alerta. */
            dailyDigest: z.boolean().default(true),
        })
        .default({}),
    counts: z
        .object({
            /** Conteo ciego por defecto al abrir un conteo nuevo. */
            blindByDefault: z.boolean().default(false),
            /** Diferencia (en valor) a partir de la cual aplicar pide un segundo par de ojos. */
            approvalThresholdValue: z.number().min(0).default(0),
            /** Recontar automáticamente los renglones con diferencia antes de dejar aplicar. */
            requireRecountOnDiscrepancy: z.boolean().default(false),
        })
        .default({}),
    abc: z
        .object({
            /** Porcentaje acumulado del valor de consumo que cierra la clase A y la B (80/95 típico). */
            cutoffA: z.number().min(1).max(99).default(80),
            cutoffB: z.number().min(2).max(100).default(95),
            historyDays: z.number().int().min(30).max(730).default(180),
        })
        .default({}),
    /**
     * Contabilidad (1.19.0). Las cuentas NO se eligen aquí: cada motivo va a su hueco y el hueco se mapea en
     * Contabilidad › Cuentas del motor. Aquí solo lo que decide Inventario.
     */
    accounting: z
        .object({
            closedPeriodPolicy: z.enum(CLOSED_PERIOD_POLICIES).default('BLOCK'),
            /**
             * Hoy solo `BLOCK`: la venta entre empresas no existe aún. El enum completo se queda en
             * `inventoryAccounting.schema.ts` para no cambiar la forma el día que exista.
             */
            crossCompanyTransfers: z.enum(CROSS_COMPANY_TRANSFER_POLICIES).default('BLOCK'),
            /** Bajas por robo, caducidad o daño que pasen de este valor piden soporte fiscal. 0 = nunca. */
            requireEvidenceAboveValue: z.number().min(0).default(0),
        })
        .default({}),
    labels: z
        .object({
            defaultTemplateId: z.string().uuid().nullish(),
            /** Imprimir etiquetas al recibir una compra (propone la cantidad recibida). */
            printOnReceive: z.boolean().default(false),
        })
        .default({}),
});

/**
 * PUT /api/inventory-settings — el documento entero (se guarda clave por clave, y solo las que
 * cambiaron). Sin `version`: el canal de settings resuelve por fecha y por clave.
 */
export const updateInventorySettingsSchema = inventorySettingsSchema
    .refine((v) => v.abc.cutoffA < v.abc.cutoffB, {
        message: 'El corte de la clase A tiene que ser menor que el de la B.',
        path: ['abc', 'cutoffA'],
    })
    .refine((v) => v.accounting.crossCompanyTransfers === 'BLOCK', {
        message: 'La venta entre empresas todavía no existe: los traspasos entre empresas se impiden.',
        path: ['accounting', 'crossCompanyTransfers'],
    });

export type InventorySettings = z.infer<typeof inventorySettingsSchema>;
export type UpdateInventorySettingsRequest = z.input<typeof updateInventorySettingsSchema>;

/** Para validar cortes y frecuencias: las clases en orden. */
export const ABC_ORDER = ABC_CLASSES;

// ── El documento como claves del canal de settings ────────────────────────────────────────────

/** Prefijo de las claves. Va en `SYNCABLE_SETTING_PREFIXES` (nube) y en `SyncablePrefixes` (escritorio). */
export const INVENTORY_SETTINGS_PREFIX = 'inventory.';

/** El documento con todo por omisión: lo que rige en una cuenta que nunca abrió la configuración. */
export const INVENTORY_SETTINGS_DEFAULT: InventorySettings = inventorySettingsSchema.parse({});

type Seccion = keyof InventorySettings;
const SECCIONES = Object.keys(inventorySettingsSchema.shape) as Seccion[];

/** La forma de una sección (quitando el `.default({})` que la envuelve). */
function formaDe(seccion: Seccion): z.ZodRawShape {
    return (inventorySettingsSchema.shape[seccion] as z.ZodDefault<z.AnyZodObject>)._def.innerType.shape;
}

/** `inventory.costing.costDecimals` y similares. */
export function claveDeInventario(seccion: Seccion, campo: string): string {
    return `${INVENTORY_SETTINGS_PREFIX}${seccion}.${campo}`;
}

/**
 * El documento como claves → valor (JSON). Los campos sin valor (`defaultTemplateId` vacío) se
 * escriben como `null`, para que borrar un valor también viaje.
 */
export function aClavesDeInventario(settings: InventorySettings): Record<string, string> {
    const claves: Record<string, string> = {};
    for (const seccion of SECCIONES) {
        const valores = settings[seccion] as Record<string, unknown>;
        for (const campo of Object.keys(formaDe(seccion))) {
            claves[claveDeInventario(seccion, campo)] = JSON.stringify(valores[campo] ?? null);
        }
    }
    return claves;
}

/**
 * Las claves → el documento. Lo que falte, no sea JSON o no valide toma su valor por omisión,
 * campo por campo: una clave rota no tira la configuración entera.
 */
export function deClavesDeInventario(claves: Readonly<Record<string, string | null | undefined>>): InventorySettings {
    const crudo: Record<string, Record<string, unknown>> = {};
    for (const seccion of SECCIONES) {
        const forma = formaDe(seccion);
        const valores: Record<string, unknown> = {};
        for (const [campo, tipo] of Object.entries(forma)) {
            const texto = claves[claveDeInventario(seccion, campo)];
            if (texto == null) continue;
            let valor: unknown;
            try {
                valor = JSON.parse(texto);
            } catch {
                continue;
            }
            if (valor === null) continue;
            if ((tipo as z.ZodTypeAny).safeParse(valor).success) valores[campo] = valor;
        }
        crudo[seccion] = valores;
    }
    const doc = inventorySettingsSchema.parse(crudo);
    // Lo que el PUT no deja guardar tampoco se lee: un valor futuro escrito por otra versión no
    // enciende aquí algo que esta versión no sabe hacer.
    if (doc.accounting.crossCompanyTransfers !== 'BLOCK') doc.accounting.crossCompanyTransfers = 'BLOCK';
    if (doc.abc.cutoffA >= doc.abc.cutoffB)
        doc.abc = {
            ...doc.abc,
            cutoffA: INVENTORY_SETTINGS_DEFAULT.abc.cutoffA,
            cutoffB: INVENTORY_SETTINGS_DEFAULT.abc.cutoffB,
        };
    return doc;
}

// ── La regla de la existencia negativa ────────────────────────────────────────────────────────

/** Lo que toca hacer con una salida: seguir, seguir avisando o detenerse. */
export type ResultadoDeExistencia = 'OK' | 'WARN' | 'BLOCK';

/**
 * ¿Qué pasa si salen `sale` unidades de una existencia de `hay`? Solo cuenta si la salida deja la
 * existencia **bajo cero**; quedarse en cero es vender lo último, no vender en negativo. Espejo en
 * el escritorio: `ExistenciaNegativa.Decidir` (mismos casos en `ExistenciaNegativaTests.cs`).
 */
export function decidirExistencia(policy: NegativeStockPolicy, hay: number, sale: number): ResultadoDeExistencia {
    if (sale <= 0 || hay - sale >= 0) return 'OK';
    return policy === 'ALLOW' ? 'OK' : policy;
}

/** Un producto que la venta deja bajo cero. Cantidades en unidad base. */
export interface FaltanteDeExistencia {
    readonly productId: string;
    readonly productName: string;
    readonly hay: number;
    readonly sale: number;
}

/**
 * POST /api/pos-tickets/:id/stock-check (I3b) — lo que pasaría al cobrar este ticket. La caja lo pide
 * al abrir el cobro: `WARN` avisa y deja seguir, `BLOCK` no deja cobrar (y completar lo vuelve a
 * revisar). Con `ALLOW` no se consulta la existencia: `faltantes` va vacío. Espejo en el escritorio:
 * `RevisionDeVenta` (`RevisionDeExistencia.RevisarAsync`).
 */
export interface RevisionDeExistenciaResponse {
    readonly policy: NegativeStockPolicy;
    readonly result: ResultadoDeExistencia;
    readonly faltantes: readonly FaltanteDeExistencia[];
}

/**
 * Revisa varias salidas a la vez: se suman **por producto** (dos renglones del mismo sacan de la
 * misma existencia) y el resultado es el peor. `hay` sin el producto = 0.
 */
export function revisarSalidas(
    policy: NegativeStockPolicy,
    hay: ReadonlyMap<string, number>,
    salidas: ReadonlyArray<{
        productId: string;
        productName: string;
        cantidad: number;
    }>,
): RevisionDeExistenciaResponse {
    if (policy === 'ALLOW') return { policy, result: 'OK', faltantes: [] };
    const porProducto = new Map<string, { productName: string; sale: number }>();
    for (const s of salidas) {
        const p = porProducto.get(s.productId);
        porProducto.set(s.productId, {
            productName: p?.productName ?? s.productName,
            sale: (p?.sale ?? 0) + s.cantidad,
        });
    }
    const faltantes: FaltanteDeExistencia[] = [];
    for (const [productId, { productName, sale }] of porProducto) {
        const h = hay.get(productId) ?? 0;
        if (decidirExistencia(policy, h, sale) !== 'OK') faltantes.push({ productId, productName, hay: h, sale });
    }
    return { policy, result: faltantes.length > 0 ? policy : 'OK', faltantes };
}
