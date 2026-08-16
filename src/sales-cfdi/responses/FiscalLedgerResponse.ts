/**
 * @fileoverview El libro fiscal y las dos listas del panel del emisor.
 * @module Contracts/SalesCfdi
 */

import type {
    FiscalSourceTypeValue,
    SaleCfdiStatusValue,
    RepPaymentFormValue,
} from '../schemas/saleCfdi.schema.js';

/** Un comprobante timbrado, con lo que la póliza necesita declarar. */
export interface FiscalLedgerEntryResponse {
    readonly sourceType: FiscalSourceTypeValue;
    /**
     * Documento origen en el TPV: `ticketId` para SALE y PAYMENT, `returnId` para RETURN, y el id
     * del propio comprobante para GLOBAL —que no cuelga de un documento: agrupa muchos—. Es la
     * llave con la que el motor de posteo encuentra la póliza que ya generó: **la idempotencia
     * vive ahí**.
     */
    readonly sourceId: string;
    readonly cfdiId: string;
    readonly uuid: string;
    /** RFC del receptor con el que se timbró. `null` solo en comprobantes viejos. */
    readonly rfc: string | null;
    /** MontoTotal del comprobante. `null` solo en comprobantes viejos. */
    readonly total: number | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly status: 'STAMPED' | 'CANCELLED';
    readonly stampedAt: string;
    readonly cancelledAt: string | null;
    readonly hasXml: boolean;
}

/**
 * `GET /api/sales-cfdi/fiscal-ledger`.
 *
 * 🔴 **`incomplete` va aparte y no se filtra.** Son comprobantes timbrados antes de que se
 * congelara el snapshot, sin RFC o sin monto y sin XML del que recuperarlos. Esconderlos
 * convertiría un error ruidoso —el motor se niega a postear— en una **declaración con huecos**,
 * que nadie ve hasta que el SAT la revisa.
 */
export interface FiscalLedgerResponse {
    readonly entries: readonly FiscalLedgerEntryResponse[];
    readonly incomplete: number;
}

/**
 * Un renglón del panel del emisor (`GET /api/sales-cfdi/emitted`).
 *
 * Es el libro fiscal **más lo que no llegó a existir**: `PENDING` y `FAILED`, que el motor de
 * posteo no quiere ver y una persona sí — un timbrado fallido es una venta cobrada y no
 * facturada.
 */
export interface EmittedCfdiItemResponse {
    readonly cfdiId: string;
    readonly sourceType: FiscalSourceTypeValue;
    readonly sourceId: string;
    readonly uuid: string | null;
    readonly serie: string | null;
    readonly folio: string | null;
    readonly status: SaleCfdiStatusValue;
    /** Nombre del receptor tal como se timbró. */
    readonly receiverName: string | null;
    readonly receiverRfc: string | null;
    readonly total: number | null;
    readonly issuedAt: string;
    readonly stampedAt: string | null;
    readonly cancelledAt: string | null;
    /** El último motivo de fallo, para no tener que abrir el ticket a ver qué pasó. */
    readonly lastError: string | null;
    readonly hasXml: boolean;
    readonly hasPdf: boolean;

    /**
     * 🔴 Lo que el SAT dice de este comprobante, si ya se le preguntó.
     *
     * Va **aparte de `cancelledAt`** a propósito: aquél significa «yo lo cancelé» y éste «el SAT
     * dice que está cancelado». Juntarlos borraría la única combinación que importa — un
     * comprobante que **yo doy por bueno**, que está en una póliza y en una declaración, y que ante
     * el SAT no existe.
     */
    readonly satStatus: string | null;
    /** Cuándo se le preguntó. `null` = nunca, que no es lo mismo que «está bien». */
    readonly satCheckedAt: string | null;
    /** Cuándo lo dio por cancelado el SAT. `null` mientras siga vigente para él. */
    readonly cancelledAtSat: string | null;
}

/**
 * `GET /api/sales-cfdi/emitted`.
 *
 * Los contadores viajan **del filtro completo y no de la página**: el número que decide si hoy
 * hay trabajo pendiente no puede depender de en qué página estés. Ya nos mordió en Cobranza.
 */
export interface ListEmittedCfdiResponse {
    readonly items: readonly EmittedCfdiItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly counts: {
        readonly stamped: number;
        readonly cancelled: number;
        /** Los que no existen ante el SAT: intentos. Es el número que hay que mirar. */
        readonly pending: number;
        readonly failed: number;
        /**
         * 🔴 Vigentes para nosotros y **cancelados para el SAT**.
         *
         * Es la cifra que justifica el barrido y la que puede costar dinero: cada uno es un ingreso
         * declarado que ya no existe, con su IVA trasladado detrás.
         */
        readonly cancelledAtSat: number;
    };
}

/**
 * `POST /api/sales-cfdi/sat-status/refresh` — resultado de una pasada.
 *
 * `failed` no es alarma: el servicio del SAT es público y se cae. Esos comprobantes se quedan para
 * la vuelta siguiente, que es justo lo que hace que el barrido no necesite reintentos propios.
 */
export interface RefreshSatEmittedStatusResponse {
    readonly checked: number;
    /** Cancelaciones **descubiertas en esta pasada**: las que nadie sabía. */
    readonly newlyCancelled: number;
    readonly failed: number;
}

/**
 * Una venta a crédito con abonos cobrados y sin complemento (`GET …/pending-reps`).
 */
export interface PendingRepItemResponse {
    readonly ticketId: string;
    readonly ticketFolio: string | null;
    readonly cfdiUuid: string;
    readonly customerName: string | null;
    readonly customerRfc: string | null;
    /** Lo cobrado sin amparar por un REP. */
    readonly amountPending: number;
    /** El abono más antiguo sin complemento: es el que marca la fecha límite. */
    readonly oldestPaymentDate: string;
    /** Día 5 del mes siguiente a ese abono. Lo calcula el backend para que nadie lo repita. */
    readonly dueDate: string;
    readonly overdue: boolean;
    /** Forma de pago del abono, si se registró: ahorra teclearla al timbrar. */
    readonly suggestedPaymentForm: RepPaymentFormValue | null;
    /** Cuántas parcialidades lleva ya timbradas la venta. */
    readonly stampedPartialities: number;
}

/**
 * `GET /api/sales-cfdi/pending-reps`.
 *
 * 📌 **De aquí sale también el globo del menú.** Decisión del dueño (2026-08-15): el sidebar de
 * Fiscal marca **solo lo vencido**, no todo lo pendiente — un número que está siempre encendido se
 * vuelve paisaje en dos semanas y deja de avisar justo cuando hace falta. La pantalla del menú pide
 * `?limit=1` y lee `overdueCount`; si es cero, no pinta nada.
 */
export interface ListPendingRepsResponse {
    readonly items: readonly PendingRepItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Cuántos ya se pasaron del día 5. Es el número que justifica la pantalla y el del menú. */
    readonly overdueCount: number;
    /** Suma de lo cobrado sin amparar, del filtro completo. */
    readonly amountPendingTotal: number;
}

/**
 * `POST /api/sales-cfdi/retry-failed`.
 *
 * `status: 'count-changed'` es la respuesta al candado de `expectedCount`: **no se timbró nada** y
 * `foundCount` dice lo que hay ahora. La pantalla vuelve a pedir confirmación con el número nuevo.
 */
export interface RetryFailedCfdiResponse {
    readonly status: 'done' | 'count-changed';
    readonly foundCount: number;
    readonly stamped: number;
    readonly stillFailed: number;
    /** Qué salió mal en cada uno que volvió a fallar, para no repetir el mismo intento a ciegas. */
    readonly failures: readonly {
        readonly sourceId: string;
        readonly error: string;
    }[];
}
