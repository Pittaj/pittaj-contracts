/**
 * @fileoverview Gastos recurrentes (F6.5): la plantilla dice qué se espera y cada periodo dice qué
 * llegó, qué falta y qué ya se pagó.
 * @module Contracts/Purchase/GastosRecurrentes
 *
 * **Una plantilla no crea el gasto: crea lo que esperas que llegue.** Cada periodo es una
 * obligación en `scheduled_payments` (`source_type = 'RECURRING'`, `template_id`): así el saldo
 * proyectado de Bancos ya la cuenta. Cuando entra el gasto del proveedor (de un CFDI o capturado a
 * mano) se **empareja** con su periodo; si el periodo cierra sin él, se pone en rojo, porque sin
 * comprobante no hay deducción.
 *
 * Las reglas viven aquí una vez; el escritorio tiene su gemela en `Pittaj.Domain/Purchasing/
 * GastosRecurrentes.cs` y la nube aplica la de emparejar también en el trigger
 * `trg_emparejar_gasto_recurrente` (migración 0128). Las tres usan el mismo id de periodo.
 *
 * Ver `producto/plan-empresas-y-lineas-de-negocio.md` (F6.5) y la maqueta «Gastos recurrentes».
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
//  Escritura
// ─────────────────────────────────────────────────────────────────────────────

/** Cada cuántos meses llega: mensual, bimestral (la luz), trimestral, semestral, anual. */
export const CADA_CUANTOS_MESES = [1, 2, 3, 4, 6, 12] as const;

/**
 * Cuándo se paga respecto a lo que cubre.
 * - `EN_EL_PERIODO`: por adelantado o dentro del mes (renta, internet, Cloudflare): el día D del
 *   primer mes del periodo.
 * - `AL_TERMINAR`: cuando el periodo ya pasó (la luz de jul–ago llega el 26 de septiembre): el día
 *   D del mes siguiente al último del periodo.
 */
export const VENCIMIENTOS_RECURRENTES = ['EN_EL_PERIODO', 'AL_TERMINAR'] as const;
export type VencimientoRecurrente = (typeof VENCIMIENTOS_RECURRENTES)[number];

const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mes en formato AAAA-MM');

/** PUT /api/purchases/recurring/:id — alta o edición (el id lo genera el cliente). */
export const saveRecurringExpenseSchema = z.object({
    name: z.string().trim().min(1, 'Ponle un nombre: «Luz Chiautla»').max(120),
    supplierId: z.string().uuid('Elige el proveedor'),
    expenseConceptId: z.string().uuid().nullish(),
    locationId: z.string().uuid().nullish(),
    businessLineId: z.string().uuid().nullish(),
    /** De dónde se piensa pagar; solo para el saldo proyectado. */
    bankAccountId: z.string().uuid().nullish(),
    /** Aproximado: solo alimenta el saldo proyectado; lo real es lo que llegue. */
    amount: z.number().positive('El monto esperado va en positivo').max(99_999_999),
    currency: z.string().trim().length(3).default('MXN'),
    everyMonths: z
        .number()
        .int()
        .refine((n) => (CADA_CUANTOS_MESES as readonly number[]).includes(n), 'Cada 1, 2, 3, 4, 6 o 12 meses'),
    dayOfMonth: z.number().int().min(1).max(31),
    dueMode: z.enum(VENCIMIENTOS_RECURRENTES).default('EN_EL_PERIODO'),
    /** El primer periodo: el mes en que empieza a cubrir. */
    startsOn: mes,
    /** Concurrencia optimista; ausente en un alta. */
    version: z.number().int().positive().optional(),
});
export type SaveRecurringExpenseRequest = z.infer<typeof saveRecurringExpenseSchema>;

/** POST /api/purchases/recurring/periods/:id/omit — «¿Omitir Neon de octubre?». */
export const omitRecurringPeriodSchema = z.object({
    reason: z.string().trim().max(200).optional(),
});

/** POST /api/purchases/recurring/periods/:id/link — «Elegir» cuando el emparejado no adivinó. */
export const linkRecurringPeriodSchema = z.object({
    purchaseId: z.string().uuid('Elige el gasto'),
});

// ─────────────────────────────────────────────────────────────────────────────
//  Lectura
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado de un periodo, **derivado** de hechos, nunca guardado (§4 del mandato de paridad):
 * - `OMITIDO`: alguien lo omitió (la obligación está cancelada).
 * - `PAGADO`: tiene gasto y el gasto está pagado (o la obligación se liquidó en Bancos).
 * - `LLEGO`: tiene gasto, por pagar.
 * - `SIN_CFDI`: el mes de su vencimiento terminó y no llegó nada. Sin comprobante no se deduce.
 * - `ESPERADO`: todavía puede llegar.
 */
export const ESTADOS_DE_PERIODO = ['ESPERADO', 'LLEGO', 'PAGADO', 'SIN_CFDI', 'OMITIDO'] as const;
export type EstadoDePeriodo = (typeof ESTADOS_DE_PERIODO)[number];

export interface RecurringExpensePeriodResponse {
    /** Id de la obligación (`scheduled_payments.id`), determinista: `idDePeriodo`. */
    readonly id: string;
    /** Primer mes que cubre (AAAA-MM). */
    readonly periodo: string;
    /** «Jul – Ago», «Oct 2026». */
    readonly etiqueta: string;
    readonly dueDate: string;
    readonly expected: number;
    readonly estado: EstadoDePeriodo;
    readonly purchaseId: string | null;
    readonly purchaseNumber: string | null;
    /** Total del gasto que llegó; null si no ha llegado. */
    readonly actual: number | null;
    /** El gasto que llegó no trae CFDI (proveedor extranjero, recibo simple). */
    readonly sinCfdi: boolean;
    readonly arrivedAt: string | null;
    readonly cancelReason: string | null;
}

export interface RecurringExpenseResponse {
    readonly id: string;
    readonly name: string;
    readonly supplierId: string;
    readonly supplierName: string;
    readonly expenseConceptId: string | null;
    readonly locationId: string | null;
    readonly businessLineId: string | null;
    readonly bankAccountId: string | null;
    readonly amount: number;
    readonly currency: string;
    readonly everyMonths: number;
    readonly dayOfMonth: number;
    readonly dueMode: VencimientoRecurrente;
    readonly startsOn: string;
    readonly pausedAt: string | null;
    readonly version: number;
    /** El periodo que pide atención: el más viejo sin CFDI, o el en curso. */
    readonly periodoActual: RecurringExpensePeriodResponse | null;
    /** Periodos cubiertos y sin CFDI, para el contexto de la ficha. */
    readonly cubiertos: number;
    readonly sinCfdi: number;
}

export interface RecurringExpenseDetailResponse extends RecurringExpenseResponse {
    /** Los periodos, del más nuevo al más viejo. */
    readonly periodos: readonly RecurringExpensePeriodResponse[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reglas
// ─────────────────────────────────────────────────────────────────────────────

/** Lo que las reglas necesitan de una plantilla. */
export interface PlantillaRecurrente {
    readonly id: string;
    readonly everyMonths: number;
    readonly dayOfMonth: number;
    readonly dueMode: VencimientoRecurrente;
    readonly startsOn: string;
    /** ISO; desde ese día no nacen periodos nuevos. */
    readonly pausedAt?: string | null;
}

/** Un periodo calculado (antes de saber qué llegó). */
export interface PeriodoRecurrente {
    readonly periodo: string;
    /** Último mes que cubre. */
    readonly hasta: string;
    readonly accrualDate: string;
    readonly dueDate: string;
}

/** «2026-07» + 2 → «2026-09». */
export function sumarMeses(m: string, n: number): string {
    const [y, mm] = m.split('-').map(Number);
    const total = y! * 12 + (mm! - 1) + n;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** El día D del mes, sin pasarse del último (31 en febrero es el 28 o 29). */
export function diaDelMes(m: string, dia: number): string {
    const [y, mm] = m.split('-').map(Number);
    const ultimo = new Date(Date.UTC(y!, mm!, 0)).getUTCDate();
    return `${m}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

/** Último día del mes (AAAA-MM-DD). */
export function finDeMes(m: string): string {
    return diaDelMes(m, 31);
}

/** El periodo k de una plantilla. */
export function periodoK(p: PlantillaRecurrente, k: number): PeriodoRecurrente {
    const periodo = sumarMeses(p.startsOn, k * p.everyMonths);
    const hasta = sumarMeses(periodo, p.everyMonths - 1);
    const mesDeVencimiento = p.dueMode === 'AL_TERMINAR' ? sumarMeses(hasta, 1) : periodo;
    return { periodo, hasta, accrualDate: `${periodo}-01`, dueDate: diaDelMes(mesDeVencimiento, p.dayOfMonth) };
}

/**
 * Los periodos que ya deben existir hoy: los que vencen hasta `hoy + 45 días` (lo próximo entra al
 * saldo proyectado con tiempo), y ninguno que empiece después de pausar la plantilla.
 */
export function periodosHasta(p: PlantillaRecurrente, hoy: string, horizonteDias = 45): PeriodoRecurrente[] {
    const limite = new Date(Date.parse(`${hoy}T00:00:00Z`) + horizonteDias * 86_400_000).toISOString().slice(0, 10);
    const pausa = p.pausedAt ? p.pausedAt.slice(0, 10) : null;
    const salida: PeriodoRecurrente[] = [];
    for (let k = 0; k < 600; k++) {
        const per = periodoK(p, k);
        if (per.dueDate > limite) break;
        if (pausa && per.accrualDate > pausa) break;
        salida.push(per);
    }
    return salida;
}

/** «Jul – Ago», «Oct», con año si no es el de `hoy`. */
export function etiquetaDePeriodo(periodo: string, hasta: string, anioDeHoy?: string): string {
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const n = (m: string) => nombres[Number(m.slice(5, 7)) - 1]!;
    const anio = periodo.slice(0, 4) !== anioDeHoy || hasta.slice(0, 4) !== anioDeHoy ? ` ${hasta.slice(0, 4)}` : '';
    return periodo === hasta ? `${n(periodo)}${anio}` : `${n(periodo)} – ${n(hasta)}${anio}`;
}

/** Los hechos de un periodo, de los que sale su estado. */
export interface HechosDelPeriodo {
    readonly dueDate: string;
    readonly cancelado: boolean;
    readonly liquidado: boolean;
    readonly tieneGasto: boolean;
    readonly gastoPagado: boolean;
}

/** El estado derivado. Ver `ESTADOS_DE_PERIODO`. */
export function estadoDelPeriodo(h: HechosDelPeriodo, hoy: string): EstadoDePeriodo {
    if (h.cancelado) return 'OMITIDO';
    if (h.liquidado || (h.tieneGasto && h.gastoPagado)) return 'PAGADO';
    if (h.tieneGasto) return 'LLEGO';
    return hoy > finDeMes(h.dueDate.slice(0, 7)) ? 'SIN_CFDI' : 'ESPERADO';
}

/**
 * El id de la obligación de un periodo: el mismo en la nube, en el trigger de Postgres y en el
 * escritorio, para que los tres puedan crearla sin duplicarla (el upsert por id la junta).
 *
 * `md5(lower(templateId) + ':' + periodo)` en hexadecimal, con forma de UUID versión 3: el
 * carácter 13 es `3` y el 17 lleva la variante RFC (`8`–`b`). Esta función recibe el md5 ya
 * calculado porque contracts corre también en el navegador, que no lo necesita.
 */
export function idDePeriodoDesdeMd5(md5Hex: string): string {
    const h = md5Hex.toLowerCase();
    const variante = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-3${h.slice(13, 16)}-${variante}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Lo que se hashea para el id de periodo. */
export function claveDePeriodo(templateId: string, periodo: string): string {
    return `${templateId.toLowerCase()}:${periodo}`;
}

/** Vector de prueba compartido: los tres lados tienen que dar este id. */
export const VECTOR_DE_ID_DE_PERIODO = {
    templateId: '6a1f0c2e-1b7d-4c55-9a43-2f6c1e0d9b11',
    periodo: '2026-07',
    id: '394a4878-9e4e-3450-a7e3-69e4f8db10a0',
} as const;

/** Un periodo abierto (sin gasto ni omitido) que puede recibir un gasto. */
export interface PeriodoAbierto {
    readonly id: string;
    readonly templateId: string;
    readonly dueDate: string;
    /** La sucursal de la plantilla: desempata dos rentas del mismo proveedor. */
    readonly locationId: string | null;
}

/** Ventana de emparejar: un gasto cuenta para el periodo cuyo vencimiento está a ±45 días. */
export const VENTANA_DE_EMPAREJAR_DIAS = 45;

const dias = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

/**
 * ¿A qué periodo pertenece un gasto del proveedor? Al abierto cuyo vencimiento está más cerca de
 * la fecha del gasto, dentro de la ventana. **No adivina:** si dos plantillas distintas empatan
 * (la renta del local y la del obrador) y la sucursal del gasto no desempata, devuelve null y la
 * lista ofrece «Elegir».
 */
export function periodoParaElGasto(
    abiertos: readonly PeriodoAbierto[],
    fechaDelGasto: string,
    sucursalDelGasto: string | null,
): PeriodoAbierto | null {
    const enVentana = abiertos.filter((p) => dias(p.dueDate, fechaDelGasto) <= VENTANA_DE_EMPAREJAR_DIAS);
    if (enVentana.length === 0) return null;
    // El más cercano de cada plantilla.
    const porPlantilla = new Map<string, PeriodoAbierto>();
    for (const p of enVentana) {
        const actual = porPlantilla.get(p.templateId);
        if (!actual || dias(p.dueDate, fechaDelGasto) < dias(actual.dueDate, fechaDelGasto)) porPlantilla.set(p.templateId, p);
    }
    let candidatos = [...porPlantilla.values()];
    if (candidatos.length > 1 && sucursalDelGasto) {
        const deLaSucursal = candidatos.filter((c) => c.locationId === sucursalDelGasto);
        if (deLaSucursal.length > 0) candidatos = deLaSucursal;
    }
    return candidatos.length === 1 ? candidatos[0]! : null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sync con el escritorio (entidades `recurring-expense` y `recurring-period`)
// ─────────────────────────────────────────────────────────────────────────────

/** Una plantilla tal como viaja por el feed y el push. `deletedAt` = borrada (soft). */
export interface RecurringExpenseSyncDto {
    readonly id: string;
    readonly name: string;
    readonly supplierId: string;
    readonly expenseConceptId: string | null;
    readonly locationId: string | null;
    readonly businessLineId: string | null;
    readonly bankAccountId: string | null;
    readonly amount: number;
    readonly currency: string;
    readonly everyMonths: number;
    readonly dayOfMonth: number;
    readonly dueMode: VencimientoRecurrente;
    readonly startsOn: string;
    readonly pausedAt: string | null;
    readonly deletedAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}

/**
 * Un periodo (la obligación `RECURRING`). Al subir desde el escritorio: si la nube ya lo tiene
 * emparejado con un gasto, **la nube gana** el emparejado (`sourceId`); omitir y restaurar ganan
 * por versión. `settled` solo baja: liquidar es de Bancos.
 */
export interface RecurringPeriodSyncDto {
    readonly id: string;
    readonly templateId: string;
    readonly accrualDate: string;
    readonly dueDate: string;
    readonly amount: number;
    readonly currency: string;
    readonly description: string;
    readonly bankAccountId: string | null;
    readonly sourceId: string | null;
    readonly cancelledAt: string | null;
    readonly cancelReason: string | null;
    readonly settled: boolean;
    readonly createdAt: string;
    readonly updatedAt: string | null;
    readonly version: number;
}
