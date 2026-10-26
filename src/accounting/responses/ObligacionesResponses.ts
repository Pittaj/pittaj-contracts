/**
 * @fileoverview «Mis obligaciones» — qué le toca a una empresa según su régimen (frente C · C1).
 * @module Contracts/Accounting/Responses
 *
 * **Papel de trabajo que revisa tu contador, nunca una declaración.** Los supuestos de cada fecha
 * y su ley están en `apps/contabilidad.md` §10.1 (docs), marcados «por revisar con un contador».
 *
 * Es de las dos plataformas (mandato de paridad): el cálculo vive en el servidor y devuelve datos
 * planos, así que el escritorio lo pinta igual que la web cuando llegue la F6.2.
 */

/** Los cuatro perfiles que hoy tienen panel. Cualquier otro régimen devuelve `profile: null`. */
export const FISCAL_PROFILES = [
    'GENERAL_PM',
    'ACTIVIDAD_EMPRESARIAL_PF',
    'RESICO_PF',
    'RESICO_PM',
] as const;
export type FiscalProfile = (typeof FISCAL_PROFILES)[number];

export type PersonType = 'FISICA' | 'MORAL';

/** Qué papel de trabajo de Pittaj prepara la obligación. `null` = todavía no hay pantalla. */
export type ObligationPaper = 'IVA' | 'DIOT' | 'ANEXO_24' | 'LIBRO_RESICO' | 'PROVISIONAL';

export type ObligationFrequency = 'MENSUAL' | 'ANUAL';

/**
 * - `SI`: aplica a este perfil según el supuesto escrito.
 * - `REVISAR`: depende de facilidades o de la RMF; el contador decide. No se da por obligatoria
 *   ni por exenta.
 */
export type ObligationApplies = 'SI' | 'REVISAR';

export interface ObligationResponse {
    readonly id: string;
    readonly name: string;
    readonly frequency: ObligationFrequency;
    readonly applies: ObligationApplies;
    /**
     * Fecha límite `YYYY-MM-DD` cuando el supuesto la fija sin depender de la RMF. `null` cuando
     * depende de ella: entonces `deadlineRule` lo dice con palabras y no se inventa un día.
     * Nunca descuenta inhábiles: el panel enseña el día de la ley y lo dice.
     */
    readonly deadline: string | null;
    readonly deadlineRule: string;
    /** Artículos que fundan el supuesto. */
    readonly legalBasis: string;
    readonly paper: ObligationPaper | null;
    readonly note: string | null;
}

export interface ObligationsPendingResponse {
    /** Documentos que el motor no pudo contabilizar (excepciones abiertas de la empresa). */
    readonly unpostedDocuments: number;
    /** Pólizas posteadas del mes. Cero = nadie ha trabajado el mes. */
    readonly entryCount: number;
    /** `null` si el ejercicio o el mes no existen todavía en el calendario. */
    readonly periodStatus: 'OPEN' | 'CLOSED' | null;
}

export interface ObligationsResponse {
    readonly companyId: string;
    readonly companyName: string;
    readonly taxId: string | null;
    /** `c_RegimenFiscal` tal como está en la empresa. */
    readonly taxRegime: string | null;
    readonly regimeLabel: string | null;
    readonly personType: PersonType | null;
    /** `null` = sin panel (régimen sin capturar, sin RFC o no cubierto). `noPanelReason` dice por qué. */
    readonly profile: FiscalProfile | null;
    readonly noPanelReason: string | null;
    readonly year: number;
    readonly month: number;
    readonly obligations: readonly ObligationResponse[];
    readonly pending: ObligationsPendingResponse;
    /** El aviso que va en pantalla, para que web y escritorio digan lo mismo. */
    readonly disclaimer: string;
}

export const OBLIGATIONS_DISCLAIMER =
    'Papel de trabajo que revisa tu contador. No es una declaración: Pittaj no presenta nada ante el SAT.';
