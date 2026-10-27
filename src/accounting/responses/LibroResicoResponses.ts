/**
 * @fileoverview Libro simplificado del RESICO persona física (frente C · C2).
 * @module Contracts/Accounting/Responses
 *
 * **Papel de trabajo que revisa tu contador, nunca una declaración.** Es una **vista sobre el
 * mismo motor contable**: nada de esto se guarda, todo se deriva del libro en cada consulta.
 * Supuestos y ley: `apps/contabilidad.md` §10.2 (docs), *por revisar con un contador*.
 *
 * Importes en pesos con dos decimales. De las dos plataformas: el cálculo vive en el servidor.
 */

export interface ResicoBookEntryResponse {
    readonly entryId: string;
    readonly date: string;
    readonly type: string;
    readonly folio: number | null;
    readonly concept: string;
    /** Documento que originó la póliza (`CASH_CLOSURE`, `CUSTOMER_PAYMENT`, `DIRECT_SALE`…). */
    readonly sourceType: string;
    readonly sourceDocId: string | null;
    /** UUID de los CFDI ligados a la póliza. Vacío si no tiene. */
    readonly cfdiUuids: readonly string[];
    /** Lo que esta póliza aporta al ingreso cobrado del mes. Puede ser negativo (devolución). */
    readonly collected: number;
}

export interface ResicoBookResponse {
    readonly companyId: string;
    readonly companyName: string;
    readonly taxId: string | null;
    readonly year: number;
    readonly month: number;
    readonly from: string;
    readonly to: string;

    /** Ingresos efectivamente cobrados del mes, sin IVA (S2.1, S2.7). */
    readonly collected: number;
    /** De dónde sale `collected`; cada pata es movimiento del periodo y dice su signo natural. */
    readonly collectedBreakdown: {
        readonly accruedIncome: number;
        readonly receivablesChange: number;
        readonly vatPendingChange: number;
        readonly iepsPendingChange: number;
        readonly advancesChange: number;
    };

    readonly isr: {
        readonly rate: number;
        /** El ingreso del mes pasó de la última fila de la tabla. */
        readonly overTable: boolean;
        readonly gross: number;
        /** Retenciones de ISR que te hicieron tus clientes en el mes. */
        readonly withheld: number;
        readonly credited: number;
        readonly payable: number;
        /** Retenido que sobró; no se arrastra. */
        readonly excessWithheld: number;
    };

    /** Las cifras del «IVA del mes» ya revisado; aquí no se recalculan. */
    readonly vat: {
        readonly transferredCollected: number;
        readonly creditablePaid: number;
        readonly withheldByCustomers: number;
        /** Positivo = a cargo; negativo = a favor. */
        readonly balance: number;
        /** Huecos del motor sin cuenta: la cifra de IVA queda corta. */
        readonly missing: readonly string[];
    };

    readonly cap: {
        readonly limit: number;
        /** Cobrado de enero al mes consultado. */
        readonly accumulated: number;
        readonly remaining: number;
        readonly usedPercent: number;
        readonly status: 'OK' | 'CERCA' | 'REBASADO';
    };

    /** Las pólizas que forman `collected`, con su CFDI. */
    readonly entries: readonly ResicoBookEntryResponse[];
    /** Lo que suman las pólizas del detalle. Debe coincidir con `collected` (S2.12). */
    readonly entriesTotal: number;
    /** `collected - entriesTotal`. Distinto de cero = el detalle no explica la cifra. */
    readonly entriesDifference: number;
    /** El detalle se cortó en el límite; `entriesTotal` entonces no es todo. */
    readonly entriesTruncated: boolean;

    /**
     * IVA que los clientes retuvieron y se asentó este mes. Cuenta como cobrado en el mes de la
     * venta y se resta en el del cobro (limitación conocida, `apps/contabilidad.md` §10.2): se
     * enseña para poder ajustarlo a mano.
     */
    readonly vatWithheldInMonth: number;

    /**
     * Huecos del motor sin cuenta que el cobrado necesita (clientes por cobrar, IVA por cobrar).
     * Un hueco sin cuenta NO es cero: el ingreso cobrado queda incompleto y la pantalla lo dice.
     */
    readonly missingAccounts: readonly string[];

    /** Documentos que el motor no pudo contabilizar: mientras haya, la cifra está corta. */
    readonly unpostedDocuments: number;
    readonly disclaimer: string;
}
