import { describe, expect, it } from 'vitest';
import { mensajeDelSello, publishImportJobSchema, SELLO_BASE64 } from '../../src/sat-download';

const PEM = `-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA${'A'.repeat(64)}\n-----END PUBLIC KEY-----`;
const trabajo = { importJobId: 'projects/p/locations/l/keyRings/efirmas/importJobs/importar-1', publicKeyPem: PEM, method: 'rsa-oaep-3072-sha256-aes-256', expiresAt: '2026-10-20T12:00:00.123456789Z' };
const texto = (t = trabajo) => new TextDecoder().decode(mensajeDelSello(t));

describe('mensajeDelSello', () => {
    it('🔴 los mismos bytes en el descargador y en la página, aunque la nube redondee la fecha y recorte el PEM', () => {
        // El KMS da nanosegundos; la base guarda microsegundos y el API devuelve milisegundos.
        const comoLaDaLaNube = { ...trabajo, publicKeyPem: PEM.trim(), expiresAt: new Date(trabajo.expiresAt).toISOString() };
        const comoLaDaElKms = { ...trabajo, publicKeyPem: `${PEM}\r\n`, expiresAt: '2026-10-20T12:00:00.123456789Z' };
        expect(texto(comoLaDaLaNube)).toBe(texto(comoLaDaElKms));
    });

    it('cambiar la llave, el trabajo o la caducidad cambia el mensaje', () => {
        const base = texto();
        expect(texto({ ...trabajo, publicKeyPem: PEM.replace('MIIB', 'MIIC') })).not.toBe(base);
        expect(texto({ ...trabajo, importJobId: `${trabajo.importJobId}x` })).not.toBe(base);
        expect(texto({ ...trabajo, expiresAt: '2026-10-21T12:00:00Z' })).not.toBe(base);
        expect(base.startsWith('pittaj/sat/trabajo-de-importacion/v1\n')).toBe(true);
    });

    it('una caducidad ilegible, o algo que no es ASCII, no se firma', () => {
        expect(() => mensajeDelSello({ ...trabajo, expiresAt: 'mañana' })).toThrow();
        expect(() => mensajeDelSello({ ...trabajo, importJobId: 'importación' })).toThrow();
    });
});

describe('publishImportJobSchema', () => {
    const firma = Buffer.alloc(64, 7).toString('base64');
    it('exige el sello, en r‖s base64', () => {
        expect(SELLO_BASE64.test(firma)).toBe(true);
        expect(publishImportJobSchema.safeParse({ ...trabajo, expiresAt: '2026-10-20T12:00:00Z', sealSignature: firma }).success).toBe(true);
        expect(publishImportJobSchema.safeParse({ ...trabajo, expiresAt: '2026-10-20T12:00:00Z' }).success).toBe(false);
        // Una firma DER (70–72 bytes) no es la forma que verifica el navegador.
        expect(publishImportJobSchema.safeParse({ ...trabajo, expiresAt: '2026-10-20T12:00:00Z', sealSignature: Buffer.alloc(71, 7).toString('base64') }).success).toBe(false);
    });
});
