/**
 * @fileoverview Respuesta de paginación cursor para clientes
 * @module CustomerCursorResponse
 * @version 1.0.0
 */

import type { CustomerResponse } from './CustomerResponse';

/** Tipo reutilizado de CustomerResponse para items de lista cursor */
export type CustomerCursorItemResponse = CustomerResponse;

/**
 * Resultado de paginación cursor de clientes.
 */
export interface CursorPaginatedCustomersResult {
    /** Clientes encontrados en esta página */
    readonly items: CustomerCursorItemResponse[];
    /** Cursor para la siguiente página, null si no hay más resultados */
    readonly nextCursor: string | null;
}
