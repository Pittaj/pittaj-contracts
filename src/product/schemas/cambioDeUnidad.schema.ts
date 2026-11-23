/**
 * @fileoverview U-T3 · POST /api/products/:id/cambiar-unidad — el asistente de cambio de unidad de
 * inventario. Pide el conteo físico en la unidad nueva; ver `cambiarUnidadDeInventario`.
 */
import { z } from 'zod';

export const cambiarUnidadDeInventarioSchema = z.object({
    /** La alterna que pasa a ser la unidad de inventario. */
    nuevaBase: z.string().trim().min(1).max(50),
    /** Cómo se llamará la unidad de ahora, que queda como alterna («Kilo»). */
    etiquetaVieja: z.string().trim().min(1).max(50),
    /** La unidad de medida de la nueva base (pieza, kilo…). */
    unitOfMeasure: z.enum(['UNIT', 'KG', 'LT', 'MT', 'BOX', 'PACK']),
    /** Lo contado en la unidad NUEVA, por bodega. */
    contado: z.record(z.string().uuid(), z.number().positive().max(100_000_000)),
    /** Concurrencia optimista: la versión del producto que vio quien cambia. */
    version: z.number().int().positive().optional(),
});

export type CambiarUnidadDeInventarioRequest = z.infer<typeof cambiarUnidadDeInventarioSchema>;
