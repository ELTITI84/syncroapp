# SYNCRO MVP Database

Este documento explica la base de datos MVP de SYNCRO definida en la migration [20260326_001_syncro_mvp.sql](C:\Users\tomas\OneDrive\Documentos\syncroapp\supabase\migrations\20260326_001_syncro_mvp.sql).

La idea de esta versión es simple: cubrir bien el MVP sin sobrecargar la arquitectura. La base está pensada para soportar:

- dashboard general;
- cashflow proyectado;
- movimientos confirmados y detectados;
- facturas por cobrar y por pagar;
- insights accionables;
- acciones recomendadas para hoy;
- multi-tenant con `workspace_id`.

## Principios

- Todo gira alrededor del `workspace`.
- Cada empresa usa su propio espacio aislado.
- Todas las tablas de negocio tienen `workspace_id`.
- RLS protege el acceso a nivel de empresa.
- La estructura prioriza claridad antes que complejidad.

## Tablas

### `profiles`

Guarda el perfil básico del usuario autenticado.

Campos importantes:

- `id`: referencia a `auth.users.id`
- `email`
- `full_name`
- `avatar_url`

Funcionalidad:

- identificar al usuario dentro de la app;
- mostrar nombre/avatar;
- relacionar usuarios con workspaces y ownership.

### `workspaces`

Representa una empresa o espacio de trabajo dentro de SYNCRO.

Campos importantes:

- `id`
- `name`
- `slug`
- `default_currency`
- `timezone`
- `owner_user_id`

Funcionalidad:

- aislar los datos de cada negocio;
- definir moneda y timezone base;
- servir como raíz de todo el modelo.

### `workspace_members`

Relaciona usuarios con empresas.

Campos importantes:

- `workspace_id`
- `user_id`
- `role`
- `status`

Funcionalidad:

- saber quién pertenece a cada empresa;
- controlar permisos con RLS;
- diferenciar `owner`, `admin` y `member`.

### `workspace_settings`

Configuración operativa mínima del workspace para el MVP.

Campos importantes:

- `low_cash_threshold`
- `due_soon_days`
- `forecast_horizon_days`

Funcionalidad:

- definir a partir de qué nivel la caja se considera baja;
- definir cuándo una factura se considera “por vencer”;
- definir el horizonte de proyección del cashflow.

### `categories`

Categorías financieras para movimientos.

Campos importantes:

- `workspace_id`
- `name`
- `color`
- `kind`

Funcionalidad:

- clasificar ingresos y gastos;
- permitir filtros en movements;
- alimentar el `expense breakdown` en insights.

Ejemplos:

- SaaS
- Payroll
- Rent
- Marketing
- Invoice payment

### `counterparties`

Personas o entidades con las que el negocio tiene relación financiera.

Campos importantes:

- `workspace_id`
- `name`
- `counterparty_type`
- `avg_payment_days`
- `notes`

Funcionalidad:

- modelar clientes y proveedores;
- conectar invoices y movements con una contraparte;
- ayudar a medir riesgo de cobro o comportamiento de pago.

Ejemplos:

- un cliente que te debe plata;
- un proveedor al que le tenés que pagar.

### `financial_accounts`

Cuentas donde vive la caja real del negocio.

Campos importantes:

- `workspace_id`
- `name`
- `account_type`
- `currency_code`
- `current_balance`
- `is_primary`

Funcionalidad:

- representar caja, banco o wallet;
- calcular `current cash`;
- servir como base para movimientos confirmados.

### `invoices`

Tabla central de facturas.

Usa `kind` para diferenciar:

- `receivable`: plata que te tienen que pagar;
- `payable`: plata que vos tenés que pagar.

Campos importantes:

- `workspace_id`
- `invoice_number`
- `kind`
- `status`
- `priority`
- `counterparty_id`
- `issue_date`
- `due_date`
- `amount`
- `paid_amount`

Funcionalidad:

- alimentar `incoming cash` y `outgoing cash`;
- ordenar facturas por vencimiento;
- mostrar overdue, due soon y futuras;
- servir como fuente para recomendaciones e insights.

Reglas clave:

- `amount` es el total de la factura;
- `paid_amount` permite soportar pago parcial;
- el trigger actualiza el `status` automáticamente.

### `movements`

Ledger operativo de movimientos de dinero.

Campos importantes:

- `workspace_id`
- `account_id`
- `category_id`
- `counterparty_id`
- `related_invoice_id`
- `movement_type`
- `source`
- `status`
- `occurred_on`
- `amount`
- `description`
- `suggested_category_name`
- `duplicate_of_movement_id`

Funcionalidad:

- guardar movimientos confirmados;
- guardar detectados automáticos por IA;
- marcar posibles duplicados;
- permitir revisión manual;
- conectar pagos/cobros con facturas.

Cómo se usa en el MVP:

- `confirmed`: ya impacta en la operación;
- `pending_review`: detectado por IA y esperando aprobación;
- `duplicate`: posible duplicado;
- `rejected`: descartado por el usuario.

### `forecast_events`

Eventos futuros que afectan la caja proyectada.

Campos importantes:

- `workspace_id`
- `event_type`
- `title`
- `event_date`
- `movement_type`
- `amount`
- `related_invoice_id`
- `scenario_key`
- `is_active`

Funcionalidad:

- construir el cashflow futuro;
- modelar cobros y pagos esperados;
- modelar escenarios del simulator sin una arquitectura pesada.

Tipos:

- `invoice`: evento futuro ligado a una factura;
- `planned`: pago/cobro esperado no ligado a una factura;
- `scenario`: evento hipotético para simulación.

### `insights`

Recomendaciones y alertas inteligentes mostradas en la app.

Campos importantes:

- `workspace_id`
- `severity`
- `title`
- `summary`
- `why_it_matters`
- `recommended_action`
- `benefit`
- `target_path`
- `target_params`
- `money_impact`
- `days_impact`
- `display_order`

Funcionalidad:

- explicar riesgos;
- mostrar beneficios de actuar;
- llevar al usuario a la sección exacta donde está el problema.

Ejemplo:

- “Si cobrás esta factura en 3 días evitás llegar a caja negativa”.

### `action_items`

Lista operativa de “What to do today”.

Campos importantes:

- `workspace_id`
- `insight_id`
- `title`
- `description`
- `severity`
- `status`
- `display_order`
- `target_path`
- `target_params`
- `expected_cash_impact`
- `expected_days_impact`
- `scenario_key`

Funcionalidad:

- convertir insights en tareas accionables;
- ordenar prioridades del día;
- conectar esas acciones con el scenario simulator.

## Relaciones

## Relación base

- Un `profile` puede pertenecer a muchos `workspaces` a través de `workspace_members`.
- Un `workspace` tiene muchos `workspace_members`.
- Un `workspace` tiene un único `workspace_settings`.

## Relación operativa

- Un `workspace` tiene muchas `categories`.
- Un `workspace` tiene muchas `counterparties`.
- Un `workspace` tiene muchas `financial_accounts`.
- Un `workspace` tiene muchas `invoices`.
- Un `workspace` tiene muchos `movements`.
- Un `workspace` tiene muchos `forecast_events`.
- Un `workspace` tiene muchos `insights`.
- Un `workspace` tiene muchos `action_items`.

## Relación financiera

- Una `invoice` pertenece a una `counterparty`.
- Un `movement` puede pertenecer a una `financial_account`.
- Un `movement` puede pertenecer a una `category`.
- Un `movement` puede pertenecer a una `counterparty`.
- Un `movement` puede referenciar una `invoice`.
- Un `forecast_event` puede referenciar una `invoice`.
- Un `action_item` puede referenciar un `insight`.

## Mapa mental simple

```text
workspace
  -> members
  -> settings
  -> categories
  -> counterparties
  -> financial_accounts
  -> invoices
  -> movements
  -> forecast_events
  -> insights
  -> action_items
```

## Cómo se conecta con el producto

### Dashboard

Se alimenta principalmente con:

- `financial_accounts`
- `invoices`
- `forecast_events`
- `insights`
- `action_items`

Métricas:

- `current cash`: suma de balances de cuentas;
- `incoming cash`: facturas `receivable` abiertas;
- `outgoing cash`: facturas `payable` abiertas;
- `risk`: cálculo a partir de cashflow proyectado.

### Cashflow

Se alimenta con:

- balance actual desde `financial_accounts`;
- movimientos históricos desde `movements`;
- eventos futuros desde `forecast_events`;
- facturas abiertas desde `invoices`.

### Movements

Se alimenta con:

- `movements`
- `categories`
- `counterparties`
- `financial_accounts`

### Invoices

Se alimenta con:

- `invoices`
- `counterparties`

### Insights

Se alimenta con:

- `insights`
- `action_items`
- agregaciones de `movements`, `invoices`, `forecast_events`.

## Qué no está incluido todavía

A propósito, en el MVP no metimos:

- invitaciones;
- auditoría avanzada;
- imports crudos separados;
- line items de factura;
- engine complejo de escenarios;
- acciones asignadas a usuarios con workflow complejo.

Todo eso puede entrar después sin romper este modelo.

## Resumen

Esta base MVP busca equilibrio:

- suficientemente chica para avanzar rápido;
- suficientemente sólida para que el producto funcione de verdad;
- suficientemente clara para conectar frontend, backend y lógica financiera sin dolor.
