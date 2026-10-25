import { describe, expect, it } from 'vitest';
import {
    aClavesDeInventario,
    decidirExistencia,
    deClavesDeInventario,
    INVENTORY_SETTINGS_DEFAULT,
    revisarSalidas,
    updateInventorySettingsSchema,
} from '../../src/inventory/index.js';

/** Espejo en el escritorio: `ConfiguracionDeInventarioTests.cs`, mismas claves y mismos casos. */
describe('configuración de Inventario como claves', () => {
    it('sin claves rige todo por omisión', () => {
        const doc = deClavesDeInventario({});
        expect(doc).toEqual(INVENTORY_SETTINGS_DEFAULT);
        expect(doc.negativeStock.policy).toBe('ALLOW');
        expect(doc.accounting.closedPeriodPolicy).toBe('BLOCK');
        expect(doc.costing.costDecimals).toBe(4);
    });

    it('ida y vuelta conserva el documento, y cada valor cabe en una clave', () => {
        const doc = {
            ...INVENTORY_SETTINGS_DEFAULT,
            negativeStock: { policy: 'BLOCK' as const },
            accounting: {
                ...INVENTORY_SETTINGS_DEFAULT.accounting,
                closedPeriodPolicy: 'POST_IN_OPEN' as const,
            },
        };
        const claves = aClavesDeInventario(doc);
        expect(claves['inventory.negativeStock.policy']).toBe('"BLOCK"');
        expect(claves['inventory.accounting.closedPeriodPolicy']).toBe('"POST_IN_OPEN"');
        expect(claves['inventory.labels.defaultTemplateId']).toBe('null');
        for (const [k, v] of Object.entries(claves)) {
            expect(k.length).toBeLessThanOrEqual(100);
            expect(v.length).toBeLessThanOrEqual(500);
        }
        expect(deClavesDeInventario(claves)).toEqual(deClavesDeInventario(aClavesDeInventario(doc)));
        expect(deClavesDeInventario(claves).negativeStock.policy).toBe('BLOCK');
    });

    it('una clave rota o desconocida toma su valor por omisión sin tirar las demás', () => {
        const doc = deClavesDeInventario({
            'inventory.negativeStock.policy': '"WARN"',
            'inventory.costing.costDecimals': 'no-es-json',
            'inventory.abc.cutoffA': '"ochenta"',
            'inventory.accounting.crossCompanyTransfers': '"INTERCOMPANY_SALE"',
        });
        expect(doc.negativeStock.policy).toBe('WARN');
        expect(doc.costing.costDecimals).toBe(4);
        expect(doc.abc.cutoffA).toBe(80);
        expect(doc.accounting.crossCompanyTransfers).toBe('BLOCK');
    });

    it('el PUT exige cortes en orden y no deja encender la venta entre empresas', () => {
        const base = INVENTORY_SETTINGS_DEFAULT;
        expect(updateInventorySettingsSchema.safeParse(base).success).toBe(true);
        expect(
            updateInventorySettingsSchema.safeParse({
                ...base,
                abc: { ...base.abc, cutoffA: 96 },
            }).success,
        ).toBe(false);
        expect(
            updateInventorySettingsSchema.safeParse({
                ...base,
                accounting: {
                    ...base.accounting,
                    crossCompanyTransfers: 'INTERCOMPANY_SALE',
                },
            }).success,
        ).toBe(false);
    });
});

describe('decidirExistencia', () => {
    it('quedarse en cero no es negativo', () => {
        expect(decidirExistencia('BLOCK', 3, 3)).toBe('OK');
    });
    it('bajo cero decide la política', () => {
        expect(decidirExistencia('ALLOW', 2, 3)).toBe('OK');
        expect(decidirExistencia('WARN', 2, 3)).toBe('WARN');
        expect(decidirExistencia('BLOCK', 2, 3)).toBe('BLOCK');
        expect(decidirExistencia('BLOCK', -1, 0.5)).toBe('BLOCK');
    });
    it('una entrada o nada no se detiene nunca', () => {
        expect(decidirExistencia('BLOCK', -5, 0)).toBe('OK');
        expect(decidirExistencia('BLOCK', -5, -2)).toBe('OK');
    });
});

describe('revisarSalidas', () => {
    const hay = new Map([['pan', 3]]);
    it('suma por producto y el resultado es la política', () => {
        const r = revisarSalidas('WARN', hay, [
            { productId: 'pan', productName: 'Pan', cantidad: 2 },
            { productId: 'pan', productName: 'Pan', cantidad: 2 },
            { productId: 'leche', productName: 'Leche', cantidad: 1 },
        ]);
        expect(r.result).toBe('WARN');
        expect(r.faltantes).toEqual([
            { productId: 'pan', productName: 'Pan', hay: 3, sale: 4 },
            { productId: 'leche', productName: 'Leche', hay: 0, sale: 1 },
        ]);
    });
    it('alcanza → OK; con ALLOW no revisa', () => {
        expect(revisarSalidas('BLOCK', hay, [{ productId: 'pan', productName: 'Pan', cantidad: 3 }])).toEqual({
            policy: 'BLOCK',
            result: 'OK',
            faltantes: [],
        });
        expect(revisarSalidas('ALLOW', hay, [{ productId: 'pan', productName: 'Pan', cantidad: 9 }]).faltantes).toEqual([]);
    });
});
