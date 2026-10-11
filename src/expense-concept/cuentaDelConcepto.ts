/**
 * @fileoverview Qué cuenta toca un concepto según a quién se le pagó, y en qué orden se ofrecen
 * los conceptos (desvío E, docs `producto/plan-gastos-que-guian.md`).
 * @module Contracts/ExpenseConcept
 *
 * **El agrupador del SAT depende del proveedor, no solo del gasto.** El Anexo 24 separa la renta
 * a personas físicas (601.45), a morales (601.46) y al extranjero (601.47), y lo mismo honorarios e
 * intereses. El tendero elige «Renta» y la cuenta sale del RFC.
 *
 * Gemelo en el escritorio: `Pittaj.Domain/Purchasing/CuentaDelConcepto.cs`, con los mismos
 * vectores.
 */

import type { ExpenseConceptGroup } from './schemas/expenseConcept.schema.js';

/** Las variantes opcionales de un concepto. Sin variante, toca la cuenta por omisión. */
export interface VariantesDeCuenta {
    /** Proveedor persona moral nacional (RFC de 12). */
    readonly company?: string | null;
    /** Proveedor extranjero persona física. */
    readonly foreignIndividual?: string | null;
    /** Proveedor extranjero persona moral. */
    readonly foreignCompany?: string | null;
}

/** Lo que hace falta del concepto para elegir su cuenta. */
export interface ConceptoConCuentas {
    /** Por omisión: proveedor persona física nacional (RFC de 13) o desconocido. */
    readonly ledgerAccountCode: string;
    readonly ledgerAccountCodeCompany?: string | null;
    readonly ledgerAccountCodeForeignIndividual?: string | null;
    readonly ledgerAccountCodeForeignCompany?: string | null;
}

/** Lo que hace falta del proveedor. */
export interface ProveedorParaLaCuenta {
    /** RFC; nulo en un gasto sin proveedor. */
    readonly rfc?: string | null;
    /** País de residencia (F6.6). Nulo o `MX` = México. */
    readonly country?: string | null;
}

/** RFC genérico de operaciones con residentes en el extranjero (Anexo 20, Guía de llenado). */
export const RFC_GENERICO_EXTRANJERO = 'XEXX010101000';
/** RFC genérico del público en general: no dice si es física o moral. */
export const RFC_GENERICO_NACIONAL = 'XAXX010101000';

export type TipoDeProveedor = 'FISICA' | 'MORAL' | 'EXTRANJERO' | 'DESCONOCIDO';

/**
 * Física o moral por la longitud del RFC: 13 caracteres las personas físicas, 12 las morales (la
 * homoclave cuenta igual en las dos; la diferencia está en las letras del nombre). El extranjero por su país o por el RFC genérico. Del extranjero no se
 * sabe si es física o moral: la cuenta prefiere la de moral, que es el caso común (Cloudflare, AWS).
 */
export function tipoDeProveedor(p: ProveedorParaLaCuenta | null | undefined): TipoDeProveedor {
    const rfc = (p?.rfc ?? '').trim().toUpperCase();
    const pais = (p?.country ?? '').trim().toUpperCase();
    if (rfc === RFC_GENERICO_EXTRANJERO || (pais !== '' && pais !== 'MX')) return 'EXTRANJERO';
    if (rfc === '' || rfc === RFC_GENERICO_NACIONAL) return 'DESCONOCIDO';
    if (rfc.length === 12) return 'MORAL';
    if (rfc.length === 13) return 'FISICA';
    return 'DESCONOCIDO';
}

/** La cuenta que toca el renglón de un gasto con este concepto y este proveedor. */
export function cuentaDelConcepto(c: ConceptoConCuentas, proveedor?: ProveedorParaLaCuenta | null): string {
    switch (tipoDeProveedor(proveedor)) {
        case 'MORAL':
            return c.ledgerAccountCodeCompany || c.ledgerAccountCode;
        case 'EXTRANJERO':
            return c.ledgerAccountCodeForeignCompany || c.ledgerAccountCodeForeignIndividual || c.ledgerAccountCode;
        default:
            return c.ledgerAccountCode;
    }
}

// ── El combo ─────────────────────────────────────────────────────────────────────────────────

/** Cuántos se enseñan arriba, antes de «Mostrar todos». */
export const CONCEPTOS_FRECUENTES_A_LA_VISTA = 10;

/** Orden y nombre de los grupos de «Mostrar todos». */
export const GRUPOS_DE_CONCEPTO: readonly { readonly group: ExpenseConceptGroup; readonly label: string }[] = [
    { group: 'OPERACION', label: 'Operación' },
    { group: 'PERSONAL', label: 'Personal' },
    { group: 'IMPUESTOS', label: 'Impuestos y derechos' },
    { group: 'FINANCIEROS', label: 'Financieros' },
    { group: 'NO_DEDUCIBLES', label: 'No deducibles' },
];

/** Lo que el combo necesita de cada concepto. */
export interface ConceptoParaElegir {
    readonly id: string;
    readonly name: string;
    readonly group: ExpenseConceptGroup;
    readonly frequent: boolean;
    readonly isSystem: boolean;
    /** Veces que este negocio lo usó en los últimos 90 días. */
    readonly recentUses?: number;
}

export interface ConceptosOrdenados<T extends ConceptoParaElegir> {
    /** Los de arriba: primero los más usados por el negocio, luego los frecuentes de fábrica. */
    readonly frecuentes: readonly T[];
    /** Todos, por grupo y por nombre. Los grupos vacíos no salen. */
    readonly grupos: readonly { readonly group: ExpenseConceptGroup; readonly label: string; readonly conceptos: readonly T[] }[];
}

const porNombre = (a: ConceptoParaElegir, b: ConceptoParaElegir) => a.name.localeCompare(b.name, 'es');

/**
 * Ordena para el combo. Arriba van hasta {@link CONCEPTOS_FRECUENTES_A_LA_VISTA}:
 *
 * 1. lo que el negocio usó, del más usado al menos;
 * 2. los frecuentes de fábrica que no se usaron.
 *
 * «Otros gastos» siempre cierra la lista, para que no gane por costumbre a uno mejor.
 */
export function ordenarConceptos<T extends ConceptoParaElegir>(conceptos: readonly T[]): ConceptosOrdenados<T> {
    const otros = conceptos.filter((c) => c.isSystem);
    const resto = conceptos.filter((c) => !c.isSystem);
    const usados = resto
        .filter((c) => (c.recentUses ?? 0) > 0)
        .sort((a, b) => (b.recentUses ?? 0) - (a.recentUses ?? 0) || porNombre(a, b));
    const deFabrica = resto.filter((c) => c.frequent && !(c.recentUses ?? 0));
    const cupo = CONCEPTOS_FRECUENTES_A_LA_VISTA - otros.length;
    const frecuentes = [...usados, ...deFabrica].slice(0, Math.max(cupo, 0)).concat(otros);

    const grupos = GRUPOS_DE_CONCEPTO.map(({ group, label }) => ({
        group,
        label,
        // Sin grupo (un concepto de una API anterior al desvío E) cuenta como Operación.
        conceptos: conceptos.filter((c) => (c.group ?? 'OPERACION') === group).sort((a, b) => Number(a.isSystem) - Number(b.isSystem) || porNombre(a, b)),
    })).filter((g) => g.conceptos.length > 0);

    return { frecuentes, grupos };
}
