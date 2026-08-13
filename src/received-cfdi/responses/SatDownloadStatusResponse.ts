/**
 * @fileoverview La marca de agua de la descarga del SAT, y la salud fiscal que se deriva de ella.
 *
 * ── Por qué existe ──
 *
 * La descarga corre en el escritorio, porque es donde vive la e.firma. Eso tiene un agujero que no
 * se arregla descargando mejor: **si esa computadora no se enciende, no pasa nada — y no pasa nada
 * de forma silenciosa**. Nadie recibe un error, porque nadie lo intentó.
 *
 * El contador entra a la web, ve doce comprobantes y **no tiene manera de distinguir «me facturaron
 * doce» de «llevan tres semanas sin encender la computadora»**. Ese es el defecto de verdad: el
 * fallo se ve exactamente igual que lo correcto.
 *
 * Así que el escritorio manda una **marca de agua**: hasta qué día tiene cubierto, cuándo barrió por
 * última vez y en qué estado está su e.firma. Con eso la nube puede notar **la ausencia**, que es lo
 * único que un error no puede reportar por sí mismo.
 *
 * ── Una por equipo, a propósito ──
 *
 * La clave es `(tenant, device)` y no solo el tenant: un negocio puede tener varias instalaciones y
 * **solo una tiene la e.firma**. Con una fila por tenant, la instalación sin e.firma pisaría a la
 * que sí la tiene y el aviso diría lo contrario de la verdad. Con una por equipo, la nube elige la
 * mejor y además **puede decir en qué computadora hay que entrar**, que es lo que convierte el
 * aviso en algo accionable.
 *
 * @module Contracts/ReceivedCfdi
 */

/**
 * Estado de la e.firma en un equipo.
 *
 * `ES_CSD` es su propia respuesta y no un error genérico: cargar el sello digital en vez de la
 * e.firma es la confusión más común, el archivo carga sin protestar y el SAT lo rechaza después.
 * Si no se nombra, el usuario lo descubre cuando el barrido falla de madrugada y ya no relaciona
 * una cosa con la otra.
 */
export const FIEL_STATUSES = ['NONE', 'OK', 'EXPIRED', 'ES_CSD'] as const;
export type FielStatusValue = (typeof FIEL_STATUSES)[number];

/** Marca de agua de UN equipo. Es lo que viaja por sync, del escritorio a la nube. */
export interface SatDownloadStatusResponse {
    readonly id: string;
    /** Equipo que la reporta. Es la mitad de la identidad de la fila. */
    readonly deviceId: string;
    /**
     * Cómo llamarle al equipo delante del usuario.
     *
     * Viaja aunque la nube ya conozca el dispositivo: el aviso tiene que poder decir «abre Pittaj
     * en la computadora de la caja» sin ir a buscar a otra tabla, y este dato se lee tal cual.
     */
    readonly deviceName: string | null;

    /** RFC cuya e.firma está cargada, o null si no hay ninguna. */
    readonly rfc: string | null;
    readonly fielStatus: FielStatusValue;
    /** Vencimiento del certificado (ISO 8601). Sirve para avisar ANTES de que se pare. */
    readonly fielValidTo: string | null;

    /**
     * Último día **completo** ya barrido con éxito (ISO 8601, solo fecha).
     *
     * Es el dato que de verdad importa: no «cuándo corrió» sino **hasta dónde llegó**. Un barrido
     * que corre todos los días y falla todos los días tiene `lastSweepAt` fresquísimo y este campo
     * congelado — y es este el que dice la verdad.
     */
    readonly coveredThrough: string | null;
    /** Última vez que el barrido corrió, con éxito o sin él (ISO 8601). */
    readonly lastSweepAt: string | null;
    /** Qué falló la última vez, si falló. Texto corto, para diagnóstico. */
    readonly lastSweepError: string | null;
    /**
     * Días que se quedaron fuera por el tope de rescate de una corrida.
     *
     * El planificador recorta por el extremo viejo cuando hay que recuperar mucho. Si esto es mayor
     * que cero, **hay días que no se van a traer solos**: alguien tiene que pedir ese periodo a
     * mano. Sin este campo, esa pérdida es invisible.
     */
    readonly omittedDays: number;

    readonly updatedAt: string;
    readonly version: number;
}

/**
 * Por qué la descarga no está al día. Una sola causa, la más accionable.
 *
 * El orden importa y es el de resolución, no el de gravedad: de nada sirve decirle a alguien que
 * lleva ocho días sin descargar si lo que pasa es que **nunca cargó la e.firma**. Cada estado
 * corresponde a una acción distinta y a un mensaje distinto.
 */
export const FISCAL_HEALTH_STATES = [
    /** Al día. No se enseña nada. */
    'OK',
    /** Hay Pittaj, pero nadie cargó la e.firma todavía. */
    'SIN_EFIRMA',
    /** Lo cargado es un CSD (sello digital), no la e.firma. El SAT lo rechaza. */
    'EFIRMA_ES_CSD',
    /** Venció. La descarga está parada hasta que se renueve. */
    'EFIRMA_VENCIDA',
    /** Vence pronto. Todavía funciona: es el aviso que evita el corte. */
    'EFIRMA_POR_VENCER',
    /** Hay e.firma y lleva días sin traer nada. Casi siempre: la computadora está apagada. */
    'SIN_DESCARGA_RECIENTE',
    /** El barrido corre y falla. Aquí sí hay un error que contar. */
    'DESCARGA_CON_ERROR',
    /** Nunca ha llegado marca de agua de ningún equipo. */
    'NUNCA_CONFIGURADO',
] as const;
export type FiscalHealthStateValue = (typeof FISCAL_HEALTH_STATES)[number];

/**
 * Cuánto insistir.
 *
 * Sube con **el calendario**, no con lo grave del error: los mismos seis días de silencio son ruido
 * el día 20 y son urgentes el 12 —cuando toca declarar— o en enero. Un aviso que grita siempre deja
 * de leerse justo cuando importa.
 */
export const FISCAL_HEALTH_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;
export type FiscalHealthSeverityValue = (typeof FISCAL_HEALTH_SEVERITIES)[number];

/**
 * Salud fiscal del negocio: lo que la nube deriva de las marcas de agua de todos sus equipos.
 *
 * **Se deriva, no se guarda.** Un aviso persistido se queda viejo —sigue gritando después de que
 * alguien encendió la computadora— y hay que acordarse de archivarlo. Calculado al vuelo no puede
 * mentir.
 *
 * Devuelve **hechos**, no la frase. El texto es cosa de la interfaz: aquí van los días, el nombre
 * del equipo y las fechas, para que la web arme el mensaje y no haya que redactar dentro de la API.
 */
export interface FiscalHealthResponse {
    readonly state: FiscalHealthStateValue;
    readonly severity: FiscalHealthSeverityValue;

    /** Días desde el último día cubierto. `null` cuando nunca se ha cubierto nada. */
    readonly daysBehind: number | null;
    /** Último día cubierto por el mejor equipo (ISO 8601, solo fecha). */
    readonly coveredThrough: string | null;
    /** Cuándo se supo por última vez de algún equipo (ISO 8601). */
    readonly lastSeenAt: string | null;

    /**
     * El equipo al que hay que ir. Es lo que hace accionable el aviso: «abre Pittaj en la
     * computadora de la caja» se puede seguir; «no se ha podido descargar» no.
     */
    readonly deviceName: string | null;
    readonly rfc: string | null;
    readonly fielValidTo: string | null;
    /** Ver `SatDownloadStatusResponse.omittedDays`: días que no se recuperan solos. */
    readonly omittedDays: number;
    readonly lastError: string | null;

    /** Cuántas instalaciones reportan, y cuántas tienen una e.firma utilizable. */
    readonly devicesReporting: number;
    readonly devicesWithFiel: number;
}
