/** B1 · Los módulos que apaga el Bancos sencillo existen y dejan a la vista lo que el tendero usa. */
import { describe, expect, it } from 'vitest';
import {
    CLAVES_DE_MODULO,
    MODULOS_APAGADOS_EN_BANCOS_SENCILLO,
    appDeLaSuite,
    claveDeModulo,
    moduloVisible,
    visibilidadSchema,
} from '../../src/suite/index.js';

describe('MODULOS_APAGADOS_EN_BANCOS_SENCILLO', () => {
    it('solo nombra módulos del catálogo, y la visibilidad los acepta', () => {
        for (const clave of MODULOS_APAGADOS_EN_BANCOS_SENCILLO) expect(CLAVES_DE_MODULO).toContain(clave);
        const modulos = Object.fromEntries(MODULOS_APAGADOS_EN_BANCOS_SENCILLO.map((c) => [c, false]));
        expect(visibilidadSchema.parse({ modulos }).modulos).toEqual(modulos);
    });

    it('deja encendidos Cuentas, Movimientos, Saldos, Por categoría y Categorías', () => {
        const v = visibilidadSchema.parse({
            modulos: Object.fromEntries(MODULOS_APAGADOS_EN_BANCOS_SENCILLO.map((c) => [c, false])),
        });
        const visibles = appDeLaSuite('bancos')!
            .modulos.filter((m) => moduloVisible(v, 'bancos', m.ruta))
            .map((m) => m.ruta);
        expect(visibles).toEqual(['cuentas', 'movimientos', 'reportes/saldos', 'reportes/categorias', 'categorias']);
    });

    it('Flujo de efectivo se apaga con Calendario: sin pagos programados no proyecta nada', () => {
        expect(MODULOS_APAGADOS_EN_BANCOS_SENCILLO).toEqual(
            expect.arrayContaining([claveDeModulo('bancos', 'calendario'), claveDeModulo('bancos', 'flujo')]),
        );
    });
});
