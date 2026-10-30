# Changelog

## [2.42.0](https://github.com/Pittaj/pittaj-contracts/compare/v2.41.0...v2.42.0) (2026-10-30)


### Features

* **accounting:** «Mis obligaciones» — contrato y catálogo (frente C · C1) ([005c607](https://github.com/Pittaj/pittaj-contracts/commit/005c607fc1e584c85fe7cd9df3bb78c65d5bc78e))
* **accounting:** libro del RESICO PF — contrato y catálogo (frente C · C2); 2.55.0 ([8b4dd0f](https://github.com/Pittaj/pittaj-contracts/commit/8b4dd0f010c7d4f3d16ad725575f3ffac7c18283))
* **accounting:** ObligationsResponse y la ruta «Mis obligaciones» en el catálogo (frente C · C1); 2.51.0 ([165b6e2](https://github.com/Pittaj/pittaj-contracts/commit/165b6e26d60d647bbf3dd53e27c0dc118ba9f798))
* **accounting:** pagos provisionales de ISR — contrato y catálogo (frente C · C3); 2.57.0 ([5d3bf81](https://github.com/Pittaj/pittaj-contracts/commit/5d3bf8162088e216b3a1916eb6e33eece06a0364))
* **accounting:** ProvisionalPaymentResponse y módulo pago-provisional (frente C · C3); 2.57.0 ([b078538](https://github.com/Pittaj/pittaj-contracts/commit/b0785385eb8a8f2c5215b13e3faa52fdf3030fca))
* **accounting:** ResicoBookResponse y módulo libro-resico (frente C · C2); 2.55.0 ([10aa6db](https://github.com/Pittaj/pittaj-contracts/commit/10aa6dbb1d7eb4422682ecee01ab6ffda19196d0))
* **admin-user:** changeOwnAdminPasswordSchema ([e7ae4e9](https://github.com/Pittaj/pittaj-contracts/commit/e7ae4e9045bb900317fb72e907bae459ce73fbc0))
* **auth:** pase de un solo uso para abrir firma.pittaj.com con la sesión de la app (2.38.0) ([cd824a3](https://github.com/Pittaj/pittaj-contracts/commit/cd824a34094bcef035dce2332c55a7d283626d24))
* **auth:** pase de un solo uso para abrir otro origen con la sesión de la app (2.38.0) ([de96b75](https://github.com/Pittaj/pittaj-contracts/commit/de96b75577fed0bc58dde157ee92a71a2210ee90))
* **banking,platform-books:** F3.4 liquidación de pasarela (2.45.0) ([ef21e05](https://github.com/Pittaj/pittaj-contracts/commit/ef21e05ca66f9c12dbf6194c6852f98e43ee1402))
* **banking,platform-books:** F3.4 liquidación de pasarela (2.46.0) ([5b009a8](https://github.com/Pittaj/pittaj-contracts/commit/5b009a830d86e277a6f7b5b117e428cb008f290a))
* **banking:** B2 cobros de clientes desde el banco — CUST_PAYMENT y sus esquemas; 2.54.0 ([fd49ea3](https://github.com/Pittaj/pittaj-contracts/commit/fd49ea317138f3a7baea07e4c226b27c9cbcbd41))
* **banking:** B2 cobros de clientes desde el banco; 2.54.0 ([98095ab](https://github.com/Pittaj/pittaj-contracts/commit/98095ab56b4eceb1a7f927b8b5ac193d9a6a0837))
* contraseña del operador y F8.4 vínculo del operador con su usuario del negocio ([aa4c7c5](https://github.com/Pittaj/pittaj-contracts/commit/aa4c7c5f2753fb1bae794867cd50a7c3ce49da70))
* D1 CFDI emitidos por otro sistema a ventas sin caja ([e8f3ee0](https://github.com/Pittaj/pittaj-contracts/commit/e8f3ee0a24df630f7fe5b9de4d2970c2586306a3))
* **direct-sale,sales-cfdi,usage-limit:** D1 CFDI emitidos por otro sistema a ventas sin caja ([22a71ac](https://github.com/Pittaj/pittaj-contracts/commit/22a71acf3c77c161706d97ad6163ce37903ffec7))
* **direct-sale:** D1c · IEPS por renglón y retenciones en la venta sin caja (2.56.0) ([1046620](https://github.com/Pittaj/pittaj-contracts/commit/104662013fe0e31e5afaf1f5b9965feb05247afa))
* **direct-sale:** D1c · IEPS y retenciones en la venta sin caja (2.56.0) ([b9ea07a](https://github.com/Pittaj/pittaj-contracts/commit/b9ea07a25c2f467dfb1096a6eed2e0504a9f8b22))
* **direct-sale:** D3a · retenciones como decisión y su cálculo por renglón (2.58.0) ([c9e9764](https://github.com/Pittaj/pittaj-contracts/commit/c9e9764cf86abe8991bbba0f7186981d97ead37d))
* **direct-sale:** D3a · retenciones como decisión y su cálculo por renglón (2.58.0) ([3ca4efe](https://github.com/Pittaj/pittaj-contracts/commit/3ca4efef1c79b50cc5a9772a8c19583f512811a6))
* F8.3 pase de los libros, F9.1 emisor y F9.2 destinos con vigencia (2.47.0) ([aad688c](https://github.com/Pittaj/pittaj-contracts/commit/aad688c18bd14c93572911301d2f1d73cf4189e6))
* F8.5 cuenta interna de Pittaj y vínculo desde la sesión de la app ([11976fb](https://github.com/Pittaj/pittaj-contracts/commit/11976fb780760e2ccf6fc08d40c3c5ec9e7c3b9d))
* **inventory:** armarTablero y exactitudDeConteos para el Inicio de Inventario (I2b); 2.59.0 ([2272842](https://github.com/Pittaj/pittaj-contracts/commit/227284281978997567ac44062ed60dc6f6439f5e))
* **inventory:** InventoryAlertAckResponse y respuestas del sync del acuse (I2) ([1efa7b4](https://github.com/Pittaj/pittaj-contracts/commit/1efa7b4fb903358c472c98042f5a7d607d5dbb9a))
* **inventory:** la configuración de Inventario viaja como claves inventory.* del canal de settings (I3) ([d74b3e3](https://github.com/Pittaj/pittaj-contracts/commit/d74b3e36b66ab03d6cfbc9c58ee6a445d4352752))
* **inventory:** la regla de las alertas de Inventario y del acuse «Revisado» (I2); 2.50.0 ([fa88852](https://github.com/Pittaj/pittaj-contracts/commit/fa888523dad7e26fcc9eb2b4f5ddc01ba193ebb7))
* **inventory:** revisarSalidas y RevisionDeExistenciaResponse para la caja (I3b); 2.49.0 ([7cac790](https://github.com/Pittaj/pittaj-contracts/commit/7cac790109e0eaa503c946c2ea30c0ebead05cbe))
* **invoice:** F9.1 el emisor de la plataforma con vigencia (2.47.0) ([40d432d](https://github.com/Pittaj/pittaj-contracts/commit/40d432d59d013295c4a1b7cc2303e72a78778259))
* **platform-books,subscription:** F8.5 cuenta interna de Pittaj y vínculo desde la sesión de la app ([1d19816](https://github.com/Pittaj/pittaj-contracts/commit/1d198163e5096eb6b441464536237635637ee0e8))
* **platform-books:** F3.3 contrato del puente de la cobranza a los libros (2.44.0) ([7d868d6](https://github.com/Pittaj/pittaj-contracts/commit/7d868d6fe929ec99968494e57267b1097e93cb73))
* **platform-books:** F3.3 contrato del puente de la cobranza a los libros (2.44.0) ([03ba597](https://github.com/Pittaj/pittaj-contracts/commit/03ba59797370b00d9407a64506e1d294f431c437))
* **platform-books:** F8.3 el pase de los libros ([b682691](https://github.com/Pittaj/pittaj-contracts/commit/b682691683327e0936a457f15667ac436c3af3c9))
* **platform-books:** F8.4 vínculo del operador con su usuario del negocio ([36ed7d0](https://github.com/Pittaj/pittaj-contracts/commit/36ed7d0e133ea1fed51cc3fbe824b166c2b429f5))
* **platform-books:** F9.2 destinos del puente con vigencia ([d7ef37f](https://github.com/Pittaj/pittaj-contracts/commit/d7ef37fdaa85a79e04f50b05e30dad90ce5fe907))
* **platform-books:** opciones del destino para el backoffice ([36a18e8](https://github.com/Pittaj/pittaj-contracts/commit/36a18e812ccc574909aec2e839ef189df0c74099))
* **sat-download:** el equipo manda su deviceId en la petición, como en el sync ([07dbf19](https://github.com/Pittaj/pittaj-contracts/commit/07dbf199d5db2aa8e785aef19314deb6227927d3))
* **sat-download:** la API interna ya no le cree al que llama (2.42.0) ([aa40c77](https://github.com/Pittaj/pittaj-contracts/commit/aa40c77c8a070e7f13cc60a59e3cb570c2be98cc))
* **sat-download:** la API interna ya no le cree al que llama (2.42.0) ([eda83b1](https://github.com/Pittaj/pittaj-contracts/commit/eda83b17971cd3698253cee1e83419799d3f04f2))
* **sat-download:** la atestación del HSM del trabajo de importación (2.43.0) ([52c32e3](https://github.com/Pittaj/pittaj-contracts/commit/52c32e38745829f9e0bb2a9f0e1931749458d4ae))
* **sat-download:** la atestación del HSM del trabajo de importación (2.43.0) ([77b945e](https://github.com/Pittaj/pittaj-contracts/commit/77b945e2ed0591adf75a1c48721076ecf4fd56b7))
* **sat-download:** la e.firma en una computadora del cliente (2.39.0) ([82e2633](https://github.com/Pittaj/pittaj-contracts/commit/82e26335e5059e7cae432aada4155d637db79208))
* **sat-download:** la e.firma en una computadora del cliente (2.39.0) ([37d939c](https://github.com/Pittaj/pittaj-contracts/commit/37d939c5b2f5bc7bbabc610f3bf0d044f289bdef))
* **sat-download:** la metadata y el folio también para el equipo del cliente ([cc5ab97](https://github.com/Pittaj/pittaj-contracts/commit/cc5ab9766a2ac8819c5f454c17db552602f540c4))
* **sat-download:** la última conciliación en el resumen de la e.firma ([15fc7e8](https://github.com/Pittaj/pittaj-contracts/commit/15fc7e81ce4ba673d4acc277a7567f70873fd619))
* **sat-download:** metadata del SAT y rescate por folio (2.41.0) ([1ef1305](https://github.com/Pittaj/pittaj-contracts/commit/1ef13058b10b299ff6552004f53ba7640d45fe99))
* **sat-download:** reautenticación del pase y conciliación con la auditoría del KMS (2.40.0) ([157478b](https://github.com/Pittaj/pittaj-contracts/commit/157478b8125c1f4e4e0138c2539da33b4df16cc8))
* **sat-download:** reautenticación, conciliación con el KMS, metadata y rescate por folio (2.41.0) ([ded4de9](https://github.com/Pittaj/pittaj-contracts/commit/ded4de961bbfb9d86bd0f563bd99696234e26138))
* **sat-download:** SatEfirmaScopeResponse, las e.firmas del alcance (H16, 2.45.0) ([d1ecae5](https://github.com/Pittaj/pittaj-contracts/commit/d1ecae53985a02dbcfc42c43487766ccb4a2bfd4))
* **sat-download:** SatEfirmaScopeResponse, las e.firmas del alcance (H16, 2.45.0) ([dcd4f2c](https://github.com/Pittaj/pittaj-contracts/commit/dcd4f2c595bf86f06d2b01f76fa39dc2872ae15e))
* **sat-download:** sello del trabajo de importación (2.37.0) ([e6176de](https://github.com/Pittaj/pittaj-contracts/commit/e6176dec20b91357baae888bc5931af78e58bffd))
* **sat-download:** sello del trabajo de importación (2.37.0) ([2431e19](https://github.com/Pittaj/pittaj-contracts/commit/2431e19fdb3b1a1ea201f1e269d7755e84d63fb6))
* **suite:** Fiscal › Facturas de otro sistema en el catálogo (D1) ([36bb473](https://github.com/Pittaj/pittaj-contracts/commit/36bb473f872f3c6bec63905c07af2bc071a762a3))
* **suite:** Inventario → Alertas en el catálogo de la suite (I2) ([fd9f78e](https://github.com/Pittaj/pittaj-contracts/commit/fd9f78eb5fdf43cbd114c7f81194699193596bd0))
* **suite:** MODULOS_APAGADOS_EN_BANCOS_SENCILLO (B1); 2.53.0 ([b058a43](https://github.com/Pittaj/pittaj-contracts/commit/b058a4323ef914959f21dbf77788e5744f6c32e6))
* **suite:** MODULOS_APAGADOS_EN_BANCOS_SENCILLO (B1); 2.53.0 ([8d48ab4](https://github.com/Pittaj/pittaj-contracts/commit/8d48ab4d04ca30676b79d5616b487ed80fbf069f))
* **sync:** contrato de estados de cuenta de Bancos (A4.1) — 2.57.0 ([157b933](https://github.com/Pittaj/pittaj-contracts/commit/157b9330840da86c73a6bad650cafc146a425b80))
* **sync:** payload del estado de cuenta con sus líneas y reconciliationId del movimiento (A4.1); 2.57.0 ([483c840](https://github.com/Pittaj/pittaj-contracts/commit/483c84080ba2a7426adcb6cd0461abd7a61d92f0))
* **sync:** payloads del sync de Bancos para el escritorio (A1) ([2063a8b](https://github.com/Pittaj/pittaj-contracts/commit/2063a8b3737f1b9a0eba767142ebe1bb0bc87671))
* **sync:** payloads del sync de Bancos para el escritorio (A1) — 2.51.0 ([7c4283f](https://github.com/Pittaj/pittaj-contracts/commit/7c4283fad48353719782f7da6b742fe32146ae98))


### Bug Fixes

* **suite:** Fiscal › e.firma en el catálogo de la suite (2.36.1) ([91374d4](https://github.com/Pittaj/pittaj-contracts/commit/91374d44790db8bfde331f378a2b2f80aaaecd11))
* **suite:** Fiscal › e.firma en el catálogo de la suite (2.36.1) ([f63e5df](https://github.com/Pittaj/pittaj-contracts/commit/f63e5dfb46b3956bb82b62b92c28010d15d0ef82))
* **sync:** userId del movimiento es opcional; la nube pone el de la sesión ([c1237e6](https://github.com/Pittaj/pittaj-contracts/commit/c1237e6bef991b7e076601ec78342e14bf06a327))

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
