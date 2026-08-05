/**
 * @fileoverview DTO de LECTURA de operadores para la web. Sin material de credencial.
 * @module Operator/Responses/OperatorListItem
 */

import type { OperatorRole } from './OperatorResponse';

/**
 * Vista web de un operador: quién puede entrar y cobrar.
 *
 * Deliberadamente NO lleva `passwordSalt`/`passwordHash` — eso solo existe en el contrato de
 * sync, que va de dispositivo a nube. Un listado web que los expusiera repartiría verificadores
 * a cualquiera con permiso de mirar la pantalla. Tampoco lleva el PIN, que ni siquiera sube.
 */
export interface OperatorListItemResponse {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly role: OperatorRole;
    readonly isActive: boolean;
    /** Vínculo opcional al usuario de la cuenta (null = solo local). */
    readonly userId: string | null;
    /** Ids de roles RBAC asignados; de ahí salen los permisos efectivos. */
    readonly roleIds: readonly string[];
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

/** Página del listado de operadores. */
export interface GetOperatorsResponse {
    readonly items: OperatorListItemResponse[];
    readonly total: number;
    readonly page: number;
    readonly limit: number;
}
