import { describe, expect, it } from 'vitest';
import {
    precioEntreEmpresas,
    semillaDeCompraEntreEmpresas,
    semillaDeVentaEntreEmpresas,
} from '../../src/inventory/index.js';

describe('precioEntreEmpresas (2.86.0)', () => {
    it('es el costo más el margen, a cuatro decimales', () => {
        expect(precioEntreEmpresas(100, 0)).toBe(100);
        expect(precioEntreEmpresas(100, 15)).toBe(115);
        expect(precioEntreEmpresas(12.3456, 10)).toBe(13.5802);
    });

    it('un margen negativo o raro vende al costo', () => {
        expect(precioEntreEmpresas(50, -5)).toBe(50);
        expect(precioEntreEmpresas(50, Number.NaN)).toBe(50);
    });

    it('las semillas de la venta y la compra son distintas y dependen del traspaso', () => {
        expect(semillaDeVentaEntreEmpresas('t1')).toBe('intercompany:sale:t1');
        expect(semillaDeCompraEntreEmpresas('t1')).toBe('intercompany:purchase:t1');
    });
});
