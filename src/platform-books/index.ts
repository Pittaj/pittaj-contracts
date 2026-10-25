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
 * - F3.4 · Cada cobro con tarjeta → su **liquidación** en la cuenta «Pasarela» de Bancos: entra el
 *   bruto, sale la comisión de Mercado Pago y su IVA (acreditable). La dispersión al banco es un
 *   traspaso, y se concilia contra el estado de cuenta como cualquiera.
 *
 * **Candado de RFC:** la empresa de la sucursal destino tiene que tener el mismo RFC con que billing
 * timbra. Si no, el conciliador no escribe nada: meter ingresos de un RFC en el libro de otro es
 * declarar lo que no es.
 */
import { z } from 'zod';
import { fechaCivilSchema } from '../shared/fechas.js';

/** De dónde sale lo que se lleva a los libros. */
export const ORIGENES_DE_LA_PLATAFORMA = ['INVOICE', 'INVOICE_PAYMENT', 'STAMP_PACKAGE', 'PSP_SETTLEMENT'] as const;
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
        /**
         * F3.4 · La cuenta `PSP` de Bancos donde cae lo que cobra Mercado Pago. Sin ella, los cobros
         * entran igual pero sus liquidaciones (bruto − comisión) no se escriben.
         */
        pspAccountId: z.string().uuid().nullable().default(null),
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
    readonly pspAccountId: string | null;
    readonly pspAccountName: string | null;
    readonly since: string;
    readonly version: number;
    /** El candado: con qué RFC timbra billing y cuál tiene la empresa de la sucursal. */
    readonly emisorRfc: string | null;
    readonly destinoRfc: string | null;
    /** null = el candado cierra; si no, por qué no se puede conciliar. */
    readonly bloqueo: string | null;
    readonly lastRun: PlatformBooksRunResponse | null;
    /**
     * F9.2 · Los destinos con su vigencia, del más viejo al más nuevo. Los campos de arriba
     * (`tenantId`, `locationId`…) son los del vigente hoy. Si nunca se programó un cambio, hay uno
     * solo, el de la configuración (`id` = `'CONFIG'`).
     */
    readonly destinos: readonly PlatformBooksDestinoResponse[];
    /**
     * F8.5 · Si el negocio del destino vigente ya es la cuenta interna de Pittaj (no se le cobra).
     * `null` sin destino. Si es `false`, la pantalla ofrece marcarlo: si no, billing le cobraría a
     * Pittaj y el puente escribiría esa factura como una venta de Pittaj a sí mismo.
     */
    readonly destinoInterno: boolean | null;
}

/** F8.5 · PUT /api/admin/platform-books/interno — marca (o desmarca) el negocio vigente como cuenta interna. */
export const marcarInternoSchema = z.object({ interno: z.boolean() });
export type MarcarInternoBody = z.infer<typeof marcarInternoSchema>;

/** F9.2 · A dónde va lo de billing desde una fecha. */
export interface PlatformBooksDestinoResponse {
    /** `'CONFIG'` mientras sea el de la configuración y no se haya guardado como historia. */
    readonly id: string;
    readonly tenantId: string;
    readonly tenantName: string | null;
    readonly locationId: string;
    readonly locationName: string | null;
    /** El RFC de la empresa de la sucursal: de él depende qué CFDI entran. */
    readonly rfc: string | null;
    readonly businessLineId: string | null;
    readonly pspAccountId: string | null;
    readonly pspAccountName: string | null;
    readonly vigenteDesde: string;
    readonly vigente: boolean;
    /** Todavía no empieza: se puede quitar. */
    readonly programado: boolean;
}

/**
 * POST /api/admin/platform-books/destinos — F9.2 · Programa el cambio de destino (p. ej. el día que
 * Pittaj pasa a otro RFC). No puede empezar antes de hoy: lo ya llevado se queda donde está.
 */
export const programarDestinoSchema = z.object({
    tenantId: z.string().uuid(),
    locationId: z.string().uuid(),
    businessLineId: z.string().uuid().nullable().default(null),
    pspAccountId: z.string().uuid().nullable().default(null),
    vigenteDesde: fechaCivilSchema,
});

export type ProgramarDestinoBody = z.infer<typeof programarDestinoSchema>;

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
    /** F3.4 · Liquidaciones escritas en la cuenta de la pasarela. */
    readonly liquidaciones: number;
    /** F3.4 · Cobros con tarjeta cuya comisión no se pudo leer de la pasarela (se reintenta). */
    readonly sinComision: number;
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
    /** F3.4 · Cuentas `PSP` activas del negocio, para la liquidación. */
    readonly pspAccounts: readonly { id: string; name: string }[];
    /**
     * F8.4 · Es el negocio técnico de la plataforma (donde viven los operadores): no lleva libros y
     * no se puede elegir como destino. Viene para que la pantalla diga por qué, en vez de dejar los
     * selectores vacíos.
     */
    readonly esLaPlataforma: boolean;
}

/**
 * F8.3 · Abrir los libros de Pittaj desde el backoffice, ya con sesión.
 *
 * El operador entra a app.pittaj.com como **el usuario que vinculó en el negocio destino vigente
 * (F8.4) o, sin vínculo, el que tiene su mismo correo** (sin ninguno de los dos no hay pase). En la
 * app manda el alcance de ese usuario (F7), no los permisos del backoffice. El pase es de un solo uso, dura dos minutos y viaja en el
 * fragmento de la dirección; la app lo canjea en `POST /api/auth/handoff/sesion`.
 */
export const LIBROS_DE_PITTAJ = ['contabilidad', 'bancos', 'fiscal'] as const;
export type LibroDePittaj = (typeof LIBROS_DE_PITTAJ)[number];

export const paseDeLosLibrosSchema = z.object({ app: z.enum(LIBROS_DE_PITTAJ) });

export interface PaseDeLosLibrosResponse {
    /** `https://app.pittaj.com/auth/pase#t=…&a=contabilidad`: abrirla canjea el pase. */
    readonly url: string;
    readonly expiresAt: string;
    /** El negocio al que entra (el destino vigente del puente). */
    readonly tenantName: string | null;
}

/**
 * F8.4 · El vínculo del operador con su usuario en el negocio de Pittaj.
 *
 * El pase de los libros abre la app como un usuario del negocio destino. Sin vínculo se busca el
 * del mismo correo que el operador; con vínculo, el que el operador demostró ser suyo tecleando su
 * correo y contraseña una vez. Así funciona aunque el backoffice y el negocio usen correos distintos.
 * El vínculo es por negocio: si el destino del puente cambia (F9), se vincula el nuevo.
 */
export const vincularOperadorSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    /** El pre-hash Argon2id de la contraseña, con la sal de `GET /api/auth/salt?email=`. */
    clientHash: z.string().min(1),
});
export type VincularOperadorBody = z.infer<typeof vincularOperadorSchema>;

/** GET/PUT /api/admin/platform-books/vinculo */
export interface VinculoDelOperadorResponse {
    /** El negocio del destino vigente; `null` si el puente todavía no tiene destino. */
    readonly tenantId: string | null;
    readonly tenantName: string | null;
    /** El correo del usuario vinculado en ese negocio; `null` si no hay vínculo. */
    readonly email: string | null;
    /** Sin vínculo, si el pase encontraría usuario por el correo del operador. */
    readonly porCorreo: boolean;
}

/**
 * F8.5 · Vincular desde la sesión de la app, sin contraseña (sirve a quien entra con Google o
 * Microsoft).
 *
 * 1. El operador pide en el backoffice una solicitud (`POST /api/admin/platform-books/vinculo/solicitud`):
 *    sale una dirección de app.pittaj con un token de un solo uso en el fragmento (10 minutos).
 * 2. En la app, con su sesión, el usuario ve quién lo pide (`POST /api/platform-books/vinculo/consulta`)
 *    y confirma (`POST /api/platform-books/vinculo/confirmacion`). El vínculo queda con **su** identidad.
 *
 * La prueba es la sesión de la app en el negocio destino: solo un usuario de ese negocio puede
 * confirmarla, y solo para sí mismo.
 */
export interface SolicitudDeVinculoResponse {
    /** `https://app.pittaj.com/vincular-operador#t=…` */
    readonly url: string;
    readonly expiresAt: string;
}

export const tokenDeVinculoSchema = z.object({ token: z.string().min(20).max(200) });
export type TokenDeVinculoBody = z.infer<typeof tokenDeVinculoSchema>;

export interface ConsultaDeVinculoResponse {
    /** Quién lo pide: el operador del backoffice. */
    readonly operadorNombre: string;
    readonly operadorEmail: string;
    /** El negocio de los libros de Pittaj, y el usuario de la sesión que confirmaría. */
    readonly tenantName: string | null;
    readonly tuEmail: string;
}

export interface VinculoConfirmadoResponse {
    readonly tenantName: string | null;
    readonly operadorEmail: string;
}
