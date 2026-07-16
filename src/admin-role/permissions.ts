/**
 * @fileoverview Catálogo de permisos del backoffice (plataforma).
 * @module Contracts/AdminRole/Permissions
 *
 * Fuente única de los permisos que se pueden asignar a los roles admin.
 * El comodín '*' (Super Admin) concede todos. El backend valida el claim `prm`.
 */

export interface AdminPermissionDef {
    readonly key: string;
    readonly label: string;
    readonly group: string;
}

export const ADMIN_PERMISSIONS: readonly AdminPermissionDef[] = [
    { group: 'Tenants', key: 'tenants.view', label: 'Ver tenants' },
    { group: 'Tenants', key: 'tenants.manage', label: 'Gestionar tenants' },
    { group: 'Onboarding', key: 'onboarding.view', label: 'Ver onboarding' },
    { group: 'Onboarding', key: 'onboarding.manage', label: 'Gestionar onboarding' },
    { group: 'Suscripciones', key: 'subscriptions.view', label: 'Ver suscripciones' },
    { group: 'Suscripciones', key: 'subscriptions.manage', label: 'Gestionar suscripciones' },
    { group: 'Planes', key: 'plans.view', label: 'Ver planes' },
    { group: 'Planes', key: 'plans.manage', label: 'Gestionar planes' },
    { group: 'Cupones', key: 'coupons.view', label: 'Ver cupones' },
    { group: 'Cupones', key: 'coupons.manage', label: 'Gestionar cupones' },
    { group: 'Feature Flags', key: 'feature-flags.view', label: 'Ver feature flags' },
    { group: 'Feature Flags', key: 'feature-flags.manage', label: 'Gestionar feature flags' },
    { group: 'Uso y Límites', key: 'usage-limits.view', label: 'Ver uso por tenant' },
    { group: 'Uso y Límites', key: 'usage-limits.manage', label: 'Gestionar cuotas de timbres' },
    { group: 'Configuración', key: 'platform-config.view', label: 'Ver configuración' },
    { group: 'Configuración', key: 'platform-config.manage', label: 'Gestionar configuración' },
    { group: 'Métricas', key: 'metrics.view', label: 'Ver métricas y dashboard' },
    { group: 'Bitácora', key: 'audit.view', label: 'Ver bitácora' },
    { group: 'Operadores', key: 'admin-users.view', label: 'Ver operadores' },
    { group: 'Operadores', key: 'admin-users.manage', label: 'Gestionar operadores' },
    { group: 'Roles', key: 'admin-roles.view', label: 'Ver roles' },
    { group: 'Roles', key: 'admin-roles.manage', label: 'Gestionar roles' },
] as const;

export const ADMIN_PERMISSION_KEYS: readonly string[] = ADMIN_PERMISSIONS.map((p) => p.key);

/** Comodín que concede todos los permisos (Super Admin). */
export const ADMIN_PERMISSION_WILDCARD = '*';
