import { describe, expect, it } from 'vitest';
import {
    correccionParaTomarLaDelEquipo,
    getDivergenciasSchema,
    noCuadra,
    resolverDivergenciaSchema,
} from '../../src/credit-note/divergences';

describe('divergencias de notas (tanda 3)', () => {
    it('un redondeo no es descuadre', () => {
        expect(noCuadra(100, 100.004)).toBe(false);
        expect(noCuadra(100, 100.01)).toBe(true);
    });

    it('tomar la del equipo solo se corrige con un uso cuando el equipo gastó más', () => {
        expect(correccionParaTomarLaDelEquipo(80, 120)).toBe(40);
        expect(correccionParaTomarLaDelEquipo(120, 80)).toBeNull();
        expect(correccionParaTomarLaDelEquipo(50, 50)).toBeNull();
    });

    it('esquemas', () => {
        expect(resolverDivergenciaSchema.parse({ decision: 'EQUIPO' }).decision).toBe('EQUIPO');
        expect(() => resolverDivergenciaSchema.parse({ decision: 'OTRA' })).toThrow();
        expect(getDivergenciasSchema.parse({}).pendientes).toBe(true);
        expect(getDivergenciasSchema.parse({ pendientes: 'false' }).pendientes).toBe(false);
    });
});
