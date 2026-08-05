/**
 * @fileoverview DTO de respuesta para Operator (usuario local de la instalación).
 *
 * Espejo del agregado desktop `Pittaj.Domain.Identity.Operator`: la persona que entra a
 * esta computadora con usuario y contraseña, incluso sin internet. Es distinto del
 * `Cashier` (Caja → Cajeros, PIN y permisos POS) y del `User` de Organización: el
 * operador es quien ABRE Pittaj, no quien cobra.
 *
 * ── Por qué la contraseña SÍ viaja (y el PIN del cajero no) ──
 * Lo que viaja es el **verificador Argon2id** (sal + hash), nunca la contraseña. Es
 * exactamente lo que ya guarda la nube para las cuentas web en `auth_credentials`: de un
 * hash Argon2id no se recupera la contraseña.
 *
 * La razón de fondo es otra, y es de producto: si el operador no sincroniza, cambiar de
 * computadora —o que se te muera— deja al negocio **sin nadie que pueda entrar a su
 * propia caja**, y sin forma de recuperarlo. Ese fallo es peor que el riesgo de guardar
 * un verificador que la nube ya guarda para las cuentas web. Decisión del dueño del
 * producto, 2026-08-04.
 *
 * Sigue sin viajar el PIN del `Cashier` (ver CashierResponse): esa es otra credencial y
 * otra decisión, hoy sin cambiar.
 *
 * @module Contracts/Operator
 */

/** Rol legado de tres niveles. Los permisos reales salen de los roles RBAC. */
export type OperatorRole = 'CASHIER' | 'MANAGER' | 'ADMIN';

/** DTO de respuesta para sync de operadores. */
export interface OperatorResponse {
    readonly id: string;

    /** Usuario de acceso, en minúsculas y único por tenant. */
    readonly username: string;

    /** Nombre visible (el que aparece en los tickets y en la bitácora). */
    readonly displayName: string;

    /** Rol legado; respaldo cuando el operador aún no tiene roles RBAC asignados. */
    readonly role: OperatorRole;

    /**
     * Sal del hash Argon2id. Viaja junto al hash porque sin ella el verificador no
     * sirve de nada: son una sola pieza.
     */
    readonly passwordSalt: string;

    /** Verificador Argon2id de la contraseña. NUNCA la contraseña. */
    readonly passwordHash: string;

    /** Un operador inactivo no puede entrar, pero se conserva por trazabilidad. */
    readonly isActive: boolean;

    /** Vínculo opcional al usuario de Organización (null = solo local). */
    readonly userId: string | null;

    /** Ids de los roles RBAC asignados (tabla hija; '[]' = sin roles). */
    readonly roleIds: readonly string[];

    /** Versión para optimistic locking. */
    readonly version: number;
    /** Fecha de creación (ISO 8601). */
    readonly createdAt?: string;
    /** Fecha de última actualización (ISO 8601). */
    readonly updatedAt?: string;
}
