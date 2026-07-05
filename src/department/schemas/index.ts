/**
 * @fileoverview Barrel export para schemas de Department.
 * @module Contracts/Department
 */

export * from './createDepartment.schema';
export * from './getDepartments.schema';
export * from './departmentIdParam.schema';
export { syncPushDepartmentSchema, syncPullDepartmentSchema } from './syncDepartment.schema';
