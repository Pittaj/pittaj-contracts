/**
 * @fileoverview La unicidad del folio empieza en el NOMBRE de la serie.
 *
 * Lo que se protege aquí es que dos puntos de emisión que no se ven entre sí —dos tiendas sin red,
 * una caja de escritorio y la terminal web— no puedan acabar con el mismo nombre de serie. Si eso
 * pasa, los dos emiten `TKT-…-00001` y no hay forma de arreglarlo después: los tickets ya están
 * impresos.
 */

import { describe, it, expect } from 'vitest';
import {
    serieDeCaja,
    serieDeTerminalWeb,
    serieDePuntoDeEmision,
    LARGO_MAXIMO_DE_SERIE,
} from '../../src/document-series/serieDeFolios';

describe('serie de folios de un punto de emisión', () => {
    it('la caja lleva sucursal y su número dentro de la sucursal', () => {
        expect(serieDeCaja('S1', 1)).toBe('S1C1');
        expect(serieDeCaja('S1', 2)).toBe('S1C2');
        expect(serieDeCaja('S2', 1)).toBe('S2C1');
    });

    it('🔴 dos tiendas distintas no pueden coincidir aunque numeren igual sus cajas', () => {
        // El caso exacto que rompió producción: las dos tiendas llamaron «1» a su primera caja.
        expect(serieDeCaja('S1', 1)).not.toBe(serieDeCaja('S2', 1));
    });

    it('la terminal web no comparte serie con las cajas de su propia sucursal', () => {
        // Es la otra mitad del fallo: la web folia en el servidor y el escritorio sin red, así que
        // compartir contador entre los dos garantiza el choque.
        expect(serieDeTerminalWeb('S1')).toBe('S1W1');
        expect(serieDeTerminalWeb('S1')).not.toBe(serieDeCaja('S1', 1));
    });

    it('normaliza el código de la sucursal', () => {
        expect(serieDeCaja(' s1 ', 3)).toBe('S1C3');
    });

    it('se niega a nombrar una serie sin sucursal', () => {
        expect(() => serieDeCaja('', 1)).toThrow();
        expect(() => serieDeCaja('   ', 1)).toThrow();
    });

    it('el ordinal empieza en 1, y es entero', () => {
        expect(() => serieDeCaja('S1', 0)).toThrow();
        expect(() => serieDeCaja('S1', -2)).toThrow();
        expect(() => serieDeCaja('S1', 1.5)).toThrow();
    });

    it('🔴 antes de truncar un nombre, se niega', () => {
        // Truncar convertiría dos series distintas en la misma, que es el fallo que esto evita.
        expect(() => serieDePuntoDeEmision('ABCDE', 10000)).toThrow(/no cabe/);

        // El caso justo en el borde sí pasa: 5 de sucursal + marca + 4 dígitos = 10.
        expect(serieDeCaja('ABCDE', 1000)).toHaveLength(LARGO_MAXIMO_DE_SERIE);
    });
});
