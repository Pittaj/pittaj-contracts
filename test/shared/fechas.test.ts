/**
 * D3 · Fechas civiles, instantes y zona. Los mismos vectores viven en
 * `Pittaj.Tests/Domain/FechasTests.cs`: si uno cambia, cambia el otro.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    ZONA_POR_OMISION,
    desfaseEn,
    esFechaCivil,
    esZonaValida,
    fechaCivilDe,
    fechaCivilDelValor,
    fechaCivilEntranteSchema,
    fechaDelComprobante,
    fechaMasDias,
    hoyEn,
    inicioDelDia,
    mostrarFecha,
    mostrarRelojDelComprobante,
    relojDelComprobante,
    zonaDe,
    zonaHorariaSchema,
} from '../../src/shared/fechas.js';

describe('D3 · la zona de un documento', () => {
    it('sucursal, si no empresa, si no la del centro; una inválida se salta', () => {
        expect(zonaDe('America/Cancun', 'America/Tijuana')).toBe('America/Cancun');
        expect(zonaDe(null, 'America/Tijuana')).toBe('America/Tijuana');
        expect(zonaDe('Marte/Olympus', undefined)).toBe(ZONA_POR_OMISION);
        expect(zonaDe()).toBe('America/Mexico_City');
    });

    it('valida contra lo que conoce el motor', () => {
        expect(esZonaValida('America/Hermosillo')).toBe(true);
        expect(esZonaValida('Mexico/Huehuetlan')).toBe(false);
        expect(zonaHorariaSchema.safeParse('America/Cancun').success).toBe(true);
        expect(zonaHorariaSchema.safeParse('GMT-6 por favor').success).toBe(false);
        expect(zonaHorariaSchema.safeParse(null).success).toBe(true);
    });
});

describe('D3 · un instante cae en el día de su sucursal', () => {
    // 2026-08-01T01:30Z = 31 de julio 19:30 en el centro, 20:30 en Cancún, 18:30 en Tijuana (verano).
    const corte = new Date('2026-08-01T01:30:00Z');

    it('el corte de las 7:30 de la noche del 31 de julio es de julio en el centro', () => {
        expect(fechaCivilDe(corte, 'America/Mexico_City')).toBe('2026-07-31');
        expect(fechaCivilDe(corte, 'America/Cancun')).toBe('2026-07-31');
        expect(fechaCivilDe(corte, 'UTC')).toBe('2026-08-01');
    });

    it('Cancún va una hora adelante del centro: 23:30 en el centro ya es otro día allá', () => {
        const noche = new Date('2026-03-11T05:30:00Z'); // 23:30 del 10 en el centro
        expect(fechaCivilDe(noche, 'America/Mexico_City')).toBe('2026-03-10');
        expect(fechaCivilDe(noche, 'America/Cancun')).toBe('2026-03-11');
    });

    it('desfase: el centro sin horario de verano, Tijuana con él', () => {
        expect(desfaseEn(new Date('2026-07-01T12:00:00Z'), 'America/Mexico_City')).toBe(-360);
        expect(desfaseEn(new Date('2026-07-01T12:00:00Z'), 'America/Tijuana')).toBe(-420);
        expect(desfaseEn(new Date('2026-01-15T12:00:00Z'), 'America/Tijuana')).toBe(-480);
    });

    it('inicio del día: la medianoche local, también el día que cambia el horario', () => {
        expect(inicioDelDia('2026-08-31', 'America/Mexico_City').toISOString()).toBe('2026-08-31T06:00:00.000Z');
        expect(inicioDelDia('2026-08-31', 'America/Cancun').toISOString()).toBe('2026-08-31T05:00:00.000Z');
        // 8 de marzo de 2026: Tijuana pasa a verano a las 2:00; la medianoche aún es −8.
        expect(inicioDelDia('2026-03-08', 'America/Tijuana').toISOString()).toBe('2026-03-08T08:00:00.000Z');
        expect(inicioDelDia('2026-03-09', 'America/Tijuana').toISOString()).toBe('2026-03-09T07:00:00.000Z');
    });

    it('hoy es el de la zona, no el del servidor', () => {
        expect(hoyEn('America/Mexico_City', corte)).toBe('2026-07-31');
    });
});

describe('D3 · fechas civiles', () => {
    it('se validan contra el calendario', () => {
        expect(esFechaCivil('2026-02-29')).toBe(false);
        expect(esFechaCivil('2028-02-29')).toBe(true);
        expect(esFechaCivil('2026-8-31')).toBe(false);
    });

    it('se suman días sin pasar por una zona', () => {
        expect(fechaMasDias('2026-08-31', 1)).toBe('2026-09-01');
        expect(fechaMasDias('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('el ISO de antes de D3 se lee por su día', () => {
        expect(fechaCivilDelValor('2026-08-31T00:00:00.000Z')).toBe('2026-08-31');
        expect(fechaCivilDelValor('2026-08-31')).toBe('2026-08-31');
        expect(fechaCivilDelValor('')).toBeNull();
        expect(fechaCivilEntranteSchema.parse('2026-08-31T03:14:00.000Z')).toBe('2026-08-31');
        expect(fechaCivilEntranteSchema.parse(null)).toBeNull();
        expect(fechaCivilEntranteSchema.safeParse('ayer').success).toBe(false);
    });

    it('se muestran sin convertir: el 31 es el 31 en cualquier navegador', () => {
        expect(mostrarFecha('2026-08-31')).toBe('31/08/2026');
        expect(mostrarFecha('2026-08-31', 'larga')).toBe('31 de agosto de 2026');
        expect(mostrarFecha(null)).toBe('—');
    });
});

describe('D3 · la hora del CFDI es la del reloj del emisor', () => {
    it('se guarda marcada UTC sin convertir: su día son sus diez primeros caracteres', () => {
        // La gasolina de D0: emitida a las 3 de la mañana del 31; convertida salía el 30.
        expect(relojDelComprobante('2026-08-31T03:14:00')).toBe('2026-08-31T03:14:00.000Z');
        expect(fechaDelComprobante('2026-08-31T03:14:00')).toBe('2026-08-31');
        expect(fechaDelComprobante(new Date('2026-08-31T03:14:00.000Z'))).toBe('2026-08-31');
    });

    it('si el XML trae zona (fuera del estándar), se respeta su reloj', () => {
        expect(relojDelComprobante('2026-08-31T23:50:00-06:00')).toBe('2026-08-31T23:50:00.000Z');
        expect(relojDelComprobante('basura')).toBeNull();
    });

    it('se muestra tal cual la dice el XML', () => {
        expect(mostrarRelojDelComprobante('2026-08-31T03:14:00.000Z', 'media')).toBe('31/08/2026');
    });
});

describe('D3 · nadie más escribe una zona a mano', () => {
    const raiz = join(__dirname, '../../src');
    const archivos = (dir: string): string[] =>
        readdirSync(dir).flatMap((n) => {
            const p = join(dir, n);
            return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
        });

    it('solo src/shared/fechas.ts nombra una zona IANA de México', () => {
        const culpables = archivos(raiz)
            .filter((p) => !p.endsWith(join('shared', 'fechas.ts')))
            .filter((p) => /America\/[A-Z]/.test(readFileSync(p, 'utf8')));
        expect(culpables).toEqual([]);
    });
});
