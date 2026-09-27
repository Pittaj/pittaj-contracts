/**
 * @fileoverview Cambios programados de un plan: las reglas y los tipos que comparten el backend y
 * el backoffice.
 *
 * Nada del plan se edita en caliente: se **programa un cambio** que entra un día 1. Cada cambio es
 * un movimiento con quién, cuándo, desde cuándo entra y a cuántas cuentas afecta, y lo vigente sale
 * de esos movimientos (docs `producto/plan-cobro-por-operaciones.md` §G, maqueta aprobada el
 * 2026-09-27).
 *
 * - Un cambio que **le cuesta más** al cliente (sube algo que paga o baja algo que recibe) entra un
 *   día 1 con **al menos 30 días de aviso** por correo a cada cuenta del plan.
 * - Uno que **le conviene** entra desde el siguiente día 1, y el aviso es opcional.
 *
 * Las reglas viven aquí, puras, para que la pantalla diga lo mismo que el servidor rechaza.
 */
import { z } from 'zod';

/** Días de aviso mínimos para un cambio que le cuesta más al cliente. */
export const DIAS_DE_AVISO_SI_CUESTA_MAS = 30;

/** Lo que un plan cobra y da. `overageCap` null = sin tope. */
export interface PlanTerms {
    readonly price: number;
    readonly includedOperations: number;
    readonly monthlyStamps: number;
    readonly overagePricePerThousand: number;
    readonly overageCap: number | null;
    readonly extraStampPrice: number;
}

const CDMX_OFFSET_MS = -6 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;
const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * ¿El cambio le cuesta más al cliente? Basta con que una cosa empeore, aunque otra mejore: el
 * correo tiene que salir igual, porque a alguien le va a doler esa.
 */
export function leCuestaMas(antes: PlanTerms, despues: PlanTerms): boolean {
    const topeSube =
        // Quitar el tope (null) es lo que más puede costar.
        (antes.overageCap !== null && despues.overageCap === null) ||
        (antes.overageCap !== null && despues.overageCap !== null && despues.overageCap > antes.overageCap);
    return (
        despues.price > antes.price ||
        despues.includedOperations < antes.includedOperations ||
        despues.monthlyStamps < antes.monthlyStamps ||
        despues.overagePricePerThousand > antes.overagePricePerThousand ||
        despues.extraStampPrice > antes.extraStampPrice ||
        topeSube
    );
}

/** ¿Cambia algo? */
export function hayCambio(antes: PlanTerms, despues: PlanTerms): boolean {
    return (
        antes.price !== despues.price ||
        antes.includedOperations !== despues.includedOperations ||
        antes.monthlyStamps !== despues.monthlyStamps ||
        antes.overagePricePerThousand !== despues.overagePricePerThousand ||
        antes.overageCap !== despues.overageCap ||
        antes.extraStampPrice !== despues.extraStampPrice
    );
}

/** «$1,234» o «$0.50»: sin centavos cuando no los hay. */
export function pesosDelPlan(monto: number): string {
    const entero = Number.isInteger(Math.round(monto * 100) / 100);
    return `$${monto.toLocaleString('en-US', { minimumFractionDigits: entero ? 0 : 2, maximumFractionDigits: 2 })}`;
}

const miles = (n: number) => n.toLocaleString('en-US');

/** Lo que cambia, renglón por renglón: «Precio $199 → $219». Lo que se queda igual no sale. */
export function renglonesDelCambio(antes: PlanTerms, despues: PlanTerms): string[] {
    const r: string[] = [];
    if (antes.price !== despues.price) r.push(`Precio ${pesosDelPlan(antes.price)} → ${pesosDelPlan(despues.price)}`);
    if (antes.includedOperations !== despues.includedOperations)
        r.push(`Operaciones ${miles(antes.includedOperations)} → ${miles(despues.includedOperations)}`);
    if (antes.monthlyStamps !== despues.monthlyStamps) r.push(`Timbres ${antes.monthlyStamps} → ${despues.monthlyStamps}`);
    if (antes.overagePricePerThousand !== despues.overagePricePerThousand)
        r.push(`Extra por 1,000 ${pesosDelPlan(antes.overagePricePerThousand)} → ${pesosDelPlan(despues.overagePricePerThousand)}`);
    if (antes.overageCap !== despues.overageCap) {
        const t = (v: number | null) => (v === null ? 'sin tope' : pesosDelPlan(v));
        r.push(`Tope ${t(antes.overageCap)} → ${t(despues.overageCap)}`);
    }
    if (antes.extraStampPrice !== despues.extraStampPrice)
        r.push(`Timbre extra ${pesosDelPlan(antes.extraStampPrice)} → ${pesosDelPlan(despues.extraStampPrice)}`);
    return r;
}

/** Lo que no se puede guardar, en palabras; null si los términos valen. */
export function errorEnLosTerminos(t: PlanTerms): string | null {
    if (!(t.price > 0)) return 'El precio tiene que ser mayor que cero.';
    if (!Number.isInteger(t.includedOperations) || t.includedOperations <= 0)
        return 'Las operaciones incluidas tienen que ser un entero mayor que cero.';
    if (!Number.isInteger(t.monthlyStamps) || t.monthlyStamps < 0) return 'Los timbres al mes tienen que ser un entero, cero o más.';
    if (t.overagePricePerThousand < 0) return 'El extra por 1,000 no puede ser negativo.';
    if (t.extraStampPrice < 0) return 'El timbre extra no puede ser negativo.';
    if (t.overageCap !== null && t.overageCap < t.price)
        return `El tope (${pesosDelPlan(t.overageCap)}) no puede ser menor que el precio (${pesosDelPlan(t.price)}): el extra quedaría negativo.`;
    return null;
}

/** «AAAA-MM-DD» de hoy en Ciudad de México. */
export function hoyEnCdmx(ahora: Date): string {
    return new Date(ahora.getTime() + CDMX_OFFSET_MS).toISOString().slice(0, 10);
}

/** El día 1 (`AAAA-MM-01`) `meses` después del mes de hoy en CDMX. */
function diaUnoEn(ahora: Date, meses: number): string {
    const local = new Date(ahora.getTime() + CDMX_OFFSET_MS);
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + meses, 1));
    return d.toISOString().slice(0, 10);
}

/** El instante en que empieza un día `AAAA-MM-DD` de CDMX. */
export function inicioDelDiaEnCdmx(dia: string): Date {
    return new Date(new Date(`${dia}T00:00:00Z`).getTime() - CDMX_OFFSET_MS);
}

/** Días completos de aviso entre ahora y el inicio de `dia` (CDMX). */
export function diasDeAviso(dia: string, ahora: Date): number {
    return Math.floor((inicioDelDiaEnCdmx(dia).getTime() - ahora.getTime()) / DIA_MS);
}

/** El día 1 más próximo en que puede entrar el cambio. */
export function primerDiaUnoPosible(ahora: Date, cuestaMas: boolean): string {
    for (let m = 1; ; m++) {
        const dia = diaUnoEn(ahora, m);
        if (!cuestaMas || diasDeAviso(dia, ahora) >= DIAS_DE_AVISO_SI_CUESTA_MAS) return dia;
    }
}

/** Los siguientes `cuantos` días 1 en que puede entrar, empezando por el más próximo. */
export function diasUnoPosibles(ahora: Date, cuestaMas: boolean, cuantos = 6): string[] {
    const primero = primerDiaUnoPosible(ahora, cuestaMas);
    const [y, m] = primero.split('-').map(Number) as [number, number];
    return Array.from({ length: cuantos }, (_, i) =>
        new Date(Date.UTC(y, m - 1 + i, 1)).toISOString().slice(0, 10)
    );
}

/** «1 de noviembre de 2026». */
export function fechaDelDiaUno(dia: string): string {
    const [y, m, d] = dia.split('-').map(Number) as [number, number, number];
    return `${d} de ${MESES[m - 1]} de ${y}`;
}

/** Por qué no puede entrar ese día; null si puede. */
export function errorEnLaFecha(dia: string, ahora: Date, cuestaMas: boolean): string | null {
    if (!/^\d{4}-\d{2}-01$/.test(dia)) return 'Un cambio solo entra un día 1.';
    const primero = primerDiaUnoPosible(ahora, cuestaMas);
    if (dia >= primero) return null;
    if (dia <= hoyEnCdmx(ahora)) return 'La fecha ya pasó: un cambio entra un día 1 que todavía no llega.';
    return `${cuestaMas ? 'Le cuesta más al cliente' : 'El cambio'}: el ${fechaDelDiaUno(dia).replace(/ de \d{4}$/, '')} no deja ${DIAS_DE_AVISO_SI_CUESTA_MAS} días de aviso. El más próximo es el ${fechaDelDiaUno(primero).replace(/ de \d{4}$/, '')}.`;
}

// ── Contratos HTTP ─────────────────────────────────────────────────────────────

/** POST /api/admin/plans/:code/changes */
export const schedulePlanChangeSchema = z.object({
    price: z.number().positive(),
    includedOperations: z.number().int().positive(),
    monthlyStamps: z.number().int().min(0),
    overagePricePerThousand: z.number().min(0),
    overageCap: z.number().positive().nullable(),
    extraStampPrice: z.number().min(0),
    /** Se guarda con el cambio y va en el correo. */
    reason: z.string().trim().min(3).max(300),
    /** `AAAA-MM-01`. */
    effectiveOn: z.string().regex(/^\d{4}-\d{2}-01$/),
    /** Obligatorio (y forzado por el servidor) cuando le cuesta más al cliente. */
    notify: z.boolean(),
});
export type SchedulePlanChangeInput = z.infer<typeof schedulePlanChangeSchema>;

export type PlanChangeStatus = 'SCHEDULED' | 'APPLIED' | 'CANCELLED';

/** Un movimiento del historial de un plan. */
export interface PlanChangeItem {
    readonly id: string;
    readonly planCode: string;
    /** `AAAA-MM-01`. */
    readonly effectiveOn: string;
    readonly status: PlanChangeStatus;
    /** Los términos que deja el cambio. */
    readonly terms: PlanTerms;
    /** Los que había al programarlo. null en el alta del plan. */
    readonly previous: PlanTerms | null;
    readonly costsMore: boolean;
    readonly reason: string;
    readonly createdByName: string;
    readonly createdAt: string;
    readonly notify: boolean;
    /** Cuentas a las que ya se les mandó el aviso. */
    readonly notifiedCount: number;
    readonly cancelledAt: string | null;
    readonly cancelledByName: string | null;
    /** Cuentas a las que ya les llegó el correo de que se canceló. */
    readonly cancellationNotifiedCount: number;
}

/** Cuentas de un plan, por lo que les pasa con un cambio. */
export interface PlanAccountsBreakdown {
    /** Pagando (activas, en impago o suspendidas), fuera de beta. */
    readonly paying: number;
    readonly trial: number;
    readonly beta: number;
}

/** Lo que el catálogo (web, escritorio, landing) muestra de un cambio ya programado. */
export interface ScheduledPlanTerms {
    readonly effectiveOn: string;
    readonly terms: PlanTerms;
    readonly costsMore: boolean;
}

/**
 * Un plan del catálogo público: `GET /api/plans`, sin sesión. La landing lo lee al construir, así
 * que un cambio programado en el backoffice llega al sitio en la siguiente publicación.
 */
export interface PublicPlanItem {
    readonly code: string;
    readonly name: string;
    readonly description: string | null;
    readonly terms: PlanTerms;
    readonly scheduledChange: ScheduledPlanTerms | null;
}

// ── Paquetes de timbres ────────────────────────────────────────────────────────

export type StampPackageStatus = 'ON_SALE' | 'RETIRED';

export interface StampPackageAdminItem {
    readonly id: string;
    readonly stamps: number;
    /** MXN, IVA incluido. */
    readonly price: number;
    readonly status: StampPackageStatus;
    /** Compras pagadas en el mes en curso (CDMX). */
    readonly soldThisMonth: number;
}

/** POST /api/admin/stamp-packages */
export const createStampPackageSchema = z.object({
    stamps: z.number().int().positive().max(100000),
    price: z.number().positive(),
});

/**
 * PATCH /api/admin/stamp-packages/:id. Los timbres no cambian nunca: son lo que el cliente compró.
 */
export const updateStampPackageSchema = z
    .object({
        price: z.number().positive().optional(),
        status: z.enum(['ON_SALE', 'RETIRED']).optional(),
    })
    .refine((v) => v.price !== undefined || v.status !== undefined, { message: 'Nada que cambiar' });
