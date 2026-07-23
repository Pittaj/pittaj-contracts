# Changelog

## [2.0.0](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.8...v2.0.0) (2026-07-23)


### ⚠ BREAKING CHANGES

* **subscription:** alinea contract al modelo de precio por sucursal

### Features

* **admin-role:** catálogo de permisos del backoffice ([ad447cf](https://github.com/Pittaj/pittaj-contracts/commit/ad447cf5c7b6628890f3182027821cd7707074f7))
* **admin-role:** permisos onboarding.view/manage en el catálogo ([3212c2f](https://github.com/Pittaj/pittaj-contracts/commit/3212c2f559aed42dbf7d028e1c77fcfd67fa29b9))
* **admin-role:** schemas CRUD + responses de detalle ([23f4b90](https://github.com/Pittaj/pittaj-contracts/commit/23f4b90a60041320516483c066040d004e333edf))
* **admin-user:** adminUserIdParamSchema + body de desactivación ([7e035cc](https://github.com/Pittaj/pittaj-contracts/commit/7e035ccae32f2d0da7bb1419dcfcd5d2ac23aa50))
* **admin-user:** refresh token en login + adminRefreshSchema ([85b6dae](https://github.com/Pittaj/pittaj-contracts/commit/85b6daec0a3d212887581808c755b27a4a7ddcc6))
* **admin-user:** schemas/responses de auth del backoffice ([6761c5d](https://github.com/Pittaj/pittaj-contracts/commit/6761c5ddd0e85af6d21468b4fe7e0ff210fe2f42))
* **audit-log:** userId/userEmail nullable (eventos de sistema) ([7187c4a](https://github.com/Pittaj/pittaj-contracts/commit/7187c4a73a8a22b80c32d8fc65991592e662f3d0))
* **cash-closure:** folio (sequence) en el contrato ([5e311cb](https://github.com/Pittaj/pittaj-contracts/commit/5e311cba051ec76423bda7ebcaf0f60b18629f25))
* **cashier:** contratos (sync + lectura) para cajeros ([ac0c6e0](https://github.com/Pittaj/pittaj-contracts/commit/ac0c6e03dece806cf67c02846568933475586d51))
* **coupon:** schemas create/update/toggle + responses de detalle ([9af46d2](https://github.com/Pittaj/pittaj-contracts/commit/9af46d2eff98a3569d6d7a2fd21af59227b45370))
* **credit-note:** contracts (subpath ./credit-note) para NC en la nube ([eed3585](https://github.com/Pittaj/pittaj-contracts/commit/eed358587c83922a1343d396dac61aad304a85ae))
* **customer:** datos fiscales del receptor para el CFDI 4.0 ([72fd656](https://github.com/Pittaj/pittaj-contracts/commit/72fd6562a662724febb6e1249d702ecba80e38f4))
* **document-series:** assign-next-folio schema + response ([88a5b33](https://github.com/Pittaj/pittaj-contracts/commit/88a5b331d70187768ffca6dfbcae9989e7db3ee8))
* **feature-flag:** schemas create/update/toggle/idParam + responses detalle ([da45feb](https://github.com/Pittaj/pittaj-contracts/commit/da45feb3c88205bd2fd366f2735db775ec0e578c))
* **inventory:** contratos de lectura (list responses + schemas) ([58a8615](https://github.com/Pittaj/pittaj-contracts/commit/58a8615fabfa93437d0d43fe6cb9d77b6f351b00))
* **inventory:** productName/productCode en los responses de lectura ([785362d](https://github.com/Pittaj/pittaj-contracts/commit/785362dbb93fbc0d28e96a67cf79e3225a75081c))
* **invoice:** exponer base/prorrateo/descuento/cupón en el DTO ([5f992bc](https://github.com/Pittaj/pittaj-contracts/commit/5f992bc596c2484e7fa0549ecf978a5bab8e9372))
* **layaway:** contracts (subpath ./layaway) para apartados ([3691a95](https://github.com/Pittaj/pittaj-contracts/commit/3691a95fbbc99f99ea4c34eb6110bd44c723c7ba))
* **platform-config:** schema de update (config singleton editable) ([0e88f72](https://github.com/Pittaj/pittaj-contracts/commit/0e88f7256ab82f195a238e73559c97637b8bd79a))
* **pos-ticket:** addLineSchema acepta unitName/unitFactor (multi-UoM) ([04f108b](https://github.com/Pittaj/pittaj-contracts/commit/04f108b373d050962936f7b5108a79a8c82694d2))
* **pos-ticket:** assignCustomerSchema (asignar/cambiar cliente del ticket) ([e8d9ec9](https://github.com/Pittaj/pittaj-contracts/commit/e8d9ec9e7a8d0e506d3d0c7b47be4f44c8ecae91))
* **pos-ticket:** línea con fidelidad fiscal (contratos) ([81142e9](https://github.com/Pittaj/pittaj-contracts/commit/81142e951305275061fe1b0cdc47a4118285783a))
* **price-list:** contratos de lectura (list response + schemas) ([2c7018d](https://github.com/Pittaj/pittaj-contracts/commit/2c7018d79e1fddef9b2398069fcf3620febb93d1))
* **price-list:** resolvePrice schema + response (Caja web) ([1df384c](https://github.com/Pittaj/pittaj-contracts/commit/1df384cefcbb862fcd13bdc85c197248564f0c40))
* **product,category:** campos de paridad con desktop (shortDescription, canBeSold/Purchased, units[]; color, description) ([ffe1cd9](https://github.com/Pittaj/pittaj-contracts/commit/ffe1cd9063539c817f8989f5b7e3a823f9138bdd))
* **product:** update acepta taxInfo/posConfig PARCIALES (para edicion en lote) ([e655276](https://github.com/Pittaj/pittaj-contracts/commit/e655276f971589a9611d666990b25106d6a0def8))
* **promotion:** contratos de lectura (list response + schemas) ([d1dba65](https://github.com/Pittaj/pittaj-contracts/commit/d1dba65a040cba2b052cb641b5dc5182e5047d0e))
* **promotion:** contratos de sync (nuevo subpath ./promotion) ([5788eba](https://github.com/Pittaj/pittaj-contracts/commit/5788eba81eee23243646001053e2435a20d488f0))
* **purchase:** contratos de lectura (list response + schemas) ([0e156ea](https://github.com/Pittaj/pittaj-contracts/commit/0e156eac928af0d51be1c76fccedfce17497a7b4))
* **register:** contratos (sync + lectura) para cajas registradoras ([99954bc](https://github.com/Pittaj/pittaj-contracts/commit/99954bce9c3cced042798cae5fd2747366ca10e4))
* **saas-metrics:** getSaasMetricsSchema (período) ([1f2cfe4](https://github.com/Pittaj/pittaj-contracts/commit/1f2cfe4bb477cfc283d204c4c1ea44982cb60d1f))
* **sales-return:** contracts (subpath ./sales-return) para devoluciones ([bf4f5ab](https://github.com/Pittaj/pittaj-contracts/commit/bf4f5ab91147730e55c92c67e1c24ba952707433))
* **subscription:** alinea contract al modelo de precio por sucursal ([795be19](https://github.com/Pittaj/pittaj-contracts/commit/795be1991a596280c1f3f6a88b0b0a636a275dc4))
* **sync S4:** contratos inventory (3 agregados) para sync ([25ad4ff](https://github.com/Pittaj/pittaj-contracts/commit/25ad4ff6c5930739ea8974c98ea1a3c4bb3229ed))
* **sync S4:** contratos pos-ticket para sync (promociones + push/pull) ([12e4e51](https://github.com/Pittaj/pittaj-contracts/commit/12e4e5198a8a097837fe2c67deee1b18048de914))
* **sync S4:** contratos purchase (compras) para sync ([b91ee13](https://github.com/Pittaj/pittaj-contracts/commit/b91ee13ad511287e2762828fd3b4adf5fdbe89a1))
* **sync S4:** PosSyncPull canónico para pos-session ([fcfbd0a](https://github.com/Pittaj/pittaj-contracts/commit/fcfbd0a7246c04bcdca4982e2c2e8c8317ae1267))

## [1.4.8](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.7...v1.4.8) (2026-04-08)


### Bug Fixes

* added node 24 version ([16ab779](https://github.com/Pittaj/pittaj-contracts/commit/16ab77901160e3eb114831bcc7af23bf77eac5eb))

## [1.4.7](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.6...v1.4.7) (2026-04-08)


### Bug Fixes

* corregir workflow de publicación npm ([89da7ab](https://github.com/Pittaj/pittaj-contracts/commit/89da7ab73ddfd95443318aff83e1663092c2c769))

## [1.4.6](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.5...v1.4.6) (2026-04-08)


### Bug Fixes

* corregir workflow de publicación npm ([a6d53ce](https://github.com/Pittaj/pittaj-contracts/commit/a6d53ce7c23780d29eaa470dacba625c20f7ffa8))

## [1.4.5](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.4...v1.4.5) (2026-04-08)


### Bug Fixes

* eliminar :authtoken ([a5ae7eb](https://github.com/Pittaj/pittaj-contracts/commit/a5ae7eb3df7221a160a13bab6c2ab0905d74b485))

## [1.4.4](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.3...v1.4.4) (2026-04-08)


### Bug Fixes

* corregir workflow de publicación npm ([729737a](https://github.com/Pittaj/pittaj-contracts/commit/729737a5c319a112d7c4d21e0f132744bdf3e819))

## [1.4.3](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.2...v1.4.3) (2026-04-08)


### Bug Fixes

* quitar registry-url ([c5a88b6](https://github.com/Pittaj/pittaj-contracts/commit/c5a88b669e0263b7c4fff3a8841777698b84821a))

## [1.4.2](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.1...v1.4.2) (2026-04-08)


### Bug Fixes

* deleted  NPM_TOKEN unnecesary ([db46d94](https://github.com/Pittaj/pittaj-contracts/commit/db46d9433a093c8e25661a09aad2dbad012ec9e5))

## [1.4.1](https://github.com/Pittaj/pittaj-contracts/compare/v1.4.0...v1.4.1) (2026-04-08)


### Bug Fixes

* CI (release-please.yml) ([fb9c1f2](https://github.com/Pittaj/pittaj-contracts/commit/fb9c1f250ab7100daf4224875f2c5b0cc9b8a478))

## [1.4.0](https://github.com/Pittaj/pittaj-contracts/compare/v1.3.2...v1.4.0) (2026-04-08)


### Features

* **auth:** agregar response types para endpoints de autenticación ([9307624](https://github.com/Pittaj/pittaj-contracts/commit/9307624ef3cac7fa70e5be4a13e7ca51702bcb90))

## [1.3.2](https://github.com/Pittaj/pittaj-contracts/compare/v1.3.1...v1.3.2) (2026-04-02)


### Bug Fixes

* install npm 11+ for trusted publishing OIDC support ([ff35d26](https://github.com/Pittaj/pittaj-contracts/commit/ff35d260e4591dd0d78bb0ce16f4f6c9246818bc))

## [1.3.1](https://github.com/Pittaj/pittaj-contracts/compare/v1.3.0...v1.3.1) (2026-04-02)


### Bug Fixes

* use node 22 for trusted publishing compatibility ([5f8fac8](https://github.com/Pittaj/pittaj-contracts/commit/5f8fac86579ebf86074b9c13901fbd9aa9ba4ac7))

## [1.3.0](https://github.com/Pittaj/pittaj-contracts/compare/v1.2.2...v1.3.0) (2026-04-02)


### Features

* switch to trusted publishing ([25539cd](https://github.com/Pittaj/pittaj-contracts/commit/25539cde14c5f22c78d55a297c182696e3586c47))

## [1.2.2](https://github.com/Pittaj/pittaj-contracts/compare/v1.2.1...v1.2.2) (2026-04-02)


### Bug Fixes

* remove npmrc github packages override ([231d10f](https://github.com/Pittaj/pittaj-contracts/commit/231d10f30116e1cf21f8a02a6ee6fb32aa409a71))

## [1.2.1](https://github.com/Pittaj/pittaj-contracts/compare/v1.2.0...v1.2.1) (2026-04-02)


### Bug Fixes

* combine release and publish workflows ([222807e](https://github.com/Pittaj/pittaj-contracts/commit/222807e27e27c9511c2af8754d7118160bbdf57a))

## [1.2.0](https://github.com/Pittaj/pittaj-contracts/compare/v1.1.1...v1.2.0) (2026-04-02)


### Features

* prepare package for public npm distribution ([639d3c7](https://github.com/Pittaj/pittaj-contracts/commit/639d3c734b908b5b8cdb7be0b3cb8a045f2725ce))
