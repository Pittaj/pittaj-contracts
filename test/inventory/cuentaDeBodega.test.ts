import { describe, expect, it } from 'vitest';
import { cuentaDeInventarioDeBodega, HUECO_FALTANTE_DE_TRASPASO } from '../../src/inventory/index.js';
import { POSTING_SWEEPS } from '../../src/accounting/index.js';

describe('cuentaDeInventarioDeBodega (I4b)', () => {
    it('una bodega sin tipo (anterior a I4) es de mercancía', () => {
        expect(cuentaDeInventarioDeBodega({})).toBe('INVENTORY');
        expect(cuentaDeInventarioDeBodega({ type: null, inventoryAccountSlot: null })).toBe('INVENTORY');
    });
    it('producción es materia prima; el resto, mercancía', () => {
        expect(cuentaDeInventarioDeBodega({ type: 'PRODUCTION' })).toBe('INVENTORY_RAW');
        expect(cuentaDeInventarioDeBodega({ type: 'WAREHOUSE' })).toBe('INVENTORY');
        expect(cuentaDeInventarioDeBodega({ type: 'QUARANTINE' })).toBe('INVENTORY');
    });
    it('la cuenta corregida en la bodega gana sobre la de su tipo', () => {
        expect(cuentaDeInventarioDeBodega({ type: 'STORE', inventoryAccountSlot: 'INVENTORY_FINISHED' })).toBe('INVENTORY_FINISHED');
        expect(cuentaDeInventarioDeBodega({ type: 'PRODUCTION', inventoryAccountSlot: 'INVENTORY' })).toBe('INVENTORY');
    });
    it('el faltante de un traspaso es merma, no robo', () => {
        expect(HUECO_FALTANTE_DE_TRASPASO).toBe('INVENTORY_SHRINKAGE');
    });
    it('el motor tiene barrido de traspasos', () => {
        expect(POSTING_SWEEPS.map((s) => s.key)).toContain('stock-transfers');
    });
});
