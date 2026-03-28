# @pittaj/contracts

Contratos compartidos de Pittaj ERP: schemas Zod, DTOs, responses, constantes y primitivas.

## Instalación

```bash
bun add github:Pittaj/pittaj-contracts
```

## Uso

```typescript
// Barrel principal (módulos organizacionales + primitives + http + hono)
import { ResponseBase, type HonoContext } from '@pittaj/contracts';

// Subpath imports para módulos DDD
import { createProductSchema } from '@pittaj/contracts/product/schemas';
import type { ProductResponse } from '@pittaj/contracts/product/responses';
import { PRODUCT_CONSTANTS } from '@pittaj/contracts/product/constants';
```

## Estructura

```
src/
├── auth/           # Schemas y responses de autenticación
├── category/       # Schemas y responses de categorías
├── product/        # Schemas, responses y constantes de productos
├── customer/       # Schemas, responses y constantes de clientes
├── cash-closure/   # Schemas, responses y constantes de cierres de caja
├── pos-session/    # Schemas, responses y constantes de sesiones POS
├── pos-ticket/     # Schemas, responses y constantes de tickets POS
├── payment-method/ # Schemas, responses y constantes de métodos de pago
├── sales-order/    # Schemas, responses y constantes de órdenes de venta
├── license/        # Responses de licencias
├── tenant/         # Schemas de tenants
├── user/           # Schemas y DTOs de usuarios
├── role/           # Schemas y DTOs de roles
├── permission/     # DTOs de permisos
├── user-role/      # Schemas y DTOs de user-role
├── company/        # Schemas y DTOs de empresas
├── location/       # Schemas y DTOs de ubicaciones
├── subscription/   # DTOs de suscripciones
├── primitives/     # Interfaces planas de value objects
├── http/           # ResponseBase
└── hono.ts         # HonoContext, WorkerEnv, DiContainer
```

## Dependencias

- `zod` — Única dependencia runtime
