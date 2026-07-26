/**
 * @fileoverview Catálogo base que siembra el onboarding de la nube (F3 instalación/vinculación).
 * @module seed
 * @version 2.0.0
 *
 * FUENTE ÚNICA DE VERDAD de las DEFINICIONES del catálogo base. La regla (2026-07-25):
 * las entidades de negocio se siembran SOLO en el onboarding de la nube; el desktop las
 * recibe por el pull inicial del wizard de vinculación.
 *
 * IDS: aleatorios POR TENANT. Las tablas de la nube son multi-tenant con PK global, así
 * que un id fijo solo podría existir una vez (el segundo tenant chocaría). El determinismo
 * de ids dejó de ser necesario en cuanto quedó UN solo sembrador: los dispositivos ya no
 * siembran, hacen pull. Los ids fijos históricos quedan abajo como LEGADO (lo que las
 * instalaciones pre-F3 ya sincronizaron) — jamás re-sembrarlos.
 */

/** Impuestos MX base. `isDefault` = el que recibe un producto sin impuesto explícito. */
export const SEED_TAXES = [
    { name: 'IVA 16%', rate: 0.16, kind: 'IVA', isIncluded: true, satFactor: 'Tasa', satCode: '002', isDefault: true },
    { name: 'Tasa 0', rate: 0, kind: 'ZERO', isIncluded: true, satFactor: 'Tasa', satCode: '002', isDefault: false },
    { name: 'Exento', rate: 0, kind: 'EXEMPT', isIncluded: true, satFactor: 'Exento', satCode: null, isDefault: false },
] as const;

/** Métodos de pago base (system-managed: no se eliminan, sí se pueden desactivar). */
export const SEED_PAYMENT_METHODS = [
    { name: 'Efectivo', type: 'CASH', isCashCount: true, requiresCustomer: false, requiresReference: false, commission: 0, displayOrder: 0 },
    { name: 'Tarjeta', type: 'CARD', isCashCount: false, requiresCustomer: false, requiresReference: false, commission: 0, displayOrder: 1 },
    { name: 'Transferencia', type: 'TRANSFER', isCashCount: false, requiresCustomer: false, requiresReference: true, commission: 0, displayOrder: 2 },
    { name: 'Credito', type: 'CREDIT', isCashCount: false, requiresCustomer: true, requiresReference: false, commission: 0, displayOrder: 3 },
] as const;

/** Series de folios base (reinicio anual, alcance GLOBAL). */
export const SEED_DOCUMENT_SERIES = [
    { documentType: 'TICKET', series: 'A', scope: 'GLOBAL', format: 'TKT-{serie}-{folio:00000}' },
    { documentType: 'INVOICE', series: 'F', scope: 'GLOBAL', format: 'F-{folio:0000}' },
    { documentType: 'CREDIT_NOTE', series: 'NC', scope: 'GLOBAL', format: 'NC-{folio:0000}' },
] as const;

/** Bodega default de cada sucursal creada en onboarding. */
export const SEED_DEFAULT_WAREHOUSE = { name: 'Principal', code: 'PRINCIPAL' } as const;

/** Caja registradora default (la nube modela cajas: unidad de cobro de la fase de pagos). */
export const SEED_DEFAULT_REGISTER = { name: 'Caja 1' } as const;

// ============================================================
// LEGADO — ids deterministas de instalaciones pre-F3
// ============================================================

/**
 * Ids fijos que los seeds del desktop usaban ANTES de F3 y que las instalaciones vivas ya
 * sincronizaron a la nube (por eso el VO Uuid acepta cualquier versión). Sirven para
 * reconocer/adoptar catálogo legado — NUNCA para sembrar tenants nuevos.
 */
export const LEGACY_SEED_IDS = {
    taxes: {
        iva16: '22222222-2222-2222-2222-222222222221',
        tasa0: '22222222-2222-2222-2222-222222222222',
        exento: '22222222-2222-2222-2222-222222222223',
    },
    paymentMethods: {
        efectivo: '00000000-0000-0000-0000-000000000001',
        tarjeta: '00000000-0000-0000-0000-000000000002',
        transferencia: '00000000-0000-0000-0000-000000000003',
        credito: '00000000-0000-0000-0000-000000000004',
    },
    warehouse: '00000000-0000-0000-0000-0000000000e1',
    register: '00000000-0000-0000-0000-0000000000f1',
} as const;

/** Ids RETIRADOS (seeds duales fusionados el 2026-07-25): no deben existir jamás. */
export const RETIRED_SEED_IDS = [
    '00000000-0000-0000-0000-0000000000c1', // company "Mi Empresa"
    '00000000-0000-0000-0000-0000000000d1', // location "Matriz"
] as const;
