/**
 * @fileoverview (2.88.0) Configuración de Producción de la cuenta.
 * @module Contracts/Production/Schemas/ProductionSettings
 *
 * Mismo canal que la de Inventario: no se guarda como documento, viaja como claves
 * `production.<sección>.<campo>` de `tenant_settings`, que ya resuelven el sync entre la nube y el
 * escritorio sin red (último en escribir gana, **por clave**). Por eso no hay `version`.
 *
 * Solo lleva lo que cambia una conducta en las dos puntas:
 * - `orders.defaultWarehouseId`: la bodega que propone una orden nueva y abre Producción del día.
 * - `orders.requireRelease`: terminar solo órdenes liberadas (las que ya apartaron sus insumos).
 * - `tolerances.*`: los umbrales con los que Rendimiento y Merma de producción marcan una fila.
 * - `daily.suggestFromStockLevels`: si Producción del día sugiere qué producir.
 *
 * {@link aClavesDeProduccion} y {@link deClavesDeProduccion} son la única traducción; el escritorio
 * las espeja en `ConfiguracionDeProduccion.cs`. Un campo que falte o no valide toma su valor por
 * omisión, campo por campo.
 */

import { z } from 'zod';

export const productionSettingsSchema = z.object({
    orders: z
        .object({
            /** La bodega de producción predeterminada. Nula = la que el usuario elija. */
            defaultWarehouseId: z.string().uuid().nullish(),
            /**
             * Terminar solo órdenes liberadas. Una orden en borrador no tiene sus insumos apartados:
             * terminarla directo puede tomar lo que otra orden liberada ya esperaba.
             */
            requireRelease: z.boolean().default(false),
        })
        .default({}),
    tolerances: z
        .object({
            /** Rendimiento (obtenido ÷ planeado) por debajo del cual la orden se marca. En %. */
            minYieldPercent: z.number().min(0).max(100).default(95),
            /** Sobreconsumo de un insumo contra su receta por encima del cual se marca. En %. */
            maxOverconsumptionPercent: z.number().min(0).max(100).default(5),
        })
        .default({}),
    daily: z
        .object({
            /** Producción del día sugiere qué producir con los niveles de existencia de la bodega. */
            suggestFromStockLevels: z.boolean().default(true),
        })
        .default({}),
});

/** PUT /api/production-settings — el documento entero (se guarda solo lo que cambió). */
export const updateProductionSettingsSchema = productionSettingsSchema;

export type ProductionSettings = z.infer<typeof productionSettingsSchema>;
export type UpdateProductionSettingsRequest = z.input<typeof updateProductionSettingsSchema>;

/** GET /api/production-settings. `updatedAt` = la clave más reciente. */
export interface ProductionSettingsResponse extends ProductionSettings {
    readonly updatedAt: string | null;
}

/** Prefijo de las claves. Va en `SYNCABLE_SETTING_PREFIXES` (nube) y en `SyncablePrefixes` (escritorio). */
export const PRODUCTION_SETTINGS_PREFIX = 'production.';

/** El documento con todo por omisión. */
export const PRODUCTION_SETTINGS_DEFAULT: ProductionSettings = productionSettingsSchema.parse({});

type Seccion = keyof ProductionSettings;
const SECCIONES = Object.keys(productionSettingsSchema.shape) as Seccion[];

function formaDe(seccion: Seccion): z.ZodRawShape {
    return (productionSettingsSchema.shape[seccion] as z.ZodDefault<z.AnyZodObject>)._def.innerType.shape;
}

/** `production.orders.requireRelease` y similares. */
export function claveDeProduccion(seccion: Seccion, campo: string): string {
    return `${PRODUCTION_SETTINGS_PREFIX}${seccion}.${campo}`;
}

/** El documento como claves → valor (JSON). Lo vacío se escribe `null`, para que borrar también viaje. */
export function aClavesDeProduccion(settings: ProductionSettings): Record<string, string> {
    const claves: Record<string, string> = {};
    for (const seccion of SECCIONES) {
        const valores = settings[seccion] as Record<string, unknown>;
        for (const campo of Object.keys(formaDe(seccion))) {
            claves[claveDeProduccion(seccion, campo)] = JSON.stringify(valores[campo] ?? null);
        }
    }
    return claves;
}

/** Las claves → el documento. Lo que falte, no sea JSON o no valide toma su valor por omisión. */
export function deClavesDeProduccion(claves: Readonly<Record<string, string | null | undefined>>): ProductionSettings {
    const crudo: Record<string, Record<string, unknown>> = {};
    for (const seccion of SECCIONES) {
        const valores: Record<string, unknown> = {};
        for (const [campo, tipo] of Object.entries(formaDe(seccion))) {
            const texto = claves[claveDeProduccion(seccion, campo)];
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
    return productionSettingsSchema.parse(crudo);
}
