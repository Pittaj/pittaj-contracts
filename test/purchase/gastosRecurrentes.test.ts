import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
    claveDePeriodo, estadoDelPeriodo, etiquetaDePeriodo, idDePeriodoDesdeMd5, periodoK, periodoParaElGasto, periodosHasta,
    saveRecurringExpenseSchema, VECTOR_DE_ID_DE_PERIODO, type PlantillaRecurrente,
} from '../../src/purchase/gastosRecurrentes.js';

const renta: PlantillaRecurrente = { id: 't-renta', everyMonths: 1, dayOfMonth: 1, dueMode: 'EN_EL_PERIODO', startsOn: '2026-08' };
const luz: PlantillaRecurrente = { id: 't-luz', everyMonths: 2, dayOfMonth: 26, dueMode: 'AL_TERMINAR', startsOn: '2026-03' };

describe('Gastos recurrentes (F6.5)', () => {
    it('el periodo de la luz bimestral cubre jul–ago y vence el 26 de septiembre', () => {
        expect(periodoK(luz, 2)).toEqual({ periodo: '2026-07', hasta: '2026-08', accrualDate: '2026-07-01', dueDate: '2026-09-26' });
        expect(etiquetaDePeriodo('2026-07', '2026-08', '2026')).toBe('Jul – Ago');
        expect(etiquetaDePeriodo('2026-12', '2027-01', '2026')).toBe('Dic – Ene 2027');
    });

    it('la renta vence el día 1 del mismo mes, y el 31 en febrero es el último día', () => {
        expect(periodoK(renta, 2).dueDate).toBe('2026-10-01');
        expect(periodoK({ ...renta, dayOfMonth: 31, startsOn: '2027-02' }, 0).dueDate).toBe('2027-02-28');
    });

    it('nacen los periodos que vencen hasta 45 días adelante, y ninguno tras pausar', () => {
        expect(periodosHasta(renta, '2026-10-04').map((p) => p.periodo)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11']);
        expect(periodosHasta({ ...renta, pausedAt: '2026-09-15T10:00:00Z' }, '2026-10-04').map((p) => p.periodo)).toEqual(['2026-08', '2026-09']);
    });

    it('el estado sale de los hechos: sin gasto y con el mes del vencimiento cerrado, es Sin CFDI', () => {
        const base = { dueDate: '2026-09-26', cancelado: false, liquidado: false, tieneGasto: false, gastoPagado: false };
        expect(estadoDelPeriodo(base, '2026-09-30')).toBe('ESPERADO');
        expect(estadoDelPeriodo(base, '2026-10-01')).toBe('SIN_CFDI');
        expect(estadoDelPeriodo({ ...base, tieneGasto: true }, '2026-10-01')).toBe('LLEGO');
        expect(estadoDelPeriodo({ ...base, tieneGasto: true, gastoPagado: true }, '2026-10-01')).toBe('PAGADO');
        expect(estadoDelPeriodo({ ...base, cancelado: true }, '2026-10-01')).toBe('OMITIDO');
    });

    it('el id de periodo es el md5 con forma de UUID v3: el mismo vector que el trigger y el escritorio', () => {
        const md5 = createHash('md5').update(claveDePeriodo(VECTOR_DE_ID_DE_PERIODO.templateId, VECTOR_DE_ID_DE_PERIODO.periodo)).digest('hex');
        expect(idDePeriodoDesdeMd5(md5)).toBe(VECTOR_DE_ID_DE_PERIODO.id);
    });

    it('empareja con el vencimiento más cercano y no adivina entre dos rentas', () => {
        const abiertos = [
            { id: 'luz-jul', templateId: 't-luz', dueDate: '2026-09-26', locationId: 'hue' },
            { id: 'luz-sep', templateId: 't-luz', dueDate: '2026-11-26', locationId: 'hue' },
        ];
        expect(periodoParaElGasto(abiertos, '2026-09-26', null)?.id).toBe('luz-jul');
        expect(periodoParaElGasto(abiertos, '2026-06-01', null)).toBeNull();
        const rentas = [
            { id: 'local', templateId: 't-local', dueDate: '2026-10-01', locationId: 'hue' },
            { id: 'obrador', templateId: 't-obrador', dueDate: '2026-10-01', locationId: 'obr' },
        ];
        expect(periodoParaElGasto(rentas, '2026-10-01', null)).toBeNull();
        expect(periodoParaElGasto(rentas, '2026-10-01', 'obr')?.id).toBe('obrador');
    });

    it('el esquema rechaza una periodicidad que no existe', () => {
        const ok = { name: 'Luz', supplierId: '6a1f0c2e-1b7d-4c55-9a43-2f6c1e0d9b11', amount: 100, everyMonths: 2, dayOfMonth: 26, startsOn: '2026-03' };
        expect(saveRecurringExpenseSchema.safeParse(ok).success).toBe(true);
        expect(saveRecurringExpenseSchema.safeParse({ ...ok, everyMonths: 5 }).success).toBe(false);
    });
});
