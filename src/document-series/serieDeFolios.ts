/**
 * @fileoverview Cómo se nombra la serie de folios de un punto de emisión.
 *
 * ── El problema que resuelve ──
 *
 * Un folio no se puede repetir NUNCA, y las cajas foliaban sin red: no hay forma de preguntarle a
 * nadie si el número que vas a emitir ya lo emitió otro. Así que la unicidad tiene que estar en el
 * NOMBRE de la serie, decidido de una vez y para siempre, no en una comprobación al vender.
 *
 * Antes la letra de la serie era el código que el dueño tecleaba al dar de alta la caja («C1»,
 * «BAR»). Eso solo se validaba contra la base local de cada instalación, y tres tiendas que no se
 * ven entre sí eligen «C1» las tres: dos cajas distintas emitiendo `TKT-C1-00001`. Pasó el
 * 2026-09-02.
 *
 * ── La regla ──
 *
 * La serie se compone de dos partes, y cada una es única por una razón distinta:
 *
 *   1. **El código de la sucursal** — único por cuenta, lo garantiza la base de la nube
 *      (`locations_tenant_code_unique`).
 *   2. **El ordinal del punto de emisión dentro de esa sucursal** — lo reparte la nube al
 *      registrar el equipo, que es el único momento que ya exige conexión.
 *
 * Dos partes únicas dan un nombre único sin que nadie tenga que coordinarse, y el folio sigue
 * diciendo de un vistazo de qué tienda y qué caja salió: `TKT-S1C2-00007`.
 */

/** Marca del punto de emisión dentro de la sucursal. */
export const MARCA_DE_CAJA = 'C';
export const MARCA_DE_WEB = 'W';

/** Tope de la columna `serie` (varchar(10) en la nube; mismo límite en el escritorio). */
export const LARGO_MAXIMO_DE_SERIE = 10;

/**
 * Nombre de la serie de un punto de emisión.
 *
 * @param codigoDeSucursal código corto de la sucursal, único por cuenta (p. ej. `S1`)
 * @param ordinal número del punto de emisión dentro de esa sucursal, repartido por la nube
 * @param marca `C` para una caja de escritorio, `W` para la terminal web
 */
export function serieDePuntoDeEmision(
    codigoDeSucursal: string,
    ordinal: number,
    marca: string = MARCA_DE_CAJA,
): string {
    const sucursal = (codigoDeSucursal ?? '').trim().toUpperCase();
    if (sucursal.length === 0) {
        throw new Error('La sucursal necesita un código para poder nombrar su serie de folios.');
    }
    if (!Number.isInteger(ordinal) || ordinal < 1) {
        throw new Error('El ordinal del punto de emisión empieza en 1.');
    }

    const nombre = `${sucursal}${marca}${ordinal}`;

    // Un nombre truncado deja de ser único, que es justo lo que esto viene a evitar: mejor
    // negarse y que se vea, a emitir folios que chocan dentro de un mes.
    if (nombre.length > LARGO_MAXIMO_DE_SERIE) {
        throw new Error(
            `La serie «${nombre}» no cabe en ${LARGO_MAXIMO_DE_SERIE} caracteres. ` +
                'Acorta el código de la sucursal.',
        );
    }

    return nombre;
}

/** Serie de una caja de escritorio: `S1C2`. */
export const serieDeCaja = (codigoDeSucursal: string, ordinal: number): string =>
    serieDePuntoDeEmision(codigoDeSucursal, ordinal, MARCA_DE_CAJA);

/**
 * Serie de la terminal web de una sucursal: `S1W1`.
 *
 * Una sola para toda la web de esa sucursal, y basta: sus folios se asignan en el servidor con
 * bloqueo optimista, así que tres cajeros web a la vez no pueden sacar el mismo número. Lo que no
 * puede es compartirla con el escritorio, que folia sin red sobre su propia copia.
 */
export const serieDeTerminalWeb = (codigoDeSucursal: string, ordinal: number = 1): string =>
    serieDePuntoDeEmision(codigoDeSucursal, ordinal, MARCA_DE_WEB);

/** Plantilla del folio. El año no entra: se quitó el reinicio anual (BUG-005/017). */
export const FORMATO_DE_TICKET = 'TKT-{serie}-{folio:00000}';
