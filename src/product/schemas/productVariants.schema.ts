/**
 * @fileoverview Variantes (talla × color) y componentes de kit/combo.
 * @module Contracts/Product/Schemas/ProductVariants
 *
 * ── Una variante es un producto ──
 *
 * El producto `VARIABLE` es la **plantilla** (nombre, categoría, impuestos, atributos que
 * varían); cada combinación —«Playera básica · M · Negro»— es un producto hijo con su propio id,
 * código, código de barras, precio y **existencia**. Así el kárdex, los traspasos, los conteos y
 * la venta no tienen que saber que existen variantes: mueven un `productId` como siempre. Es lo
 * que hacen Shopify, Odoo y Lightspeed, y la razón es esa.
 *
 * El padre no tiene existencia propia: su «existencia» es la suma de sus hijas (derivada).
 *
 * ── Kit y combo ──
 *
 * - `KIT` — se arma **antes** de vender y se guarda armado (canasta navideña): tiene existencia
 *   propia; armarlo consume componentes (movimiento `PRODUCTION`, como una orden de producción
 *   de una sola línea) y desarmarlo los devuelve.
 * - `COMBO` — se arma **al vender** (hamburguesa + refresco): no tiene existencia; la venta
 *   descuenta cada componente.
 *
 * La receta de manufactura (BOM con mermas, rutas y costos indirectos) vive en Producción; los
 * componentes de aquí son la versión simple para retail.
 */

import { z } from 'zod';
import { PRODUCT_CONSTANTS } from '../constants/index.js';

const { LIMITS } = PRODUCT_CONSTANTS;

/** Un atributo que varía y sus valores, en el orden en que se muestran. */
export const variantAttributeSchema = z.object({
    /** «Talla», «Color», «Sabor». */
    name: z.string().trim().min(1).max(40),
    values: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
});
export type VariantAttributeInput = z.infer<typeof variantAttributeSchema>;

/** Una combinación concreta. Las llaves de `values` son los nombres de los atributos del padre. */
const variantSchema = z
    .object({
        /** Id del producto hijo (identidad en origen). */
        id: z.string().uuid(),
        values: z.record(z.string().min(1).max(40), z.string().min(1).max(40)),
        code: z.string().trim().min(LIMITS.MIN_CODE_LENGTH).max(LIMITS.MAX_CODE_LENGTH),
        sku: z.string().trim().max(LIMITS.MAX_SKU_LENGTH).nullish(),
        barcode: z.string().trim().max(LIMITS.MAX_BARCODE_LENGTH).nullish(),
        /** Nulo = hereda el del padre. */
        salePrice: z.number().min(0).nullish(),
        costPrice: z.number().min(0).nullish(),
        /** Apagar una combinación que no se maneja (no hay «XL rosa») sin borrarla. */
        active: z.boolean().optional().default(true),
    })
    .strict();
export type ProductVariantInput = z.infer<typeof variantSchema>;

/**
 * PUT /api/products/:id/variants — la matriz entera del padre.
 * Una variante que desaparece de la lista **se archiva**, no se borra: tiene historial.
 */
export const saveProductVariantsSchema = z
    .object({
        attributes: z.array(variantAttributeSchema).min(1).max(3),
        variants: z.array(variantSchema).min(1).max(LIMITS.MAX_VARIANTS),
        version: z.number().int().min(0),
    })
    .superRefine((v, ctx) => {
        const nombres = v.attributes.map((a) => a.name);
        const vistas = new Set<string>();
        v.variants.forEach((variant, i) => {
            const llave = nombres.map((n) => variant.values[n] ?? '').join('|');
            if (nombres.some((n) => !variant.values[n])) {
                ctx.addIssue({ code: 'custom', path: ['variants', i, 'values'], message: 'Falta el valor de un atributo.' });
            }
            if (vistas.has(llave)) {
                ctx.addIssue({ code: 'custom', path: ['variants', i], message: 'Esa combinación ya está.' });
            }
            vistas.add(llave);
        });
    });

/** POST /api/products/:id/variants/generate — propone la matriz (no guarda). */
export const generateProductVariantsSchema = z.object({
    attributes: z.array(variantAttributeSchema).min(1).max(3),
    /** Patrón del código: `{padre}-{Talla}-{Color}`. */
    codePattern: z.string().trim().max(60).optional().default('{padre}-{1}-{2}'),
});

export const KIT_ASSEMBLY_MODES = ['PREASSEMBLED', 'ON_SALE'] as const;
export type KitAssemblyMode = (typeof KIT_ASSEMBLY_MODES)[number];

/** PUT /api/products/:id/components — los componentes de un KIT o COMBO. */
export const saveProductComponentsSchema = z.object({
    components: z
        .array(
            z
                .object({
                    productId: z.string().uuid(),
                    productName: z.string().trim().min(1).max(200),
                    /** Presentación del componente (unidad alterna); nula = unidad base. */
                    unitId: z.string().uuid().nullish(),
                    quantity: z.number().positive(),
                    /** Combo: el cliente puede cambiarlo por otro del mismo grupo (refresco por agua). */
                    substituteGroup: z.string().trim().max(40).nullish(),
                })
                .strict()
        )
        .min(1)
        .max(LIMITS.MAX_COMPONENTS),
    version: z.number().int().min(0),
});

/**
 * POST /api/kits/:id/assemble — armar (o desarmar con `quantity` negativa) N kits.
 * Escribe salida de componentes y entrada del kit al costo sumado, con un folio propio.
 */
export const assembleKitSchema = z.object({
    id: z.string().uuid(),
    warehouseId: z.string().uuid(),
    quantity: z.number().refine((q) => q !== 0, 'Armar cero no arma nada'),
    note: z.string().trim().max(500).nullish(),
    actorName: z.string().trim().max(200).nullish(),
});

export type SaveProductVariantsRequest = z.infer<typeof saveProductVariantsSchema>;
export type GenerateProductVariantsRequest = z.infer<typeof generateProductVariantsSchema>;
export type SaveProductComponentsRequest = z.infer<typeof saveProductComponentsSchema>;
export type AssembleKitRequest = z.infer<typeof assembleKitSchema>;
