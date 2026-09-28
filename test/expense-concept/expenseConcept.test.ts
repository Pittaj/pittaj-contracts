import { describe, expect, it } from 'vitest';
import {
    createExpenseConceptSchema,
    esCuentaDeGasto,
    expenseConceptRefSchema,
    SEED_EXPENSE_CONCEPTS,
    EXPENSE_CONCEPT_OTHER_CODE,
} from '../../src/expense-concept/index.js';
import { purchaseLineInputSchema } from '../../src/purchase/schemas/createPurchase.schema.js';

const ID = '11111111-1111-4111-8111-111111111111';

describe('esCuentaDeGasto — un concepto solo carga a resultados', () => {
    it('acepta 6xx y 7xx', () => {
        expect(esCuentaDeGasto('601-03')).toBe(true);
        expect(esCuentaDeGasto('701-01')).toBe(true);
        expect(esCuentaDeGasto('601-03-01')).toBe(true);
    });
    it('rechaza cuentas de balance y formatos raros', () => {
        expect(esCuentaDeGasto('115-01')).toBe(false); // inventario
        expect(esCuentaDeGasto('102-01')).toBe(false); // bancos
        expect(esCuentaDeGasto('601')).toBe(false);
        expect(esCuentaDeGasto('601.03')).toBe(false);
    });
});

describe('createExpenseConceptSchema', () => {
    it('acepta lo mínimo y pone offeredAtCash en false', () => {
        const r = createExpenseConceptSchema.parse({ id: ID, name: 'Gas LP del horno', ledgerAccountCode: '601-09' });
        expect(r.offeredAtCash).toBe(false);
    });
    it('rechaza una cuenta de balance con un mensaje que se entiende', () => {
        const r = createExpenseConceptSchema.safeParse({ id: ID, name: 'Mercancía', ledgerAccountCode: '115-01' });
        expect(r.success).toBe(false);
        expect(JSON.stringify(r.error?.issues)).toContain('Solo cuentas de gastos');
    });
    it('una línea vacía del formulario es «sin línea»', () => {
        const r = createExpenseConceptSchema.parse({ id: ID, name: 'Luz', ledgerAccountCode: '601-03', businessLineId: '' });
        expect(r.businessLineId).toBeNull();
    });
});

describe('la semilla', () => {
    it('trae un solo concepto del sistema y es «Otros gastos» en 601-09', () => {
        const delSistema = SEED_EXPENSE_CONCEPTS.filter((c) => c.isSystem);
        expect(delSistema).toHaveLength(1);
        expect(delSistema[0]!.code).toBe(EXPENSE_CONCEPT_OTHER_CODE);
        expect(delSistema[0]!.ledgerAccountCode).toBe('601-09');
    });
    it('toda cuenta sembrada es de gasto y no se repiten claves ni nombres', () => {
        for (const c of SEED_EXPENSE_CONCEPTS) expect(esCuentaDeGasto(c.ledgerAccountCode)).toBe(true);
        expect(new Set(SEED_EXPENSE_CONCEPTS.map((c) => c.code)).size).toBe(SEED_EXPENSE_CONCEPTS.length);
        expect(new Set(SEED_EXPENSE_CONCEPTS.map((c) => c.name)).size).toBe(SEED_EXPENSE_CONCEPTS.length);
    });
});

describe('el renglón de compra lleva concepto y línea', () => {
    it('los acepta y convierte el vacío en nulo', () => {
        const r = purchaseLineInputSchema.parse({
            productName: 'Suministro de energía eléctrica', quantity: 1, unitCost: 6840,
            expenseConceptId: ID, businessLineId: '',
        });
        expect(r.expenseConceptId).toBe(ID);
        expect(r.businessLineId).toBeNull();
    });
    it('sin ellos sigue siendo válido (un renglón de mercancía no los manda)', () => {
        const r = purchaseLineInputSchema.parse({ productName: 'Corona', quantity: 24, unitCost: 302 });
        expect(r.expenseConceptId).toBeUndefined();
    });
});

it('refSchema: ausente es undefined, vacío es null', () => {
    expect(expenseConceptRefSchema.parse(undefined)).toBeUndefined();
    expect(expenseConceptRefSchema.parse('')).toBeNull();
});
