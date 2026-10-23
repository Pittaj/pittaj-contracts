/**
 * @fileoverview F3.3 · Los libros de la plataforma: la cobranza de Pittaj (suscripciones y paquetes de
 * timbres que factura billing) entra sola a la contabilidad de Pittaj como ventas sin caja.
 * @module Contracts/PlatformBooks
 *
 * **Billing no emite eventos** y el backend no tiene bus, así que el puente es un **conciliador
 * idempotente**: barre lo de billing que todavía no está en los libros y lo escribe, con una tabla de
 * vínculos `origen → documento` como candado. Corre cada noche y se dispara a mano desde el
 * backoffice. Si algo falla, la siguiente pasada lo repone; billing nunca se entera.
 *
 * - Factura de suscripción o paquete de timbres **pagado y timbrado** → venta sin caja con su CFDI
 *   **registrado** (el XML que timbró billing; no se gasta otro timbre).
 * - Cada pago → un **cobro** aplicado a esa venta, con la forma de pago «Pasarela».
 * - CFDI **cancelado** en billing → se cancelan el cobro y la venta (y su CFDI queda CANCELLED).
 * - **Reembolso sin CFDI cancelado** → no se adivina: se reporta, pide nota de crédito.
 *
 * **Candado de RFC:** la empresa de la sucursal destino tiene que tener el mismo RFC con que billing
 * timbra. Si no, el conciliador no escribe nada: meter ingresos de un RFC en el libro de otro es
 * declarar lo que no es.
 */
import { z } from 'zod';
import { fechaCivilSchema } from '../shared/fechas.js';

/** De dónde sale lo que se lleva a los libros. */
export const ORIGENES_DE_LA_PLATAFORMA = ['INVOICE', 'INVOICE_PAYMENT', 'STAMP_PACKAGE'] as const;
export type OrigenDeLaPlataforma = (typeof ORIGENES_DE_LA_PLATAFORMA)[number];

/** POSTED = ya está en los libros · FAILED = se reintenta en la siguiente pasada · CANCELLED = se deshizo. */
export const ESTADOS_DEL_VINCULO = ['PENDING', 'POSTED', 'FAILED', 'CANCELLED'] as const;
export type EstadoDelVinculo = (typeof ESTADOS_DEL_VINCULO)[number];

export const updatePlatformBooksConfigSchema = z
    .object({
        enabled: z.boolean(),
        /** El negocio de Pittaj (su tenant), donde viven sus libros. */
        tenantId: z.string().uuid().nullable(),
        /** La sucursal que «vende»: de ella sale la empresa (RFC) a cuyo libro va. */
        locationId: z.string().uuid().nullable(),
        /** La línea de negocio (p. ej. «SaaS»). Sin ella, la de la sucursal. */
        businessLineId: z.string().uuid().nullable(),
        /** Desde qué fecha se concilia (civil). Lo anterior se quedó fuera a propósito. */
        since: fechaCivilSchema,
        version: z.number().int().positive(),
    })
    .refine((c) => !c.enabled || (c.tenantId && c.locationId), {
        message: 'Para encenderlo hacen falta el negocio y la sucursal destino',
        path: ['locationId'],
    });

export type UpdatePlatformBooksConfigBody = z.infer<typeof updatePlatformBooksConfigSchema>;

export const getPlatformBooksLinksSchema = z.object({
    status: z.enum(ESTADOS_DEL_VINCULO).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export interface PlatformBooksConfigResponse {
    readonly enabled: boolean;
    readonly tenantId: string | null;
    readonly tenantName: string | null;
    readonly locationId: string | null;
    readonly locationName: string | null;
    readonly businessLineId: string | null;
    readonly since: string;
    readonly version: number;
    /** El candado: con qué RFC timbra billing y cuál tiene la empresa de la sucursal. */
    readonly emisorRfc: string | null;
    readonly destinoRfc: string | null;
    /** null = el candado cierra; si no, por qué no se puede conciliar. */
    readonly bloqueo: string | null;
    readonly lastRun: PlatformBooksRunResponse | null;
}

/** Lo que hizo una pasada del conciliador. */
export interface PlatformBooksRunResponse {
    readonly at: string;
    readonly trigger: 'CRON' | 'MANUAL';
    /** null = corrió; si no, por qué no corrió (apagado, candado de RFC…). */
    readonly skipped: string | null;
    readonly ventas: number;
    readonly cobros: number;
    readonly cancelados: number;
    readonly fallidos: number;
    /** Pagadas pero sin CFDI timbrado: no entran hasta que billing las timbre. */
    readonly sinCfdi: number;
    /** Reembolsadas con el CFDI vigente: piden nota de crédito. */
    readonly reembolsosSinNota: number;
}

export interface PlatformBooksLinkResponse {
    readonly id: string;
    readonly sourceType: OrigenDeLaPlataforma;
    readonly sourceId: string;
    /** Folio de billing (FAC-2026-…), o el del paquete. */
    readonly sourceLabel: string | null;
    readonly status: EstadoDelVinculo;
    readonly directSaleId: string | null;
    readonly directSaleFolio: string | null;
    readonly customerPaymentId: string | null;
    readonly amount: number | null;
    readonly error: string | null;
    readonly attempts: number;
    readonly updatedAt: string;
}

export interface GetPlatformBooksLinksResponse {
    readonly items: readonly PlatformBooksLinkResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}

/** GET /api/admin/platform-books/options?tenantId= — para elegir el destino. */
export interface PlatformBooksOptionsResponse {
    readonly locations: readonly { id: string; name: string; companyName: string; rfc: string | null }[];
    readonly businessLines: readonly { id: string; name: string }[];
}
