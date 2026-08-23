/**
 * @fileoverview DTO de "Mi Suscripción" para el tenant autenticado.
 *
 * Modelo de negocio: precio único con COBRO POR CAJA — sin planes por niveles
 * y sin cobro por sucursal. La mensualidad (setting billing.base-price, $399
 * MXN IVA incluido) cubre 3 cajas en TODA la cuenta, y de ahí en adelante se
 * cobra por caja. Abrir sucursales no cuesta.
 *
 * Incluye 100 timbres CFDI/mes POR CUENTA (no por sucursal), extras por paquete.
 *
 * @module Contracts/SubscriptionSummary
 */

/** Estados de la suscripción (espejo del dominio backend). */
export const MY_SUBSCRIPTION_STATUSES = [
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'SUSPENDED',
] as const;
export type MySubscriptionStatus = (typeof MY_SUBSCRIPTION_STATUSES)[number];

/** Conteos de uso del tenant (informativos; sin límites que bloqueen). */
export interface SubscriptionUsage {
    readonly users: number;
    readonly companies: number;
    /** Sucursales activas. Informativo: no cuestan. */
    readonly locations: number;
    /** Cajas activas hoy en toda la cuenta: lo único que se cobra. */
    readonly devices: number;
}

/** Datos de cobro estimado (preliminar hasta integrar pagos). */
export interface SubscriptionBilling {
    /** Sucursales activas. Se conserva por compatibilidad; ya no cobra nada. */
    readonly activeLocations: number;
    /** Mensualidad, IVA incluido (setting billing.base-price). */
    readonly basePrice: number;
    /** Cajas cubiertas por la mensualidad. */
    readonly includedDevices: number;
    /** Cajas activas por encima de las incluidas. */
    readonly extraDevices: number;
    /** Precio de cada caja adicional al mes, IVA incluido. */
    readonly pricePerExtraDevice: number;
    readonly currency: 'MXN';
    /** basePrice + extraDevices × pricePerExtraDevice, menos el cupón vigente. */
    readonly estimatedMonthly: number;
    /** true mientras no exista integración de pagos (precio preliminar). */
    readonly preliminary: boolean;
}

/** Modelos de cobro de una licencia. */
export const BILLING_MODELS = ['PERPETUAL', 'SUBSCRIPTION'] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

/**
 * La licencia contratada: qué se compró, no qué puede hacer el usuario.
 *
 * El código nunca pregunta «¿qué plan tiene?» sino «¿tiene esta capacidad?»; este
 * bloque existe para lo único que sí necesita saber el nombre del plan, que es
 * enseñárselo al dueño y decidir qué tarjeta pintar.
 */
export interface SubscriptionLicense {
    /** Código del plan: 'escritorio' | 'conectado' | 'completo'. */
    readonly planCode: string;
    readonly planName: string;
    /** PERPETUAL se compró una vez; SUBSCRIPTION se renta. */
    readonly billingModel: BillingModel;
    /** Cajas que cubre el nivel: 1 en la perpetua, 3 en las de renta. */
    readonly includedDevices: number;
    /**
     * Hasta cuándo recibe funciones nuevas la licencia perpetua (ISO 8601).
     * null en las de renta: ahí el mantenimiento va dentro de la mensualidad.
     */
    readonly maintenanceUntil: string | null;
    /**
     * false solo cuando una perpetua tiene el mantenimiento caducado.
     *
     * **No corta nada.** Deja de recibir funciones nuevas y lo obligatorio por ley
     * entra siempre: un punto de venta que no puede timbrar está muerto.
     */
    readonly maintenanceActive: boolean;
    /** Qué apps abre el nivel: 'sync' | 'web' | 'bancos' | 'contabilidad' | 'fiscal'. */
    readonly capabilities: readonly string[];
}

/**
 * Un nivel del catálogo, como se pinta en la pantalla de suscripción.
 *
 * Sale de la tabla `plans`, no de una lista en el cliente: añadir un nivel tiene
 * que seguir siendo meter una fila.
 */
export interface AvailablePlan {
    readonly code: string;
    readonly name: string;
    readonly description: string | null;
    /** MXN, IVA incluido. Mensual salvo que `billingModel` sea PERPETUAL. */
    readonly price: number;
    readonly billingModel: BillingModel;
    readonly includedDevices: number;
    /** Timbres que se reponen cada mes. 0 en la perpetua. */
    readonly monthlyStamps: number;
    /** Timbres de bienvenida, una sola vez en la vida de la licencia. */
    readonly oneTimeStamps: number;
    readonly capabilities: readonly string[];
    /**
     * false = existe pero **todavía no se vende**.
     *
     * Se devuelve igual, en vez de esconderlo: el dueño tiene que poder ver a qué
     * puede subir, y que un nivel esté a medias es información, no un secreto.
     */
    readonly available: boolean;
    /**
     * true = está disponible **solo** porque a esta cuenta se le abrió el acceso
     * anticipado; para el resto sigue sin venderse.
     *
     * Tiene que llegar hasta lo que el cliente ve. Si un nivel a medias le aparece
     * como uno normal, cuando choque con lo que falta no va a pensar «estoy
     * probando algo temprano», va a pensar «me vendieron algo roto» — y serán las
     * devoluciones de la gente que menos conviene perder.
     */
    readonly beta: boolean;
}

/** Respuesta de GET /api/subscriptions/me. */
export interface MySubscriptionResponse {
    readonly status: MySubscriptionStatus;
    /** Fin de la prueba (ISO 8601); null si no aplica. */
    readonly trialEndsAt: string | null;
    /** Días restantes de prueba (0 si venció hoy); null si no está en TRIAL. */
    readonly trialDaysLeft: number | null;
    readonly currentPeriodStart: string | null;
    readonly currentPeriodEnd: string | null;
    readonly usage: SubscriptionUsage;
    readonly billing: SubscriptionBilling;
    /** null en cuentas viejas sin fila de suscripción. */
    readonly license: SubscriptionLicense | null;
    /**
     * Bajada de nivel ya pedida que todavía NO ha entrado. `null` si no hay ninguna.
     *
     * Tiene que viajar aunque la interfaz pudiera vivir sin ello: quien pide una bajada y no
     * ve rastro de ella vuelve a pedirla, o escribe a soporte creyendo que falló. Y como el
     * cambio no toca `license` hasta el día 1, sin este campo la pantalla enseñaría el nivel
     * viejo sin ninguna pista de lo que va a pasar.
     */
    readonly pendingPlanChange: PendingPlanChange | null;
    /**
     * Desde cuándo la cuenta está en el programa beta (ISO), o `null` si no lo está.
     *
     * Cambia lo que la pantalla DEBE decir: a un invitado no se le habla de prueba vencida ni de
     * cobros, porque no va a pagar mientras dure. Sin este dato, el aviso de vencimiento le llega
     * igual y es la primera fricción que se encuentra — falsa, además.
     *
     * NO tiene nada que ver con el canal de actualizaciones: un tester corre el mismo `stable`
     * que cualquiera.
     */
    readonly betaSince: string | null;
}

/** Una bajada de nivel programada para el inicio del siguiente periodo. */
export interface PendingPlanChange {
    readonly planCode: string;
    readonly planName: string;
    /** Cuándo entra (ISO 8601). Es el día 1 del mes siguiente al de la petición. */
    readonly effectiveFrom: string;
}
