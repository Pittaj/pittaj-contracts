/**
 * @fileoverview Seeds canónicos del catálogo base (F3 instalación/vinculación).
 * @module seed
 * @version 1.0.0
 *
 * FUENTE ÚNICA DE VERDAD de los ids deterministas del catálogo base. La regla (2026-07-25):
 * las entidades de negocio se siembran SOLO en el onboarding de la nube, con estos ids;
 * el desktop las recibe por el pull inicial del wizard de vinculación.
 *
 * Los ids son deliberadamente deterministas (no v4) para que TODAS las instalaciones y la
 * nube converjan por construcción — vienen de los seeds históricos del desktop, horneados
 * hasta en defaults de columnas de sus migraciones (p. ej. product.tax_id → IVA 16%). El VO
 * Uuid del backend acepta cualquier versión de UUID precisamente por esto.
 *
 * NO cambiar un id existente jamás (romper la convergencia con instalaciones vivas).
 * Agregar seeds nuevos = nueva entrada aquí + sembrarla en el onboarding.
 */

/** Impuestos MX base. `isDefault` = el que recibe un producto sin impuesto explícito. */
export const SEED_TAXES = [
    {
        id: '22222222-2222-2222-2222-222222222221',
        name: 'IVA 16%',
        rate: 0.16,
        kind: 'IVA',
        isIncluded: true,
        satFactor: 'Tasa',
        satCode: '002',
        isDefault: true,
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Tasa 0',
        rate: 0,
        kind: 'ZERO',
        isIncluded: true,
        satFactor: 'Tasa',
        satCode: '002',
        isDefault: false,
    },
    {
        id: '22222222-2222-2222-2222-222222222223',
        name: 'Exento',
        rate: 0,
        kind: 'EXEMPT',
        isIncluded: true,
        satFactor: 'Exento',
        satCode: null,
        isDefault: false,
    },
] as const;

/** Id del impuesto default (referenciado por el DEFAULT de columna en el desktop). */
export const SEED_DEFAULT_TAX_ID = '22222222-2222-2222-2222-222222222221';

/** Métodos de pago base (system-managed: no se eliminan, sí se pueden desactivar). */
export const SEED_PAYMENT_METHODS = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Efectivo',
        type: 'CASH',
        isCashCount: true,
        requiresCustomer: false,
        requiresReference: false,
        commission: 0,
        displayOrder: 0,
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Tarjeta',
        type: 'CARD',
        isCashCount: false,
        requiresCustomer: false,
        requiresReference: false,
        commission: 0,
        displayOrder: 1,
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Transferencia',
        type: 'TRANSFER',
        isCashCount: false,
        requiresCustomer: false,
        requiresReference: true,
        commission: 0,
        displayOrder: 2,
    },
    {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Credito',
        type: 'CREDIT',
        isCashCount: false,
        requiresCustomer: true,
        requiresReference: false,
        commission: 0,
        displayOrder: 3,
    },
] as const;

/**
 * Series de folios base (reinicio anual, alcance GLOBAL). Ids canónicos nuevos (los seeds
 * históricos del desktop las creaban con ids aleatorios; las instalaciones existentes
 * convergen por clave natural type+series, las nuevas nacen con estos ids).
 */
export const SEED_DOCUMENT_SERIES = [
    {
        id: '00000000-0000-0000-0000-0000000000b1',
        documentType: 'TICKET',
        series: 'A',
        scope: 'GLOBAL',
        format: 'TKT-{serie}-{folio:00000}',
    },
    {
        id: '00000000-0000-0000-0000-0000000000b2',
        documentType: 'INVOICE',
        series: 'F',
        scope: 'GLOBAL',
        format: 'F-{folio:0000}',
    },
    {
        id: '00000000-0000-0000-0000-0000000000b3',
        documentType: 'CREDIT_NOTE',
        series: 'NC',
        scope: 'GLOBAL',
        format: 'NC-{folio:0000}',
    },
] as const;

/**
 * Bodega default de la PRIMERA sucursal del tenant (converge con el seed histórico del
 * desktop). Las sucursales adicionales generan su bodega default con id aleatorio.
 */
export const SEED_DEFAULT_WAREHOUSE = {
    id: '00000000-0000-0000-0000-0000000000e1',
    name: 'Principal',
    code: 'PRINCIPAL',
} as const;

/**
 * Caja registradora default de la PRIMERA sucursal (misma regla que la bodega). La nube
 * empieza a modelar cajas con esto (adelanta la fase de pagos: caja = unidad de cobro).
 */
export const SEED_DEFAULT_REGISTER = {
    id: '00000000-0000-0000-0000-0000000000f1',
    name: 'Caja 1',
} as const;

/**
 * NOTA sobre ids RETIRADOS (no sembrar jamás): la empresa `…c1` ("Mi Empresa") y la
 * sucursal `…d1` ("Matriz") de los seeds históricos del desktop se eliminaron — la empresa
 * y sucursal REALES nacen del onboarding con ids propios. El catálogo UoM y las condiciones
 * de pago se sumarán aquí cuando exista su entidad (pendiente ⑤ del feedback de julio).
 */
export const RETIRED_SEED_IDS = [
    '00000000-0000-0000-0000-0000000000c1', // company "Mi Empresa" (seed dual, fusionada)
    '00000000-0000-0000-0000-0000000000d1', // location "Matriz" (seed dual, fusionada)
] as const;
