/**
 * @fileoverview Tipos de contexto Hono para las APIs.
 * Tipos Cloudflare-específicos usan unknown para no depender de @cloudflare/workers-types.
 * DiContainer es genérico para no acoplar a tsyringe.
 */

/**
 * Interfaz mínima del contenedor DI (compatible con tsyringe).
 * Contracts no depende de ningún contenedor DI concreto.
 */
export interface DiContainer {
    resolve<T>(token: new (...args: any[]) => T): T;
}

/** Variables inyectadas en el contexto Hono por middleware. */
export type HonoVariables = {
    container: DiContainer;
};

/** Bindings del entorno Cloudflare Worker / Bun local. */
export type WorkerEnv = {
    DATABASE_URL: string;
    HYPERDRIVE?: { connectionString: string };
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SUPABASE_SERVICE_KEY?: string;
    CACHE?: unknown;
    SESSION_CACHE?: unknown;
    EVENT_STORE?: unknown;
    EVENT_BUS?: unknown;
    ENVIRONMENT?: string;
    RESEND_API_KEY?: string;
    APP_URL?: string;
    JWT_PRIVATE_KEY?: string;
    JWT_PUBLIC_KEY?: string;
    COOKIE_DOMAIN?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
};

/** Contexto Hono completo para la API. */
export type HonoContext = {
    Bindings: WorkerEnv;
    Variables: HonoVariables;
};
