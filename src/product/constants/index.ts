/**
 * @fileoverview Constantes de validación para product
 * Extraídas de dominio para uso compartido en contracts.
 * Solo contiene LIMITS y enums de API. La lógica de negocio permanece en el dominio.
 */

export const PRODUCT_CONSTANTS = {
  LIMITS: {
    /** Longitud maxima del nombre de producto */
    MAX_NAME_LENGTH: 200,

    /** Longitud minima del nombre de producto */
    MIN_NAME_LENGTH: 2,

    /** Longitud maxima del SKU */
    MAX_SKU_LENGTH: 50,

    /** Longitud minima del SKU */
    MIN_SKU_LENGTH: 1,

    /** Longitud maxima del codigo de barras */
    MAX_BARCODE_LENGTH: 50,

    /** Longitud maxima del codigo interno */
    MAX_CODE_LENGTH: 50,

    /** Longitud minima del codigo interno */
    MIN_CODE_LENGTH: 2,

    /** Longitud maxima de la descripcion larga */
    MAX_DESCRIPTION_LENGTH: 2000,

    /** Longitud maxima de la descripcion corta */
    MAX_SHORT_DESCRIPTION_LENGTH: 500,

    /** Numero maximo de tags por producto */
    MAX_TAGS: 20,

    /** Longitud maxima de cada tag */
    MAX_TAG_LENGTH: 50,

    /** Numero maximo de imagenes por producto */
    MAX_IMAGES: 10,

    /** Numero maximo de variantes por producto */
    MAX_VARIANTS: 100,

    /** Numero maximo de componentes en combo/kit */
    MAX_COMPONENTS: 50,

    /** Precio maximo permitido */
    MAX_PRICE: 999_999_999.99,

    /** Precio minimo permitido */
    MIN_PRICE: 0,

    /** Stock maximo permitido */
    MAX_STOCK: 999_999_999,

    /** Peso maximo en kg */
    MAX_WEIGHT: 999_999.99,

    /** Numero maximo de atributos personalizados */
    MAX_ATTRIBUTES_SIZE: 50,

    /** Orden maximo de visualizacion en POS */
    MAX_POS_ORDER: 9999,

    /** Orden minimo de visualizacion en POS */
    MIN_POS_ORDER: 0,

    /** Precision decimal para precios */
    PRICE_DECIMAL_PLACES: 2,

    /** Numero maximo de productos por tenant */
    MAX_PRODUCTS_PER_TENANT: 50_000,

    /** Tamano de pagina por defecto para consultas */
    DEFAULT_PAGE_SIZE: 20,

    /** Tamano maximo de pagina para consultas */
    MAX_PAGE_SIZE: 100,
  },

  PRODUCT_TYPES: {
    SIMPLE: {
      value: 'SIMPLE',
      label: 'Producto simple',
      hasVariants: false,
      hasComponents: false,
      tracksInventory: true,
    },
    VARIABLE: {
      value: 'VARIABLE',
      label: 'Producto con variantes',
      hasVariants: true,
      hasComponents: false,
      tracksInventory: true,
    },
    COMBO: {
      value: 'COMBO',
      label: 'Combo',
      hasVariants: false,
      hasComponents: true,
      tracksInventory: false,
    },
    KIT: {
      value: 'KIT',
      label: 'Kit de productos',
      hasVariants: false,
      hasComponents: true,
      tracksInventory: true,
    },
    SERVICE: {
      value: 'SERVICE',
      label: 'Servicio',
      hasVariants: false,
      hasComponents: false,
      tracksInventory: false,
    },
  } as const,

  TAX_TYPES: {
    IVA_16: { value: 'IVA_16', rate: 0.16, label: 'IVA 16%' },
    IVA_8: { value: 'IVA_8', rate: 0.08, label: 'IVA 8%' },
    IVA_0: { value: 'IVA_0', rate: 0.0, label: 'IVA 0%' },
    EXENTO: { value: 'EXENTO', rate: 0.0, label: 'Exento' },
    IEPS: { value: 'IEPS', rate: 0.0, label: 'IEPS (variable)' },
  } as const,

  UNITS_OF_MEASURE: {
    UNIT: { value: 'UNIT', label: 'Pieza', allowsFractional: false },
    KG: { value: 'KG', label: 'Kilogramo', allowsFractional: true },
    LT: { value: 'LT', label: 'Litro', allowsFractional: true },
    MT: { value: 'MT', label: 'Metro', allowsFractional: true },
    BOX: { value: 'BOX', label: 'Caja', allowsFractional: false },
    PACK: { value: 'PACK', label: 'Paquete', allowsFractional: false },
  } as const,

  VALUATION_METHODS: ['FIFO', 'AVERAGE', 'SPECIFIC'] as const,
} as const;
