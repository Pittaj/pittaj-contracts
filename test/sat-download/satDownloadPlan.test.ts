import { describe, expect, it } from 'vitest';
import {
    cierraElDia,
    cubreHasta,
    diaEnMexico,
    diasAbiertos,
    diasAtrasados,
    estadoComprobanteDeSolicitud,
    horaEnMexico,
    inicioMinimoDeHistorico,
    planearCorrida,
    rangoParaSolicitar,
    sumarDias,
    tocaMetadata,
    tramoDeMetadata,
    tramoDeRango,
    SAT_DIAS_POR_RANGO,
    SAT_RANGOS_POR_CORRIDA,
} from '../../src/sat-download/satDownloadPlan.js';
import { esCsd, rfcDeCertificado } from '../../src/sat-download/satCredential.js';

const HOY = '2026-09-24';
const d = (n: number) => sumarDias(HOY, n);
/** Días cerrados de `desde` a `hasta` (desplazamientos respecto a HOY, ambos incluidos). */
const cerrados = (desde: number, hasta: number) => {
    const s = new Set<string>();
    for (let i = desde; i <= hasta; i++) s.add(d(i));
    return s;
};

describe('fechas del calendario del centro', () => {
    it('el día en México no es el día en UTC', () => {
        expect(diaEnMexico(new Date('2026-09-24T05:30:00Z'))).toBe('2026-09-23');
        expect(diaEnMexico(new Date('2026-09-24T06:30:00Z'))).toBe('2026-09-24');
        expect(horaEnMexico(new Date('2026-09-24T12:00:00Z'))).toBe(6);
    });

    it('sumarDias cruza meses y años bisiestos', () => {
        expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
        expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
        expect(() => sumarDias('2026-02-30', 1)).toThrow();
    });
});

describe('cierraElDia — el plazo de timbrado de 72 h más un día', () => {
    it('una descarga pedida antes de D + 4 no cierra D', () => {
        expect(cierraElDia('2026-09-20', '2026-09-21')).toBe(false);
        expect(cierraElDia('2026-09-20', '2026-09-23')).toBe(false);
        expect(cierraElDia('2026-09-20', '2026-09-24')).toBe(true);
        expect(cierraElDia('2026-09-20', '2026-10-01')).toBe(true);
    });
});

describe('planearCorrida — qué XML se pide hoy', () => {
    it('en condiciones normales pide los cuatro días abiertos', () => {
        const plan = planearCorrida({ hoy: HOY, inicio: d(-60), cerrados: cerrados(-60, -5) });
        expect(plan.tramos).toEqual([{ desde: d(-4), hasta: d(-1) }]);
        expect(plan.diasPendientes).toBe(0);
    });

    it('si el SAT estuvo caído tres días, el rango crece: nada se cae de la ventana', () => {
        const plan = planearCorrida({ hoy: HOY, inicio: d(-60), cerrados: cerrados(-60, -8) });
        expect(plan.tramos).toEqual([{ desde: d(-7), hasta: d(-1) }]);
    });

    it('el día que tocaba cerrar y no se cerró sigue en la corrida siguiente', () => {
        // Ayer debía cerrarse d(-5) y el SAT estaba caído: hoy sigue abierto y entra.
        const plan = planearCorrida({ hoy: HOY, inicio: d(-60), cerrados: cerrados(-60, -6) });
        expect(plan.tramos[0]).toEqual({ desde: d(-5), hasta: d(-1) });
    });

    it('un hueco viejo sale en su propio tramo, sin volver a pedir lo cerrado de en medio', () => {
        const c = cerrados(-60, -5);
        c.delete(d(-20));
        const plan = planearCorrida({ hoy: HOY, inicio: d(-60), cerrados: c });
        expect(plan.tramos).toEqual([
            { desde: d(-4), hasta: d(-1) },
            { desde: d(-20), hasta: d(-20) },
        ]);
    });

    it('no vuelve a pedir lo que ya tiene una solicitud en curso que lo va a cerrar', () => {
        // La de ayer cubrió d(-5)…d(-2) y se pidió ayer (d(-1)): cierra d(-5) (d(-1) − d(-5) = 4), no los demás.
        const plan = planearCorrida({
            hoy: HOY,
            inicio: d(-60),
            cerrados: cerrados(-60, -6),
            enCurso: [{ desde: d(-5), hasta: d(-2), pedidaEl: d(-1) }],
        });
        expect(plan.tramos).toEqual([{ desde: d(-4), hasta: d(-1) }]);
    });

    it('el histórico se reparte: tramos de 30 días, de lo reciente a lo viejo, con tope por corrida', () => {
        const plan = planearCorrida({ hoy: HOY, inicio: d(-400), cerrados: new Set() });
        expect(plan.tramos).toHaveLength(SAT_RANGOS_POR_CORRIDA);
        expect(plan.tramos[0]).toEqual({ desde: d(-SAT_DIAS_POR_RANGO), hasta: d(-1) });
        expect(plan.tramos[1]).toEqual({ desde: d(-2 * SAT_DIAS_POR_RANGO), hasta: d(-SAT_DIAS_POR_RANGO - 1) });
        expect(plan.diasPendientes).toBe(400 - SAT_RANGOS_POR_CORRIDA * SAT_DIAS_POR_RANGO);
    });

    it('el tramo corto queda en el extremo viejo', () => {
        const plan = planearCorrida({ hoy: HOY, inicio: d(-45), cerrados: new Set() });
        expect(plan.tramos).toEqual([
            { desde: d(-30), hasta: d(-1) },
            { desde: d(-45), hasta: d(-31) },
        ]);
    });

    it('sin días abiertos no pide nada', () => {
        const plan = planearCorrida({ hoy: HOY, inicio: d(-10), cerrados: cerrados(-10, -1) });
        expect(plan.tramos).toEqual([]);
        expect(diasAbiertos(HOY, d(-10), cerrados(-10, -1))).toEqual([]);
    });
});

describe('rangoParaSolicitar — reintentos sin gastar el cupo', () => {
    const tramo = { desde: '2026-09-20', hasta: '2026-09-23' };

    it('el primer intento pide días completos', () => {
        expect(rangoParaSolicitar(tramo)).toEqual({ inicio: '2026-09-20T00:00:00', fin: '2026-09-23T23:59:59' });
    });

    it('cada reintento corre el inicio un segundo: para el SAT es otro periodo', () => {
        const r1 = rangoParaSolicitar(tramo, 1);
        const r2 = rangoParaSolicitar(tramo, 2);
        expect(r1.inicio).toBe('2026-09-19T23:59:59');
        expect(r2.inicio).toBe('2026-09-19T23:59:58');
        expect(r1.fin).toBe(r2.fin);
        expect(new Set([rangoParaSolicitar(tramo).inicio, r1.inicio, r2.inicio]).size).toBe(3);
    });

    it('del rango se recuperan los días que cubre completos, aunque el inicio esté corrido', () => {
        expect(tramoDeRango(rangoParaSolicitar(tramo))).toEqual(tramo);
        expect(tramoDeRango(rangoParaSolicitar(tramo, 3))).toEqual(tramo);
    });

    it('rechaza tramos al revés e intentos inválidos', () => {
        expect(() => rangoParaSolicitar({ desde: '2026-09-23', hasta: '2026-09-20' })).toThrow();
        expect(() => rangoParaSolicitar(tramo, -1)).toThrow();
    });
});

describe('cubreHasta — la racha, no el máximo', () => {
    it('un día cerrado después de un hueco no cubre el hueco', () => {
        const c = cerrados(-30, -5);
        c.delete(d(-12));
        expect(cubreHasta(d(-30), c)).toBe(d(-13));
    });

    it('null si ni el inicio está cerrado', () => {
        expect(cubreHasta(d(-30), cerrados(-29, -5))).toBeNull();
    });
});

describe('diasAtrasados — cuándo avisar', () => {
    it('un día abierto avisa desde D + 7 si nada lo va a cerrar', () => {
        const late = diasAtrasados({ hoy: HOY, inicio: d(-30), cerrados: cerrados(-30, -9) });
        expect(late).toEqual([d(-8), d(-7)]);
    });

    it('con una solicitud en curso que lo cierra, espera a D + 10', () => {
        const late = diasAtrasados({
            hoy: HOY,
            inicio: d(-30),
            cerrados: cerrados(-30, -9),
            enCurso: [{ desde: d(-8), hasta: d(-1), pedidaEl: d(-2) }],
        });
        expect(late).toEqual([]);
    });
});

describe('metadata, histórico y estado de la solicitud', () => {
    it('la metadata toca una vez por semana y cubre 35 días hasta ayer', () => {
        expect(tocaMetadata(HOY, null)).toBe(true);
        expect(tocaMetadata(HOY, d(-6))).toBe(false);
        expect(tocaMetadata(HOY, d(-7))).toBe(true);
        expect(tramoDeMetadata(HOY)).toEqual({ desde: d(-35), hasta: d(-1) });
    });

    it('el histórico llega a cinco años, y un 29 de febrero no se sale del tope', () => {
        expect(inicioMinimoDeHistorico('2026-09-24')).toBe('2021-09-24');
        expect(inicioMinimoDeHistorico('2028-02-29')).toBe('2023-03-01');
    });

    it('recibidos en XML exige Vigente (v1.5); lo demás pide Todos', () => {
        expect(estadoComprobanteDeSolicitud('RECIBIDOS', 'CFDI')).toBe('Vigente');
        expect(estadoComprobanteDeSolicitud('RECIBIDOS', 'METADATA')).toBe('Todos');
        expect(estadoComprobanteDeSolicitud('EMITIDOS', 'CFDI')).toBe('Todos');
    });
});

describe('lo que se lee del certificado', () => {
    it('el RFC del contribuyente es el primero del x500UniqueIdentifier', () => {
        expect(rfcDeCertificado('EKU9003173C9 / VADA800927DJ3')).toBe('EKU9003173C9');
        expect(rfcDeCertificado('VADA800927DJ3')).toBe('VADA800927DJ3');
        expect(rfcDeCertificado('no es un rfc')).toBeNull();
    });

    it('el CSD trae OU; la e.firma no', () => {
        expect(esCsd('Sucursal 1')).toBe(true);
        expect(esCsd(null)).toBe(false);
        expect(esCsd('  ')).toBe(false);
    });
});
