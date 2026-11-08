/**
 * @fileoverview Lotes y caducidades (I8a): qué lote sale, cuándo está caducado y su identidad.
 * @module Contracts/Inventory/Schemas/ReglasDeLotes
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Inventory/ReglasDeLotes.cs`, con los mismos vectores
 * (`reglasDeLotes.test.ts` ↔ `ReglasDeLotesTests`).
 *
 * - El lote es catálogo; **su saldo se deriva** de los movimientos que lo nombran (§4).
 * - Su id es determinista por producto y número (`stock:lot:{producto}:{NÚMERO}`): la web y el
 *   escritorio que reciben el mismo lote sin red dejan una sola fila.
 * - Una salida sin lote elegido toma por la política (`FEFO` / `FIFO`); con `MANUAL` no toma
 *   ninguno. Lo que no alcance a cubrir con lotes sale **sin lote** — la venta nunca se detiene
 *   por esto; la existencia negativa es otra regla (I3).
 * - No salen solos los lotes en cuarentena, retirados, caducados ni los que caducan dentro de la
 *   vida útil mínima (`blockSaleDaysBeforeExpiry`).
 */

import type { LotPickingPolicy } from './inventorySettings.schema.js';
import type { StockLotStatus } from './stockLot.schema.js';

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const DIA = 86_400_000;

/** El número como se compara: sin espacios a los lados y en mayúsculas («l2409 » = «L2409»). */
export function normalizarNumeroDeLote(numero: string): string {
    return numero.trim().toUpperCase();
}

/** La semilla del id de un lote. **Idéntica en el escritorio**. */
export function semillaDeLote(productId: string, lotNumber: string): string {
    return `stock:lot:${productId}:${normalizarNumeroDeLote(lotNumber)}`;
}

/** La semilla del movimiento de un lote, a partir de la del renglón. */
export function semillaDeMovimientoDeLote(seedDelRenglon: string, lotId: string): string {
    return `${seedDelRenglon}:lot:${lotId}`;
}

/**
 * Días de hoy a la caducidad, por fecha civil (`YYYY-MM-DD`). Negativo = ya caducó; 0 = caduca
 * hoy (y hoy todavía se puede usar). Nulo si el lote no caduca.
 */
export function diasACaducar(expiresAt: string | null, hoy: string): number | null {
    if (!expiresAt) return null;
    return Math.round((Date.parse(`${expiresAt.slice(0, 10)}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA);
}

/** El estado que se enseña: un lote disponible cuya fecha ya pasó se lee «Caducado». */
export function estadoVisibleDeLote(status: StockLotStatus, expiresAt: string | null, hoy: string): StockLotStatus {
    if (status !== 'AVAILABLE') return status;
    const d = diasACaducar(expiresAt, hoy);
    return d !== null && d < 0 ? 'EXPIRED' : 'AVAILABLE';
}

/** Lo que el asignador necesita de un lote con saldo en la bodega de la salida. */
export interface LoteConSaldo {
    readonly lotId: string;
    readonly lotNumber: string;
    readonly onHand: number;
    readonly status: StockLotStatus;
    /** `YYYY-MM-DD` o nulo. */
    readonly expiresAt: string | null;
    /** ISO; desempata FEFO y ordena FIFO. */
    readonly receivedAt: string;
}

export interface AsignacionDeLotes {
    readonly asignados: readonly { lotId: string; lotNumber: string; quantity: number }[];
    /** Lo que sale sin lote (no alcanzó, o la política es manual). */
    readonly sinLote: number;
}

/** Si el lote puede salir solo en una venta hoy. */
export function loteVendible(l: LoteConSaldo, hoy: string, diasMinimos: number): boolean {
    if (l.status !== 'AVAILABLE' || !(l.onHand > 0)) return false;
    const d = diasACaducar(l.expiresAt, hoy);
    return d === null || d >= Math.max(0, diasMinimos);
}

/**
 * Reparte `cantidad` entre los lotes, por la política. FEFO: el que caduca primero (los que no
 * caducan, al final), y entre iguales el que entró primero. FIFO: el que entró primero.
 */
export function asignarLotes(
    cantidad: number,
    lotes: readonly LoteConSaldo[],
    politica: LotPickingPolicy,
    hoy: string,
    diasMinimos = 0
): AsignacionDeLotes {
    if (!(cantidad > 0)) return { asignados: [], sinLote: 0 };
    if (politica === 'MANUAL') return { asignados: [], sinLote: r4(cantidad) };
    const candidatos = lotes.filter((l) => loteVendible(l, hoy, diasMinimos));
    const porEntrada = (a: LoteConSaldo, b: LoteConSaldo) =>
        a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : a.lotNumber < b.lotNumber ? -1 : a.lotNumber > b.lotNumber ? 1 : 0;
    const orden = [...candidatos].sort((a, b) => {
        if (politica === 'FEFO') {
            const ea = a.expiresAt?.slice(0, 10) ?? null;
            const eb = b.expiresAt?.slice(0, 10) ?? null;
            if (ea !== eb) {
                if (ea === null) return 1;
                if (eb === null) return -1;
                return ea < eb ? -1 : 1;
            }
        }
        return porEntrada(a, b);
    });
    let falta = r4(cantidad);
    const asignados: { lotId: string; lotNumber: string; quantity: number }[] = [];
    for (const l of orden) {
        if (falta <= 0) break;
        const toma = r4(Math.min(falta, l.onHand));
        if (toma <= 0) continue;
        asignados.push({ lotId: l.lotId, lotNumber: l.lotNumber, quantity: toma });
        falta = r4(falta - toma);
    }
    return { asignados, sinLote: falta > 0 ? falta : 0 };
}

/**
 * El número de un lote nuevo cuando el proveedor no trae uno: `L{AAMMDD}-{n}` por omisión.
 * `{AAAA}`, `{AA}`, `{MM}`, `{DD}`, `{AAMMDD}` y `{n}` (consecutivo del día, desde 1).
 */
export function numeroDeLoteAutomatico(patron: string, hoy: string, n: number): string {
    const [aaaa, mm, dd] = hoy.split('-') as [string, string, string];
    const aa = aaaa.slice(2);
    return (patron || 'L{AAMMDD}-{n}')
        .split('{AAMMDD}').join(`${aa}${mm}${dd}`)
        .split('{AAAA}').join(aaaa)
        .split('{AA}').join(aa)
        .split('{MM}').join(mm)
        .split('{DD}').join(dd)
        .split('{n}').join(String(n))
        .slice(0, 60);
}

// ── I8b · El lote en los demás movimientos ────────────────────────────────────────────────────
//
// Dos reglas cubren todo lo que no es venta ni compra:
//
// - **Una salida interna** (traspaso, ajuste, diferencia de conteo) toma de **todos** los lotes con
//   saldo, no solo de los vendibles: si la mercancía salió físicamente, salió de algún lote. Toma
//   primero el grupo que prefiere el motivo —los vendibles, o los que ya no lo son (caducados, en
//   cuarentena, retirados) cuando se da de baja una merma— y dentro de cada grupo, FEFO.
// - **Un movimiento que espeja a otro** (la entrada del traspaso, la devolución de una venta, la
//   reversa de una recepción) **sigue** los lotes del original, en su orden. Lo que el original
//   movió sin lote, o lo que exceda, va sin lote.

/** De qué lotes sale primero una salida interna. */
export type PreferenciaDeSalida = 'VENDIBLES' | 'NO_VENDIBLES';

/**
 * El motivo de un ajuste decide de dónde sale: dar de baja lo caducado, dañado o mermado busca
 * primero lo que ya no se puede vender; lo demás (robo, consumo, corrección, conteo) sale como la
 * venta, de lo vendible.
 */
export function preferenciaDeAjuste(reason: string): PreferenciaDeSalida {
    return reason === 'EXPIRED' || reason === 'DAMAGE' || reason === 'SHRINKAGE' ? 'NO_VENDIBLES' : 'VENDIBLES';
}

/** Reparte una salida interna entre todos los lotes con saldo. Ver {@link PreferenciaDeSalida}. */
export function asignarLotesInternos(
    cantidad: number,
    lotes: readonly LoteConSaldo[],
    hoy: string,
    preferir: PreferenciaDeSalida = 'VENDIBLES'
): AsignacionDeLotes {
    if (!(cantidad > 0)) return { asignados: [], sinLote: 0 };
    const grupo = (l: LoteConSaldo) => (loteVendible(l, hoy, 0) === (preferir === 'VENDIBLES') ? 0 : 1);
    const orden = lotes
        .filter((l) => l.onHand > 0)
        .sort((a, b) => {
            const g = grupo(a) - grupo(b);
            if (g !== 0) return g;
            const ea = a.expiresAt?.slice(0, 10) ?? null;
            const eb = b.expiresAt?.slice(0, 10) ?? null;
            if (ea !== eb) {
                if (ea === null) return 1;
                if (eb === null) return -1;
                return ea < eb ? -1 : 1;
            }
            return a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : a.lotNumber < b.lotNumber ? -1 : a.lotNumber > b.lotNumber ? 1 : 0;
        });
    return tomarEnOrden(cantidad, orden.map((l) => ({ lotId: l.lotId, lotNumber: l.lotNumber, quantity: l.onHand })));
}

/** Un tramo de un movimiento original: de qué lote fue y cuánto. */
export interface TramoDeLote {
    readonly lotId: string;
    readonly lotNumber: string;
    readonly quantity: number;
}

/**
 * Sigue los lotes de un movimiento original, en su orden: la entrada de un traspaso recibe del
 * primer lote que salió, luego del segundo… La devolución de una venta regresa a los lotes de la
 * venta. Lo que exceda al original va sin lote.
 */
export function seguirLotes(cantidad: number, origen: readonly TramoDeLote[]): AsignacionDeLotes {
    if (!(cantidad > 0)) return { asignados: [], sinLote: 0 };
    // Un mismo lote en dos tramos se junta: la regla es «cuánto de cada lote», no «cuántas filas».
    const junto = new Map<string, TramoDeLote>();
    for (const t of origen) {
        const p = junto.get(t.lotId);
        junto.set(t.lotId, p ? { ...p, quantity: r4(p.quantity + t.quantity) } : t);
    }
    return tomarEnOrden(cantidad, [...junto.values()]);
}

function tomarEnOrden(cantidad: number, tramos: readonly TramoDeLote[]): AsignacionDeLotes {
    let falta = r4(cantidad);
    const asignados: { lotId: string; lotNumber: string; quantity: number }[] = [];
    for (const t of tramos) {
        if (falta <= 0) break;
        const toma = r4(Math.min(falta, t.quantity));
        if (toma <= 0) continue;
        asignados.push({ lotId: t.lotId, lotNumber: t.lotNumber, quantity: toma });
        falta = r4(falta - toma);
    }
    return { asignados, sinLote: falta > 0 ? falta : 0 };
}

// ── I8b-2 · El lote elegido a mano en un documento ──────────────────────────────────────────

/**
 * Los lotes de un renglón no pueden mover más que el renglón, ni cantidades en cero, ni repetir lote.
 * Devuelve el problema en una frase, o nulo si está bien. Lo que no cubran va por la regla.
 */
export function validarLotesDeRenglon(cantidad: number, lots: readonly { lotId?: string | null; lotNumber: string; quantity: number }[]): string | null {
    const vistos = new Set<string>();
    for (const l of lots) {
        if (!(l.quantity > 0)) return `El lote ${l.lotNumber} lleva una cantidad en cero.`;
        const k = l.lotId ?? normalizarNumeroDeLote(l.lotNumber);
        if (vistos.has(k)) return `El lote ${l.lotNumber} está dos veces.`;
        vistos.add(k);
    }
    const suma = r4(lots.reduce((s, l) => s + l.quantity, 0));
    const tope = r4(Math.abs(cantidad));
    return suma > tope ? `Los lotes suman ${suma} y el renglón mueve ${tope}.` : null;
}

/** Lo que llegó de cada lote de un traspaso: lo recibido, en el orden en que salieron. */
export function recibidoPorLote(
    lots: readonly { lotId: string; lotNumber: string; quantity: number }[],
    recibido: number | null
): (number | null)[] {
    if (recibido === null) return lots.map(() => null);
    let queda = r4(recibido);
    return lots.map((l) => {
        const t = r4(Math.max(0, Math.min(queda, l.quantity)));
        queda = r4(queda - t);
        return t;
    });
}

// ── (2.82.0) El conteo por lote ─────────────────────────────────────────────────────────────

/** Lo que mueve un conteo por lote: lo que sale de cada lote, lo que entra y el resto sin lote. */
export interface ConteoPorLote {
    readonly sale: readonly TramoDeLote[];
    readonly entra: readonly TramoDeLote[];
    readonly saleSinLote: number;
    readonly entraSinLote: number;
}

/**
 * Un renglón de conteo de un producto por lote dice **cuánto se encontró de cada lote**
 * (`contados`). Cada lote queda en lo contado: si había más, la diferencia sale de ese lote; si
 * había menos, entra a él. Un lote con saldo que no se contó **no se encontró** (sale todo). Lo que
 * no cuadre con la diferencia del renglón (`diferencia`, contado − teórico) se mueve sin lote, así
 * que el total del producto queda igual que en un conteo sin lotes.
 *
 * Mismos vectores que `ReglasDeLotes.ConteoPorLote` del escritorio.
 */
export function conteoPorLote(
    contados: readonly TramoDeLote[],
    saldos: readonly { lotId: string; lotNumber: string; onHand: number }[],
    diferencia: number
): ConteoPorLote {
    const sale: TramoDeLote[] = [];
    const entra: TramoDeLote[] = [];
    const vistos = new Set<string>();
    let suma = 0;
    const mover = (lotId: string, lotNumber: string, d: number) => {
        d = r4(d);
        if (d < 0) sale.push({ lotId, lotNumber, quantity: -d });
        else if (d > 0) entra.push({ lotId, lotNumber, quantity: d });
        suma = r4(suma + d);
    };
    for (const s of saldos) {
        if (vistos.has(s.lotId)) continue;
        vistos.add(s.lotId);
        const contado = contados.filter((c) => c.lotId === s.lotId).reduce((t, c) => t + c.quantity, 0);
        mover(s.lotId, s.lotNumber, contado - Math.max(0, s.onHand));
    }
    for (const c of contados) {
        if (vistos.has(c.lotId)) continue;
        vistos.add(c.lotId);
        mover(c.lotId, c.lotNumber, contados.filter((x) => x.lotId === c.lotId).reduce((t, x) => t + x.quantity, 0));
    }
    const resto = r4(diferencia - suma);
    return { sale, entra, saleSinLote: resto < 0 ? -resto : 0, entraSinLote: resto > 0 ? resto : 0 };
}
