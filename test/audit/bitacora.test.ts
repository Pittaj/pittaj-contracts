import { describe, expect, it } from 'vitest';
import {
    etiquetaDeAccion,
    getBitacoraSchema,
    nombresCrudosDeTipo,
    operacionDeBitacora,
    resumirCambios,
    tipoDeBitacora,
    TIPOS_DE_BITACORA,
} from '../../src/audit/index.js';

describe('Bitácora del negocio', () => {
    it('la web y la caja caen en la misma clave', () => {
        expect(tipoDeBitacora('products')).toEqual(tipoDeBitacora('Product'));
        expect(tipoDeBitacora('Product').etiqueta).toBe('Productos');
        expect(nombresCrudosDeTipo('producto')).toEqual(['products', 'Product']);
    });

    it('lo desconocido se enseña tal cual y filtra por sí mismo', () => {
        expect(tipoDeBitacora('widgets')).toEqual({ clave: 'widgets', etiqueta: 'widgets' });
        expect(nombresCrudosDeTipo('widgets')).toEqual(['widgets']);
    });

    it('ningún nombre crudo está en dos claves', () => {
        const todos = TIPOS_DE_BITACORA.flatMap((t) => [...t.web, ...t.instalacion]);
        expect(new Set(todos).size).toBe(todos.length);
    });

    it('las acciones de las dos puntas se leen igual', () => {
        expect(operacionDeBitacora('CREATE')).toBe('create');
        expect(operacionDeBitacora('delete')).toBe('delete');
        expect(operacionDeBitacora('SET_DEFAULT')).toBe('otra');
        expect(etiquetaDeAccion('UPDATE')).toBe('Cambio');
        expect(etiquetaDeAccion('SET_DEFAULT')).toBe('Predeterminó');
        expect(etiquetaDeAccion('MARK_PAID')).toBe('Mark paid');
    });

    it('resume el diff como el escritorio', () => {
        expect(resumirCambios('{"price":{"old":10,"new":25},"name":"x"}')).toBe('price: 10 → 25 · name');
        expect(resumirCambios('{"name":{"old":"Pan","new":"Pan dulce"}}')).toBe('name: Pan → Pan dulce');
        expect(resumirCambios(null)).toBe('—');
        expect(resumirCambios('{}')).toBe('—');
        expect(resumirCambios('no es json')).toBe('no es json');
    });

    it('los filtros traen paginado por omisión y rechazan fechas sin zona', () => {
        expect(getBitacoraSchema.parse({})).toMatchObject({ page: 1, pageSize: 50 });
        expect(getBitacoraSchema.safeParse({ desde: '2026-11-01' }).success).toBe(false);
        expect(getBitacoraSchema.safeParse({ desde: '2026-11-01T00:00:00-06:00', origen: 'web' }).success).toBe(true);
    });
});
