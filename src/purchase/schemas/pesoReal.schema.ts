/**
 * @fileoverview U-T4 · GET /api/purchases/peso-real?productId=… — lo que de verdad trae cada
 * proveedor de un producto con unidad variable (ver `pesoRealPorProveedor`).
 */
import { z } from 'zod';

export const pesoRealQuerySchema = z.object({
    productId: z.string().uuid(),
    /** Desde (`YYYY-MM-DD`); por omisión, 180 días atrás. */
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type PesoRealQuery = z.infer<typeof pesoRealQuerySchema>;
