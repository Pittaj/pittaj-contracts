import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    bytesDeBase64,
    ErrorDeCertificado,
    leerCertificadoDelSat,
    razonSocialDelCertificado,
    revisarCsdDeEmpresa,
} from '../../src/sat-download/index.js';

/** Espejo: `CertificadoDelSatTests.cs` (escritorio). Certificados de prueba del SAT (EKU9003173C9). */
const fixture = (n: string) => new Uint8Array(readFileSync(resolve(__dirname, 'fixtures', n)));
const CSD = fixture('csd-EKU9003173C9.cer');
const FIEL = fixture('fiel-EKU9003173C9.cer');
const AHORA = new Date('2026-11-24T12:00:00Z');

describe('el certificado del SAT, leído sin librerías', () => {
    it('lee el CSD de pruebas: RFC, nombre, sucursal y vigencia', () => {
        const c = leerCertificadoDelSat(CSD);
        expect(c.rfc).toBe('EKU9003173C9');
        expect(c.nombre).toBe('ESCUELA KEMPER URGATE SA DE CV');
        expect(c.unidadOrganizacional).toBe('Sucursal 1');
        expect(c.validoHasta > AHORA).toBe(true);
    });

    it('lo mismo desde base64, como llega en el cuerpo de la petición', () => {
        const b64 = Buffer.from(CSD).toString('base64');
        expect(leerCertificadoDelSat(bytesDeBase64(b64)).rfc).toBe('EKU9003173C9');
    });

    it('rechaza basura con un error con nombre', () => {
        expect(() => leerCertificadoDelSat(new Uint8Array(10))).toThrow(ErrorDeCertificado);
    });
});

describe('la razón social como va en el CFDI 4.0', () => {
    it('sin el régimen societario, solo a personas morales', () => {
        expect(razonSocialDelCertificado('ESCUELA KEMPER URGATE SA DE CV', 'EKU9003173C9')).toBe('ESCUELA KEMPER URGATE');
        expect(razonSocialDelCertificado('Comercializadora del Sur, S.A.P.I. de C.V.', 'CDS190101AB1')).toBe('COMERCIALIZADORA DEL SUR');
        expect(razonSocialDelCertificado('LA ESPIGA S. DE R.L. DE C.V.', 'EDC190101XY2')).toBe('LA ESPIGA');
        expect(razonSocialDelCertificado('MARIA LOPEZ SA', 'LOPM800101AB1')).toBe('MARIA LOPEZ SA');
    });
});

describe('¿sirven estos sellos para esta empresa?', () => {
    const csd = leerCertificadoDelSat(CSD);
    it('sin RFC todavía (o el genérico): el sello lo pone', () => {
        expect(revisarCsdDeEmpresa(csd, { rfc: null }, [], AHORA)).toBeNull();
        expect(revisarCsdDeEmpresa(csd, { rfc: 'XAXX010101000' }, [], AHORA)).toBeNull();
        expect(revisarCsdDeEmpresa(csd, { rfc: 'eku9003173c9' }, [], AHORA)).toBeNull();
    });
    it('un RFC distinto, el de otra empresa, la e.firma o vencido: no', () => {
        expect(revisarCsdDeEmpresa(csd, { rfc: 'LOPM800101AB1' }, [], AHORA)?.codigo).toBe('RFC_DE_OTRO');
        expect(revisarCsdDeEmpresa(csd, { rfc: null }, [{ nombre: 'Abarrotes', rfc: 'EKU9003173C9' }], AHORA)?.mensaje).toContain('Abarrotes');
        expect(revisarCsdDeEmpresa(leerCertificadoDelSat(FIEL), { rfc: null }, [], AHORA)?.codigo).toBe('NO_ES_CSD');
        expect(revisarCsdDeEmpresa(csd, { rfc: null }, [], new Date('2040-01-01'))?.codigo).toBe('VENCIDO');
    });
});
