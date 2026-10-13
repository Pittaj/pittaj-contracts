import { describe, expect, it } from 'vitest';
import { avisoDeVencimiento } from '../../src/sat-download/satCredential';

const AHORA = new Date('2026-10-13T12:00:00.000Z');
const en = (dias: number) => new Date(AHORA.getTime() + dias * 86_400_000).toISOString();

describe('avisoDeVencimiento', () => {
    it('lejos del vencimiento no avisa', () => {
        expect(avisoDeVencimiento(en(31), AHORA)).toBeNull();
    });

    it('a 30 días o menos avisa; a 7 o menos, urgente', () => {
        expect(avisoDeVencimiento(en(30), AHORA)).toEqual({ nivel: 'PRONTO', dias: 30 });
        expect(avisoDeVencimiento(en(8), AHORA)).toEqual({ nivel: 'PRONTO', dias: 8 });
        expect(avisoDeVencimiento(en(7), AHORA)).toEqual({ nivel: 'URGENTE', dias: 7 });
        expect(avisoDeVencimiento(en(0.5), AHORA)).toEqual({ nivel: 'URGENTE', dias: 1 });
    });

    it('vencida, y una fecha que no se lee no inventa avisos', () => {
        expect(avisoDeVencimiento(en(-1), AHORA)).toEqual({ nivel: 'VENCIDA', dias: 0 });
        expect(avisoDeVencimiento(AHORA, AHORA)).toEqual({ nivel: 'VENCIDA', dias: 0 });
        expect(avisoDeVencimiento('no es fecha', AHORA)).toBeNull();
    });
});
