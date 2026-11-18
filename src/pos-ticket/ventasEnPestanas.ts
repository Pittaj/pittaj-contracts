/**
 * @fileoverview C1 de plan-caja-sin-salir · Las ventas abiertas de un turno se ven como pestañas.
 * @module Contracts/PosTicket
 *
 * Una pestaña es un ticket abierto de la sesión: en la web, `OPEN`; en el escritorio, la activa es
 * `OPEN` y las demás `SUSPENDED` (el dominio ya lo tenía). Estas reglas son puras para que las dos
 * puntas las apliquen igual; el espejo en C# es `Pittaj.Application.PosTicket.VentasEnPestanas`.
 */

/** Más de esto a la vez es un problema de operación, no de pantalla: F4 avisa en vez de abrir otra. */
export const MAX_VENTAS_ABIERTAS = 8;

/** Una pestaña sin tocar por más de esto se marca, para que nadie olvide a un cliente esperando. */
export const MINUTOS_PARA_MARCAR_INACTIVA = 5;

/** Estados que cuentan como pestaña: la venta sigue viva. */
export const ESTADOS_DE_PESTANA = ['OPEN', 'SUSPENDED'] as const;

/** Lo mínimo de un ticket para ordenarlo como pestaña. */
export interface VentaAbierta {
    readonly id: string;
    readonly status: string;
    readonly createdAt: string | Date;
    readonly updatedAt?: string | Date | null;
}

const ms = (d: string | Date): number => (d instanceof Date ? d.getTime() : new Date(d).getTime());

/** Las pestañas del turno: solo las vivas, en el orden en que se abrieron (el id desempata). */
export function pestanasDelTurno<T extends VentaAbierta>(tickets: readonly T[]): T[] {
    return tickets
        .filter((t) => (ESTADOS_DE_PESTANA as readonly string[]).includes(t.status))
        .sort((a, b) => ms(a.createdAt) - ms(b.createdAt) || a.id.localeCompare(b.id));
}

/**
 * La pestaña a la que lleva F6 (paso +1) o Shift+F6 (paso −1), dando la vuelta. Sin pestaña activa
 * (venta nueva sin renglones) F6 va a la primera y Shift+F6 a la última. Null si no hay ninguna.
 */
export function pestanaSiguiente(ids: readonly string[], actual: string | null | undefined, paso: 1 | -1): string | null {
    if (ids.length === 0) return null;
    const i = actual ? ids.indexOf(actual) : -1;
    if (i < 0) return paso === 1 ? ids[0]! : ids[ids.length - 1]!;
    return ids[(i + paso + ids.length) % ids.length]!;
}

/** ¿Se puede abrir otra? La venta nueva sin renglones no cuenta: todavía no es un ticket. */
export function puedeAbrirOtra(abiertas: number): boolean {
    return abiertas < MAX_VENTAS_ABIERTAS;
}

/** ¿Lleva demasiado sin tocarse? */
export function estaInactiva(ultimoCambio: string | Date | null | undefined, ahora: Date = new Date()): boolean {
    if (!ultimoCambio) return false;
    return ahora.getTime() - ms(ultimoCambio) > MINUTOS_PARA_MARCAR_INACTIVA * 60_000;
}

/** El nombre de la pestaña: el del cliente si lo hay; si no, «Venta N» por su lugar (1, 2, 3…). */
export function nombreDePestana(nombreDelCliente: string | null | undefined, posicion: number): string {
    const n = nombreDelCliente?.trim();
    return n ? n : `Venta ${posicion}`;
}
