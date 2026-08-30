/**
 * @fileoverview Zod schema para duplicar una compra.
 *
 * Duplicar produce un **borrador nuevo**: folio nuevo de la serie de la web, sin
 * arrastrar estado, ni fecha de recepción, ni motivo de cancelación, ni los datos
 * del comprobante del proveedor (el CFDI es de la compra original, no de la copia).
 * Se copian proveedor, bodega, sucursal, naturaleza, uso CFDI, divisa, notas y los
 * renglones.
 *
 * Es la salida natural de una compra cancelada y el atajo del pedido recurrente, y
 * hasta ahora no existía en ninguna de las dos plataformas.
 *
 * @module Contracts/Purchase
 */

import { z } from 'zod';

/**
 * POST /api/purchases/:id/duplicate
 *
 * El id del borrador nuevo lo pone el cliente (identidad en origen), igual que al
 * crear. El id de origen va en la URL.
 */
export const duplicatePurchaseSchema = z
    .object({
        /** Id del borrador que se va a crear. */
        id: z.string().uuid({ message: 'El ID debe ser un UUID válido' }),
    })
    .strict();

export type DuplicatePurchaseRequest = z.infer<typeof duplicatePurchaseSchema>;
