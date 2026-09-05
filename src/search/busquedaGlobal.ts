/**
 * @fileoverview Qué encuentra el buscador de la cabecera, y en qué orden lo enseña.
 *
 * ── Las tres intenciones ──
 *
 * Quien escribe en la cabecera quiere una de tres cosas, y las mezcla sin darse cuenta:
 *
 *   1. **Un registro concreto** — un producto, un cliente, un folio de venta. El 80 % de las veces.
 *   2. **Una pantalla** — con trece aplicaciones y un menú distinto en cada una, nadie recuerda si
 *      «Antigüedad de saldos» vive en Compras o en Bancos.
 *   3. **Una acción** — «nueva compra», «abrir caja».
 *
 * ── La regla que decide el orden ──
 *
 * **Lo que se resolvió sin red va primero.** Pantallas y acciones salen del catálogo de navegación,
 * que ya está en memoria; los registros hay que ir a buscarlos. En una tienda con internet regular,
 * un buscador que espera a la red es un buscador roto — y este producto vende sin internet a
 * propósito.
 *
 * Por encima de todo va la **coincidencia exacta**: si lo escrito ES un folio o un código de barras,
 * eso es lo que se buscaba, y ninguna coincidencia parcial le gana.
 */

/** De qué es cada resultado. Decide el grupo, el icono y a dónde lleva. */
export type TipoDeResultado =
    | 'pantalla'
    | 'accion'
    | 'producto'
    | 'cliente'
    | 'proveedor'
    | 'venta'
    | 'compra'
    | 'cfdi';

/** Los tipos que se resuelven en el propio equipo, sin preguntarle a nadie. */
export const TIPOS_LOCALES: readonly TipoDeResultado[] = ['pantalla', 'accion'];

export interface ResultadoDeBusqueda {
    readonly id: string;
    readonly tipo: TipoDeResultado;
    /** Lo que se lee grande: el nombre del producto, el folio, el nombre de la pantalla. */
    readonly titulo: string;
    /** La segunda línea: la categoría, la app a la que pertenece, la fecha. */
    readonly subtitulo?: string;
    /** A la derecha: importe, existencia, lo que distinga a este de sus parecidos. */
    readonly meta?: string;
    /**
     * A dónde lleva. En la web es una ruta; en el escritorio, la clave de la página.
     * Cada plataforma lo interpreta con lo suyo.
     */
    readonly destino: string;
}

/** Un grupo tal como se pinta en el panel. */
export interface GrupoDeResultados {
    readonly clave: string;
    /** Encabezado del grupo, ya en plural y en español. */
    readonly titulo: string;
    readonly resultados: readonly ResultadoDeBusqueda[];
    /** Cuántos hay en total, si se recortaron. */
    readonly total: number;
}

/**
 * Cuántos resultados se enseñan por grupo.
 *
 * Tres. El panel **responde**, no lista: quien quiere ver los ochenta productos que empiezan por
 * «co» no está buscando, está navegando, y para eso está la pantalla de productos.
 */
export const LIMITE_POR_GRUPO = 3;

/** Con menos de esto no se busca: una sola letra devuelve el catálogo entero y no ayuda a nadie. */
export const MINIMO_PARA_BUSCAR = 2;

const TITULOS: Record<TipoDeResultado, string> = {
    pantalla: 'Ir a',
    accion: 'Crear',
    producto: 'Productos',
    cliente: 'Clientes',
    proveedor: 'Proveedores',
    venta: 'Ventas',
    compra: 'Compras',
    cfdi: 'Comprobantes',
};

/** Orden de los grupos. Lo local primero, y dentro de lo local, ir antes que crear. */
const ORDEN: readonly TipoDeResultado[] = [
    'pantalla',
    'accion',
    'producto',
    'venta',
    'cliente',
    'proveedor',
    'compra',
    'cfdi',
];

/**
 * Normaliza para comparar: sin acentos, sin espacios ni guiones, en mayúsculas.
 *
 * Los folios se dictan por teléfono y se teclean a mano: `tkt s1c1 00042`, `TKT-S1C1-00042` y
 * `tktS1C100042` son la misma venta para quien la busca.
 */
export function normalizar(texto: string): string {
    return (texto ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[\s\-_./]/g, '')
        .toUpperCase();
}

/**
 * Si lo escrito identifica exactamente a este candidato.
 *
 * Vale la coincidencia entera y también **el último segmento del folio**: nadie teclea
 * `TKT-S1C1-` con un cliente delante, escribe `42` o `00042`. Solo cuenta si la consulta es
 * numérica — si valiera para letras, «tija» encontraría «Cotija» y el grupo de exactos se llenaría
 * de parecidos, que es lo contrario de lo que significa «exacta».
 */
export function esCoincidenciaExacta(consulta: string, candidato: string): boolean {
    const q = normalizar(consulta);
    const c = normalizar(candidato);
    if (q.length === 0 || c.length === 0) return false;
    if (q === c) return true;

    if (!/^[0-9]+$/.test(q)) return false;

    // El número del folio es **el último segmento**, no «los dígitos del final»: la serie lleva
    // dígitos pegados (`S1C1`), así que en `TKTS1C100042` el final numérico es `100042` y `42` no
    // encontraría nada. Hay que partir por los separadores del folio original, donde el último
    // trozo sí es el consecutivo: `TKT-S1C1-00042` → `00042`.
    const segmentos = (candidato ?? '').split(/[\s\-_/.]+/).filter(Boolean);
    const ultimo = segmentos[segmentos.length - 1];
    if (!ultimo || !/^[0-9]+$/.test(ultimo)) return false;

    // Por valor, para que `42` encuentre `00042` sin contar los ceros de relleno.
    return Number(ultimo) === Number(q);
}

/**
 * Agrupa y ordena lo que se va a enseñar.
 *
 * Las coincidencias exactas se sacan de su grupo y se ponen arriba del todo, juntas: si escribiste
 * un folio, eso es lo que buscabas, y hacerte bajar hasta el grupo «Ventas» sería absurdo.
 */
export function agruparResultados(
    consulta: string,
    resultados: readonly ResultadoDeBusqueda[],
    limitePorGrupo: number = LIMITE_POR_GRUPO,
): GrupoDeResultados[] {
    const exactos = resultados.filter((r) => esCoincidenciaExacta(consulta, r.titulo));
    const exactosIds = new Set(exactos.map((r) => r.id));
    const resto = resultados.filter((r) => !exactosIds.has(r.id));

    const grupos: GrupoDeResultados[] = [];

    if (exactos.length > 0) {
        grupos.push({
            clave: 'exacto',
            titulo: exactos.length === 1 ? 'Coincidencia exacta' : 'Coincidencias exactas',
            resultados: exactos.slice(0, limitePorGrupo),
            total: exactos.length,
        });
    }

    for (const tipo of ORDEN) {
        const delTipo = resto.filter((r) => r.tipo === tipo);
        if (delTipo.length === 0) continue;

        grupos.push({
            clave: tipo,
            titulo: TITULOS[tipo],
            resultados: delTipo.slice(0, limitePorGrupo),
            total: delTipo.length,
        });
    }

    return grupos;
}

/** Si este tipo se resuelve en el propio equipo (y por tanto sale al instante, haya red o no). */
export const esLocal = (tipo: TipoDeResultado): boolean => TIPOS_LOCALES.includes(tipo);

/**
 * Si el texto parece un código escaneado.
 *
 * Un lector de códigos de barras **teclea** el número y pulsa Enter. Cuando eso pasa con el buscador
 * enfocado, lo que quiere quien escaneó no es una lista: es ese producto. Ocho dígitos o más, todo
 * números, es la forma de EAN‑8, EAN‑13 y UPC.
 */
export function pareceCodigoEscaneado(texto: string): boolean {
    const t = normalizar(texto);
    return /^[0-9]{8,}$/.test(t);
}
