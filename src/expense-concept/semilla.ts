/**
 * @fileoverview Los conceptos de gasto con que nace cada tenant.
 * @module Contracts/ExpenseConcept
 *
 * Cada uno apunta a la cuenta de la plantilla PyME que ya existía para eso y que nadie
 * usaba: hasta F6 todo gasto caía en `601-09` (plan, F6 «Qué existe ya»). Quien no sabe de
 * cuentas no tiene que tocar nada.
 *
 * `code` es la clave estable: el usuario puede renombrar «Luz» a «Energía», y la semilla
 * se sigue reconociendo. La siembran la nube (onboarding) y la migración que retro-siembra
 * a los tenants existentes, con estos mismos valores.
 */

export interface SemillaDeConceptoDeGasto {
    readonly code: string;
    readonly name: string;
    readonly ledgerAccountCode: string;
    readonly offeredAtCash: boolean;
    readonly isSystem: boolean;
}

/** Clave del concepto del sistema, donde cae lo que no tiene concepto. */
export const EXPENSE_CONCEPT_OTHER_CODE = 'OTHER';

export const SEED_EXPENSE_CONCEPTS: readonly SemillaDeConceptoDeGasto[] = [
    { code: 'RENT', name: 'Renta', ledgerAccountCode: '601-02', offeredAtCash: false, isSystem: false },
    { code: 'ELECTRICITY', name: 'Luz', ledgerAccountCode: '601-03', offeredAtCash: false, isSystem: false },
    { code: 'WATER', name: 'Agua', ledgerAccountCode: '601-10', offeredAtCash: true, isSystem: false },
    { code: 'PHONE_INTERNET', name: 'Teléfono e internet', ledgerAccountCode: '601-11', offeredAtCash: false, isSystem: false },
    { code: 'CLOUD_SOFTWARE', name: 'Software y servicios en la nube', ledgerAccountCode: '601-14', offeredAtCash: false, isSystem: false },
    { code: 'STATIONERY', name: 'Papelería y consumibles', ledgerAccountCode: '601-04', offeredAtCash: true, isSystem: false },
    { code: 'MAINTENANCE', name: 'Mantenimiento', ledgerAccountCode: '601-05', offeredAtCash: true, isSystem: false },
    { code: 'ADVERTISING', name: 'Publicidad', ledgerAccountCode: '601-06', offeredAtCash: false, isSystem: false },
    { code: 'FREIGHT', name: 'Fletes y paquetería', ledgerAccountCode: '601-07', offeredAtCash: true, isSystem: false },
    // Gasolina pagada en efectivo no se deduce: este concepto no se ofrece en la caja (2026-10-04).
    { code: 'FUEL', name: 'Combustibles', ledgerAccountCode: '601-15', offeredAtCash: false, isSystem: false },
    { code: 'FEES', name: 'Honorarios', ledgerAccountCode: '601-08', offeredAtCash: false, isSystem: false },
    { code: EXPENSE_CONCEPT_OTHER_CODE, name: 'Otros gastos', ledgerAccountCode: '601-09', offeredAtCash: true, isSystem: true },
];
