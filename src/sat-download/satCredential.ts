/**
 * @fileoverview La e.firma resguardada: consentimiento, estados y lo que se lee del certificado.
 * @module Contracts/SatDownload/Credential
 *
 * Decisión del dueño (2026-09-24): la descarga del SAT corre en la nube a diario, así que Pittaj
 * resguarda la e.firma **en un HSM, como llave no exportable**. La llave llega **envuelta desde el
 * navegador** para el trabajo de importación del KMS: ni la contraseña ni la llave en claro pasan
 * nunca por un servidor de Pittaj. Aquí solo viaja lo público (el `.cer`) y el sobre cifrado.
 */

/**
 * Versión del texto de consentimiento. Se guarda con cada alta junto con el texto exacto: si el
 * texto cambia, las altas viejas siguen diciendo lo que el cliente aceptó entonces.
 */
export const SAT_CONSENT_VERSION = '2026-09-24';

/**
 * El mandato limitado que acepta el Propietario al cargar la e.firma.
 *
 * ⚠️ Pendiente de revisión legal antes de abrirlo a clientes. Cambiarlo obliga a subir
 * `SAT_CONSENT_VERSION`.
 */
export const SAT_CONSENT_TEXT =
    'Autorizo a Pittaj a resguardar mi e.firma (FIEL) en un módulo de seguridad de hardware y a ' +
    'usarla únicamente para descargar del SAT los CFDI emitidos y recibidos de mi RFC: una vez al ' +
    'día y, si lo pido, para recuperar mi histórico. Pittaj no conoce mi contraseña ni puede ' +
    'extraer la llave. Cada uso queda en una bitácora que puedo consultar, y puedo revocar esta ' +
    'autorización cuando quiera desde Fiscal → e.firma.';

/**
 * Cómo se envuelve la llave para el KMS: RSA-OAEP (3072, SHA-256) sobre una clave AES-256 efímera,
 * y AES-KWP (RFC 5649) con esa clave sobre la llave privada en PKCS#8 DER. Es el
 * `rsa-oaep-3072-sha256-aes-256` de Cloud KMS.
 */
export const SAT_IMPORT_METHOD = 'rsa-oaep-3072-sha256-aes-256';

/**
 * Estados de una e.firma resguardada.
 *
 * - `PENDIENTE`: el sobre llegó y espera a que el descargador lo importe al HSM y compruebe la
 *   pareja `.cer`/llave firmando un reto.
 * - `ACTIVA`: importada y comprobada. Es la única que firma.
 * - `FALLIDA`: la importación o la comprobación falló (sobre corrupto, llave que no es del `.cer`).
 * - `REVOCADA`: el Propietario la revocó. Deja de firmar al instante; la llave se destruye.
 * - `REEMPLAZADA`: se cargó otra del mismo negocio y ésta se retiró (renovación).
 *
 * «Vencida» no es un estado: se deriva de `validTo`. Guardarlo exigiría un proceso que lo
 * actualice, y el día que no corra la pantalla mentiría.
 */
export const SAT_CREDENTIAL_STATUSES = ['PENDIENTE', 'ACTIVA', 'FALLIDA', 'REVOCADA', 'REEMPLAZADA'] as const;
export type SatCredentialStatus = (typeof SAT_CREDENTIAL_STATUSES)[number];

/** Lo que se usa de la llave, para la bitácora que ve el cliente. */
export const SAT_SIGNATURE_OPERATIONS = [
    /** Comprobar, al importarla, que la llave corresponde al `.cer`. */
    'VERIFICAR_PAREJA',
    'AUTENTICAR',
    'SOLICITAR',
    'VERIFICAR',
    'DESCARGAR',
] as const;
export type SatSignatureOperation = (typeof SAT_SIGNATURE_OPERATIONS)[number];

/**
 * El RFC de un certificado del SAT.
 *
 * El SAT lo pone en `x500UniqueIdentifier` (OID 2.5.4.45). En una persona moral viene con el RFC
 * del representante: `"EKU9003173C9 / VADA800927DJ3"`. El primero es el del contribuyente.
 */
export function rfcDeCertificado(x500UniqueIdentifier: string): string | null {
    const primero = x500UniqueIdentifier.split('/')[0]?.trim().toUpperCase() ?? '';
    return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(primero) ? primero : null;
}

/**
 * ¿Es un CSD (sello digital) en vez de la e.firma?
 *
 * El CSD trae la unidad organizacional (`OU`, la sucursal) en el sujeto; la e.firma no. Es la
 * confusión más común: el CSD carga sin protestar y **el SAT lo rechaza** en la descarga.
 */
export function esCsd(organizationalUnit: string | null | undefined): boolean {
    return typeof organizationalUnit === 'string' && organizationalUnit.trim().length > 0;
}
