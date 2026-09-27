import { describe, expect, it } from 'vitest';
import {
    upsertStockLevelSchema,
    serialNumbersSchema,
    updateInventorySettingsSchema,
    inventorySettingsSchema,
    createWarehouseSchema,
    traceabilityReportSchema,
} from '../../src/inventory/index.js';
import { saveProductVariantsSchema } from '../../src/product/index.js';

const P = '11111111-1111-4111-8111-111111111111';
const W = '22222222-2222-4222-8222-222222222222';

describe('Niveles de existencia', () => {
    it('el mínimo no pasa del máximo', () => {
        expect(upsertStockLevelSchema.safeParse({ productId: P, warehouseId: W, minStock: 10, maxStock: 5 }).success).toBe(false);
    });
    it('máximo cero = sin tope', () => {
        expect(upsertStockLevelSchema.safeParse({ productId: P, warehouseId: W, minStock: 10, maxStock: 0 }).success).toBe(true);
    });
    it('acepta decimales (2.5 kg)', () => {
        expect(upsertStockLevelSchema.parse({ productId: P, warehouseId: W, minStock: 2.5 }).minStock).toBe(2.5);
    });
});

describe('Series', () => {
    it('una serie repetida (sin distinguir mayúsculas) se rechaza', () => {
        expect(serialNumbersSchema.safeParse(['ab1', 'AB1']).success).toBe(false);
        expect(serialNumbersSchema.safeParse(['ab1', 'ab2']).success).toBe(true);
    });
});

describe('Configuración', () => {
    it('los defaults salen de un objeto con secciones vacías', () => {
        const s = inventorySettingsSchema.parse({ costing: {}, negativeStock: {}, lots: {}, alerts: {}, counts: {}, abc: {}, labels: {} });
        expect(s.costing.valuationMethod).toBe('AVERAGE');
        expect(s.lots.pickingPolicy).toBe('FEFO');
        expect(s.negativeStock.policy).toBe('ALLOW');
    });
    it('el corte A es menor que el B', () => {
        const r = updateInventorySettingsSchema.safeParse({
            costing: {}, negativeStock: {}, lots: {}, alerts: {}, counts: {}, labels: {},
            abc: { cutoffA: 96, cutoffB: 95 },
            version: 1,
        });
        expect(r.success).toBe(false);
    });
    it('PEPS todavía no se acepta', () => {
        expect(inventorySettingsSchema.shape.costing.safeParse({ valuationMethod: 'FIFO' }).success).toBe(false);
    });
});

describe('Bodegas', () => {
    it('las ubicaciones (pasillo/anaquel) todavía no se activan', () => {
        expect(createWarehouseSchema.safeParse({ id: W, name: 'Centro', usesBins: true }).success).toBe(false);
        expect(createWarehouseSchema.parse({ id: W, name: 'Centro' }).type).toBe('STORE');
    });
});

describe('Trazabilidad', () => {
    it('pide un lote o una serie', () => {
        expect(traceabilityReportSchema.safeParse({}).success).toBe(false);
        expect(traceabilityReportSchema.safeParse({ serialNumber: 'X1' }).success).toBe(true);
    });
});

describe('Variantes', () => {
    const attributes = [
        { name: 'Talla', values: ['M', 'G'] },
        { name: 'Color', values: ['Negro'] },
    ];
    const v = (id: string, talla: string) => ({ id, values: { Talla: talla, Color: 'Negro' }, code: `PL-${talla}-N` });

    it('una combinación repetida se rechaza', () => {
        const r = saveProductVariantsSchema.safeParse({
            attributes,
            variants: [v('33333333-3333-4333-8333-333333333333', 'M'), v('44444444-4444-4444-8444-444444444444', 'M')],
            version: 0,
        });
        expect(r.success).toBe(false);
    });
    it('a cada variante le toca un valor por atributo', () => {
        const r = saveProductVariantsSchema.safeParse({
            attributes,
            variants: [{ id: '33333333-3333-4333-8333-333333333333', values: { Talla: 'M' }, code: 'PL-M' }],
            version: 0,
        });
        expect(r.success).toBe(false);
    });
});
