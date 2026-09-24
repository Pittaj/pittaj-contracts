/**
 * @fileoverview Qué se le pide al SAT cada día: días abiertos, rangos, reintentos y cobertura.
 * @module Contracts/SatDownload/Plan
 *
 * Decisión del dueño (2026-09-24, `arquitectura/descarga-del-sat-en-la-web.md` §2): la descarga
 * corre sola una vez al día en la nube, y **nada se cae de la ventana aunque el SAT esté caído**.
 *
 * ── Por qué no basta una ventana fija ──
 *
 * Un CFDI se puede timbrar hasta 72 h después de su fecha de emisión, y el servicio filtra **por
 * fecha de emisión** (documentación oficial v1.5). Pedir «ayer» pierde lo que se timbra tarde; pedir
 * «los últimos 4 días» lo pierde igual si el SAT falla justo el día que tocaba cerrar.
 *
 * ── La regla ──
 *
 * Cada día (por RFC y tipo) está **abierto** hasta que una descarga **exitosa**, pedida el día
 * D + 4 o después, lo cubre. Entonces se **cierra** y no se vuelve a pedir. Cada corrida pide desde
 * el día abierto más antiguo hasta ayer. En condiciones normales son cuatro días; si el SAT estuvo
 * caído tres, son siete. Nada se pierde en silencio.
 *
 * Aquí solo hay funciones puras sobre fechas `YYYY-MM-DD` del calendario del centro de México. La
 * nube (API) y el descargador las usan igual, así que deciden lo mismo.
 */

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Zona del calendario fiscal. El SAT interpreta `FechaInicial`/`FechaFinal` en hora del centro. */
export const SAT_ZONA_HORARIA = 'America/Mexico_City';

/**
 * Un día D se cierra con una descarga exitosa **pedida el día D + 4 o después**.
 *
 * 72 h de plazo de timbrado (D + 3 a medianoche en el peor caso: emitido a las 23:59 de D) más un
 * día de margen para lo que el SAT publica tarde. Si en producción el retraso resulta mayor, se
 * sube aquí y en ningún otro lado.
 */
export const SAT_DIAS_PARA_CERRAR = 4;

/**
 * Tope de días por solicitud.
 *
 * El SAT acepta hasta 200 000 CFDI por solicitud; 30 días de un negocio chico o mediano caben de
 * sobra, y un paquete más chico se recupera más rápido si algo falla.
 */
export const SAT_DIAS_POR_RANGO = 30;

/**
 * Cuántos rangos de XML se piden como máximo en una corrida, por tipo.
 *
 * Es lo que reparte el histórico: cinco años son ~61 rangos, así que se completan en unas dos
 * semanas de corridas en vez de una avalancha de solicitudes que el SAT tardaría días en servir.
 */
export const SAT_RANGOS_POR_CORRIDA = 4;

/** Hasta dónde se puede pedir el histórico. El servicio admite seis años; se deja uno de margen. */
export const SAT_HISTORICO_MAXIMO_ANIOS = 5;

/** Días de metadata de la revisión semanal (red para lo publicado tarde y las cancelaciones). */
export const SAT_DIAS_DE_METADATA = 35;
/** Cada cuánto corre la revisión de metadata. */
export const SAT_METADATA_CADA_DIAS = 7;

/** Un día abierto sin solicitud en curso que lo pueda cerrar avisa a partir de D + 7… */
export const SAT_AVISO_DIA_ABIERTO = 7;
/** …y con una en curso, a partir de D + 10: el SAT puede tardar hasta 72 h en preparar una solicitud. */
export const SAT_AVISO_DIA_ABIERTO_EN_CURSO = 10;

/**
 * Cuántas veces se reintenta pedir el mismo rango base en un día.
 *
 * Cada reintento **corre el inicio un segundo hacia atrás**, así que para el SAT es otro periodo y
 * no gasta el cupo de dos por periodo idéntico. El tope evita martillar un servicio caído: lo que
 * no entre hoy, lo pide la corrida de mañana.
 */
export const SAT_REINTENTOS_POR_DIA = 12;

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Recibidos: lo que te facturaron. Emitidos: para contrastar contra lo que timbraste. */
export const SAT_DOWNLOAD_KINDS = ['RECIBIDOS', 'EMITIDOS'] as const;
export type SatDownloadKind = (typeof SAT_DOWNLOAD_KINDS)[number];

/**
 * Qué se pide.
 *
 * - `CFDI`: los XML. Es lo que gasta el cupo de dos solicitudes por periodo idéntico.
 * - `METADATA`: la lista con estado. **No gasta cupo**: es la red de la revisión semanal.
 * - `FOLIO`: un UUID concreto (`SolicitaDescargaFolio`), para rescatar un faltante.
 */
export const SAT_DOWNLOAD_PAYLOADS = ['CFDI', 'METADATA', 'FOLIO'] as const;
export type SatDownloadPayload = (typeof SAT_DOWNLOAD_PAYLOADS)[number];

/**
 * Un rango tal como se le manda al SAT: fecha y hora **locales del centro**, sin zona.
 *
 * Es texto y no `Date` a propósito: el SAT recibe `2026-09-20T00:00:00`, y cualquier conversión de
 * zona en medio es la forma más fácil de partir un día por la mitad.
 */
export interface SatRango {
    /** `YYYY-MM-DDTHH:mm:ss`, hora del centro de México. */
    readonly inicio: string;
    /** `YYYY-MM-DDTHH:mm:ss`, hora del centro de México. */
    readonly fin: string;
}

/** Un rango de días completos: el primero y el último (`YYYY-MM-DD`, ambos incluidos). */
export interface SatTramo {
    readonly desde: string;
    readonly hasta: string;
}

/**
 * Una solicitud que ya se hizo y todavía no termina (el SAT la aceptó y no se ha descargado).
 *
 * Importa para no pedir dos veces lo mismo: si ya hay una en curso que **puede cerrar** un día, ese
 * día no se vuelve a pedir.
 */
export interface SatSolicitudEnCurso {
    readonly desde: string;
    readonly hasta: string;
    /** Día (calendario del centro) en que se pidió. Decide si puede cerrar los días que cubre. */
    readonly pedidaEl: string;
}

// ─── Fechas ──────────────────────────────────────────────────────────────────

const RE_DIA = /^\d{4}-\d{2}-\d{2}$/;

function aUtc(dia: string): number {
    if (!RE_DIA.test(dia)) throw new Error(`Día inválido: «${dia}» (se espera YYYY-MM-DD)`);
    const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
    const t = Date.UTC(a, m - 1, d);
    const vuelta = new Date(t);
    if (vuelta.getUTCFullYear() !== a || vuelta.getUTCMonth() !== m - 1 || vuelta.getUTCDate() !== d) {
        throw new Error(`Día inválido: «${dia}»`);
    }
    return t;
}

function deUtc(t: number): string {
    return new Date(t).toISOString().slice(0, 10);
}

/** `dia` más `n` días (n puede ser negativo). */
export function sumarDias(dia: string, n: number): string {
    return deUtc(aUtc(dia) + n * 86_400_000);
}

/** Días de `a` a `b` (positivo si `b` es posterior). */
export function diasEntre(a: string, b: string): number {
    return Math.round((aUtc(b) - aUtc(a)) / 86_400_000);
}

/**
 * El día del calendario del centro de México en que cae un instante.
 *
 * Se calcula con `Intl` y la zona `America/Mexico_City`, no restando seis horas: si México vuelve a
 * cambiar de horario, la zona lo sabe y una resta fija no.
 */
export function diaEnMexico(instante: Date): string {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: SAT_ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(instante);
    const v = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
    return `${v('year')}-${v('month')}-${v('day')}`;
}

/** La hora (0–23) del centro de México en que cae un instante. Para saber si ya «toca» la corrida. */
export function horaEnMexico(instante: Date): number {
    const h = new Intl.DateTimeFormat('en-GB', {
        timeZone: SAT_ZONA_HORARIA,
        hour: '2-digit',
        hour12: false,
    }).format(instante);
    return Number(h) % 24;
}

// ─── Reglas ──────────────────────────────────────────────────────────────────

/**
 * ¿Cierra el día `dia` una descarga exitosa pedida el día `pedidaEl`?
 *
 * Solo si se pidió cuando ya pasó el plazo de timbrado más el margen. Una descarga de «ayer» trae lo
 * que hay, pero **no** demuestra que no falte nada: lo que se timbre mañana con fecha de ayer
 * todavía no existía.
 */
export function cierraElDia(dia: string, pedidaEl: string): boolean {
    return diasEntre(dia, pedidaEl) >= SAT_DIAS_PARA_CERRAR;
}

/**
 * Los días abiertos entre `inicio` y ayer, del más antiguo al más reciente.
 *
 * @param hoy       Día de la corrida (calendario del centro).
 * @param inicio    Desde cuándo responde el negocio por sus comprobantes: el día en que se activó
 *                  la descarga, o antes si pidió histórico.
 * @param cerrados  Días ya cerrados.
 */
export function diasAbiertos(hoy: string, inicio: string, cerrados: ReadonlySet<string>): string[] {
    const ayer = sumarDias(hoy, -1);
    const out: string[] = [];
    for (let d = inicio; diasEntre(d, ayer) >= 0; d = sumarDias(d, 1)) {
        if (!cerrados.has(d)) out.push(d);
    }
    return out;
}

/** ¿Hay una solicitud en curso que, si termina bien, cerrará este día? */
function tieneSolicitudQueLoCierra(dia: string, enCurso: readonly SatSolicitudEnCurso[]): boolean {
    return enCurso.some(
        (s) => diasEntre(s.desde, dia) >= 0 && diasEntre(dia, s.hasta) >= 0 && cierraElDia(dia, s.pedidaEl),
    );
}

/**
 * Agrupa días ascendentes en tramos consecutivos de a lo más `maxDias`.
 *
 * Cada racha se parte **desde su extremo reciente**, así el tramo corto (el sobrante) queda en lo
 * viejo y lo de esta semana siempre sale en un tramo completo.
 */
function agrupar(dias: readonly string[], maxDias: number): SatTramo[] {
    const rachas: string[][] = [];
    for (const d of dias) {
        const ultima = rachas[rachas.length - 1];
        const previo = ultima?.[ultima.length - 1];
        if (ultima && previo !== undefined && diasEntre(previo, d) === 1) ultima.push(d);
        else rachas.push([d]);
    }
    const tramos: SatTramo[] = [];
    for (const racha of rachas) {
        for (let fin = racha.length; fin > 0; fin -= maxDias) {
            const ini = Math.max(0, fin - maxDias);
            tramos.push({ desde: racha[ini]!, hasta: racha[fin - 1]! });
        }
    }
    return tramos;
}

export interface PlanDeCorrida {
    /** Tramos de XML a pedir hoy, **del más reciente al más antiguo**. */
    readonly tramos: SatTramo[];
    /** Días abiertos que no entraron por el tope de la corrida. Los pide la siguiente. */
    readonly diasPendientes: number;
}

/**
 * Qué XML pedir hoy, para un RFC y un tipo.
 *
 * - Parte de los días abiertos entre `inicio` y ayer.
 * - Salta los que ya tienen una solicitud en curso que los va a cerrar (pedirlos de nuevo solo
 *   duplicaría el trabajo del SAT).
 * - Agrupa lo que queda en tramos consecutivos de hasta `SAT_DIAS_POR_RANGO` días.
 * - Ordena **de lo más reciente a lo más antiguo** y corta en `SAT_RANGOS_POR_CORRIDA`: lo de esta
 *   semana importa más que lo de hace tres años, y el histórico se completa en las corridas
 *   siguientes sin que nadie lo pida.
 */
export function planearCorrida(params: {
    readonly hoy: string;
    readonly inicio: string;
    readonly cerrados: ReadonlySet<string>;
    readonly enCurso?: readonly SatSolicitudEnCurso[];
    readonly maxRangos?: number;
}): PlanDeCorrida {
    const enCurso = params.enCurso ?? [];
    const maxRangos = params.maxRangos ?? SAT_RANGOS_POR_CORRIDA;
    const porPedir = diasAbiertos(params.hoy, params.inicio, params.cerrados).filter(
        (d) => !tieneSolicitudQueLoCierra(d, enCurso),
    );
    const tramos = agrupar(porPedir, SAT_DIAS_POR_RANGO).sort((a, b) => diasEntre(a.hasta, b.hasta));
    const hoyTramos = tramos.slice(0, maxRangos);
    const pedidos = hoyTramos.reduce((n, t) => n + diasEntre(t.desde, t.hasta) + 1, 0);
    return { tramos: hoyTramos, diasPendientes: porPedir.length - pedidos };
}

/**
 * El rango que se le manda al SAT para un tramo, en su intento `intento` del día (0 = el primero).
 *
 * Cada reintento corre el inicio **un segundo hacia atrás**: el SAT lo cuenta como un periodo
 * distinto (cambiar un segundo ya es otro periodo) y así un reintento nunca gasta el cupo de dos
 * solicitudes de por vida del periodo idéntico. Lo que se repita por ese segundo lo descarta el
 * buzón, que toma el UUID como llave.
 *
 * El fin se queda fijo en `23:59:59` del último día: el rango mínimo que acepta el SAT (v1.5) es de
 * dos segundos, y siempre se cumple.
 */
export function rangoParaSolicitar(tramo: SatTramo, intento = 0): SatRango {
    if (intento < 0 || !Number.isInteger(intento)) throw new Error(`Intento inválido: ${intento}`);
    if (diasEntre(tramo.desde, tramo.hasta) < 0) throw new Error(`Tramo al revés: ${tramo.desde} > ${tramo.hasta}`);
    const inicio = new Date(aUtc(tramo.desde) - intento * 1000).toISOString().slice(0, 19);
    return { inicio, fin: `${tramo.hasta}T23:59:59` };
}

/** Los días (calendario del centro) que cubre un rango ya mandado al SAT, a partir de su fin e inicio. */
export function tramoDeRango(rango: SatRango): SatTramo {
    // Un inicio corrido por reintento cae en el día anterior a las 23:59:5x: ese día NO se cubre
    // completo, así que el tramo empieza en el siguiente.
    const diaInicio = rango.inicio.slice(0, 10);
    const desde = rango.inicio.slice(11) === '00:00:00' ? diaInicio : sumarDias(diaInicio, 1);
    return { desde, hasta: rango.fin.slice(0, 10) };
}

/**
 * Hasta qué día está cubierto un RFC y tipo: el último de la racha continua de días cerrados que
 * empieza en `inicio`. `null` si ni siquiera `inicio` está cerrado.
 *
 * Es la racha y no el máximo: un día cerrado suelto después de un hueco **no** cubre el hueco, y
 * decir que sí taparía justo lo que el aviso existe para enseñar.
 */
export function cubreHasta(inicio: string, cerrados: ReadonlySet<string>): string | null {
    if (!cerrados.has(inicio)) return null;
    let d = inicio;
    while (cerrados.has(sumarDias(d, 1))) d = sumarDias(d, 1);
    return d;
}

/**
 * Los días abiertos que ya deberían estar cerrados y no lo están: los que merecen aviso.
 *
 * Sin solicitud en curso que los pueda cerrar, avisan desde D + 7. Con una en curso, desde D + 10,
 * porque el SAT puede tardar hasta 72 h en preparar una solicitud y avisar antes sería ruido.
 */
export function diasAtrasados(params: {
    readonly hoy: string;
    readonly inicio: string;
    readonly cerrados: ReadonlySet<string>;
    readonly enCurso?: readonly SatSolicitudEnCurso[];
}): string[] {
    const enCurso = params.enCurso ?? [];
    return diasAbiertos(params.hoy, params.inicio, params.cerrados).filter((d) => {
        const umbral = tieneSolicitudQueLoCierra(d, enCurso) ? SAT_AVISO_DIA_ABIERTO_EN_CURSO : SAT_AVISO_DIA_ABIERTO;
        return diasEntre(d, params.hoy) >= umbral;
    });
}

/** ¿Toca hoy la revisión semanal de metadata? */
export function tocaMetadata(hoy: string, ultimaMetadata: string | null): boolean {
    return ultimaMetadata === null || diasEntre(ultimaMetadata, hoy) >= SAT_METADATA_CADA_DIAS;
}

/** El tramo de la revisión de metadata: los últimos `SAT_DIAS_DE_METADATA` días hasta ayer. */
export function tramoDeMetadata(hoy: string): SatTramo {
    return { desde: sumarDias(hoy, -SAT_DIAS_DE_METADATA), hasta: sumarDias(hoy, -1) };
}

/**
 * El día más antiguo que se puede pedir de histórico.
 *
 * El SAT (v1.5) rechaza fechas anteriores a seis años atrás; aquí se ofrece hasta cinco.
 */
export function inicioMinimoDeHistorico(hoy: string): string {
    const [a, m, d] = hoy.split('-').map(Number) as [number, number, number];
    // Un 29 de febrero cae en 1 de marzo del año sin bisiesto: nunca antes del tope del SAT.
    return deUtc(Date.UTC(a - SAT_HISTORICO_MAXIMO_ANIOS, m - 1, d));
}

/**
 * El `EstadoComprobante` que va en la solicitud.
 *
 * Desde la v1.5, **recibidos en XML exige `Vigente`**: sin él, el SAT rechaza la solicitud. Los
 * cancelados no llegan como XML; la cancelación la trae la metadata. Todo lo demás pide `Todos`.
 */
export function estadoComprobanteDeSolicitud(kind: SatDownloadKind, payload: SatDownloadPayload): 'Vigente' | 'Todos' {
    return kind === 'RECIBIDOS' && payload === 'CFDI' ? 'Vigente' : 'Todos';
}
