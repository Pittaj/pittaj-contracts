// ─── Módulos organizacionales (barrel directo) ──────────────
export * from './tenant';
export * from './user';
export * from './role';
export * from './permission';
export * from './user-role';
export * from './subscription';
export * from './company';
export * from './location';

// ─── Módulos DDD — usar subpath imports ─────────────────────
// @pittaj/lib-contracts/auth/schemas, /auth/responses
// @pittaj/lib-contracts/category/schemas, /category/responses
// @pittaj/lib-contracts/product/schemas, /product/responses, /product/constants
// @pittaj/lib-contracts/customer/schemas, /customer/responses, /customer/constants
// @pittaj/lib-contracts/cash-closure/schemas, /cash-closure/responses, /cash-closure/constants
// @pittaj/lib-contracts/pos-session/schemas, /pos-session/responses, /pos-session/constants
// @pittaj/lib-contracts/pos-ticket/schemas, /pos-ticket/responses, /pos-ticket/constants
// @pittaj/lib-contracts/payment-method/schemas, /payment-method/responses, /payment-method/constants
// @pittaj/lib-contracts/sales-order/schemas, /sales-order/responses, /sales-order/constants
// @pittaj/lib-contracts/license/responses

// ─── Primitives (tipos planos de value objects) ─────────────
export * from './primitives';

// ─── HTTP Response Types ────────────────────────────────────
export * from './http/ResponseBase';

// ─── Hono Context Types ─── MOVIDOS a @pittaj/lib-server-types (solo backend)
