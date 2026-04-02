# @pittaj/contracts

Contratos compartidos de Pittaj ERP: schemas Zod, responses, constantes y primitivas.

## Instalación

```bash
bun add github:Pittaj/pittaj-contracts
```

## Uso

```typescript
// Por módulo
import { createProductSchema, ProductResponse, PRODUCT_CONSTANTS } from '@pittaj/contracts/product';
import { createUserSchema, UserResponse } from '@pittaj/contracts/user';

// Shared (HTTP + primitives compartidas)
import { ResponseBase } from '@pittaj/contracts/shared';
import type { MoneyPrimitives } from '@pittaj/contracts/shared';
```

## Estructura

```
src/
├── index.ts            # Re-exporta shared/
├── shared/             # Utilidades globales
│   ├── http/           # ResponseBase
│   └── primitives/     # Primitives compartidas entre módulos
├── auth/               # Schemas, responses, primitives
├── cash-closure/       # Schemas, responses, constants, primitives
├── category/           # Schemas, responses
├── company/            # Schemas, responses
├── customer/           # Schemas, responses, constants, primitives
├── license/            # Responses
├── location/           # Schemas, responses
├── payment-method/     # Schemas, responses, constants, primitives
├── permission/         # Schemas, responses
├── pos-session/        # Schemas, responses, constants, primitives
├── pos-ticket/         # Schemas, responses, constants, primitives
├── product/            # Schemas, responses, constants, primitives
├── role/               # Schemas, responses
├── sales-order/        # Schemas, responses, constants, primitives
├── subscription/       # (pendiente)
├── tenant/             # Schemas
├── user/               # Schemas, responses
└── user-role/          # Schemas, responses
```

## Dependencias

- `zod` — Única dependencia runtime
