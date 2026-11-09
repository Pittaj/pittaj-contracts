/** I9a · Variantes. Los mismos vectores que `ReglasDeVariantesTests` del escritorio. */
import { describe, expect, it } from 'vitest';
import {
    opcionesDeVariante,
    varianteElegida,
    codigoDeVariante,
    combinaciones,
    fragmentoDeCodigo,
    generarMatriz,
    llaveDeVariante,
    nombreDeVariante,
    planDeVariantes,
    semillaDeVariante,
} from '../../src/product/index.js';

const tallaColor = [
    { name: 'Talla', values: ['CH', 'M'] },
    { name: 'Color', values: ['Negro', 'Azul marino'] },
];

describe('nombres, llaves y códigos', () => {
    it('la llave y el nombre siguen el orden de los atributos', () => {
        const v = { Color: 'Negro', Talla: 'M' };
        expect(llaveDeVariante(tallaColor, v)).toBe('M|Negro');
        expect(nombreDeVariante(' Playera básica ', tallaColor, v)).toBe('Playera básica · M · Negro');
    });

    it('el fragmento del código no lleva acentos ni espacios', () => {
        expect(['Azul marino', 'Ñandú', 'Talla única extra grande', '¡!', '32/34'].map(fragmentoDeCodigo)).toEqual([
            'AZULMARINO',
            'NANDU',
            'TALLAUNICA',
            'X',
            '3234',
        ]);
    });

    it('el patrón acepta posición, nombre y recoge los guiones de sobra', () => {
        const v = { Talla: 'M', Color: 'Azul marino' };
        expect(codigoDeVariante('{padre}-{1}-{2}', 'PLAY-01', tallaColor, v)).toBe('PLAY-01-M-AZULMARINO');
        expect(codigoDeVariante('{padre}{Color}{Talla}', 'P', tallaColor, v)).toBe('PAZULMARINOM');
        expect(codigoDeVariante('{padre}-{1}-{2}-{3}', 'P', [tallaColor[0]!], { Talla: 'CH' })).toBe('P-CH');
    });

    it('la semilla del id', () => {
        expect(semillaDeVariante('p1', 'M|Negro')).toBe('product:variant:p1:M|Negro');
    });
});

describe('la matriz', () => {
    it('combina en orden, sin vacíos ni repetidos', () => {
        expect(combinaciones([{ name: 'Talla', values: ['CH', ' M ', 'M', ''] }, { name: 'Color', values: ['Negro', 'Azul'] }])).toEqual([
            { Talla: 'CH', Color: 'Negro' },
            { Talla: 'CH', Color: 'Azul' },
            { Talla: 'M', Color: 'Negro' },
            { Talla: 'M', Color: 'Azul' },
        ]);
        expect(combinaciones([])).toEqual([]);
    });

    it('conserva lo que ya existía y desempata los códigos repetidos', () => {
        const matriz = generarMatriz(
            { code: 'P', name: 'Playera' },
            [{ name: 'Color', values: ['Negro', 'Negró', 'Rojo'] }],
            '{padre}-{1}',
            [{ id: 'v-rojo', values: { Color: 'Rojo' }, code: 'P-ROJO-VIEJO', active: false }]
        );
        expect(matriz.map((m) => [m.existingId, m.code, m.displayName, m.active])).toEqual([
            [null, 'P-NEGRO', 'Playera · Negro', true],
            [null, 'P-NEGRO-2', 'Playera · Negró', true],
            ['v-rojo', 'P-ROJO-VIEJO', 'Playera · Rojo', false],
        ]);
    });

    it('guardar crea, cambia y archiva', () => {
        expect(planDeVariantes(['a', 'b', 'c'], ['a', 'b', 'c'], ['a', 'd'])).toEqual({ crear: ['d'], cambiar: ['a'], archivar: ['b', 'c'] });
        expect(planDeVariantes([], new Set<string>(), ['x'])).toEqual({ crear: ['x'], cambiar: [], archivar: [] });
    });
});

describe('elegir la variante en la caja (2.84.0)', () => {
    const attrs = [
        { name: 'Talla', values: ['CH', 'M', 'G'] },
        { name: 'Color', values: ['Negro', 'Blanco'] },
    ];
    const vs = [
        { id: 'ch-n', values: { Talla: 'CH', Color: 'Negro' }, active: true },
        { id: 'ch-b', values: { Talla: 'CH', Color: 'Blanco' }, active: true },
        { id: 'm-n', values: { Talla: 'M', Color: 'Negro' }, active: true },
        { id: 'm-b', values: { Talla: 'M', Color: 'Blanco' }, active: false },
        { id: 'g-n', values: { Talla: 'G', Color: 'Negro' }, active: false },
        { id: 'g-b', values: { Talla: 'G', Color: 'Blanco' }, active: false },
    ];
    it('ofrece solo lo que lleva a una variante activa', () => {
        expect(opcionesDeVariante(attrs, vs, {})).toEqual({ Talla: ['CH', 'M'], Color: ['Negro', 'Blanco'] });
        expect(opcionesDeVariante(attrs, vs, { Talla: 'M' })).toEqual({ Talla: ['CH', 'M'], Color: ['Negro'] });
        expect(opcionesDeVariante(attrs, vs, { Color: 'Blanco' })).toEqual({ Talla: ['CH'], Color: ['Negro', 'Blanco'] });
    });
    it('con todo elegido, la variante; si falta o está archivada, nada', () => {
        expect(varianteElegida(attrs, vs, { Talla: 'CH', Color: 'Blanco' })).toBe('ch-b');
        expect(varianteElegida(attrs, vs, { Talla: 'M' })).toBeNull();
        expect(varianteElegida(attrs, vs, { Talla: 'M', Color: 'Blanco' })).toBeNull();
    });
});
