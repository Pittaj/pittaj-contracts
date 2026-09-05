/**
 * @fileoverview Lo que el buscador de la cabecera tiene que acertar sí o sí.
 *
 * Dos cosas se prueban aquí y las dos vienen del mostrador, no de la teoría: que **el folio de un
 * ticket se encuentre escribiendo solo su número** —nadie teclea la serie con un cliente delante— y
 * que **lo que se resolvió sin red salga primero**, porque este producto vende sin internet.
 */

import { describe, it, expect } from 'vitest';
import {
    agruparResultados,
    esCoincidenciaExacta,
    normalizar,
    pareceCodigoEscaneado,
    type ResultadoDeBusqueda,
} from '../../src/search/busquedaGlobal';

const r = (
    id: string,
    tipo: ResultadoDeBusqueda['tipo'],
    titulo: string,
): ResultadoDeBusqueda => ({ id, tipo, titulo, destino: `/${id}` });

describe('normalizar', () => {
    it('quita acentos, espacios y guiones', () => {
        expect(normalizar('TKT-S1C1-00042')).toBe('TKTS1C100042');
        expect(normalizar('tkt s1c1 00042')).toBe('TKTS1C100042');
        expect(normalizar('Cotija Añejo')).toBe('COTIJAANEJO');
    });
});

describe('coincidencia exacta', () => {
    it('🔴 el número del ticket, sin la serie, encuentra la venta', () => {
        // El caso del mostrador: el cliente vuelve con su ticket y nadie teclea «TKT-S1C1-».
        expect(esCoincidenciaExacta('42', 'TKT-S1C1-00042')).toBe(true);
        expect(esCoincidenciaExacta('00042', 'TKT-S1C1-00042')).toBe(true);
        expect(esCoincidenciaExacta('TKT-S1C1-00042', 'TKT-S1C1-00042')).toBe(true);
    });

    it('pero un número distinto NO coincide', () => {
        expect(esCoincidenciaExacta('43', 'TKT-S1C1-00042')).toBe(false);
        expect(esCoincidenciaExacta('420', 'TKT-S1C1-00042')).toBe(false);
    });

    it('🔴 el sufijo solo vale si es numérico', () => {
        // Si valiera para letras, «tija» encontraría «Cotija» y el grupo de exactos se llenaría de
        // parecidos, que es justo lo contrario de lo que significa «exacta».
        expect(esCoincidenciaExacta('tija', 'Cotija')).toBe(false);
        expect(esCoincidenciaExacta('cotija', 'Cotija')).toBe(true);
    });

    it('no se rompe con la consulta vacía', () => {
        expect(esCoincidenciaExacta('', 'TKT-S1C1-00042')).toBe(false);
        expect(esCoincidenciaExacta('42', '')).toBe(false);
    });
});

describe('agrupar', () => {
    it('🔴 lo que se resuelve sin red va primero', () => {
        // Pantallas y acciones salen del catálogo que ya está en memoria; los registros hay que ir
        // a buscarlos. Si el orden fuera al revés, el panel parpadearía al llegar la respuesta.
        const grupos = agruparResultados('coti', [
            r('p1', 'producto', 'Cotija Trozo'),
            r('n1', 'pantalla', 'Cotizaciones'),
            r('a1', 'accion', 'Nueva cotización'),
        ]);

        expect(grupos.map((g) => g.clave)).toEqual(['pantalla', 'accion', 'producto']);
    });

    it('la coincidencia exacta se saca de su grupo y sube del todo', () => {
        const grupos = agruparResultados('42', [
            r('p1', 'producto', 'Cotija Trozo'),
            r('v1', 'venta', 'TKT-S1C1-00042'),
        ]);

        expect(grupos[0]!.clave).toBe('exacto');
        expect(grupos[0]!.resultados[0]!.id).toBe('v1');
        // Y no se repite abajo, en «Ventas».
        expect(grupos.some((g) => g.clave === 'venta')).toBe(false);
    });

    it('recorta a tres por grupo pero dice cuántos hay', () => {
        const muchos = Array.from({ length: 7 }, (_, i) => r(`p${i}`, 'producto', `Cotija ${i}`));

        const grupos = agruparResultados('coti', muchos);

        expect(grupos[0]!.resultados).toHaveLength(3);
        expect(grupos[0]!.total).toBe(7);
    });

    it('sin resultados no inventa grupos', () => {
        expect(agruparResultados('xyz', [])).toEqual([]);
    });
});

describe('código escaneado', () => {
    it('reconoce la forma de un código de barras', () => {
        // El lector teclea el número y pulsa Enter: con ocho dígitos o más, quien escaneó quiere
        // ESE producto, no una lista.
        expect(pareceCodigoEscaneado('7501055300006')).toBe(true);
        expect(pareceCodigoEscaneado('75010553')).toBe(true);
    });

    it('y no confunde un folio corto ni un nombre con uno', () => {
        expect(pareceCodigoEscaneado('42')).toBe(false);
        expect(pareceCodigoEscaneado('cotija')).toBe(false);
        expect(pareceCodigoEscaneado('TKT-S1C1-00042')).toBe(false);
    });
});
