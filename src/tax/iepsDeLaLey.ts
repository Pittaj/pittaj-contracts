/**
 * @fileoverview D8 · El contribuyente de IEPS: de qué clase es cada bien, cuándo su IEPS se
 * acredita al comprarlo y cuándo se desglosa en el CFDI al venderlo.
 * @module Contracts/Tax
 *
 * Texto de la Ley del IEPS vigente (última reforma DOF 07-11-2025):
 *
 * - **Art. 2o., fr. I** agrupa los bienes en incisos (A–J; el E está derogado). La **clase** del
 *   bien es su inciso: el IEPS se acredita y se declara por clase (art. 4o., fr. IV; art. 5o.).
 * - **Art. 4o., 2º párrafo:** solo se acredita el IEPS trasladado por la adquisición de bienes de los
 *   incisos **A), D), F), G), I) y J)**. Requisitos (fr. I–V): que quien acredita cause el impuesto
 *   por esos bienes, que sean de la **misma clase** (fr. IV; la cerveza y las bebidas refrescantes
 *   son clase aparte de las demás bebidas alcohólicas), que el IEPS conste **por separado** en el
 *   CFDI (fr. III) y que esté **efectivamente pagado** (fr. V). Lo que no se acredita es costo.
 * - **Art. 19, fr. II:** el CFDI se expide **sin** el IEPS por separado, salvo bienes de los incisos
 *   **A), D), F), G), I) y J)** cuando el adquirente sea a su vez contribuyente del impuesto por
 *   esos bienes **y así lo solicite**. Quien vende el 90 % o más al público en general tampoco lo
 *   desglosa, salvo esa misma solicitud. En todos los casos el precio se ofrece con el IEPS dentro.
 * - **Art. 10:** en la enajenación, el impuesto se causa cuando se cobran las contraprestaciones.
 *
 * El escritorio tiene la gemela en `Pittaj.Domain/Tax/IepsDeLaLey.cs`, con los mismos vectores.
 */

/** Las clases de bienes del art. 2o., fr. I (el inciso E está derogado). */
export const CATEGORIAS_DE_IEPS = ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J'] as const;
export type CategoriaDeIeps = (typeof CATEGORIAS_DE_IEPS)[number];

/** Nombre de cada clase, como la ley la enuncia (abreviado donde el inciso es largo). */
export const NOMBRE_DE_CATEGORIA_DE_IEPS: Record<CategoriaDeIeps, string> = {
    A: 'A) Bebidas con contenido alcohólico y cerveza',
    B: 'B) Alcohol, alcohol desnaturalizado y mieles incristalizables',
    C: 'C) Tabacos labrados y otros',
    D: 'D) Combustibles automotrices',
    F: 'F) Bebidas energetizantes, concentrados, polvos y jarabes',
    G: 'G) Bebidas saborizadas, concentrados, polvos, jarabes y extractos',
    H: 'H) Combustibles fósiles',
    I: 'I) Plaguicidas',
    J: 'J) Alimentos no básicos con densidad calórica de 275 kcal o más por 100 g',
};

/** Art. 4o., 2º párrafo: las clases cuyo IEPS trasladado en la adquisición se acredita. */
export const CATEGORIAS_ACREDITABLES: readonly CategoriaDeIeps[] = ['A', 'D', 'F', 'G', 'I', 'J'];

/** Art. 19, fr. II: las clases cuyo IEPS se desglosa si el adquirente contribuyente lo solicita. */
export const CATEGORIAS_CON_DESGLOSE: readonly CategoriaDeIeps[] = ['A', 'D', 'F', 'G', 'I', 'J'];

export function esCategoriaDeIeps(c: string | null | undefined): c is CategoriaDeIeps {
    return (CATEGORIAS_DE_IEPS as readonly string[]).includes((c ?? '').trim().toUpperCase());
}

/**
 * ¿Se acredita el IEPS de lo que se compra? (art. 4o.). Solo si el bien es de una clase
 * acreditable **y** la empresa causa el IEPS por esa misma clase. Las fracciones III y V (que
 * conste por separado y que esté pagado) se cumplen o no con el comprobante y el pago: aquí se
 * decide la clase; el libro lo acredita al pagarse.
 */
export function iepsEsAcreditable(input: {
    readonly categoria: string | null | undefined;
    readonly categoriasQueCausa: readonly string[];
}): { readonly acreditable: boolean; readonly fundamento: string } {
    const c = (input.categoria ?? '').trim().toUpperCase();
    if (!esCategoriaDeIeps(c)) {
        return { acreditable: false, fundamento: 'Sin clase de IEPS conocida: es costo (LIEPS art. 4o.).' };
    }
    if (!CATEGORIAS_ACREDITABLES.includes(c)) {
        return { acreditable: false, fundamento: `El IEPS de la clase ${c}) no se acredita en la adquisición (LIEPS art. 4o., 2º párrafo): es costo.` };
    }
    if (!input.categoriasQueCausa.map((x) => x.trim().toUpperCase()).includes(c)) {
        return { acreditable: false, fundamento: `La empresa no causa IEPS por bienes de la clase ${c}) (LIEPS art. 4o., fr. I y IV): es costo.` };
    }
    return { acreditable: true, fundamento: `Acreditable contra el IEPS de la clase ${c}) (LIEPS art. 4o.).` };
}

/**
 * ¿El IEPS del renglón va por separado en el CFDI? (art. 19, fr. II). Solo clases A, D, F, G, I
 * y J, y solo si el cliente es contribuyente de IEPS por esos bienes y lo pide. Si no, el
 * concepto lleva el IEPS dentro de su importe y solo traslada el IVA (sobre la base con IEPS).
 */
export function iepsSeDesglosa(input: {
    readonly categoria: string | null | undefined;
    /** El cliente es contribuyente de IEPS por estos bienes y solicita el desglose. */
    readonly clienteContribuyenteLoSolicita: boolean;
}): boolean {
    const c = (input.categoria ?? '').trim().toUpperCase();
    return input.clienteContribuyenteLoSolicita && esCategoriaDeIeps(c) && CATEGORIAS_CON_DESGLOSE.includes(c);
}

/** Un IEPS del catálogo, como lo lee la regla: factor, tasa o cuota, y su clase. */
export interface IepsDelCatalogo {
    readonly factor: 'Tasa' | 'Cuota';
    /** Tasa como fracción (0.08) o cuota en pesos por unidad (1.6451). */
    readonly tasaOCuota: number;
    readonly categoria: string | null;
}

/**
 * La clase de un IEPS que llega en un CFDI recibido: la del IEPS del catálogo con el mismo factor
 * y la misma tasa o cuota. El CFDI no dice el inciso; el catálogo de la empresa sí. Null si no hay
 * uno igual (entonces no se acredita: es costo).
 */
export function categoriaDelIepsRecibido(
    ieps: { readonly factor: string | null | undefined; readonly tasaOCuota: number | null | undefined },
    catalogo: readonly IepsDelCatalogo[],
): string | null {
    const f = (ieps.factor ?? '').trim().toLowerCase();
    const t = ieps.tasaOCuota ?? 0;
    if (!f || !(t > 0)) return null;
    const igual = catalogo.find((c) => c.factor.toLowerCase() === f && Math.abs(c.tasaOCuota - t) < 0.000_001 && c.categoria);
    return igual?.categoria ?? null;
}
