/**
 * @fileoverview Barrel export para schemas Zod de Role.
 * @module Contracts/Role/Schemas
 * @version 1.1.0
 */

export { CreateRoleSchema, type CreateRoleRequest } from './createRole.schema';
export { UpdateRoleSchema, type UpdateRoleRequest } from './updateRole.schema';
export { GetRolesSchema, type GetRolesQuery } from './getRoles.schema';
export { RoleIdParamSchema, type RoleIdParam } from './roleIdParam.schema';
