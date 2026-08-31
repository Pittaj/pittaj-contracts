/**
 * @fileoverview Avisos del buzón: lo que pide una decisión y se puede cerrar.
 * @module Contracts/ReceivedCfdi/Responses/CfdiAlert
 *
 * ── Qué es un aviso y qué no ──
 *
 * No es una notificación. Una notificación se lee y se va; un aviso **se cierra**, y quien lo
 * cerró y por qué queda escrito. Esa diferencia es todo el módulo: el día que el SAT pregunte por
 * una factura cancelada que ya se dedujo, la nota de quien la revisó vale más que cualquier
 * reconstrucción.
 *
 * ── Y por qué cada aviso lleva un importe ──
 *
 * Porque «te cancelaron A-14882» no mueve a nadie, y «te cancelaron la factura de una compra que
 * ya está en tu inventario, y son $3,336.63 de IVA» sí. Un aviso que solo dice qué pasó, sin decir
 * cuánto está en juego, se lee y se deja pasar.
 */

/** De qué avisa. */
export const CFDI_ALERT_KINDS = [
    /**
     * Cancelado en el SAT y **ya convertido en documento nuestro**. El caso caro: la deducción y
     * el IVA acreditado se apoyan en un comprobante que dejó de existir.
     */
    'CFDI_CANCELADO_YA_CAPTURADO',
    /**
     * El emisor aparece en la lista del 69-B (empresas que facturan operaciones simuladas). Sus
     * comprobantes pueden estar impecables y vigentes y aun así no amparar nada.
     */
    'EMISOR_EN_69B',
    /**
     * El barrido del SAT lleva días sin correr. Es de otra naturaleza que los dos anteriores: no
     * es un problema con un proveedor, es que **el buzón está ciego** — y entonces los demás
     * cajones mienten por omisión, que es la peor forma de mentir en una pantalla que se usa para
     * decidir.
     */
    'BARRIDO_SAT_ATRASADO',
] as const;

export type CfdiAlertKind = (typeof CFDI_ALERT_KINDS)[number];

export const CFDI_ALERT_SEVERITIES = ['ALTA', 'MEDIA', 'BAJA'] as const;
export type CfdiAlertSeverity = (typeof CFDI_ALERT_SEVERITIES)[number];

/**
 * Las dos formas de que un aviso deje de estar abierto, y las dos importan.
 *
 * `REVIEWED` — alguien lo miró y anotó qué pasó.
 * `AUTO_RESOLVED` — dejó de ser cierto: el barrido volvió a correr, el proveedor salió de la
 * lista. Se dice que se resolvió solo en vez de dejarlo desaparecer sin que nadie sepa si se
 * atendió o se evaporó.
 */
export const CFDI_ALERT_STATUSES = ['OPEN', 'REVIEWED', 'AUTO_RESOLVED'] as const;
export type CfdiAlertStatus = (typeof CFDI_ALERT_STATUSES)[number];

/** A qué lleva el «ver» del aviso. */
export const CFDI_ALERT_SUBJECTS = ['RECEIVED_CFDI', 'SUPPLIER', 'SAT_SWEEP'] as const;
export type CfdiAlertSubject = (typeof CFDI_ALERT_SUBJECTS)[number];

export interface CfdiAlertResponse {
    readonly id: string;
    readonly kind: CfdiAlertKind;
    readonly severity: CfdiAlertSeverity;
    readonly status: CfdiAlertStatus;

    /** El titular, en una línea. */
    readonly title: string;
    /** Qué documento afecta y cuánto dinero está en juego, ya redactado. */
    readonly detail: string;

    readonly subjectKind: CfdiAlertSubject;
    /** Id del comprobante, o RFC del emisor. Nulo para el barrido. */
    readonly subjectId: string | null;
    /** Lo que había en juego cuando se levantó. Foto, no saldo: no se recalcula. */
    readonly amount: number;

    readonly firstSeenAt: string;
    readonly lastSeenAt: string;
    readonly closedAt: string | null;
    readonly reviewedBy: string | null;
    /** Qué pasó, en palabras de quien lo revisó. */
    readonly note: string | null;
}

export interface GetCfdiAlertsResponse {
    readonly items: readonly CfdiAlertResponse[];
    /** Cuántos siguen abiertos, en todo el buzón. Es el número de la pestaña. */
    readonly abiertos: number;
    /** Cuántos se han cerrado alguna vez. Para ofrecer «ver atendidos» solo si hay qué ver. */
    readonly atendidos: number;

    /**
     * El vacío bueno.
     *
     * Un «no hay avisos» a secas es indistinguible de un barrido que no corrió, y esa duda es
     * justo la que este módulo existe para quitar. Así que cuando no hay nada que revisar, la
     * pantalla dice **cuántos comprobantes se miraron y hasta cuándo estás cubierto**.
     */
    readonly comprobantesRevisados: number;
    readonly cubiertoHasta: string | null;
}
