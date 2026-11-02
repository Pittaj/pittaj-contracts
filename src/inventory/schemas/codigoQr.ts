/**
 * @fileoverview I10b · Código QR (ISO/IEC 18004), lo justo para una etiqueta: modo byte (UTF-8),
 * corrección M, versiones 1 a 10 (hasta 213 bytes). Sin dependencias, y con espejo exacto en
 * `Pittaj.Domain.Inventory.CodigoQr` (los mismos vectores): la web y el escritorio dibujan la misma
 * matriz. Sigue el procedimiento de la norma: datos → Reed-Solomon por bloques → intercalado →
 * patrones fijos → colocación en zigzag → la máscara de menor penalización → formato y versión.
 */

/** Por versión (1..10), corrección M: [palabras de corrección por bloque, bloques del grupo 1, datos por bloque del grupo 1, bloques del grupo 2]. */
const BLOQUES_M: readonly (readonly [number, number, number, number])[] = [
    [10, 1, 16, 0],
    [16, 1, 28, 0],
    [26, 1, 44, 0],
    [18, 2, 32, 0],
    [24, 2, 43, 0],
    [16, 4, 27, 0],
    [18, 4, 31, 0],
    [22, 2, 38, 2],
    [22, 3, 36, 2],
    [26, 4, 43, 1],
];

const ALINEACION: readonly (readonly number[])[] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const datosDe = (v: number) => {
    const [, b1, d1, b2] = BLOQUES_M[v - 1]!;
    return b1 * d1 + b2 * (d1 + 1);
};

/** Cuántos bytes caben en modo byte con corrección M en la versión `v`. */
export const capacidadQr = (v: number) => datosDe(v) - (v < 10 ? 2 : 3);

// ── GF(256), polinomio 0x11D ──

const EXP: number[] = new Array(512);
const LOG: number[] = new Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;
})();
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!);

/** Las palabras de corrección Reed-Solomon de un bloque. */
export function correccionRs(datos: readonly number[], grado: number): number[] {
    // Generador: (x - α^0)(x - α^1)…(x - α^(grado-1)), coeficientes del de mayor grado al menor (sin el 1 inicial).
    let gen = [1];
    for (let i = 0; i < grado; i++) {
        const sig = new Array(gen.length + 1).fill(0);
        for (let j = 0; j < gen.length; j++) {
            sig[j] ^= gen[j]!;
            sig[j + 1] ^= mul(gen[j]!, EXP[i]!);
        }
        gen = sig;
    }
    const resto = new Array(grado).fill(0);
    for (const b of datos) {
        const factor = b ^ resto[0];
        resto.shift();
        resto.push(0);
        for (let j = 0; j < grado; j++) resto[j] ^= mul(gen[j + 1]!, factor);
    }
    return resto;
}

const utf8 = (texto: string): number[] => {
    const r: number[] = [];
    for (const ch of texto) {
        let c = ch.codePointAt(0)!;
        if (c < 0x80) r.push(c);
        else if (c < 0x800) r.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000) r.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else r.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        c = 0;
    }
    return r;
};

/** Las palabras finales (datos y corrección, intercaladas) para la versión `v`. */
function palabras(bytes: readonly number[], v: number): number[] {
    const bits: number[] = [];
    const poner = (valor: number, n: number) => {
        for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
    };
    poner(0b0100, 4);
    poner(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) poner(b, 8);
    const capacidad = datosDe(v) * 8;
    poner(0, Math.min(4, capacidad - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    const datos: number[] = [];
    for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    for (let relleno = 0xec; datos.length < datosDe(v); relleno ^= 0xec ^ 0x11) datos.push(relleno);

    const [ec, b1, d1, b2] = BLOQUES_M[v - 1]!;
    const bloques: number[][] = [];
    let k = 0;
    for (let i = 0; i < b1 + b2; i++) {
        const n = i < b1 ? d1 : d1 + 1;
        bloques.push(datos.slice(k, k + n));
        k += n;
    }
    const correcciones = bloques.map((b) => correccionRs(b, ec));
    const r: number[] = [];
    for (let i = 0; i <= d1; i++) for (const b of bloques) if (i < b.length) r.push(b[i]!);
    for (let i = 0; i < ec; i++) for (const c of correcciones) r.push(c[i]!);
    return r;
}

/** BCH: el resto de `valor << grado` entre `generador`, pegado al valor. */
const bch = (valor: number, generador: number, grado: number) => {
    let r = valor << grado;
    const largo = (n: number) => 32 - Math.clz32(n);
    while (largo(r) - 1 >= grado) r ^= generador << (largo(r) - 1 - grado);
    return (valor << grado) | r;
};

const MASCARAS: readonly ((f: number, c: number) => boolean)[] = [
    (f, c) => (f + c) % 2 === 0,
    (f) => f % 2 === 0,
    (_f, c) => c % 3 === 0,
    (f, c) => (f + c) % 3 === 0,
    (f, c) => (Math.floor(f / 2) + Math.floor(c / 3)) % 2 === 0,
    (f, c) => ((f * c) % 2) + ((f * c) % 3) === 0,
    (f, c) => (((f * c) % 2) + ((f * c) % 3)) % 2 === 0,
    (f, c) => (((f + c) % 2) + ((f * c) % 3)) % 2 === 0,
];

function penalizacion(m: boolean[][]): number {
    const n = m.length;
    let p = 0;
    // N1: cinco o más iguales seguidos, en renglones y columnas.
    for (let dir = 0; dir < 2; dir++)
        for (let i = 0; i < n; i++) {
            let corrida = 1;
            for (let j = 1; j < n; j++) {
                const a = dir === 0 ? m[i]![j]! : m[j]![i]!;
                const b = dir === 0 ? m[i]![j - 1]! : m[j - 1]![i]!;
                if (a === b) corrida++;
                else {
                    if (corrida >= 5) p += corrida - 2;
                    corrida = 1;
                }
            }
            if (corrida >= 5) p += corrida - 2;
        }
    // N2: cuadros de 2×2 del mismo color.
    for (let f = 0; f < n - 1; f++)
        for (let c = 0; c < n - 1; c++) {
            const x = m[f]![c]!;
            if (x === m[f]![c + 1] && x === m[f + 1]![c] && x === m[f + 1]![c + 1]) p += 3;
        }
    // N3: 1:1:3:1:1 con cuatro claros a un lado.
    const patron = [true, false, true, true, true, false, true];
    for (let dir = 0; dir < 2; dir++)
        for (let i = 0; i < n; i++)
            for (let j = 0; j + 7 <= n; j++) {
                const en = (k: number) => (dir === 0 ? m[i]![k]! : m[k]![i]!);
                if (!patron.every((x, t) => en(j + t) === x)) continue;
                // Fuera de la matriz es zona de silencio: cuenta como claro.
                const claros = (desde: number, hasta: number) => {
                    for (let k = desde; k < hasta; k++) if (k >= 0 && k < n && en(k)) return false;
                    return true;
                };
                if (claros(j - 4, j)) p += 40;
                if (claros(j + 7, j + 11)) p += 40;
            }
    // N4: proporción de oscuros.
    let oscuros = 0;
    for (const fila of m) for (const x of fila) if (x) oscuros++;
    p += Math.floor(Math.abs(oscuros * 20 - n * n * 10) / (n * n)) * 10;
    return p;
}

export interface MatrizQr {
    readonly version: number;
    readonly mascara: number;
    /** Un renglón por fila: '1' oscuro, '0' claro. Sin zona de silencio. */
    readonly modulos: readonly string[];
}

/** El QR de un texto, o nulo si no cabe en la versión 10 (213 bytes). */
export function codigoQr(texto: string, mascaraFija?: number): MatrizQr | null {
    const bytes = utf8(texto);
    let v = 1;
    while (v <= 10 && bytes.length > capacidadQr(v)) v++;
    if (v > 10) return null;
    const n = 17 + 4 * v;
    const m: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
    const fijo: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
    const poner = (f: number, c: number, oscuro: boolean) => {
        m[f]![c] = oscuro;
        fijo[f]![c] = true;
    };

    // Buscadores con su separador.
    for (const [f0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]] as const)
        for (let df = -1; df <= 7; df++)
            for (let dc = -1; dc <= 7; dc++) {
                const f = f0 + df;
                const c = c0 + dc;
                if (f < 0 || f >= n || c < 0 || c >= n) continue;
                const borde = df === 0 || df === 6 || dc === 0 || dc === 6;
                const centro = df >= 2 && df <= 4 && dc >= 2 && dc <= 4;
                poner(f, c, df >= 0 && df <= 6 && dc >= 0 && dc <= 6 && (borde || centro));
            }
    // Temporización.
    for (let i = 8; i < n - 8; i++) {
        poner(6, i, i % 2 === 0);
        poner(i, 6, i % 2 === 0);
    }
    // Alineación.
    const pos = ALINEACION[v - 1]!;
    for (let i = 0; i < pos.length; i++)
        for (let j = 0; j < pos.length; j++) {
            // Las tres esquinas de los buscadores no llevan alineación.
            if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
            const f = pos[i]!;
            const c = pos[j]!;
            for (let df = -2; df <= 2; df++) for (let dc = -2; dc <= 2; dc++) poner(f + df, c + dc, Math.max(Math.abs(df), Math.abs(dc)) !== 1);
        }
    // Reservar formato (se escribe al final), el módulo oscuro y la versión.
    for (let i = 0; i < 9; i++) {
        if (!fijo[8]![i]) poner(8, i, false);
        if (!fijo[i]![8]) poner(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
        poner(8, n - 1 - i, false);
        poner(n - 1 - i, 8, false);
    }
    poner(n - 8, 8, true);
    if (v >= 7)
        for (let i = 0; i < 6; i++)
            for (let j = 0; j < 3; j++) {
                poner(i, n - 11 + j, false);
                poner(n - 11 + j, i, false);
            }

    // Datos en zigzag, de abajo a la derecha, en pares de columnas (saltando la 6).
    const flujo = palabras(bytes, v);
    let bit = 0;
    for (let c = n - 1; c >= 1; c -= 2) {
        if (c === 6) c = 5;
        const subiendo = ((c + 1) & 2) === 0;
        for (let k = 0; k < n; k++) {
            const f = subiendo ? n - 1 - k : k;
            for (const cc of [c, c - 1]) {
                if (fijo[f]![cc]) continue;
                const valor = bit < flujo.length * 8 ? ((flujo[bit >> 3]! >> (7 - (bit & 7))) & 1) === 1 : false;
                m[f]![cc] = valor;
                bit++;
            }
        }
    }

    const conMascara = (k: number) => {
        const r = m.map((fila) => [...fila]);
        for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (!fijo[f]![c] && MASCARAS[k]!(f, c)) r[f]![c] = !r[f]![c];
        // Formato: corrección M (00) y la máscara, con BCH y la máscara 0x5412.
        const formato = bch((0b00 << 3) | k, 0x537, 10) ^ 0x5412;
        const b = (i: number) => ((formato >> i) & 1) === 1;
        // Primera copia junto al buscador de arriba a la izquierda; segunda, partida entre los otros dos.
        for (let i = 0; i <= 5; i++) r[i]![8] = b(i);
        r[7]![8] = b(6);
        r[8]![8] = b(7);
        r[8]![7] = b(8);
        for (let i = 9; i < 15; i++) r[8]![14 - i] = b(i);
        for (let i = 0; i < 8; i++) r[8]![n - 1 - i] = b(i);
        for (let i = 8; i < 15; i++) r[n - 15 + i]![8] = b(i);
        r[n - 8]![8] = true;
        if (v >= 7) {
            const ver = bch(v, 0x1f25, 12);
            for (let i = 0; i < 18; i++) {
                const x = ((ver >> i) & 1) === 1;
                const a = Math.floor(i / 3);
                const bb = n - 11 + (i % 3);
                r[a]![bb] = x;
                r[bb]![a] = x;
            }
        }
        return r;
    };

    let mejor = mascaraFija ?? 0;
    if (mascaraFija === undefined) {
        let menor = Infinity;
        for (let k = 0; k < 8; k++) {
            const p = penalizacion(conMascara(k));
            if (p < menor) {
                menor = p;
                mejor = k;
            }
        }
    }
    return { version: v, mascara: mejor, modulos: conMascara(mejor).map((fila) => fila.map((x) => (x ? '1' : '0')).join('')) };
}
