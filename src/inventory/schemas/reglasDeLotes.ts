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
