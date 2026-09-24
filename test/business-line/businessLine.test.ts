import { describe, expect, it } from 'vitest';
import {
    resolverLineaDeNegocio,
    businessLineRefSchema,
    businessLineFilterSchema,
    createBusinessLineSchema,
} from '../../src/business-line/index.js';
import { updateProductSchema } from '../../src/product/schemas/productSchemas.js';

const PAN = '11111111-1111-4111-8111-111111111111';
const ABA = '22222222-2222-4222-8222-222222222222';
const SAAS = '33333333-3333-4333-8333-333333333333';

describe('resolverLineaDeNegocio — de qué giro es un renglón', () => {
    it('renglón > producto > categoría > sucursal', () => {
        expect(resolverLineaDeNegocio({ renglon: SAAS, producto: PAN, categoria: ABA, sucursal: ABA })).toBe(SAAS);
        expect(resolverLineaDeNegocio({ producto: ABA, categoria: PAN, sucursal: PAN })).toBe(ABA);
        expect(resolverLineaDeNegocio({ producto: null, categoria: PAN, sucursal: ABA })).toBe(PAN);
        expect(resolverLineaDeNegocio({ sucursal: SAAS })).toBe(SAAS);
    });

    it('sin nada es «Sin línea» (null), no un error', () => {
        expect(resolverLineaDeNegocio({})).toBeNull();
        expect(resolverLineaDeNegocio({ producto: null, categoria: null, sucursal: null })).toBeNull();
    });
});

describe('businessLineRefSchema', () => {
    it('undefined no cambia, null o cadena vacía la quitan', () => {
        expect(businessLineRefSchema.parse(undefined)).toBeUndefined();
        expect(businessLineRefSchema.parse(null)).toBeNull();
        expect(businessLineRefSchema.parse('')).toBeNull();
        expect(businessLineRefSchema.parse(PAN)).toBe(PAN);
        expect(() => businessLineRefSchema.parse('pan')).toThrow();
    });

    it('viaja en la actualización del producto', () => {
        expect(updateProductSchema.parse({ version: 1, businessLineId: PAN }).businessLineId).toBe(PAN);
        expect(updateProductSchema.parse({ version: 1 }).businessLineId).toBeUndefined();
    });
});

describe('businessLineFilterSchema', () => {
    it('acepta un id o «none»', () => {
        expect(businessLineFilterSchema.parse('none')).toBe('none');
        expect(businessLineFilterSchema.parse(PAN)).toBe(PAN);
        expect(businessLineFilterSchema.parse(undefined)).toBeUndefined();
        expect(() => businessLineFilterSchema.parse('todas')).toThrow();
    });
});

describe('createBusinessLineSchema', () => {
    it('exige id y nombre; no acepta campos de más', () => {
        expect(createBusinessLineSchema.parse({ id: PAN, name: ' Panadería ' }).name).toBe('Panadería');
        expect(() => createBusinessLineSchema.parse({ id: PAN, name: 'P' })).toThrow();
        expect(() => createBusinessLineSchema.parse({ id: PAN, name: 'Pan', companyId: ABA })).toThrow();
    });
});
