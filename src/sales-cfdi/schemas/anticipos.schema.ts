/**
 * @fileoverview D7h · Los CFDI de los anticipos de un apartado (Anexo 20, apéndice 6, procedimiento
 * con CFDI de egreso).
 * @module Contracts/SalesCfdi
 *
 * 1. **Anticipo** (D7h2): por cada abono que el cliente pida facturar, un Ingreso con el concepto
 *    `84111506` «Anticipo del bien o servicio», unidad `ACT`, `PUE` y la forma de pago real del
 *    abono. Sus impuestos: la proporción del abono sobre el total del apartado.
 * 2. **La venta** (D7h3): al facturar la venta de la liquidación, el CFDI lleva la relación `07`
 *    a los anticipos y forma de pago `30` («aplicación de anticipos»).
 * 3. **La aplicación** (D7h3): enseguida, un Egreso con relación `07` a esa factura, concepto
 *    `84111506` «Aplicación de anticipo», forma `30`, `PUE` y uso `G02`, por lo facturado como
 *    anticipo. Lo timbra la nube sola, en el mismo acto de facturar la venta.
 */
import { z } from 'zod';
import { stampReceptorSchema } from './saleCfdi.schema.js';

export const CLAVE_PROD_SERV_ANTICIPO = '84111506';
export const TIPO_RELACION_ANTICIPO = '07';
export const FORMA_PAGO_APLICACION_DE_ANTICIPOS = '30';

/** `POST /api/sales-cfdi/anticipos/:paymentId/stamp` — factura un abono de apartado. */
export const stampAnticipoSchema = z.object({
    /** El receptor capturado; si no viene, el cliente del apartado. Todo-o-nada, como en la venta. */
    receptor: stampReceptorSchema.optional(),
});
export type StampAnticipoInput = z.infer<typeof stampAnticipoSchema>;

/** Un CFDI de anticipo o de aplicación, como quedó. */
export interface CfdiDeAnticipoResponse {
    readonly id: string;
    readonly tipo: 'ANTICIPO' | 'APLICACION';
    /** PENDING | STAMPED | FAILED | CANCELLED. */
    readonly status: string;
    readonly uuid: string | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly formaPago: string;
    readonly receptorRfc: string | null;
    readonly base: number | null;
    readonly iva: number | null;
    readonly total: number | null;
    readonly stampedAt: string | null;
    readonly lastError: string | null;
}

/** `GET /api/sales-cfdi/anticipos/:layawayId` — los abonos de un apartado y lo facturado. */
export interface AnticiposDelApartadoResponse {
    readonly layawayId: string;
    readonly folio: string;
    readonly total: number;
    /** Qué parte de cada peso del apartado es IVA (0 si es un apartado sin snapshot fiscal). */
    readonly proporcionDeIva: number;
    readonly abonos: ReadonlyArray<{
        readonly paymentId: string;
        readonly amount: number;
        readonly occurredAt: string;
        readonly paymentMethodName: string | null;
        /** c_FormaPago con que se facturaría. */
        readonly formaPago: string;
        readonly cfdi: CfdiDeAnticipoResponse | null;
    }>;
    /** El Egreso de aplicación, cuando la venta ya se facturó. */
    readonly aplicacion: CfdiDeAnticipoResponse | null;
}

export interface StampAnticipoResult {
    readonly status: 'stamped' | 'failed' | 'blocked';
    readonly uuid: string | null;
    readonly total?: number;
    readonly message?: string;
    /** `extra-stamps-consent-required` pide aceptar el cobro de timbres extra. */
    readonly reason?: string;
    readonly error?: string | null;
}
