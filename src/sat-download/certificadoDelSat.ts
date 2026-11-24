/**
 * @fileoverview El certificado que da el SAT —e.firma o sello digital (CSD)— leído sin librerías.
 *
 * Un lector DER acotado (solo lo que el SAT pone en sus certificados), sin dependencias: corre igual
 * en el navegador, en Workers y en Node. Lo usan la descarga del SAT (la e.firma) y la carga de los
 * sellos (el CSD): de ahí salen el RFC y la razón social de una empresa, que ya no se escriben a mano.
 * Espejo C#: `CertificadoDelSat` del escritorio, mismos casos.
 */
import { esCsd, rfcDeCertificado } from './satCredential.js';

export type CodigoDeCertificado = 'CERTIFICADO_INVALIDO' | 'LLAVE_NO_ADMITIDA';

export class ErrorDeCertificado extends Error {
    constructor(readonly codigo: CodigoDeCertificado, mensaje: string) {
        super(mensaje);
        this.name = 'ErrorDeCertificado';
    }
}

export interface CertificadoDelSat {
    readonly rfc: string;
    readonly nombre: string | null;
    readonly numeroDeCertificado: string;
    readonly validoDesde: Date;
    readonly validoHasta: Date;
    /** La sucursal (`OU`): solo la trae el CSD. */
    readonly unidadOrganizacional: string | null;
    readonly exponente: number;
    readonly bitsDelModulo: number;
}

/** Bytes → texto latin1 (cada byte, un carácter). */
function latin1(bytes: Uint8Array): string {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
    return s;
}

/** Bytes UTF-8 → texto. Sin `TextDecoder`: contracts no asume navegador ni Node. */
function utf8(bytes: Uint8Array): string {
    let s = '';
    for (let i = 0; i < bytes.length; ) {
        const b = bytes[i]!;
        let cp: number;
        let n: number;
        if (b < 0x80) { cp = b; n = 1; }
        else if (b >= 0xc0 && b < 0xe0) { cp = b & 0x1f; n = 2; }
        else if (b >= 0xe0 && b < 0xf0) { cp = b & 0x0f; n = 3; }
        else if (b >= 0xf0) { cp = b & 0x07; n = 4; }
        else { cp = 0xfffd; n = 1; }
        for (let k = 1; k < n; k++) cp = (cp << 6) | ((bytes[i + k] ?? 0x80) & 0x3f);
        s += String.fromCodePoint(cp > 0x10ffff ? 0xfffd : cp);
        i += n;
    }
    return s;
}

// ─── Lector DER acotado ──────────────────────────────────────────────────────

interface Tlv {
    readonly tag: number;
    /** Inicio del contenido. */
    readonly start: number;
    /** Fin del contenido (exclusivo). */
    readonly end: number;
}

const OID_RSA = '1.2.840.113549.1.1.1';
const OID_CN = '2.5.4.3';
const OID_OU = '2.5.4.11';
const OID_UNIQUE_ID = '2.5.4.45';

function invalido(detalle: string): ErrorDeCertificado {
    return new ErrorDeCertificado('CERTIFICADO_INVALIDO', `El archivo no es un certificado válido (${detalle}).`);
}

function leerTlv(buf: Uint8Array, pos: number, limite: number): Tlv {
    if (pos + 2 > limite) throw invalido('se acabó antes de tiempo');
    const tag = buf[pos]!;
    if ((tag & 0x1f) === 0x1f) throw invalido('etiqueta no admitida');
    let len = buf[pos + 1]!;
    let start = pos + 2;
    if (len & 0x80) {
        const n = len & 0x7f;
        if (n === 0 || n > 4 || start + n > limite) throw invalido('longitud no admitida');
        len = 0;
        for (let i = 0; i < n; i++) len = len * 256 + buf[start + i]!;
        start += n;
    }
    const end = start + len;
    if (end > limite) throw invalido('longitud fuera del archivo');
    return { tag, start, end };
}

/** Los hijos de un SEQUENCE / SET, en orden. */
function hijos(buf: Uint8Array, padre: Tlv): Tlv[] {
    const out: Tlv[] = [];
    for (let p = padre.start; p < padre.end; ) {
        const t = leerTlv(buf, p, padre.end);
        out.push(t);
        p = t.end;
        if (out.length > 64) throw invalido('demasiados elementos');
    }
    return out;
}

function esperar(t: Tlv | undefined, tag: number, que: string): Tlv {
    if (!t || t.tag !== tag) throw invalido(`falta ${que}`);
    return t;
}

function requerido(t: Tlv | undefined, que: string): Tlv {
    if (!t) throw invalido(`falta ${que}`);
    return t;
}

function leerOid(buf: Uint8Array, t: Tlv): string {
    const bytes = buf.subarray(t.start, t.end);
    if (bytes.length === 0) throw invalido('OID vacío');
    const partes: number[] = [];
    const primero = bytes[0]!;
    partes.push(Math.min(2, Math.floor(primero / 40)), primero - Math.min(2, Math.floor(primero / 40)) * 40);
    let v = 0;
    for (let i = 1; i < bytes.length; i++) {
        v = v * 128 + (bytes[i]! & 0x7f);
        if (!(bytes[i]! & 0x80)) {
            partes.push(v);
            v = 0;
        }
    }
    return partes.join('.');
}

function leerTexto(buf: Uint8Array, t: Tlv): string {
    const bytes = buf.subarray(t.start, t.end);
    switch (t.tag) {
        case 0x0c: // UTF8String
            return utf8(bytes);
        case 0x1e: {
            // BMPString (UTF-16BE)
            let s = '';
            for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode((bytes[i]! << 8) | bytes[i + 1]!);
            return s;
        }
        case 0x13: // PrintableString
        case 0x16: // IA5String
        case 0x14: // T61String
            return latin1(bytes);
        default:
            throw invalido('texto con codificación no admitida');
    }
}

function leerFecha(buf: Uint8Array, t: Tlv): Date {
    const s = latin1(buf.subarray(t.start, t.end));
    let m: RegExpMatchArray | null;
    let anio: number;
    if (t.tag === 0x17 && (m = s.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/))) {
        const yy = Number(m[1]);
        anio = yy < 50 ? 2000 + yy : 1900 + yy;
    } else if (t.tag === 0x18 && (m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/))) {
        anio = Number(m[1]);
    } else {
        throw invalido('fecha de vigencia');
    }
    return new Date(Date.UTC(anio, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])));
}

/** Los atributos de un Name (RDNSequence) por OID. Si un OID se repite, gana el primero. */
function leerNombre(buf: Uint8Array, t: Tlv): Map<string, string> {
    const out = new Map<string, string>();
    for (const set of hijos(buf, esperar(t, 0x30, 'el nombre'))) {
        for (const atv of hijos(buf, esperar(set, 0x31, 'un atributo del nombre'))) {
            const [oid, valor] = hijos(buf, esperar(atv, 0x30, 'un atributo del nombre'));
            const codigo = leerOid(buf, esperar(oid, 0x06, 'el OID de un atributo'));
            if (valor && !out.has(codigo)) out.set(codigo, leerTexto(buf, valor));
        }
    }
    return out;
}

/** Entero positivo big-endian → número y bits (sin el cero de signo). */
function leerEnteroPositivo(buf: Uint8Array, t: Tlv): { valor: number; bits: number } {
    let i = t.start;
    while (i < t.end - 1 && buf[i] === 0) i++;
    const len = t.end - i;
    if (len <= 0) throw invalido('entero vacío');
    const bits = (len - 1) * 8 + (32 - Math.clz32(buf[i]!));
    let valor = 0;
    for (let k = i; k < t.end && k < i + 7; k++) valor = valor * 256 + buf[k]!;
    return { valor: len > 7 ? Number.POSITIVE_INFINITY : valor, bits };
}

/**
 * El «número de certificado» del SAT.
 *
 * El SAT guarda en el serial los 20 dígitos en ASCII (`0x3330303031…` → `30001…`). Si no fueran
 * dígitos, se devuelve en hexadecimal para no inventar un número.
 */
function leerNumeroDeCertificado(buf: Uint8Array, t: Tlv): string {
    const bytes = buf.subarray(t.start, t.end);
    const sinCero = bytes[0] === 0 ? bytes.subarray(1) : bytes;
    const ascii = sinCero.every((b) => b >= 0x30 && b <= 0x39);
    if (ascii && sinCero.length > 0) return latin1(sinCero);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Lee un certificado X.509 en DER.
 *
 * @throws ErrorDeCertificado `CERTIFICADO_INVALIDO` ante cualquier cosa que no cuadre.
 */
export function leerCertificadoDelSat(der: Uint8Array): CertificadoDelSat {
    if (der.length < 200 || der.length > 8_000) throw invalido('tamaño fuera de lo normal');
    const cert = esperar(leerTlv(der, 0, der.length), 0x30, 'el certificado');
    if (cert.end !== der.length) throw invalido('bytes sobrantes');
    const [tbs] = hijos(der, cert);
    const campos = hijos(der, esperar(tbs, 0x30, 'el cuerpo del certificado'));

    let i = 0;
    if (campos[i]?.tag === 0xa0) i++; // [0] version
    const serial = esperar(campos[i++], 0x02, 'el número de certificado');
    i++; // algoritmo de la firma
    i++; // emisor
    const validez = hijos(der, esperar(campos[i++], 0x30, 'la vigencia'));
    const sujeto = leerNombre(der, esperar(campos[i++], 0x30, 'el sujeto'));
    const spki = hijos(der, esperar(campos[i++], 0x30, 'la llave pública'));

    const [alg] = hijos(der, esperar(spki[0], 0x30, 'el algoritmo de la llave'));
    if (leerOid(der, esperar(alg, 0x06, 'el algoritmo de la llave')) !== OID_RSA) {
        throw new ErrorDeCertificado('LLAVE_NO_ADMITIDA', 'La llave del certificado no es RSA.');
    }
    const bitString = esperar(spki[1], 0x03, 'la llave pública');
    if (der[bitString.start] !== 0) throw invalido('llave pública con bits sobrantes');
    const rsa = leerTlv(der, bitString.start + 1, bitString.end);
    const [modulo, exponente] = hijos(der, esperar(rsa, 0x30, 'la llave RSA'));

    const uniqueId = sujeto.get(OID_UNIQUE_ID);
    const rfc = uniqueId ? rfcDeCertificado(uniqueId) : null;
    if (!rfc) throw invalido('no trae el RFC del contribuyente');

    return {
        rfc,
        nombre: sujeto.get(OID_CN) ?? null,
        numeroDeCertificado: leerNumeroDeCertificado(der, serial),
        validoDesde: leerFecha(der, requerido(validez[0], 'el inicio de vigencia')),
        validoHasta: leerFecha(der, requerido(validez[1], 'el fin de vigencia')),
        unidadOrganizacional: sujeto.get(OID_OU) ?? null,
        exponente: leerEnteroPositivo(der, esperar(exponente, 0x02, 'el exponente')).valor,
        bitsDelModulo: leerEnteroPositivo(der, esperar(modulo, 0x02, 'el módulo')).bits,
    };
}


/** Los RFC genéricos (público en general, extranjero) no son el RFC de nadie. */
const RFC_GENERICOS = new Set(['XAXX010101000', 'XEXX010101000']);

const REGIMEN_SOCIETARIO =
    /\s+(S\s?A\s?P\s?I(\s?DE\s?C\s?V)?|S\s?A\s?B(\s?DE\s?C\s?V)?|S\s?A\s?S(\s?DE\s?C\s?V)?|S\s?A(\s?DE\s?C\s?V)?|S\s?DE\s?R\s?L(\s?(DE\s?C\s?V|MI))?|S\s?P\s?R\s?DE\s?R\s?[LI]|S\s?C(\s?DE\s?R\s?L)?|A\s?C|I\s?A\s?P|S\s?N\s?C|S\s?EN\s?C(\s?POR\s?A)?|SOFOM(\s?E\s?N\s?R|\s?E\s?R)?)\s*$/;

/**
 * La razón social como va en el CFDI 4.0: el nombre del certificado **sin el régimen societario**
 * («ESCUELA KEMPER URGATE SA DE CV» → «ESCUELA KEMPER URGATE»), que es como el SAT la tiene en su
 * padrón. Solo a personas morales (RFC de 12): un nombre de persona física se deja tal cual.
 */
export function razonSocialDelCertificado(nombre: string | null, rfc: string): string {
    const limpio = (nombre ?? '').toUpperCase().replace(/\./g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (rfc.length !== 12) return limpio;
    let r = limpio;
    for (let i = 0; i < 2 && REGIMEN_SOCIETARIO.test(r); i++) r = r.replace(REGIMEN_SOCIETARIO, '').trim();
    return r || limpio;
}

export type CodigoDeCsd = 'NO_ES_CSD' | 'AUN_NO_VIGENTE' | 'VENCIDO' | 'RFC_DE_OTRO' | 'RFC_DE_OTRA_EMPRESA';

/**
 * ¿Sirve este certificado como los sellos de esta empresa? Devuelve el problema o null.
 *
 * El RFC lo pone el certificado: si la empresa ya tiene uno (que no sea genérico) tiene que ser el
 * mismo, y no puede ser el de otra empresa del negocio. Así nadie timbra con un RFC tecleado mal.
 */
export function revisarCsdDeEmpresa(
    cert: CertificadoDelSat,
    empresa: { readonly rfc: string | null },
    otras: ReadonlyArray<{ readonly nombre: string; readonly rfc: string | null }>,
    ahora: Date
): { readonly codigo: CodigoDeCsd; readonly mensaje: string } | null {
    if (!esCsd(cert.unidadOrganizacional)) {
        return { codigo: 'NO_ES_CSD', mensaje: 'Ese certificado es la e.firma, no los sellos (CSD). Los sellos se tramitan en el SAT con la e.firma, en CertiSAT.' };
    }
    if (ahora < cert.validoDesde) return { codigo: 'AUN_NO_VIGENTE', mensaje: 'Esos sellos todavía no entran en vigor.' };
    if (ahora > cert.validoHasta) return { codigo: 'VENCIDO', mensaje: 'Esos sellos ya vencieron. Tramita unos nuevos en CertiSAT.' };
    const propio = (empresa.rfc ?? '').trim().toUpperCase();
    if (propio && !RFC_GENERICOS.has(propio) && propio !== cert.rfc) {
        return { codigo: 'RFC_DE_OTRO', mensaje: `Esos sellos son del RFC ${cert.rfc} y esta empresa tiene el RFC ${propio}.` };
    }
    const otra = otras.find((o) => (o.rfc ?? '').trim().toUpperCase() === cert.rfc);
    if (otra) {
        return { codigo: 'RFC_DE_OTRA_EMPRESA', mensaje: `Esos sellos son del RFC ${cert.rfc}, que ya es el de ${otra.nombre}. Elige los sellos de esta empresa.` };
    }
    return null;
}

/** Base64 (con o sin saltos de línea) → bytes, para leer el .cer que llega en el cuerpo de una petición. */
export function bytesDeBase64(b64: string): Uint8Array {
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const limpio = b64.replace(/[\s=]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const out = new Uint8Array(Math.floor((limpio.length * 3) / 4));
    let bits = 0, acumulado = 0, j = 0;
    for (const c of limpio) {
        const v = alfabeto.indexOf(c);
        if (v < 0) throw new ErrorDeCertificado('CERTIFICADO_INVALIDO', 'El archivo no es un certificado válido (no viene en base64).');
        acumulado = (acumulado << 6) | v;
        bits += 6;
        if (bits >= 8) { bits -= 8; out[j++] = (acumulado >> bits) & 0xff; }
    }
    return out.subarray(0, j);
}
