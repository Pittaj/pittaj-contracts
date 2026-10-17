/**
 * @fileoverview El sello del trabajo de importación: la prueba de que la llave pública con la que
 * el navegador envuelve la e.firma salió del HSM de Pittaj y no de quien controle la nube.
 * @module Contracts/SatDownload/Sello
 *
 * `firma.pittaj.com` cifra la e.firma con la llave pública de un trabajo de importación de Cloud
 * KMS. Esa llave la publica el descargador y la nube solo la reparte. Sin el sello, quien
 * comprometa el API o la base podría repartir **su** llave pública: la página cifraría la e.firma
 * para él, y él la abriría.
 *
 * Por eso el descargador **firma** cada trabajo con una llave de sello que vive en el HSM (ECDSA
 * P-256 con SHA-256) y la página, que trae fija la llave pública del sello en su código (bajo
 * `CODEOWNERS`), verifica la firma **antes** de cifrar nada. Para cambiar la llave del trabajo
 * hay que poder firmar con el HSM, o cambiar el código de la página pasando la revisión.
 *
 * Los dos extremos firman y verifican exactamente los bytes de `mensajeDelSello`: la caducidad va
 * en segundos (el KMS la da con nanosegundos y la base la guarda en microsegundos) y el PEM sin
 * espacios al borde ni `\r` (el esquema de la API lo recorta).
 */

/** El algoritmo del sello, como lo nombran Cloud KMS (`EC_SIGN_P256_SHA256`) y WebCrypto. */
export const SAT_SELLO_ALGORITMO = 'EC_SIGN_P256_SHA256';

/** Etiqueta del formato del mensaje: si algún día cambia, una firma vieja no valida el nuevo. */
const ETIQUETA = 'pittaj/sat/trabajo-de-importacion/v1';

export interface TrabajoSellado {
    readonly importJobId: string;
    readonly publicKeyPem: string;
    readonly method: string;
    readonly expiresAt: string;
}

/** Los bytes que se firman y se verifican. Lanza si la caducidad no es una fecha. */
export function mensajeDelSello(t: TrabajoSellado): Uint8Array {
    const ms = Date.parse(t.expiresAt);
    if (Number.isNaN(ms)) throw new Error(`Caducidad ilegible en el trabajo de importación: ${t.expiresAt}`);
    const pem = t.publicKeyPem.replace(/\r/g, '').trim();
    const texto = [ETIQUETA, t.importJobId.trim(), t.method.trim(), String(Math.floor(ms / 1000)), pem].join('\n');
    // Todo es ASCII (PEM, nombres de recurso, dígitos); otra cosa es un trabajo que no es del KMS.
    if (!/^[\x20-\x7e\n]*$/.test(texto)) throw new Error('El trabajo de importación trae caracteres fuera de ASCII.');
    return Uint8Array.from(texto, (c) => c.charCodeAt(0));
}

/**
 * Una firma ECDSA P-256 en la forma que verifica WebCrypto (IEEE P1363: `r‖s`, 64 bytes) en
 * base64: 88 caracteres. El KMS la entrega en DER; el descargador la convierte.
 */
export const SELLO_BASE64 = /^[A-Za-z0-9+/]{86}==$/;
