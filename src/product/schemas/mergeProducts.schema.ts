/**
 * @fileoverview «Fusionar con…»: el remedio de los productos repetidos.
 * @module Contracts/Product/Schemas/MergeProducts
 *
 * Decisión del 2026-09-22 («todo lo automático se deshace»): «Dar de alta» al convertir un CFDI es
 * lo que hace que importar una factura de 200 renglones no cueste 200 clics, y el precio de esa
 * comodidad son los repetidos — el mismo azúcar dado de alta dos veces porque dos proveedores lo
 * escriben distinto. Fusionar es el remedio, y sin él la automatización no se puede defender.
 *
 * Fusionar **no borra**: el duplicado queda inactivo, apuntando al superviviente. Todo lo que
 * colgaba de él —existencias, compras, ventas, alias, traspasos, producción— pasa a apuntar al que
 * sobrevive, y el kárdex enseña el movimiento del traslado con su motivo. Es irreversible por
 * diseño: deshacer una fusión sería rehacer a ciegas un reparto que ya nadie recuerda, así que la
 * decisión se toma **con el preview delante**, no después.
 */

import { z } from 'zod';

export const mergeProductsSchema = z
    .object({
        /**
         * El que sobrevive: el que se queda con todo.
         *
         * El **duplicado** no viaja en el cuerpo: es el `:id` de la ruta, porque se fusiona desde
         * su propia ficha. Mandarlo dos veces solo abre la puerta a que discrepen.
         */
        survivorId: z.string().uuid(),
        /** Versión OCC del superviviente, tal y como la trajo el preview. */
        survivorVersion: z.number().int().min(1),
        /** Versión OCC del duplicado. */
        duplicateVersion: z.number().int().min(1),
        /**
         * El código de barras del duplicado pasa al superviviente. Solo cabe cuando el
         * superviviente no tiene uno propio: la columna es única, y dos códigos no caben en un
         * producto.
         */
        moverCodigoDeBarras: z.boolean().optional().default(false),
        /** Quién fusiona: queda en la nota del duplicado y en el kárdex. */
        userName: z.string().trim().max(120).optional(),
    });

/** El otro producto del preview: `GET /api/products/:id/fusion-preview?con=<superviviente>`. */
export const mergeProductsPreviewQuerySchema = z.object({
    con: z.string().uuid(),
});

export type MergeProductsInput = z.input<typeof mergeProductsSchema>;
export type MergeProductsData = z.output<typeof mergeProductsSchema>;
