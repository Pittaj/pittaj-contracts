/** D4 · Los perfiles de uso solo apagan, y se ponen encima del predeterminado de la plataforma. */
import { describe, expect, it } from 'vitest';
import {
    APP_IDS,
    CLAVES_DE_MODULO,
    MODULOS_APAGADOS_EN_BANCOS_SENCILLO,
    PERFILES_DE_USO,
    aplicarPerfil,
    appVisible,
    moduloVisible,
    visibilidadDelPerfil,
    visibilidadSchema,
} from '../../src/suite/index.js';

describe('D4 · perfiles de uso', () => {
    it('cada perfil es una lista válida de la suite, y solo apaga', () => {
        for (const p of PERFILES_DE_USO) {
            const v = visibilidadDelPerfil(p);
            expect(visibilidadSchema.safeParse(v).success).toBe(true);
            expect([...Object.values(v.apps), ...Object.values(v.modulos)].every((x) => x === false)).toBe(true);
            expect(Object.keys(v.apps).every((a) => (APP_IDS as readonly string[]).includes(a))).toBe(true);
            expect(Object.keys(v.modulos).every((m) => CLAVES_DE_MODULO.includes(m))).toBe(true);
        }
    });

    it('Operar es Bancos sencillo: lo demás se ve', () => {
        const v = aplicarPerfil({ apps: {}, modulos: {} }, 'OPERAR');
        expect(Object.keys(v.modulos).sort()).toEqual([...MODULOS_APAGADOS_EN_BANCOS_SENCILLO].sort());
        expect(appVisible(v, 'caja')).toBe(true);
    });

    it('Solo libros apaga caja, inventario y producción; deja Fiscal, Bancos completo y Contabilidad', () => {
        const v = aplicarPerfil({ apps: {}, modulos: {} }, 'SOLO_LIBROS');
        for (const a of ['caja', 'tpv', 'inventario', 'produccion']) expect(appVisible(v, a)).toBe(false);
        for (const a of ['fiscal', 'bancos', 'contabilidad', 'ventas', 'compras', 'org']) expect(appVisible(v, a)).toBe(true);
        expect(moduloVisible(v, 'bancos', 'conciliacion')).toBe(true);
        expect(moduloVisible(v, 'ventas', 'facturas')).toBe(true);
        expect(moduloVisible(v, 'compras', 'buzon-cfdi')).toBe(true);
        expect(moduloVisible(v, 'compras', 'ordenes')).toBe(false);
    });

    it('el perfil no enciende lo que la plataforma apagó', () => {
        const base = { apps: { produccion: false, fiscal: false }, modulos: { 'bancos/flujo': false } };
        const v = aplicarPerfil(base, 'SOLO_LIBROS');
        expect(appVisible(v, 'fiscal')).toBe(false);
        expect(moduloVisible(v, 'bancos', 'flujo')).toBe(false);
    });

    it('sin perfil, el predeterminado tal cual', () => {
        const base = { apps: { produccion: false }, modulos: {} };
        expect(aplicarPerfil(base, null)).toBe(base);
    });
});
