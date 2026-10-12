import { describe, expect, it } from 'vitest';
import {
    huecoDeAjuste,
    inventorySettingsSchema,
    applyStockAdjustmentSchema,
    WAREHOUSE_INVENTORY_SLOT,
    INVENTORY_REPORT_SCHEMAS,
} from '../../src/inventory/index.js';

/** Espejo en Contabilidad: `StockMovementPosting.contrapartida` cuando se construya la fase. */
describe('huecoDeAjuste', () => {
    it('un conteo es una diferencia de inventario, entre o salga', () => {
        expect(huecoDeAjuste('COUNT', 'COUNT')).toBe('INVENTORY_ADJUSTMENT');
    });
    it('el inventario inicial va contra capital', () => {
        expect(huecoDeAjuste('ADJUSTMENT', 'OPENING')).toBe('INVENTORY_OPENING');
    });
    it('cada pérdida a su cuenta', () => {
        expect(huecoDeAjuste('ADJUSTMENT', 'THEFT')).toBe('INVENTORY_THEFT');
        expect(huecoDeAjuste('ADJUSTMENT', 'INTERNAL_USE')).toBe('INVENTORY_INTERNAL_USE');
        expect(huecoDeAjuste('ADJUSTMENT', 'EXPIRED')).toBe('INVENTORY_SHRINKAGE');
        expect(huecoDeAjuste('ADJUSTMENT', 'DAMAGE')).toBe('INVENTORY_SHRINKAGE');
    });
    it('corregir una captura no es merma', () => {
        expect(huecoDeAjuste('ADJUSTMENT', 'CORRECTION')).toBe('INVENTORY_ADJUSTMENT');
        expect(huecoDeAjuste('ADJUSTMENT', 'OTHER')).toBe('INVENTORY_ADJUSTMENT');
    });
});

describe('Configuración contable de Inventario', () => {
    it('sin la sección, se bloquea el periodo cerrado y el traspaso entre empresas', () => {
        const s = inventorySettingsSchema.parse({ costing: {}, negativeStock: {}, lots: {}, alerts: {}, counts: {}, abc: {}, labels: {} });
        expect(s.accounting.closedPeriodPolicy).toBe('BLOCK');
        expect(s.accounting.crossCompanyTransfers).toBe('BLOCK');
    });
    it('la bodega de producción es materia prima', () => {
        expect(WAREHOUSE_INVENTORY_SLOT.PRODUCTION).toBe('INVENTORY_RAW');
        expect(WAREHOUSE_INVENTORY_SLOT.STORE).toBe('INVENTORY');
    });
    it('aplicar acepta fecha efectiva y soporte de la baja', () => {
        const r = applyStockAdjustmentSchema.parse({
            version: 2,
            effectiveAt: '2026-08-31',
            evidence: [{ kind: 'POLICE_REPORT', reference: 'CI-PUE-2026-0412' }],
        });
        expect(r.effectiveAt).toBeInstanceOf(Date);
        expect(r.evidence![0]!.kind).toBe('POLICE_REPORT');
    });
    it('la conciliación pide una empresa', () => {
        expect(INVENTORY_REPORT_SCHEMAS.ACCOUNTING_RECONCILIATION.safeParse({ asOf: '2026-08-31' }).success).toBe(false);
    });
});
