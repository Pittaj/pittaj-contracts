/**
 * @fileoverview Lo que piden las sucursales.
 * @module Contracts/Purchase/Responses/PurchaseRequest
 *
 * La **petición humana**: la sucursal dice «me estoy quedando sin aceite» y la oficina resuelve.
 * Hoy eso vive en WhatsApp, y con dos sucursales ya es un problema real.
 *
 * Muchas se resuelven **sin comprar**, porque el producto ya está en la otra bodega — por eso el
 * traspaso está al mismo nivel que la compra y no escondido.
 */

/** `PENDIENTE` está esperando · `ATENDIDA` se resolvió · `RECHAZADA` alguien dijo que no. */
export const PURCHASE_REQUEST_STATUSES = ['PENDIENTE', 'ATENDIDA', 'RECHAZADA'] as const;
export type PurchaseRequestStatusType = (typeof PURCHASE_REQUEST_STATUSES)[number];

export const PURCHASE_REQUEST_RESOLUTIONS = ['TRANSFER', 'PURCHASE'] as const;
export type PurchaseRequestResolutionType = (typeof PURCHASE_REQUEST_RESOLUTIONS)[number];

export interface PurchaseRequestLineResponse {
    readonly id: string;
    readonly productId: string;
    readonly productName: string;
    readonly quantity: number;
    /**
     * Cuánto hay del producto en OTRAS bodegas.
     *
     * Es la columna que ahorra dinero de verdad, y sale de un dato que ya existe: si hay existencia
     * en otra bodega, comprar es tirar el dinero dos veces. Hoy nadie lo mira porque nadie tiene
     * las dos existencias delante al leer el mensaje.
     */
    readonly existenciaEnOtras: number;
    /** La bodega con más existencia de ese producto, para no tener que buscarla. */
    readonly mejorBodegaId: string | null;
    readonly mejorBodegaNombre: string | null;
}

export interface PurchaseRequestResponse {
    readonly id: string;
    readonly requestNumber: string;
    readonly status: PurchaseRequestStatusType;

    readonly requestedByName: string | null;
    readonly locationId: string | null;
    readonly locationName: string | null;
    /** «ya no tenemos nada»: lo que explica la urgencia y que ninguna cifra dice. */
    readonly note: string | null;

    readonly rejectedReason: string | null;
    readonly resolvedKind: PurchaseRequestResolutionType | null;
    readonly resolvedDocId: string | null;
    readonly resolvedDocNumber: string | null;
    readonly resolvedAt: string | null;

    readonly createdAt: string;
    readonly lines: readonly PurchaseRequestLineResponse[];

    /**
     * Con qué se puede resolver: `TRANSFER` si hay existencia en otra bodega, `PURCHASE` si no.
     *
     * Es una **sugerencia derivada**, no un estado: se recalcula en cada lectura porque la
     * existencia de la otra bodega cambia mientras la petición espera.
     */
    readonly sugerencia: PurchaseRequestResolutionType;
}

export interface GetPurchaseRequestsResponse {
    readonly items: readonly PurchaseRequestResponse[];
    readonly pendientes: number;
    /** Cuántas de las pendientes se pueden resolver con lo que ya hay en otra bodega. */
    readonly resolublesConTraspaso: number;
}
