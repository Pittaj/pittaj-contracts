/**
 * @fileoverview Barrel export para schemas de Department.
 * @module Contracts/Department
 */

export * from './createDepartment.schema.js';
export * from './getDepartments.schema.js';
export * from './departmentIdParam.schema.js';
export { syncPushDepartmentSchema, syncPullDepartmentSchema } from './syncDepartment.schema.js';
