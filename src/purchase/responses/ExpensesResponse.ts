/**
 * @fileoverview Respuestas de la lista de gastos y del reporte por concepto (F6.4).
 * @module Contracts/Purchase
 *
 * Las dos salen de los **documentos** (compras de gasto recibidas y, en el reporte, el gasto de
 * caja), no de las pólizas: el escritorio no tiene pólizas y la misma pregunta tiene que dar el
 * mismo número en las dos puntas. Las reglas las comparten por `gastos.ts`; el escritorio tiene su
 * gemela en C#.
 */

/** Un gasto de la lista: una compra de naturaleza gasto. */
export interface ExpenseRowResponse {
    readonly id: string;
    readonly purchaseNumber: string;
    /** Solo borradores y vigentes: una cancelada no es gasto. */
    readonly status: 'DRAFT' | 'ACTIVE';
    /** `YYYY-MM-DD` en hora de México: la recepción si la hubo; si no, el comprobante o la captura. */
    readonly fecha: string;
    readonly supplierId: string;
    readonly supplierName: string;
    /** Conceptos distintos de sus renglones. `null` = Otros gastos. */
    readonly conceptIds: readonly (string | null)[];
    /** Líneas distintas de sus renglones, ya resueltas (renglón → proveedor → concepto → sucursal). `null` = sin línea. */
    readonly businessLineIds: readonly (string | null)[];
    readonly locationId: string | null;
    readonly renglones: number;
    /** Trae UUID de CFDI. */
    readonly hasCfdi: boolean;
    /** `YYYY-MM-DD`. */
    readonly dueDate: string | null;
    readonly total: number;
    /**
     * Base sin IVA de los renglones **que pasan el filtro**. Sin filtro de concepto ni de línea es
     * la del documento entero; con él, solo la parte que le toca — la misma que suma el reporte.
     */
    readonly importe: number;
    /** Lo que falta por pagar (total + notas − pagos). Cero en un borrador: todavía no es deuda. */
    readonly saldo: number;
    readonly diasDeAtraso: number;
}

/** Los cajones de arriba de la lista. Cuentan solo lo vigente: un borrador aún no es gasto. */
export interface ExpensesSummary {
    /** Base sin IVA de lo vigente. */
    readonly gastado: number;
    readonly documentos: number;
    readonly borradores: number;
    readonly porPagar: number;
    readonly documentosPorPagar: number;
    /** `YYYY-MM-DD` del vencimiento más cercano de lo que se debe. */
    readonly proximoVencimiento: string | null;
    /** Gastos vigentes con al menos un renglón en Otros gastos. */
    readonly sinConcepto: number;
    readonly importeSinConcepto: number;
}

/** GET /api/purchases/expenses */
export interface GetExpensesResponse {
    readonly items: readonly ExpenseRowResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly resumen: ExpensesSummary;
}

/** Una fila del reporte: un concepto a lo largo de los meses. */
export interface ExpenseByConceptRow {
    /** `null` = Otros gastos (sin concepto, el del sistema o uno que ya no existe). */
    readonly conceptId: string | null;
    readonly nombre: string;
    readonly ledgerAccountCode: string;
    /** Uno por mes, en el orden de `meses`. */
    readonly importes: readonly number[];
    readonly total: number;
    /** Último mes contra el anterior. `null` si hay un solo mes o el anterior fue cero. */
    readonly cambioPercent: number | null;
    /** Qué parte del último mes es este concepto. */
    readonly participacionPercent: number;
}

/** Algo que el dueño debería ver sin leer la tabla. */
export interface AvisoDeGasto {
    /** `SUBE`: tres meses seguidos al alza. `OTROS_BAJA`: cada vez se clasifica más. */
    readonly tipo: 'SUBE' | 'OTROS_BAJA';
    readonly conceptId: string | null;
    readonly nombre: string;
    /** Del primero de esos tres meses al último. */
    readonly cambioPercent: number;
    /** `YYYY-MM` desde el que se mide. */
    readonly desde: string;
}

/** GET /api/purchases/expenses/by-concept */
export interface ExpenseByConceptResponse {
    /** `YYYY-MM`, en orden. */
    readonly meses: readonly string[];
    readonly filas: readonly ExpenseByConceptRow[];
    readonly totales: readonly number[];
    readonly total: number;
    readonly cambioPercent: number | null;
    readonly avisos: readonly AvisoDeGasto[];
    /** Todo lo gastado está en Otros gastos: hay que clasificar antes de que el reporte diga algo. */
    readonly todoEnOtros: boolean;
    /** Cuánto del total salió de la caja (gasto de caja): la lista de gastos no lo enseña. */
    readonly deCaja: number;
}
