/**
 * @fileoverview Cuánto se debe y desde cuándo.
 *
 * Lo que se prueba aquí es dinero que alguien va a reclamar. Un saldo mal derivado no da error:
 * paga de más, o deja al proveedor cobrando algo que ya cobró.
 *
 * Espejo de `CuentasPorPagarTests.cs` del escritorio.
 */

import { describe, it, expect } from 'vitest';
import {
    saldoDeDocumento,
    estaSaldado,
    cubetaDeAntiguedad,
    diasDeAtraso,
    sinAplicar,
} from '../../src/purchase/cuentasPorPagar';

describe('El saldo de un documento', () => {
    it('es total más notas menos pagado', () => {
        const s = saldoDeDocumento(1160, -160, 500);

        expect(s.saldo).toBe(500);
        expect(s.total).toBe(1160);
        expect(s.notas).toBe(-160);
    });

    it('las notas se enseñan aparte, no restadas del total', () => {
        // Un renglón que no cuadra con la factura que el proveedor tiene sobre la mesa, y que no
        // explica por qué, es un renglón que nadie se cree.
        const s = saldoDeDocumento(1000, -200, 0);

        expect(s.total).toBe(1000);
        expect(s.notas).toBe(-200);
        expect(s.saldo).toBe(800);
    });

    it('una nota de débito SUMA', () => {
        const s = saldoDeDocumento(1000, 150, 0);
        expect(s.saldo).toBe(1150);
    });

    it('pagar de más no genera saldo negativo', () => {
        // 🔴 Eso es un anticipo, y vive en el pago sin aplicar. Un saldo negativo en el documento
        // se sumaría a la cartera como si el proveedor te debiera a ti.
        const s = saldoDeDocumento(1000, 0, 1200);
        expect(s.saldo).toBe(0);
    });

    it('saldado tolera el céntimo', () => {
        expect(estaSaldado(0)).toBe(true);
        expect(estaSaldado(0.004)).toBe(true);
        expect(estaSaldado(0.01)).toBe(false);
    });

    it('no arrastra basura de coma flotante', () => {
        const s = saldoDeDocumento(0.1 + 0.2, 0, 0);
        expect(s.total).toBe(0.3);
    });
});

describe('Días de atraso', () => {
    const hoy = new Date('2026-09-15T10:00:00');

    it('cuenta desde el vencimiento', () => {
        expect(diasDeAtraso('2026-09-05T12:00:00Z', hoy)).toBe(10);
    });

    it('vencer hoy todavía no es atraso', () => {
        expect(diasDeAtraso('2026-09-15T12:00:00Z', hoy)).toBe(0);
    });

    it('lo que no ha vencido no tiene atraso', () => {
        expect(diasDeAtraso('2026-09-30T12:00:00Z', hoy)).toBe(0);
    });

    it('de contado no tiene atraso nunca', () => {
        expect(diasDeAtraso(null, hoy)).toBe(0);
    });
});

describe('Las cubetas', () => {
    it('reparten por días de atraso, no por antigüedad del documento', () => {
        // Una factura a 30 días emitida hace 40 lleva 10 de atraso, no 40 — y esa diferencia es la
        // que decide si hay que llamar al proveedor.
        expect(cubetaDeAntiguedad(0)).toBe('POR_VENCER');
        expect(cubetaDeAntiguedad(1)).toBe('D1_30');
        expect(cubetaDeAntiguedad(30)).toBe('D1_30');
        expect(cubetaDeAntiguedad(31)).toBe('D31_60');
        expect(cubetaDeAntiguedad(60)).toBe('D31_60');
        expect(cubetaDeAntiguedad(61)).toBe('D61_90');
        expect(cubetaDeAntiguedad(90)).toBe('D61_90');
        expect(cubetaDeAntiguedad(91)).toBe('D90_MAS');
        expect(cubetaDeAntiguedad(400)).toBe('D90_MAS');
    });

    it('lo que no ha vencido cae en «por vencer», no fuera de la tabla', () => {
        expect(cubetaDeAntiguedad(-5)).toBe('POR_VENCER');
    });
});

describe('Lo que queda sin aplicar', () => {
    it('es el anticipo', () => {
        expect(sinAplicar(1000, 600)).toBe(400);
    });

    it('nunca es negativo', () => {
        expect(sinAplicar(1000, 1200)).toBe(0);
    });

    it('cero cuando se aplicó todo', () => {
        expect(sinAplicar(1000, 1000)).toBe(0);
    });
});
