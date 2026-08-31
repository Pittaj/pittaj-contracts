/**
 * @fileoverview «Complementos que te deben»: facturas PPD sin su REP.
 * @module Contracts/ReceivedCfdi/Responses/RepPendientes
 *
 * ── Por qué esto es una pantalla y no una columna ──
 *
 * Una factura **PPD** (pago en parcialidades o diferido) no acredita su IVA con la factura: lo
 * acredita con el **complemento de pago** que el proveedor emite cada vez que le pagas. Sin REP,
 * ese IVA no existe para el SAT por mucho que el dinero haya salido de tu cuenta.
 *
 * Y el complemento que no llega **no avisa**. Nadie vuelve a mirar una factura que ya pagó, así que
 * el hueco se descubre meses después, con la declaración presentada. Esta lista existe para que se
 * descubra el mismo mes.
 */

/** Un REP que sí llegó, con lo que dice cubrir de esta factura. */
export interface RepRecibidoResponse {
    /** Id del comprobante REP en el buzón. */
    readonly cfdiId: string;
    readonly uuid: string;
    readonly folioDisplay: string;
    readonly fechaPago: string | null;
    readonly numParcialidad: string | null;
    readonly impPagado: number;
    /** Lo que el emisor declara que queda por pagar DESPUÉS de este pago. */
    readonly impSaldoInsoluto: number;
}

/** Una factura PPD y su situación de complementos. */
export interface RepPendienteResponse {
    readonly cfdiId: string;
    readonly uuid: string;
    readonly issuerName: string;
    readonly issuerRfc: string;
    readonly folioDisplay: string;
    readonly issuedAt: string | null;
    readonly total: number;
    /** El IVA que no se acredita mientras no llegue el complemento. Es el número que mueve. */
    readonly trasladoIva: number;

    /**
     * Cuánto llevan cubierto los REP que sí llegaron.
     *
     * **Derivado**, no guardado: es la suma de los renglones de complemento (§4 del mandato). Cero
     * cuando no ha llegado ninguno, que es el caso que la pantalla existe para enseñar.
     */
    readonly cubierto: number;
    /** Días desde que se emitió la factura. Ordena la lista: lo viejo primero. */
    readonly diasDesdeEmision: number;

    /** Si ya se capturó como compra, cuál. Vacío si solo está en el buzón. */
    readonly compra: { readonly id: string; readonly purchaseNumber: string } | null;

    /** Los complementos que sí llegaron. Vacío = te deben el primero. */
    readonly reps: readonly RepRecibidoResponse[];
}

export interface GetRepPendientesResponse {
    readonly items: readonly RepPendienteResponse[];
    /** Cuántas facturas PPD siguen sin ningún complemento. */
    readonly sinNingunRep: number;
    /**
     * IVA que no puedes acreditar mientras no lleguen.
     *
     * Es la cifra de la pantalla. «Te faltan 7 complementos» no mueve a nadie; «hay $18,430 de IVA
     * que no vas a poder acreditar este mes» sí.
     */
    readonly ivaEnEspera: number;
}
