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
 * 🆕 Un renglón del panel del emisor (`GET /api/sales-cfdi/emitted`, sin implementar).
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
}

/**
 * 🆕 `GET /api/sales-cfdi/emitted` (sin implementar).
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
    };
}

/**
 * 🆕 Una venta a crédito con abonos cobrados y sin complemento (`GET …/pending-reps`).
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

/** 🆕 `GET /api/sales-cfdi/pending-reps` (sin implementar). */
export interface ListPendingRepsResponse {
    readonly items: readonly PendingRepItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    /** Cuántos ya se pasaron del día 5. Es el número que justifica la pantalla. */
    readonly overdueCount: number;
    /** Suma de lo cobrado sin amparar, del filtro completo. */
    readonly amountPendingTotal: number;
}
