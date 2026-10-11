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

import type { ExpenseConceptGroup } from './schemas/expenseConcept.schema.js';
import type { VariantesDeCuenta } from './cuentaDelConcepto.js';

export interface SemillaDeConceptoDeGasto {
    readonly code: string;
    readonly name: string;
    readonly ledgerAccountCode: string;
    readonly offeredAtCash: boolean;
    readonly isSystem: boolean;
    /** Grupo en que se enseña en «Mostrar todos» (E1). */
    readonly group: ExpenseConceptGroup;
    /** Sale arriba del combo aunque el negocio no lo haya usado todavía (E1). */
    readonly frequent: boolean;
    /** Variantes de cuenta por tipo de proveedor (E1 §3). Ver `cuentaDelConcepto`. */
    readonly ledgerAccountCodeCompany: string | null;
    readonly ledgerAccountCodeForeignIndividual: string | null;
    readonly ledgerAccountCodeForeignCompany: string | null;
}

/** Clave del concepto del sistema, donde cae lo que no tiene concepto. */
export const EXPENSE_CONCEPT_OTHER_CODE = 'OTHER';

type Opciones = Partial<Pick<SemillaDeConceptoDeGasto, 'offeredAtCash' | 'isSystem' | 'group' | 'frequent'>> & {
    readonly variants?: VariantesDeCuenta;
};
const op = (code: string, name: string, ledgerAccountCode: string, o: Opciones = {}): SemillaDeConceptoDeGasto => ({
    code,
    name,
    ledgerAccountCode,
    offeredAtCash: o.offeredAtCash ?? false,
    isSystem: o.isSystem ?? false,
    group: o.group ?? 'OPERACION',
    frequent: o.frequent ?? false,
    ledgerAccountCodeCompany: o.variants?.company ?? null,
    ledgerAccountCodeForeignIndividual: o.variants?.foreignIndividual ?? null,
    ledgerAccountCodeForeignCompany: o.variants?.foreignCompany ?? null,
});

/**
 * Un concepto por cada cuenta de gasto elegible de la plantilla PyME (desvío E, docs
 * `producto/plan-gastos-que-guian.md`). Lo vigila `planDeCuentasYConceptos.test.ts` del backend:
 * una cuenta elegible sin concepto, o un concepto que apunta a una cuenta interna, lo rompe.
 *
 * Los agrupadores del SAT que dan las cuentas son del Anexo 24 (DOF 2016-10-04).
 */
export const SEED_EXPENSE_CONCEPTS: readonly SemillaDeConceptoDeGasto[] = [
    // ── Operación ──────────────────────────────────────────────────────────────────────────────
    // Renta: 601.45 a personas físicas, 601.46 a morales, 601.47 al extranjero.
    op('RENT', 'Renta', '601-02', { frequent: true, variants: { company: '601-31', foreignIndividual: '601-32', foreignCompany: '601-32' } }),
    op('ELECTRICITY', 'Luz', '601-03', { frequent: true }),
    op('WATER', 'Agua', '601-10', { frequent: true, offeredAtCash: true }),
    op('PHONE_INTERNET', 'Teléfono e internet', '601-11', { frequent: true }),
    // Gas LP o natural del horno y la cocina. No es combustible de vehículo: el tope de efectivo
    // de LISR art. 27 fr. III no le aplica, así que sí se ofrece en la caja.
    op('GAS', 'Gas', '601-16', { frequent: true, offeredAtCash: true }),
    // Gasolina pagada en efectivo no se deduce: este concepto no se ofrece en la caja (2026-10-04).
    op('FUEL', 'Combustibles', '601-15', { frequent: true }),
    op('MAINTENANCE', 'Mantenimiento', '601-05', { frequent: true, offeredAtCash: true }),
    op('STATIONERY', 'Papelería y consumibles', '601-04', { frequent: true, offeredAtCash: true }),
    op('CLOUD_SOFTWARE', 'Software y servicios en la nube', '601-14', { frequent: true }),
    op('ADVERTISING', 'Publicidad', '601-06', { frequent: true }),
    // Honorarios: 601.34 a personas físicas, 601.38 a morales, 601.36/601.40 del extranjero.
    op('FEES', 'Honorarios', '601-08', { frequent: true, variants: { company: '601-33', foreignIndividual: '601-34', foreignCompany: '601-35' } }),
    op('FREIGHT', 'Fletes y paquetería', '601-07', { offeredAtCash: true }),
    op('TRAVEL', 'Viáticos y gastos de viaje', '601-17', { offeredAtCash: true }),
    op('SECURITY', 'Vigilancia y seguridad', '601-18'),
    op('CLEANING', 'Limpieza', '601-19', { offeredAtCash: true }),
    op('INSURANCE', 'Seguros y fianzas', '601-20'),
    op('DUES_SUBSCRIPTIONS', 'Cuotas y suscripciones', '601-24'),
    op('DONATIONS', 'Donativos', '601-26'),
    op('TECH_ASSISTANCE', 'Asistencia técnica', '601-27'),
    op('SALES_COMMISSIONS', 'Comisiones sobre ventas', '601-28'),
    op('IMPORT_EXPENSES', 'Gastos de importación', '601-30'),
    // ── Personal ───────────────────────────────────────────────────────────────────────────────
    op('SALARIES', 'Sueldos y salarios', '601-01', { group: 'PERSONAL' }),
    op('IMSS', 'Cuotas al IMSS', '601-36', { group: 'PERSONAL' }),
    op('INFONAVIT', 'Aportaciones al Infonavit', '601-37', { group: 'PERSONAL' }),
    op('SAR', 'Aportaciones al SAR', '601-38', { group: 'PERSONAL' }),
    op('TRAINING', 'Capacitación', '601-25', { group: 'PERSONAL' }),
    op('UNIFORMS', 'Uniformes', '601-29', { group: 'PERSONAL', offeredAtCash: true }),
    // ── Impuestos y derechos ───────────────────────────────────────────────────────────────────
    // Licencias, permisos, tenencia. NO el ISR ni el IVA propios: esos no son gasto.
    op('TAXES_DUTIES', 'Impuestos y derechos', '601-21', { group: 'IMPUESTOS' }),
    op('PROPERTY_TAX', 'Predial', '601-22', { group: 'IMPUESTOS' }),
    op('PAYROLL_TAX', 'Impuesto sobre nómina', '601-39', { group: 'IMPUESTOS' }),
    // Recargos sí; las multas van a «Multas y gastos no deducibles».
    op('TAX_SURCHARGES', 'Recargos fiscales', '601-23', { group: 'IMPUESTOS' }),
    // ── Financieros ────────────────────────────────────────────────────────────────────────────
    op('BANK_FEES', 'Comisiones bancarias', '701-01', { group: 'FINANCIEROS' }),
    op('CARD_FEES', 'Comisiones de cobro con tarjeta', '701-02', { group: 'FINANCIEROS' }),
    op('BANK_INTEREST', 'Intereses bancarios', '701-03', { group: 'FINANCIEROS' }),
    // Financieras, SOFOM (Mercado Lending), particulares: 701.06 a físicas, 701.08 a morales.
    op('LOAN_INTEREST', 'Intereses de otros préstamos', '701-05', { group: 'FINANCIEROS', variants: { company: '701-04' } }),
    op('OTHER_FINANCIAL', 'Otros gastos financieros', '701-06', { group: 'FINANCIEROS' }),
    // ── No deducibles ──────────────────────────────────────────────────────────────────────────
    op('NON_DEDUCTIBLE', 'Multas y gastos no deducibles', '601-12', { group: 'NO_DEDUCIBLES' }),
    // ── Del sistema ────────────────────────────────────────────────────────────────────────────
    op(EXPENSE_CONCEPT_OTHER_CODE, 'Otros gastos', '601-09', { frequent: true, offeredAtCash: true, isSystem: true }),
];
