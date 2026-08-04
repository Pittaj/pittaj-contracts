/**
 * @fileoverview Barrel export para schemas Zod de Location.
 * @module Contracts/Location/Schemas
 * @version 1.0.0
 * @since 11-11-2025
 */

export { CreateLocationSchema, type CreateLocationRequest } from './createLocation.schema.js';
export { updateLocationSchema, type UpdateLocationRequest } from './updateLocation.schema.js';
export { GetLocationsSchema, type GetLocationsQuery } from './getLocations.schema.js';
export { locationIdParamSchema, type LocationIdParam } from './getLocationById.schema.js';
export { syncPushLocationSchema, syncPullLocationSchema } from './syncLocation.schema.js';
