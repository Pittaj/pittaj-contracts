import { describe, expect, it } from 'vitest';
import { sourceTypeDeAjuste } from '../../src/inventory/schemas/stockAdjustment.schema.js';

/**
 * El tipo de movimiento decide la póliza (accounting/StockMovementPosting): INITIAL va contra
 * capital, MERMA/ADJUSTMENT/COUNT contra resultados. Espejo en el escritorio:
 * `StockAdjustmentTests.TipoDeMovimiento_*`.
 */
describe('sourceTypeDeAjuste', () => {
    it('un conteo siempre es COUNT, entre o salga', () => {
        expect(sourceTypeDeAjuste('COUNT', 'COUNT', 'IN')).toBe('COUNT');
        expect(sourceTypeDeAjuste('COUNT', 'SHRINKAGE', 'OUT')).toBe('COUNT');
    });

    it('el inventario inicial es INITIAL: no es pérdida del periodo', () => {
        expect(sourceTypeDeAjuste('ADJUSTMENT', 'OPENING', 'IN')).toBe('INITIAL');
    });

    it('una pérdida que sale es MERMA; si entra (se encontró) es ajuste', () => {
        for (const r of ['SHRINKAGE', 'DAMAGE', 'THEFT', 'EXPIRED', 'INTERNAL_USE'] as const) {
            expect(sourceTypeDeAjuste('ADJUSTMENT', r, 'OUT')).toBe('MERMA');
            expect(sourceTypeDeAjuste('ADJUSTMENT', r, 'IN')).toBe('ADJUSTMENT');
        }
    });

    it('corrección y otro son ajuste en las dos direcciones', () => {
        expect(sourceTypeDeAjuste('ADJUSTMENT', 'CORRECTION', 'OUT')).toBe('ADJUSTMENT');
        expect(sourceTypeDeAjuste('ADJUSTMENT', 'OTHER', 'IN')).toBe('ADJUSTMENT');
    });
});
