/**
 * @fileoverview Clase base para respuestas HTTP estandarizadas
 * @module ResponseBase
 * @version 1.0.0
 * 
 * PATRÓN DE DEPRECATED PRESERVADO:
 * - Todas las respuestas tienen estructura consistente
 * - Campo `success` para identificar éxito/error
 * - Campo `message` descriptivo
 * - Campo `data` para datos (null en errores)
 * - Campo `errors` array para múltiples errores
 * 
 * @example
 * // Respuesta exitosa
 * return ResponseBase.success(category, 'Category created successfully');
 * 
 * @example
 * // Respuesta de error
 * return ResponseBase.error('Validation failed', ['Name is too short']);
 */

/**
 * Interfaz para respuestas de error con detalles.
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Clase base para todas las respuestas HTTP.
 * 
 * Garantiza estructura consistente en toda la API:
 * - success: boolean (true = éxito, false = error)
 * - message: string (descripción legible)
 * - data: T | null (datos en éxito, null en error)
 * - errors: ErrorDetail[] | undefined (detalles de errores)
 * 
 * @template T - Tipo de datos de la respuesta
 * 
 * @class ResponseBase
 * @since 1.0.0
 */
export class ResponseBase<T> {
  /**
   * Crea una instancia de ResponseBase.
   * 
   * @param {boolean} success - Indica si la operación fue exitosa
   * @param {string} message - Mensaje descriptivo de la respuesta
   * @param {T | null} [data] - Datos de la respuesta (null en errores)
   * @param {ErrorDetail[]} [errors] - Detalles de errores (solo en fallos)
   */
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly data: T | null = null,
    public readonly errors?: ErrorDetail[]
  ) {}

  /**
   * Crea una respuesta exitosa con datos.
   * 
   * @template T - Tipo de datos
   * @param {T} data - Datos a retornar
   * @param {string} [message='Operación exitosa'] - Mensaje de éxito
   * @returns {ResponseBase<T>} Respuesta estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.success(
   *   { id: '123', name: 'Electrónica' },
   *   'Category created successfully'
   * );
   * ```
   */
  public static success<T>(
    data: T,
    message = 'Operación exitosa'
  ): ResponseBase<T> {
    return new ResponseBase<T>(true, message, data);
  }

  /**
   * Crea una respuesta exitosa sin datos (solo mensaje).
   * 
   * @param {string} [message='Operación exitosa'] - Mensaje de éxito
   * @returns {ResponseBase<null>} Respuesta estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.successMessage('Category deleted successfully');
   * ```
   */
  public static successMessage(
    message = 'Operación exitosa'
  ): ResponseBase<null> {
    return new ResponseBase<null>(true, message, null);
  }

  /**
   * Crea una respuesta de error.
   * 
   * @param {string} message - Mensaje principal del error
   * @param {ErrorDetail[] | string[]} [errors] - Detalles de errores
   * @returns {ResponseBase<null>} Respuesta de error estructurada
   * 
   * @example
   * ```typescript
   * // Error simple
   * return ResponseBase.error('Category not found');
   * 
   * // Error con detalles
   * return ResponseBase.error('Validation failed', [
   *   { field: 'name', message: 'Name is too short', code: 'NAME_TOO_SHORT' },
   *   { field: 'code', message: 'Code already exists', code: 'CODE_DUPLICATE' }
   * ]);
   * ```
   */
  public static error(
    message: string,
    errors?: ErrorDetail[] | string[]
  ): ResponseBase<null> {
    // Normalizar errors a ErrorDetail[]
    let errorDetails: ErrorDetail[] | undefined;

    if (errors) {
      if (typeof errors[0] === 'string') {
        errorDetails = (errors as string[]).map((msg) => ({ message: msg }));
      } else {
        errorDetails = errors as ErrorDetail[];
      }
    }

    return new ResponseBase<null>(false, message, null, errorDetails);
  }

  /**
   * Crea una respuesta de error de validación.
   * 
   * @param {ErrorDetail[] | string[]} errors - Errores de validación
   * @param {string} [message='Error de validación'] - Mensaje principal
   * @returns {ResponseBase<null>} Respuesta de error estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.validationError([
   *   { field: 'name', message: 'Name is required', code: 'REQUIRED' },
   *   { field: 'scope', message: 'Invalid scope', code: 'INVALID_ENUM' }
   * ]);
   * ```
   */
  public static validationError(
    errors: ErrorDetail[] | string[],
    message = 'Error de validación'
  ): ResponseBase<null> {
    return ResponseBase.error(message, errors);
  }

  /**
   * Crea una respuesta de recurso no encontrado.
   * 
   * @param {string} [message='Recurso no encontrado'] - Mensaje de error
   * @returns {ResponseBase<null>} Respuesta de error estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.notFound('Category not found');
   * ```
   */
  public static notFound(
    message = 'Recurso no encontrado'
  ): ResponseBase<null> {
    return ResponseBase.error(message);
  }

  /**
   * Crea una respuesta de conflicto (409).
   * 
   * @param {string} message - Mensaje del conflicto
   * @param {ErrorDetail[] | string[]} [errors] - Detalles adicionales
   * @returns {ResponseBase<null>} Respuesta de error estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.conflict('Category code already exists');
   * ```
   */
  public static conflict(
    message: string,
    errors?: ErrorDetail[] | string[]
  ): ResponseBase<null> {
    return ResponseBase.error(message, errors);
  }

  /**
   * Crea una respuesta de error del servidor (500).
   * 
   * @param {string} [message='Error interno del servidor'] - Mensaje de error
   * @param {string} [errorStack] - Stack trace (solo en desarrollo)
   * @returns {ResponseBase<null>} Respuesta de error estructurada
   * 
   * @example
   * ```typescript
   * return ResponseBase.serverError('Database connection failed');
   * ```
   */
  public static serverError(
    message = 'Error interno del servidor',
    errorStack?: string
  ): ResponseBase<null> {
    const errors = errorStack ? [{ message: errorStack }] : undefined;
    return ResponseBase.error(message, errors);
  }
}
