/**
 * @fileoverview Pagos provisionales de ISR (frente C · C3): actividad empresarial, persona moral
 * y RESICO persona moral.
 * @module Contracts/Accounting/Responses
 *
 * **Papel de trabajo que revisa tu contador, nunca una declaración.** Se deriva del libro en cada
 * consulta; lo que el libro no sabe (pagos anteriores, coeficiente de utilidad, pérdidas, PTU,
 * deducciones sin pagar) se **captura** y viaja en la consulta: no se guarda. Supuestos S3.1–S3.14
 * en `apps/contabilidad.md` §10.3 (docs), *por revisar con un contador*.
 *
 * Importes en pesos con dos decimales. Un campo `null` significa «no se pudo calcular», nunca cero.
 */

export const PROVISIONAL_PROFILES = ['ACTIVIDAD_EMPRESARIAL_PF', 'GENERAL_PM', 'RESICO_PM'] as const;
export type ProvisionalProfile = (typeof PROVISIONAL_PROFILES)[number];

/** Lo que el libro no sabe y se captura en pantalla. Todo en pesos salvo el coeficiente. */
export interface ProvisionalInputs {
    readonly previousPayments: number;
    /** Coeficiente de utilidad (p. ej. 0.2). Solo persona moral régimen general. */
    readonly coefficient: number | null;
    readonly lossesToAmortize: number;
    readonly ptuPaid: number;
    /** Deducciones devengadas que aún no se pagan y que hay que restar (por flujo). */
    readonly unpaidDeductions: number;
}

export interface ProvisionalTariffRow {
    /** Límites y cuota fija ya multiplicados por los meses del periodo. */
    readonly lowerLimit: number;
    readonly upperLimit: number | null;
    readonly fixedFee: number;
    /** Porcentaje sobre el excedente, p. ej. 21.36. */
    readonly ratePercent: number;
    readonly excess: number;
}

export interface ProvisionalPaymentResponse {
    readonly companyId: string;
    readonly companyName: string;
    readonly taxId: string | null;
    readonly profile: ProvisionalProfile;
    readonly year: number;
    readonly month: number;
    /** Meses acumulados del periodo (enero al mes consultado). */
    readonly monthsInPeriod: number;
    readonly from: string;
    readonly to: string;

    /** Qué se acumuló como ingreso: `COBRADOS` (flujo) o `NOMINALES` (devengado, persona moral). */
    readonly incomeBasis: 'COBRADOS' | 'NOMINALES';
    readonly income: number;

    /**
     * Deducciones del libro (costo y gasto devengados, sin las no deducibles). `null` en persona
     * moral régimen general, que no las usa.
     */
    readonly deductions: {
        readonly booked: number;
        /** Lo capturado como aún no pagado. */
        readonly unpaidAdjustment: number;
        /** `booked - unpaidAdjustment`, mínimo 0. */
        readonly applied: number;
        /** Cuentas por pagar a proveedores al corte, sin IVA: referencia de lo que habría que restar. */
        readonly suppliersPayableReference: number;
    } | null;

    /** Lo capturado, repetido para que cada cifra diga de dónde viene. */
    readonly inputs: ProvisionalInputs;

    readonly profit: number | null;
    readonly isr: {
        readonly method: 'TARIFA_ART_96' | 'TASA_30';
        /** Solo con tarifa: ejercicio de la RMF con el que se verificó la tabla. */
        readonly tariffReferenceYear: number | null;
        readonly tariffRow: ProvisionalTariffRow | null;
        /** Solo con tasa fija: 30. */
        readonly ratePercent: number | null;
        /** ISR del periodo antes de acreditar. */
        readonly amount: number | null;
    };
    readonly credits: {
        readonly previousPayments: number;
        /** Retenciones de ISR que te hicieron en el año (del libro). */
        readonly withheld: number;
        readonly applied: number | null;
    };
    readonly payable: number | null;
    /** Acreditable que sobró; no se arrastra ni se devuelve en el provisional. */
    readonly creditBalance: number | null;

    /** Datos que el cálculo necesita y no se capturaron. Con alguno, los resultados son `null`. */
    readonly missingInputs: readonly 'COEFICIENTE_DE_UTILIDAD'[];

    /** Solo RESICO PM: acumulado cobrado contra el tope de $35,000,000. */
    readonly cap: {
        readonly limit: number;
        readonly accumulated: number;
        readonly remaining: number;
        readonly usedPercent: number;
        readonly status: 'OK' | 'CERCA' | 'REBASADO';
    } | null;

    readonly missingAccounts: readonly string[];
    readonly unpostedDocuments: number;
    readonly disclaimer: string;
}
