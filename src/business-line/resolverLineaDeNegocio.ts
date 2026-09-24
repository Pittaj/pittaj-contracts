/**
 * @fileoverview De qué giro es un renglón: la regla única de resolución.
 * @module Contracts/BusinessLine
 *
 * La misma función decide en la nube (motor contable, reportes) y en la web; el
 * escritorio tiene su gemela (`LineaDeNegocio.Resolver`) con las mismas pruebas.
 * Si las dos puntas resolvieran distinto, el mismo ticket saldría en dos giros
 * según quién lo mirara.
 *
 * **Orden** (la primera que exista gana):
 *   1. la del renglón del documento (cuando se estampe al confirmar, F1.7);
 *   2. la del producto;
 *   3. la de la categoría del producto;
 *   4. la de la sucursal del documento;
 *   5. ninguna → `null`, «Sin línea».
 *
 * `null` no es un error: es el estado normal de quien no usa líneas de negocio,
 * que es la mayoría. Nada debe fallar ni avisar por ello.
 *
 * El producto va antes que la categoría porque es la excepción explícita: la
 * categoría «Pan» es de Panadería, pero la harina que se revende al menudeo
 * puede estar en ella y ser de Abarrotes.
 */

export interface FuentesDeLineaDeNegocio {
    readonly renglon?: string | null;
    readonly producto?: string | null;
    readonly categoria?: string | null;
    readonly sucursal?: string | null;
}

export function resolverLineaDeNegocio(f: FuentesDeLineaDeNegocio): string | null {
    return f.renglon ?? f.producto ?? f.categoria ?? f.sucursal ?? null;
}
