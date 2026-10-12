import { describe, expect, it } from 'vitest';
import {
    ALCANCE_COMPLETO,
    SIN_LINEA,
    esAlcanceCompleto,
    estaEnAlcance,
    normalizarAlcance,
    updateUserScopeSchema,
    veLoContable,
} from '../../src/user/index.js';

const CO = '11111111-1111-4111-8111-111111111111';
const HUE = '22222222-2222-4222-8222-222222222222';
const OBR = '33333333-3333-4333-8333-333333333333';
const ABA = '44444444-4444-4444-8444-444444444444';
const PAN = '55555555-5555-4555-8555-555555555555';

const comprador = { companyIds: [], locationIds: [HUE], businessLineIds: [ABA, SIN_LINEA] };

describe('estaEnAlcance — un documento se ve completo o no se ve', () => {
    it('el alcance completo lo ve todo, también lo que no trae sucursal', () => {
        expect(estaEnAlcance(ALCANCE_COMPLETO, { locationId: null, businessLineIds: [null] })).toBe(true);
        expect(esAlcanceCompleto(ALCANCE_COMPLETO)).toBe(true);
    });

    it('sucursal fuera del alcance: no se ve; sin sucursal: solo quien no está limitado', () => {
        expect(estaEnAlcance(comprador, { locationId: OBR, businessLineIds: [ABA] })).toBe(false);
        expect(estaEnAlcance(comprador, { locationId: null, businessLineIds: [ABA] })).toBe(false);
        expect(estaEnAlcance(comprador, { locationId: HUE, businessLineIds: [ABA] })).toBe(true);
    });

    it('basta un renglón de una línea del alcance; «Sin línea» cuenta si está marcada', () => {
        expect(estaEnAlcance(comprador, { locationId: HUE, businessLineIds: [PAN, ABA] })).toBe(true);
        expect(estaEnAlcance(comprador, { locationId: HUE, businessLineIds: [PAN] })).toBe(false);
        expect(estaEnAlcance(comprador, { locationId: HUE, businessLineIds: [null] })).toBe(true);
        const soloAba = { ...comprador, businessLineIds: [ABA] };
        expect(estaEnAlcance(soloAba, { locationId: HUE, businessLineIds: [null] })).toBe(false);
    });

    it('la empresa también filtra', () => {
        const otra = { companyIds: [CO], locationIds: [], businessLineIds: [] };
        expect(estaEnAlcance(otra, { companyId: CO })).toBe(true);
        expect(estaEnAlcance(otra, { companyId: HUE })).toBe(false);
    });

    it('lo contable pide sucursal y línea completas, no empresa', () => {
        expect(veLoContable(comprador)).toBe(false);
        expect(veLoContable({ companyIds: [CO], locationIds: [], businessLineIds: [] })).toBe(true);
    });
});

describe('normalizarAlcance', () => {
    const existentes = { companyIds: [CO], locationIds: [HUE, OBR], businessLineIds: [ABA, PAN] };

    it('quita duplicados y lo que ya no existe; «Sin línea» siempre vale', () => {
        const r = normalizarAlcance({ companyIds: [], locationIds: [HUE, HUE, ABA], businessLineIds: [SIN_LINEA, PAN] }, existentes);
        expect(r).toEqual({ companyIds: [], locationIds: [HUE], businessLineIds: [SIN_LINEA, PAN] });
    });

    it('si una dimensión limitada se queda vacía al limpiar, no se guarda: sería «todas»', () => {
        expect(normalizarAlcance({ companyIds: [], locationIds: [ABA], businessLineIds: [] }, existentes)).toBeNull();
    });
});

describe('updateUserScopeSchema', () => {
    it('lo que falta es «todas»; una línea acepta uuid o NONE', () => {
        expect(updateUserScopeSchema.parse({ businessLineIds: [SIN_LINEA] })).toEqual({ companyIds: [], locationIds: [], businessLineIds: [SIN_LINEA] });
        expect(updateUserScopeSchema.safeParse({ locationIds: ['x'] }).success).toBe(false);
    });
});
