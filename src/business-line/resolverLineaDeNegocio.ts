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

/**
 * La línea de un renglón de **gasto** (F6.2, F6.3). Mismo espíritu, otras fuentes:
 *   1. la del renglón (la que eligió quien capturó, o la que se estampó al guardar);
 *   2. la del **proveedor** (Cloudflare → SaaS): es una decisión explícita sobre ese proveedor;
 *   3. la del **concepto** (Gas LP del horno → Panadería): es genérica, vale para cualquiera;
 *   4. la de la sucursal del documento;
 *   5. ninguna → «Sin línea».
 *
 * El proveedor va antes que el concepto porque es más específico: «Teléfono e internet» no tiene
 * giro, pero el Telmex de la oficina sí. La nube (lector de compras) y la web (vista previa de la
 * póliza) usan esta misma función; el escritorio, su gemela.
 */
export interface FuentesDeLineaDelGasto {
    readonly renglon?: string | null;
    readonly proveedor?: string | null;
    readonly concepto?: string | null;
    readonly sucursal?: string | null;
}

export function resolverLineaDelGasto(f: FuentesDeLineaDelGasto): string | null {
    return f.renglon ?? f.proveedor ?? f.concepto ?? f.sucursal ?? null;
}
