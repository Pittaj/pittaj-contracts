/**
 * @fileoverview Respuestas de visibilidad de la suite.
 * @module Contracts/Suite
 */

import type { Visibilidad } from '../schemas/visibilidad.schema.js';
import { APPS_SIEMPRE_VISIBLES } from '../catalogo.js';

/**
 * GET /api/suite/visibilidad — lo que ve ESTE negocio, ya resuelto (predeterminado u override).
 * La web y el escritorio la consumen tal cual; ninguno mezcla niveles.
 */
export interface VisibilidadEfectivaResponse extends Visibilidad {
    /** De dónde salió: útil para mostrar «sigue el predeterminado» en el backoffice. */
    readonly origen: 'predeterminado' | 'personalizado';
}

/** GET /api/admin/tenants/:id/suite/visibilidad — el override tal como está guardado. */
export interface VisibilidadDeTenantResponse extends Visibilidad {
    readonly modo: 'predeterminado' | 'personalizado';
}

/** ¿Se ve esta app? Clave ausente = sí. */
export function appVisible(v: Visibilidad, appId: string): boolean {
    if ((APPS_SIEMPRE_VISIBLES as readonly string[]).includes(appId)) return true;
    return v.apps[appId] !== false;
}

/** ¿Se ve este módulo? Requiere que su app se vea; clave ausente = sí. */
export function moduloVisible(v: Visibilidad, appId: string, ruta: string): boolean {
    return appVisible(v, appId) && v.modulos[`${appId}/${ruta}`] !== false;
}
