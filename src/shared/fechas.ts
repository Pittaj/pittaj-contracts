/**
 * @fileoverview D3 · Fechas civiles, instantes y la zona horaria de cada sucursal.
 * @module Contracts/Shared
 *
 * Hay dos clases de «fecha» y mezclarlas es lo que corría las cosas un día:
 *
 * | Tipo | Ejemplos | Se guarda | Se muestra |
 * |---|---|---|---|
 * | **Fecha civil** | fecha del comprobante, vencimiento, fecha contable, periodo | `YYYY-MM-DD` (`date`) | tal cual, **nunca** se convierte |
 * | **Instante** | cobro, recepción física, sincronización, auditoría | ISO en UTC (`timestamptz`) | en la zona de **la sucursal** del documento |
 *
 * Un instante se vuelve fecha civil **una sola vez**, con la zona de la sucursal donde pasó
 * (`fechaCivilDe`). Una fecha civil no se vuelve instante salvo para filtrar por rango
 * (`inicioDelDia`).
 *
 * **La hora del CFDI** es un tercer caso: el Anexo 20 la pide «hora local del lugar de
 * expedición», sin zona. Es la hora del reloj del emisor y no se sabe de qué zona. Se guarda
 * **como la dice el XML marcada como UTC** (`relojDelComprobante`) para que su fecha civil sea
 * siempre sus primeros diez caracteres, y se muestra en UTC (`mostrarRelojDelComprobante`).
 * Convertirla con la zona del navegador era el error de D0: «31/08 → 30/08».
 *
 * La zona de un documento es la de su sucursal, si no la de su empresa, si no
 * `ZONA_POR_OMISION` (`zonaDe`). La gemela en C# es `Pittaj.Domain/Shared/Fechas.cs`.
 *
 * ⚠️ Este es el único archivo de contracts que puede escribir una zona a mano: la prueba
 * `test/shared/fechas.test.ts` lo vigila, y la nube, la web y el escritorio tienen la suya.
 */

import { z } from 'zod';

/**
 * La zona del SAT: la del centro del país. Manda en lo que el SAT fecha con su propio reloj
 * (las solicitudes de descarga masiva).
 */
export const ZONA_DEL_SAT = 'America/Mexico_City';

/**
 * La zona de un negocio que no ha dicho la suya: la del centro, que es la de casi todo el país y
 * la del SAT. Cada sucursal y cada empresa pueden decir otra.
 */
export const ZONA_POR_OMISION = ZONA_DEL_SAT;

/** La zona de la operación de Pittaj (horario de soporte, avisos de su facturación). */
export const ZONA_DE_PITTAJ = ZONA_DEL_SAT;

/** Una zona horaria que se puede elegir en la ficha de la sucursal o de la empresa. */
export interface ZonaHorariaDeMexico {
    readonly zona: string;
    readonly nombre: string;
}

/**
 * Las zonas de México desde la reforma de 2022 (sin horario de verano salvo en la franja
 * fronteriza, que sigue el de Estados Unidos). Se ofrece esta lista; cualquier zona IANA válida
 * se acepta para un negocio fuera de México.
 */
export const ZONAS_DE_MEXICO: readonly ZonaHorariaDeMexico[] = [
    { zona: 'America/Mexico_City', nombre: 'Centro (la mayor parte del país)' },
    { zona: 'America/Cancun', nombre: 'Sureste (Quintana Roo)' },
    { zona: 'America/Mazatlan', nombre: 'Pacífico (Sinaloa, Nayarit, Baja California Sur)' },
    { zona: 'America/Hermosillo', nombre: 'Sonora' },
    { zona: 'America/Tijuana', nombre: 'Noroeste (Baja California), con horario de verano' },
    { zona: 'America/Ciudad_Juarez', nombre: 'Ciudad Juárez, con horario de verano' },
    { zona: 'America/Ojinaga', nombre: 'Frontera de Chihuahua (Ojinaga), con horario de verano' },
    { zona: 'America/Matamoros', nombre: 'Frontera de Coahuila, Nuevo León y Tamaulipas, con horario de verano' },
];

/** Las zonas ya validadas: `Intl` es caro de construir y se pregunta por la misma muchas veces. */
const validas = new Map<string, boolean>();
const formatos = new Map<string, Intl.DateTimeFormat>();

/** `true` si `zona` es un identificador IANA que este motor conoce. */
export function esZonaValida(zona: string | null | undefined): zona is string {
    if (!zona) return false;
    const sabida = validas.get(zona);
    if (sabida !== undefined) return sabida;
    let ok: boolean;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zona });
        ok = true;
    } catch {
        ok = false;
    }
    validas.set(zona, ok);
    return ok;
}

/**
 * La zona de un documento: la primera válida de las candidatas, en orden (sucursal, empresa),
 * o `ZONA_POR_OMISION`. Una zona inválida se salta, no se propaga: un dato viejo mal escrito no
 * debe tirar un reporte.
 */
export function zonaDe(...candidatas: ReadonlyArray<string | null | undefined>): string {
    for (const z of candidatas) if (esZonaValida(z)) return z;
    return ZONA_POR_OMISION;
}

function formato(zona: string): Intl.DateTimeFormat {
    let f = formatos.get(zona);
    if (!f) {
        f = new Intl.DateTimeFormat('en-US', {
            timeZone: zona,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        formatos.set(zona, f);
    }
    return f;
}

interface Partes {
    readonly anio: number;
    readonly mes: number;
    readonly dia: number;
    readonly hora: number;
    readonly minuto: number;
    readonly segundo: number;
}

function partesEn(instante: Date, zona: string): Partes {
    const p: Record<string, number> = {};
    for (const x of formato(zona).formatToParts(instante)) {
        if (x.type !== 'literal') p[x.type] = Number(x.value);
    }
    return { anio: p.year!, mes: p.month!, dia: p.day!, hora: p.hour! % 24, minuto: p.minute!, segundo: p.second! };
}

const dos = (n: number) => String(n).padStart(2, '0');
const comoFecha = (instante: Date | string): Date => (instante instanceof Date ? instante : new Date(instante));

const FECHA_CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `true` si `s` es una fecha civil `YYYY-MM-DD` que existe en el calendario. */
export function esFechaCivil(s: unknown): s is string {
    if (typeof s !== 'string') return false;
    const m = FECHA_CIVIL.exec(s);
    if (!m) return false;
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/**
 * La fecha civil (`YYYY-MM-DD`) en que ocurrió un instante en la zona dada. Es **la** conversión:
 * una venta a las 19:30 del 31 de julio en Huehuetlán es del 31 aunque en UTC ya sea 1 de agosto.
 */
export function fechaCivilDe(instante: Date | string, zona: string): string {
    const p = partesEn(comoFecha(instante), zona);
    return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`;
}

/** «Hoy» del negocio en la zona dada. */
export function hoyEn(zona: string, ahora: Date = new Date()): string {
    return fechaCivilDe(ahora, zona);
}

/** Minutos que la zona va adelante de UTC en ese instante (México centro: −360). */
export function desfaseEn(instante: Date, zona: string): number {
    const p = partesEn(instante, zona);
    const comoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
    return Math.round((comoUtc - Math.floor(instante.getTime() / 1000) * 1000) / 60_000);
}

/**
 * El instante en que empieza la fecha civil en la zona dada: para filtrar instantes por día
 * (`>= inicioDelDia(desde) and < inicioDelDia(hasta + 1)`).
 */
export function inicioDelDia(fecha: string, zona: string): Date {
    if (!esFechaCivil(fecha)) throw new RangeError(`Fecha civil inválida: ${fecha}`);
    const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
    const medianocheUtc = Date.UTC(a, m - 1, d);
    // Dos pasadas: la primera aproxima con el desfase de la medianoche UTC; la segunda corrige si
    // ese día cambia el horario (la franja fronteriza).
    let t = medianocheUtc - desfaseEn(new Date(medianocheUtc), zona) * 60_000;
    t = medianocheUtc - desfaseEn(new Date(t), zona) * 60_000;
    return new Date(t);
}

/** La fecha civil `n` días después (o antes, si `n` < 0). */
export function fechaMasDias(fecha: string, n: number): string {
    if (!esFechaCivil(fecha)) throw new RangeError(`Fecha civil inválida: ${fecha}`);
    const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
    const x = new Date(Date.UTC(a, m - 1, d + n));
    return `${x.getUTCFullYear()}-${dos(x.getUTCMonth() + 1)}-${dos(x.getUTCDate())}`;
}

/** El periodo (`YYYY-MM`) de una fecha civil. */
export function mesDe(fecha: string): string {
    return fecha.slice(0, 7);
}

/**
 * La fecha civil de un valor que puede venir como fecha (`YYYY-MM-DD`) o como ISO viejo
 * (`2026-08-31T00:00:00.000Z`). Para leer columnas y respuestas de antes de D3, que viajaban
 * como `timestamp` con la fecha del reloj marcada como UTC.
 */
export function fechaCivilDelValor(valor: Date | string | null | undefined): string | null {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
    const s = valor.slice(0, 10);
    return esFechaCivil(s) ? s : null;
}

// ── La hora del CFDI ─────────────────────────────────────────────────────────

const RELOJ = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

/**
 * La `Fecha` del CFDI («2026-08-31T03:14:00», hora del reloj del emisor) como ISO marcado UTC
 * **sin convertir**: «2026-08-31T03:14:00.000Z». Así su fecha civil es `slice(0, 10)` en
 * cualquier máquina. Si ya trae zona (un XML fuera del estándar), se respeta su reloj tal cual.
 * `null` si no se puede leer.
 */
export function relojDelComprobante(fecha: string | null | undefined): string | null {
    if (!fecha) return null;
    const s = fecha.trim();
    const m = RELOJ.exec(s);
    if (m) {
        if (!esFechaCivil(m[1])) return null;
        return `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}.000Z`;
    }
    // Con zona: la hora de su reloj, no la de UTC.
    const conZona = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.exec(s);
    if (conZona && esFechaCivil(conZona[1])) return `${conZona[1]}T${conZona[2]}:${conZona[3]}:${conZona[4] ?? '00'}.000Z`;
    return null;
}

/** La fecha civil del comprobante (`YYYY-MM-DD`) a partir de su reloj guardado o de su `Fecha`. */
export function fechaDelComprobante(reloj: Date | string | null | undefined): string | null {
    if (reloj instanceof Date) return fechaCivilDelValor(reloj);
    return fechaCivilDelValor(relojDelComprobante(reloj ?? null) ?? reloj ?? null);
}

// ── Mostrar ──────────────────────────────────────────────────────────────────

export type EstiloDeFecha = 'corta' | 'media' | 'larga';
export type EstiloDeInstante = EstiloDeFecha | 'fechaHora' | 'hora';

const OPCIONES_DE_FECHA: Record<EstiloDeFecha, Intl.DateTimeFormatOptions> = {
    corta: { day: '2-digit', month: '2-digit', year: '2-digit' },
    media: { day: '2-digit', month: '2-digit', year: 'numeric' },
    larga: { day: 'numeric', month: 'long', year: 'numeric' },
};

/** Una fecha civil para leerla («31/08/2026»). No convierte: es ese día en cualquier zona. */
export function mostrarFecha(fecha: string | null | undefined, estilo: EstiloDeFecha = 'media'): string {
    const civil = fechaCivilDelValor(fecha);
    if (!civil) return '—';
    const [a, m, d] = civil.split('-').map(Number) as [number, number, number];
    return new Date(Date.UTC(a, m - 1, d, 12)).toLocaleDateString('es-MX', { ...OPCIONES_DE_FECHA[estilo], timeZone: 'UTC' });
}

/** Un instante para leerlo, en la zona de la sucursal donde pasó. */
export function mostrarInstante(
    instante: Date | string | null | undefined,
    zona: string,
    estilo: EstiloDeInstante = 'fechaHora',
): string {
    if (instante === null || instante === undefined || instante === '') return '—';
    const d = comoFecha(instante);
    if (Number.isNaN(d.getTime())) return '—';
    const timeZone = zonaDe(zona);
    if (estilo === 'hora') return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone });
    if (estilo === 'fechaHora') {
        return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone });
    }
    return d.toLocaleDateString('es-MX', { ...OPCIONES_DE_FECHA[estilo], timeZone });
}

/** La hora del CFDI como la dice el XML (sin convertir: ver `relojDelComprobante`). */
export function mostrarRelojDelComprobante(
    reloj: Date | string | null | undefined,
    estilo: EstiloDeInstante = 'fechaHora',
): string {
    if (reloj === null || reloj === undefined || reloj === '') return '—';
    const iso = reloj instanceof Date ? reloj.toISOString() : (relojDelComprobante(reloj) ?? reloj);
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    if (estilo === 'hora') return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    if (estilo === 'fechaHora') {
        return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    }
    return d.toLocaleDateString('es-MX', { ...OPCIONES_DE_FECHA[estilo], timeZone: 'UTC' });
}

// ── Esquemas ─────────────────────────────────────────────────────────────────

/** Una fecha civil `YYYY-MM-DD`. */
export const fechaCivilSchema = z.string().refine(esFechaCivil, 'Fecha inválida: se espera AAAA-MM-DD');

/**
 * Una fecha civil que también acepta el ISO de antes de D3 (`2026-08-31T00:00:00.000Z`) y se
 * queda con su día. `null`/ausente pasan.
 */
export const fechaCivilEntranteSchema = z.preprocess(
    (v) => (v === undefined || v === null || v === '' ? v : (fechaCivilDelValor(v as Date | string) ?? v)),
    fechaCivilSchema.nullish(),
);

/** La zona horaria de una sucursal o empresa: IANA válida, o `null` para heredar. */
export const zonaHorariaSchema = z
    .string()
    .trim()
    .max(64)
    .refine((zona) => esZonaValida(zona), 'Zona horaria desconocida')
    .nullish();
