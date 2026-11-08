/**
 * @fileoverview Variantes (I9a): la matriz talla × color, sus nombres, sus códigos y qué cambia al guardar.
 * @module Contracts/Product/Schemas/ReglasDeVariantes
 *
 * **Espejo exacto en C#**: `Pittaj.Domain/Product/ReglasDeVariantes.cs`, con los mismos vectores
 * (`reglasDeVariantes.test.ts` ↔ `ReglasDeVariantesTests`). Una matriz armada sin red en el
 * escritorio tiene que dar los mismos hijos —mismo id, mismo código, mismo nombre— que la web.
 *
 * Una variante **es un producto** (hijo) con su id, código, precio y existencia; el padre `VARIABLE`
 * es la plantilla y guarda la matriz (`product_variant_sets`). Lo que liga a los dos es la matriz,
 * no una columna del producto: el kárdex, la venta y los traspasos no se enteran de que existen.
 */

/** Un atributo que varía y sus valores, en el orden en que se muestran. */
export interface AtributoDeVariante {
    readonly name: string;
    readonly values: readonly string[];
}

/** Una combinación ya guardada en la matriz. */
export interface VarianteDeMatriz {
    readonly id: string;
    readonly values: Readonly<Record<string, string>>;
    readonly code: string;
    readonly active: boolean;
}

/** Lo que propone el generador para una combinación. */
export interface VariantePropuesta {
    /** El de la variante existente con la misma combinación, o nulo si es nueva. */
    readonly existingId: string | null;
    readonly key: string;
    readonly values: Readonly<Record<string, string>>;
    readonly code: string;
    readonly displayName: string;
    readonly active: boolean;
}

/** La llave de una combinación: sus valores en el orden de los atributos. */
export function llaveDeVariante(attributes: readonly AtributoDeVariante[], values: Readonly<Record<string, string>>): string {
    return attributes.map((a) => values[a.name] ?? '').join('|');
}

/** «Playera básica · M · Negro». */
export function nombreDeVariante(parentName: string, attributes: readonly AtributoDeVariante[], values: Readonly<Record<string, string>>): string {
    return [parentName.trim(), ...attributes.map((a) => (values[a.name] ?? '').trim()).filter((v) => v.length > 0)].join(' · ').slice(0, 200);
}

/** «Azul marino» → `AZULMARINO`; «Ñandú» → `NANDU`. Sin acentos ni espacios, máximo 10. */
export function fragmentoDeCodigo(valor: string): string {
    const limpio = valor
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    return limpio.slice(0, 10) || 'X';
}

/**
 * El código de una combinación según el patrón: `{padre}` es el código del padre, `{1}`…`{3}` el
 * valor de cada atributo en orden y `{Talla}` el del atributo por su nombre. Los guiones que quedan
 * sobrando (un patrón de dos atributos en una matriz de uno) se recogen.
 */
export function codigoDeVariante(
    pattern: string,
    parentCode: string,
    attributes: readonly AtributoDeVariante[],
    values: Readonly<Record<string, string>>
): string {
    let c = pattern.replace(/\{padre\}/g, parentCode.trim());
    attributes.forEach((a, i) => {
        const f = fragmentoDeCodigo(values[a.name] ?? '');
        c = c.split(`{${i + 1}}`).join(f).split(`{${a.name}}`).join(f);
    });
    c = c.replace(/\{[^}]*\}/g, '');
    return c.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

/** La semilla del id de un hijo nuevo. **Idéntica en el escritorio**: pasa por el mismo UUID determinista. */
export function semillaDeVariante(parentId: string, key: string): string {
    return `product:variant:${parentId}:${key}`;
}

/** El producto cartesiano de los valores, en orden: primero varía el último atributo. */
export function combinaciones(attributes: readonly AtributoDeVariante[]): Record<string, string>[] {
    let acc: Record<string, string>[] = [{}];
    for (const a of attributes) {
        const valores = [...new Set(a.values.map((v) => v.trim()).filter((v) => v.length > 0))];
        acc = acc.flatMap((parcial) => valores.map((v) => ({ ...parcial, [a.name.trim()]: v })));
    }
    return attributes.length === 0 ? [] : acc;
}

/**
 * Propone la matriz: cada combinación de los atributos, conservando id, código y estado de la que ya
 * existía con la misma llave. Un código repetido (dos valores que se escriben igual sin acentos) se
 * desempata con `-2`, `-3`…, igual que el que ya ocupa una variante que sigue.
 */
export function generarMatriz(
    parent: { readonly code: string; readonly name: string },
    attributes: readonly AtributoDeVariante[],
    pattern: string,
    existentes: readonly VarianteDeMatriz[]
): VariantePropuesta[] {
    const nombres = attributes.map((a) => ({ ...a, name: a.name.trim() }));
    const porLlave = new Map(existentes.map((e) => [llaveDeVariante(nombres, e.values), e] as const));
    const usados = new Set<string>();
    const propuestas = combinaciones(nombres).map((values) => {
        const key = llaveDeVariante(nombres, values);
        const previa = porLlave.get(key) ?? null;
        return { key, values, previa };
    });
    // Los códigos de las que ya existían se respetan primero: no se renombra lo que ya se imprimió.
    for (const p of propuestas) if (p.previa) usados.add(p.previa.code);
    return propuestas.map(({ key, values, previa }) => {
        let code = previa?.code ?? codigoDeVariante(pattern, parent.code, nombres, values);
        if (!previa) {
            const base = code;
            for (let n = 2; usados.has(code); n++) code = `${base}-${n}`.slice(0, 50);
            usados.add(code);
        }
        return {
            existingId: previa?.id ?? null,
            key,
            values,
            code,
            displayName: nombreDeVariante(parent.name, nombres, values),
            active: previa?.active ?? true,
        };
    });
}

/** Qué hace guardar la matriz con los productos hijos. */
export interface PlanDeVariantes {
    /** Ids que no tienen producto todavía: nacen. */
    readonly crear: readonly string[];
    /** Ids que ya tienen producto: se actualizan (código, precio, nombre, activa). */
    readonly cambiar: readonly string[];
    /** Estaban en la matriz y ya no: el producto se archiva, no se borra (tiene historial). */
    readonly archivar: readonly string[];
}

export function planDeVariantes(
    anteriores: readonly string[],
    conProducto: ReadonlySet<string> | readonly string[],
    entrantes: readonly string[]
): PlanDeVariantes {
    const existe = conProducto instanceof Set ? conProducto : new Set(conProducto as readonly string[]);
    const quedan = new Set(entrantes);
    return {
        crear: entrantes.filter((id) => !existe.has(id)),
        cambiar: entrantes.filter((id) => existe.has(id)),
        archivar: anteriores.filter((id) => !quedan.has(id) && existe.has(id)),
    };
}

// ── La caja (2.82.0) ──────────────────────────────────────────────────────────────────────────

/** Lo que la caja sabe de cada variante para elegirla. */
export interface VarianteParaElegir {
    readonly id: string;
    readonly values: Readonly<Record<string, string>>;
    readonly active: boolean;
}

/** ¿La variante cuadra con lo elegido en todos los atributos menos `salvo`? */
function cuadra(v: VarianteParaElegir, elegidos: Readonly<Record<string, string>>, salvo: string | null): boolean {
    return Object.entries(elegidos).every(([k, val]) => k === salvo || val === '' || v.values[k] === val);
}

/**
 * Para cada atributo, los valores que todavía llevan a una variante **activa**, dado lo elegido en
 * los demás atributos. En el orden de la matriz. Una combinación archivada no se ofrece.
 */
export function opcionesDeVariante(
    attributes: readonly AtributoDeVariante[],
    variants: readonly VarianteParaElegir[],
    elegidos: Readonly<Record<string, string>>
): Record<string, string[]> {
    const activas = variants.filter((v) => v.active);
    const r: Record<string, string[]> = {};
    for (const a of attributes) {
        const posibles = new Set(activas.filter((v) => cuadra(v, elegidos, a.name)).map((v) => v.values[a.name]));
        r[a.name] = a.values.filter((val) => posibles.has(val));
    }
    return r;
}

/** La variante activa que corresponde a lo elegido, o nulo si falta un atributo o no existe. */
export function varianteElegida(
    attributes: readonly AtributoDeVariante[],
    variants: readonly VarianteParaElegir[],
    elegidos: Readonly<Record<string, string>>
): string | null {
    if (attributes.some((a) => !elegidos[a.name])) return null;
    return variants.find((v) => v.active && attributes.every((a) => v.values[a.name] === elegidos[a.name]))?.id ?? null;
}
