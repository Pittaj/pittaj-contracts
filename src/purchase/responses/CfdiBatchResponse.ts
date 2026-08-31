/**
 * @fileoverview Respuestas de la conversión en lote de comprobantes a compras.
 * @module Contracts/Purchase/Responses/CfdiBatch
 */

/**
 * Por qué un comprobante no puede convertirse solo.
 *
 * No son errores: son decisiones que le tocan al usuario. La pantalla las enseña para que las
 * resuelva o las deje para después, y el lote sigue adelante con el resto.
 */
export const MOTIVOS_DE_ATENCION = [
    /** Conceptos que nunca se le habían comprado a ese emisor y no emparejan con ningún producto. */
    'CONCEPTOS_SIN_EMPAREJAR',
    /** El RFC del emisor no corresponde a ningún proveedor dado de alta. */
    'PROVEEDOR_DESCONOCIDO',
    /**
     * Ya existe una compra con ese mismo comprobante.
     *
     * 🔴 Es el que evita el desastre callado: sin esta comprobación, el lote duplica una compra
     * que alguien capturó a mano la semana pasada y el inventario acaba con mercancía que nunca
     * llegó. Se detecta por UUID y por folio del proveedor.
     */
    'YA_CAPTURADO',
    /** El comprobante ya no está en «sin capturar»: alguien lo vinculó o lo descartó. */
    'NO_ESTA_PENDIENTE',
] as const;

export type MotivoDeAtencion = (typeof MOTIVOS_DE_ATENCION)[number];

/**
 * Un concepto del comprobante, ya resuelto por el servidor.
 *
 * La vista previa los devuelve **listos para mandarse de vuelta** en la conversión. Podría no
 * hacerlo y obligar al cliente a emparejar comprobante por comprobante contra `/cfdi-match`, pero
 * eso son cien peticiones para un lote de cien y, peor, abre la puerta a que lo que se convierte
 * no sea lo que la pantalla enseñó.
 */
export interface CfdiBatchResolvedConcepto {
    readonly conceptoKey: string;
    readonly claveProdServ: string;
    readonly claveUnidad: string | null;
    readonly noIdentificacion: string | null;
    readonly descripcion: string;
    readonly cantidad: number;
    readonly valorUnitario: number;
    readonly importe: number;
    readonly descuento: number;
    readonly taxRate: number;

    readonly productId: string | null;
    /** Con qué se emparejó, para poder explicarlo en la pantalla. */
    readonly matchedProductName: string | null;
    readonly isDocumentCharge: boolean;
    readonly createProduct: boolean;
}

/** Un comprobante del lote, ya evaluado. */
export interface CfdiBatchPreviewItem {
    readonly cfdiId: string;
    readonly uuid: string;
    readonly issuerName: string;
    readonly issuerRfc: string;
    readonly folio: string | null;
    readonly issuedAt: string;
    readonly total: number;

    /** El proveedor que corresponde al RFC, si existe. */
    readonly supplierId: string | null;
    readonly supplierName: string | null;

    readonly conceptos: number;
    readonly emparejados: number;
    readonly sinEmparejar: number;
    /** Conceptos que no son un producto (flete, maniobras): entran como cargo del documento. */
    readonly cargos: number;

    /**
     * Naturaleza sugerida, no decidida.
     *
     * Si ninguno de sus conceptos empareja con un producto y el emisor nunca te ha vendido
     * mercancía, lo más probable es que sea un gasto. Se dice para que no sorprenda; el usuario
     * puede cambiarlo.
     */
    readonly kindSugerido: 'INVENTORY' | 'EXPENSE';

    /** Vacío = se convierte solo. Con algo dentro = pide una decisión. */
    readonly motivos: readonly MotivoDeAtencion[];
    /** Si el motivo es `YA_CAPTURADO`, la compra que ya lo ampara. */
    readonly compraExistente: { readonly id: string; readonly purchaseNumber: string } | null;

    /** Los conceptos ya resueltos, tal cual hay que devolverlos para convertir. */
    readonly conceptosResueltos: readonly CfdiBatchResolvedConcepto[];
}

export interface CfdiBatchPreviewResponse {
    readonly items: readonly CfdiBatchPreviewItem[];
    /** Cuántos se crean sin que nadie toque nada. */
    readonly listos: number;
    /** Cuántos piden una decisión. */
    readonly conAtencion: number;
    readonly conceptosTotales: number;
    readonly conceptosEmparejados: number;
    /** Suma de los que están listos: lo que de verdad se va a crear. */
    readonly importeListos: number;
    /**
     * Conceptos distintos que habría que dar de alta como producto.
     *
     * Es el número que decide si conviene encender «dar de alta los faltantes»: tres es una
     * factura con novedades, ciento veinte es un catálogo que se va a llenar de basura.
     */
    readonly productosPorCrear: number;
}

/** Qué pasó con cada comprobante del lote. */
export interface CfdiBatchResultItem {
    readonly cfdiId: string;
    readonly uuid: string;
    readonly issuerName: string;
    /** Presente si se creó. */
    readonly purchaseId: string | null;
    readonly purchaseNumber: string | null;
    readonly total: number;
    /** Vacío si se creó; si no, por qué se quedó fuera. */
    readonly motivos: readonly MotivoDeAtencion[];
    /** El detalle legible cuando el comprobante falló por algo que no es una decisión del usuario. */
    readonly error: string | null;
}

export interface CreatePurchasesFromCfdiBatchResponse {
    readonly items: readonly CfdiBatchResultItem[];
    readonly creadas: number;
    readonly omitidos: number;
    /** Suma de las compras creadas. */
    readonly importeCreado: number;
    /**
     * Equivalencias concepto→producto aprendidas en este lote.
     *
     * Se devuelve porque se enseña: es lo que convence a alguien de emparejar bien la primera
     * vez, al ver que el mes siguiente hay menos excepciones.
     */
    readonly equivalenciasAprendidas: number;
}
