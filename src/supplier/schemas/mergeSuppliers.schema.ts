/**
 * @fileoverview «Fusionar con…» para proveedores: el gemelo del remedio de los productos repetidos.
 * @module Contracts/Supplier/Schemas/MergeSuppliers
 *
 * «Dar de alta» al importar un CFDI crea el proveedor solo —lo que hace que importar una factura no
 * cueste capturar antes al emisor—, y el precio de esa comodidad son los repetidos: el mismo
 * proveedor dos veces porque factura con dos razones sociales, o porque alguien ya lo había
 * capturado a mano con otro nombre.
 *
 * Fusionar **no borra**: las compras, cotizaciones, notas y pagos del repetido pasan al
 * superviviente, y el repetido queda inactivo apuntando a aquel. Es irreversible por diseño, así
 * que la decisión se toma **con el preview delante**.
 */

import { z } from 'zod';

export const mergeSuppliersSchema = z.object({
    /**
     * El que sobrevive. El **repetido** no viaja en el cuerpo: es el `:id` de la ruta, porque se
     * fusiona desde su propia ficha.
     */
    survivorId: z.string().uuid(),
    /** Versión OCC del superviviente, tal y como la trajo el preview. */
    survivorVersion: z.number().int().min(1),
    /** Versión OCC del repetido. */
    duplicateVersion: z.number().int().min(1),
});

/** El otro proveedor del preview: `GET /api/suppliers/:id/fusion-preview?con=<superviviente>`. */
export const mergeSuppliersPreviewQuerySchema = z.object({
    con: z.string().uuid(),
});

export type MergeSuppliersInput = z.input<typeof mergeSuppliersSchema>;
export type MergeSuppliersData = z.output<typeof mergeSuppliersSchema>;
