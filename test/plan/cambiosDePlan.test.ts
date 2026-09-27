import { describe, expect, it } from 'vitest';
import {
    diasUnoPosibles,
    errorEnLaFecha,
    errorEnLosTerminos,
    hayCambio,
    leCuestaMas,
    primerDiaUnoPosible,
    renglonesDelCambio,
    schedulePlanChangeSchema,
    updateStampPackageSchema,
    type PlanTerms,
} from '../../src/plan/index.js';

const NEGOCIO: PlanTerms = {
    price: 199,
    includedOperations: 15000,
    monthlyStamps: 50,
    overagePricePerThousand: 10,
    overageCap: 499,
    extraStampPrice: 1,
};

// 27 de septiembre de 2026, 01:00 de CDMX.
const HOY = new Date('2026-09-27T07:00:00Z');

describe('leCuestaMas', () => {
    it('subir el precio le cuesta más; bajarlo le conviene', () => {
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, price: 219 })).toBe(true);
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, price: 179 })).toBe(false);
    });

    it('dar menos también le cuesta más', () => {
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, includedOperations: 12000 })).toBe(true);
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, monthlyStamps: 40 })).toBe(true);
    });

    it('quitar el tope le cuesta más; ponerlo le conviene', () => {
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, overageCap: null })).toBe(true);
        expect(leCuestaMas({ ...NEGOCIO, overageCap: null }, NEGOCIO)).toBe(false);
    });

    it('basta con una cosa que empeore, aunque otra mejore', () => {
        expect(leCuestaMas(NEGOCIO, { ...NEGOCIO, price: 179, extraStampPrice: 2 })).toBe(true);
    });
});

describe('hayCambio y renglonesDelCambio', () => {
    it('nombra solo lo que cambia', () => {
        expect(hayCambio(NEGOCIO, { ...NEGOCIO })).toBe(false);
        expect(renglonesDelCambio(NEGOCIO, { ...NEGOCIO, price: 219, overageCap: null })).toEqual([
            'Precio $199 → $219',
            'Tope $499 → sin tope',
        ]);
    });
});

describe('errorEnLosTerminos', () => {
    it('el tope no puede quedar debajo del precio', () => {
        expect(errorEnLosTerminos({ ...NEGOCIO, price: 219, overageCap: 199 })).toBe(
            'El tope ($199) no puede ser menor que el precio ($219): el extra quedaría negativo.'
        );
        expect(errorEnLosTerminos(NEGOCIO)).toBeNull();
    });
});

describe('fechas', () => {
    it('si le cuesta más, el día 1 más próximo con 30 días de aviso', () => {
        expect(primerDiaUnoPosible(HOY, true)).toBe('2026-11-01');
        expect(primerDiaUnoPosible(HOY, false)).toBe('2026-10-01');
    });

    it('con el 1 justo a 30 días, sí entra', () => {
        // 2 de octubre 00:00 CDMX: al 1 de noviembre faltan exactamente 30 días.
        expect(primerDiaUnoPosible(new Date('2026-10-02T06:00:00Z'), true)).toBe('2026-11-01');
        expect(primerDiaUnoPosible(new Date('2026-10-02T06:00:01Z'), true)).toBe('2026-12-01');
    });

    it('explica por qué no', () => {
        expect(errorEnLaFecha('2026-10-01', HOY, true)).toBe(
            'Le cuesta más al cliente: el 1 de octubre no deja 30 días de aviso. El más próximo es el 1 de noviembre.'
        );
        expect(errorEnLaFecha('2026-10-01', HOY, false)).toBeNull();
        expect(errorEnLaFecha('2026-10-15', HOY, false)).toBe('Un cambio solo entra un día 1.');
        expect(errorEnLaFecha('2026-09-01', HOY, false)).toBe(
            'La fecha ya pasó: un cambio entra un día 1 que todavía no llega.'
        );
    });

    it('ofrece los días 1 siguientes, cruzando el año', () => {
        expect(diasUnoPosibles(HOY, true, 3)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01']);
    });
});

describe('esquemas', () => {
    it('el cambio pide un día 1 y un motivo', () => {
        const base = { ...NEGOCIO, reason: 'Ajuste del PAC', effectiveOn: '2026-11-01', notify: true };
        expect(schedulePlanChangeSchema.safeParse(base).success).toBe(true);
        expect(schedulePlanChangeSchema.safeParse({ ...base, effectiveOn: '2026-11-02' }).success).toBe(false);
        expect(schedulePlanChangeSchema.safeParse({ ...base, reason: '' }).success).toBe(false);
    });

    it('un paquete no cambia sus timbres', () => {
        expect(updateStampPackageSchema.safeParse({ price: 89 }).success).toBe(true);
        expect(updateStampPackageSchema.safeParse({}).success).toBe(false);
    });
});
