/**
 * Desvío E · la cuenta sale del RFC y el combo ordena. Los mismos vectores viven en el escritorio
 * (`CuentaDelConceptoTests.cs`).
 */
import { describe, expect, it } from 'vitest';
import {
    cuentaDelConcepto,
    tipoDeProveedor,
    ordenarConceptos,
    CONCEPTOS_FRECUENTES_A_LA_VISTA,
    SEED_EXPENSE_CONCEPTS,
    EXPENSE_CONCEPT_GROUPS,
    esCuentaDeGasto,
    createExpenseConceptSchema,
    type ConceptoParaElegir,
} from '../../src/expense-concept/index.js';

const renta = SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'RENT')!;
const honorarios = SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'FEES')!;
const intereses = SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'LOAN_INTEREST')!;
const luz = SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'ELECTRICITY')!;

describe('tipoDeProveedor', () => {
    it.each([
        ['SAAL870512MJ8', null, 'FISICA'],
        ['MLE1702168U1', null, 'MORAL'],
        ['mle1702168u1', 'MX', 'MORAL'],
        ['XEXX010101000', null, 'EXTRANJERO'],
        [null, 'US', 'EXTRANJERO'],
        ['XAXX010101000', null, 'DESCONOCIDO'],
        [null, null, 'DESCONOCIDO'],
        ['ABC', null, 'DESCONOCIDO'],
    ] as const)('%s / %s → %s', (rfc, country, esperado) => {
        expect(tipoDeProveedor({ rfc, country })).toBe(esperado);
    });
});

describe('cuentaDelConcepto — el agrupador depende de a quién se le paga', () => {
    it('renta: física 601-02 (601.45), moral 601-31 (601.46), extranjero 601-32 (601.47)', () => {
        expect(cuentaDelConcepto(renta, { rfc: 'SAAL870512MJ8' })).toBe('601-02');
        expect(cuentaDelConcepto(renta, { rfc: 'MLE1702168U1' })).toBe('601-31');
        expect(cuentaDelConcepto(renta, { rfc: 'XEXX010101000' })).toBe('601-32');
    });
    it('honorarios del extranjero prefieren la de moral', () => {
        expect(cuentaDelConcepto(honorarios, { rfc: null, country: 'US' })).toBe('601-35');
        expect(cuentaDelConcepto(honorarios, { rfc: 'MLE1702168U1' })).toBe('601-33');
    });
    it('Mercado Lending (moral) → intereses a personas morales 701-04 (701.08)', () => {
        expect(cuentaDelConcepto(intereses, { rfc: 'MLE1702168U1' })).toBe('701-04');
        expect(cuentaDelConcepto(intereses, { rfc: 'SAAL870512MJ8' })).toBe('701-05');
        // Sin variante del extranjero: cae a la de omisión.
        expect(cuentaDelConcepto(intereses, { country: 'US' })).toBe('701-05');
    });
    it('sin variantes, sin proveedor o con RFC genérico: la cuenta por omisión', () => {
        expect(cuentaDelConcepto(luz, { rfc: 'CSS160330CP7' })).toBe('601-03');
        expect(cuentaDelConcepto(renta, null)).toBe('601-02');
        expect(cuentaDelConcepto(renta, { rfc: 'XAXX010101000' })).toBe('601-02');
    });
});

describe('la semilla del desvío E', () => {
    it('grupos válidos, variantes de gasto y ninguna cuenta repetida', () => {
        const cuentas = SEED_EXPENSE_CONCEPTS.map((c) => c.ledgerAccountCode);
        expect(new Set(cuentas).size).toBe(cuentas.length);
        for (const c of SEED_EXPENSE_CONCEPTS) {
            expect(EXPENSE_CONCEPT_GROUPS).toContain(c.group);
            for (const v of [c.ledgerAccountCodeCompany, c.ledgerAccountCodeForeignIndividual, c.ledgerAccountCodeForeignCompany]) {
                if (v) expect(esCuentaDeGasto(v)).toBe(true);
            }
        }
    });
    it('caben los frecuentes de fábrica y «Otros gastos» es uno de ellos', () => {
        const frecuentes = SEED_EXPENSE_CONCEPTS.filter((c) => c.frequent);
        expect(frecuentes.length).toBeLessThanOrEqual(CONCEPTOS_FRECUENTES_A_LA_VISTA + 2);
        expect(frecuentes.some((c) => c.isSystem)).toBe(true);
    });
    it('la gasolina no se ofrece en caja; el gas sí', () => {
        expect(SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'FUEL')!.offeredAtCash).toBe(false);
        expect(SEED_EXPENSE_CONCEPTS.find((c) => c.code === 'GAS')!.offeredAtCash).toBe(true);
    });
});

describe('ordenarConceptos', () => {
    const c = (id: string, extra: Partial<ConceptoParaElegir> = {}): ConceptoParaElegir => ({
        id, name: id, group: 'OPERACION', frequent: false, isSystem: false, ...extra,
    });

    it('lo usado va primero, luego los de fábrica, y «Otros» cierra', () => {
        const r = ordenarConceptos([
            c('Otros', { isSystem: true, frequent: true }),
            c('Luz', { frequent: true }),
            c('Gas', { recentUses: 3 }),
            c('Renta', { frequent: true, recentUses: 7 }),
            c('Predial', { group: 'IMPUESTOS' }),
        ]);
        expect(r.frecuentes.map((x) => x.id)).toEqual(['Renta', 'Gas', 'Luz', 'Otros']);
    });
    it('no pasa del cupo', () => {
        const muchos = Array.from({ length: 30 }, (_, i) => c(`C${String(i).padStart(2, '0')}`, { frequent: true }));
        const r = ordenarConceptos([...muchos, c('Otros', { isSystem: true })]);
        expect(r.frecuentes).toHaveLength(CONCEPTOS_FRECUENTES_A_LA_VISTA);
        expect(r.frecuentes.at(-1)!.id).toBe('Otros');
    });
    it('un concepto sin grupo (API anterior al desvío E) sale en Operación, no desaparece', () => {
        const sinGrupo = { id: 'Renta', name: 'Renta', frequent: false, isSystem: false } as unknown as ConceptoParaElegir;
        const r = ordenarConceptos([sinGrupo]);
        expect(r.grupos.map((g) => g.group)).toEqual(['OPERACION']);
        expect(r.grupos[0]!.conceptos).toHaveLength(1);
    });
    it('«Mostrar todos» agrupa en el orden del catálogo y omite los grupos vacíos', () => {
        const r = ordenarConceptos([c('Predial', { group: 'IMPUESTOS' }), c('Agua'), c('Abarrotes', { group: 'OPERACION' })]);
        expect(r.grupos.map((g) => g.group)).toEqual(['OPERACION', 'IMPUESTOS']);
        expect(r.grupos[0]!.conceptos.map((x) => x.id)).toEqual(['Abarrotes', 'Agua']);
    });
});

describe('createExpenseConceptSchema con lo del desvío E', () => {
    const ID = '11111111-1111-4111-8111-111111111111';
    it('pone grupo, frecuente y variantes por omisión', () => {
        const r = createExpenseConceptSchema.parse({ id: ID, name: 'Gas del horno', ledgerAccountCode: '601-16' });
        expect(r.group).toBe('OPERACION');
        expect(r.frequent).toBe(false);
        expect(r.ledgerAccountCodeCompany).toBeNull();
    });
    it('una variante vacía del formulario es «sin variante» y una de balance se rechaza', () => {
        expect(createExpenseConceptSchema.parse({ id: ID, name: 'Renta bodega', ledgerAccountCode: '601-02', ledgerAccountCodeCompany: '' }).ledgerAccountCodeCompany).toBeNull();
        expect(createExpenseConceptSchema.safeParse({ id: ID, name: 'Renta bodega', ledgerAccountCode: '601-02', ledgerAccountCodeCompany: '115-01' }).success).toBe(false);
    });
});
