/**
 * @fileoverview D4 · Los perfiles de uso: cómo va a usar Pittaj un negocio.
 * @module Contracts/Suite
 *
 * Se pregunta en el alta («¿Cómo vas a usar Pittaj?») y se cambia después desde Configuración, sin
 * borrar nada: un perfil solo decide **qué se ve**. Es un preajuste de la visibilidad de la suite
 * (`Visibilidad`), con la misma forma de lista de lo apagado.
 *
 * Cómo se combina con los otros niveles (lo resuelve la nube en `GET /api/suite/visibilidad`):
 *
 * 1. Si el backoffice le puso al negocio una lista **personalizada**, esa manda, entera.
 * 2. Si no, se parte del **predeterminado de la plataforma** y el perfil **solo apaga** más cosas:
 *    nunca enciende lo que la plataforma ocultó (lo que no está en la beta no se anuncia).
 *
 * Un negocio sin perfil (los que existían antes de D4) ve lo de siempre: el predeterminado.
 *
 * `DESPACHO` llega con D6, la cuenta de despacho: ofrecerlo antes sería prometer algo que no existe.
 *
 * Plan: docs `producto/plan-despachos-y-solo-libros.md` § D4.
 */
import type { Visibilidad } from './schemas/visibilidad.schema.js';
import { claveDeModulo, MODULOS_APAGADOS_EN_BANCOS_SENCILLO, type AppId } from './catalogo.js';

export const PERFILES_DE_USO = ['OPERAR', 'SOLO_LIBROS'] as const;
export type PerfilDeUso = (typeof PERFILES_DE_USO)[number];

/** La clave en `tenant_settings`. No sincronizable: el escritorio lee la visibilidad ya resuelta. */
export const CLAVE_DEL_PERFIL_DE_USO = 'suite.perfil';

export const PERFIL_DE_USO_INFO: Record<PerfilDeUso, { readonly nombre: string; readonly descripcion: string }> = {
    OPERAR: {
        nombre: 'Vender y operar mi negocio',
        descripcion: 'Caja, inventario, compras y ventas, con Bancos en su versión sencilla y tu contabilidad al día.',
    },
    SOLO_LIBROS: {
        nombre: 'Solo llevar mis libros',
        descripcion:
            'Ya vendes con otro sistema (o no vendes en mostrador): descargas tus CFDI, concilias el banco y ves tus impuestos.',
    },
};

/**
 * *Solo libros* no opera mostrador ni almacén: se apaga lo que vende, mueve existencias o
 * produce, y lo que en Ventas y Compras solo sirve a eso. Queda lo fiscal y contable: facturas y
 * cobranza, gastos y cuentas por pagar, el Buzón de CFDI, Bancos completo (el contador concilia) y
 * Contabilidad.
 */
const APPS_APAGADAS_EN_SOLO_LIBROS: readonly AppId[] = ['caja', 'tpv', 'inventario', 'produccion'];

const MODULOS_APAGADOS_EN_SOLO_LIBROS: readonly string[] = [
    ...['cotizaciones', 'pedidos', 'remisiones', 'devoluciones', 'listas-precios', 'promociones', 'reportes/por-producto'].map(
        (r) => claveDeModulo('ventas', r),
    ),
    ...['reabastecimiento', 'solicitudes', 'cotizaciones', 'ordenes', 'recepciones', 'devoluciones', 'productos', 'reportes/por-producto'].map(
        (r) => claveDeModulo('compras', r),
    ),
    claveDeModulo('contabilidad', 'inventario'),
];

/** Lo que apaga el perfil, en la forma de `Visibilidad` (solo claves en `false`). */
export function visibilidadDelPerfil(perfil: PerfilDeUso): Visibilidad {
    const apagar = (claves: readonly string[]) => Object.fromEntries(claves.map((k) => [k, false]));
    switch (perfil) {
        case 'OPERAR':
            return { apps: {}, modulos: apagar(MODULOS_APAGADOS_EN_BANCOS_SENCILLO) };
        case 'SOLO_LIBROS':
            return { apps: apagar(APPS_APAGADAS_EN_SOLO_LIBROS), modulos: apagar(MODULOS_APAGADOS_EN_SOLO_LIBROS) };
    }
}

/**
 * El predeterminado de la plataforma con el perfil encima. El perfil **solo apaga**: una clave que
 * la plataforma dejó en `false` sigue en `false` aunque el perfil no la mencione, y una que el
 * perfil apaga queda en `false` aunque la plataforma la hubiera encendido de forma explícita.
 */
export function aplicarPerfil(base: Visibilidad, perfil: PerfilDeUso | null | undefined): Visibilidad {
    if (!perfil) return base;
    const p = visibilidadDelPerfil(perfil);
    return {
        apps: { ...base.apps, ...p.apps },
        modulos: { ...base.modulos, ...p.modulos },
    };
}

export const esPerfilDeUso = (v: unknown): v is PerfilDeUso =>
    typeof v === 'string' && (PERFILES_DE_USO as readonly string[]).includes(v);
