/**
 * @fileoverview Barrel export para contratos de Category
 * @module Contracts/Category
 * @version 1.0.0
 *
 * Solo schemas Zod para validación compartida.
 * Los tipos se infieren con z.infer<typeof schema> donde se necesiten.
 *
 * @example
 * ```typescript
 * import { createCategorySchema } from '@pittaj/lib-contracts/category';
 * import { z } from 'zod';
 *
 * type CreateCategoryPayload = z.infer<typeof createCategorySchema>;
 * ```
 */

// Schemas Zod
export * from './schemas';

// Migrado desde módulos
export * from './responses';
