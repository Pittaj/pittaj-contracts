import { describe, expect, it } from 'vitest';
import {
    importesDelRenglonDeApartado,
    totalDelRenglonDeApartado,
    impuestosDelRenglonDeApartadoSchema,
} from '../../src/layaway/impuestosDelRenglon.js';

describe('D7h1 · renglón del apartado con snapshot fiscal', () => {
    it('con IVA incluido, vale lo de etiqueta y desglosa el IVA', () => {
        const r = importesDelRenglonDeApartado({ quantity: 2, unitPrice: 116, impuestos: { taxPercent: 0.16, taxIncluded: true } });
        expect(r).toMatchObject({ total: 232, base: 200, iva: 32 });
    });

    it('con IVA aparte, el total suma el IVA (el apartado viejo lo perdía)', () => {
        expect(totalDelRenglonDeApartado({ quantity: 2, unitPrice: 100, impuestos: { taxPercent: 16, taxIncluded: false } })).toBe(232);
    });

    it('con IEPS por cuota y descuento, la misma cuenta del ticket', () => {
        const r = importesDelRenglonDeApartado({
            quantity: 3, unitPrice: 20, impuestos: {
                taxPercent: 0.16, taxIncluded: true, iepsFactor: 'Cuota', iepsPercent: 1.6451, unitFactor: 2, discountPercent: 10,
            },
        })!;
        expect(r.total).toBe(54);
        expect(r.ieps).toBe(9.87);
        expect(Math.round((r.base + r.ieps + r.iva) * 100) / 100).toBe(54);
    });

    it('sin snapshot (apartado viejo) vale cantidad × precio', () => {
        expect(importesDelRenglonDeApartado({ quantity: 2, unitPrice: 10.5 })).toBeNull();
        expect(totalDelRenglonDeApartado({ quantity: 2, unitPrice: 10.5 })).toBe(21);
    });

    it('el schema rechaza un factor de IEPS inventado', () => {
        expect(impuestosDelRenglonDeApartadoSchema.safeParse({ taxPercent: 0.16, taxIncluded: true, iepsFactor: 'Exento' }).success).toBe(false);
    });
});
