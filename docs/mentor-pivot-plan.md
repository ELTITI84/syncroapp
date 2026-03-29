# SYNCRO Pivot Plan - 2026-03-28

## Contexto sintetizado de la mentoría

Las mentorías empujan a SYNCRO a salir del lugar de "dashboard financiero genérico" y convertirse en un producto mucho más fácil de vender, usar y expandir.

Las ideas repetidas en la transcripción fueron:

- agregar un estado de resultados real y entenderlo primero a nivel negocio;
- elegir un nicho concreto para que el producto sea productizado y vendible;
- permitir políticas financieras distintas, por ejemplo `profit first` versus "pago costos primero";
- simplificar muchísimo el onboarding con importación desde Excel, libro contable o flujos asistidos por IA;
- pensar uso real desde celular, especialmente para carga y validación de movimientos;
- enriquecer el dashboard con revenue, cash collected, cuentas por cobrar, ventas por producto y pagos por cuenta;
- sumar cierre contable por período, exportación y permisos por rol.

## Suposición estratégica que vamos a usar

Para bajar esto a implementación vamos a asumir que SYNCRO se posiciona primero para **agencias y productoras de marketing de LatAm**.

Motivos:

- la mentoría pone ese ejemplo de forma explícita;
- el modelo actual de clientes, facturas, movimientos y Mercado Pago ya encaja mejor con servicios que con retail o industria;
- el pedido de separar pagos a creadores, vendedores y managers encaja naturalmente con agencias;
- es un nicho donde el dolor de caja, cobro, payout y visibilidad de margen es muy fuerte.

Si más adelante quieren cambiar a otro vertical, el plan sigue sirviendo, pero hoy conviene cerrar uno para no seguir construyendo algo genérico.

## Nuevo producto de valor

SYNCRO no debería venderse como "una app para ver finanzas".

SYNCRO debería convertirse en:

> El sistema operativo financiero para agencias y productoras que necesitan saber
> cuanto facturaron, cuanto cobraron, cuanto pueden retirar, que tienen que pagar,
> y si el mes realmente dejo margen.

La promesa pasa a ser:

1. Ver la caja real y la caja proyectada.
2. Entender el resultado del negocio por período.
3. Elegir una política financiera y simular su impacto.
4. Cobrar, pagar y cerrar el período sin depender de planillas desordenadas.
5. Operar todo con baja fricción desde desktop y celular.

## Lo que hoy conviene arreglar primero

### 1. Falta una capa de rentabilidad

Hoy el producto entiende caja e insights, pero no termina de mostrar si el negocio gana plata o solo sobrevive al timing.

Hay que agregar:

- estado de resultados por período;
- revenue, costos directos, costos comerciales, administrativos y operativos;
- margen bruto, margen operativo y resultado neto;
- sueldos founders y retiros visibles como decisiones, no como ruido mezclado.

### 2. El producto sigue demasiado horizontal

El copy y la estructura actual todavía se leen como finanzas generales.

Hay que verticalizar:

- lenguaje del producto;
- categorías por defecto;
- plantillas de importación;
- ejemplos del dashboard;
- insights y recomendaciones;
- métricas propias del nicho, como cash collected, active clients, revenue by service y payouts pendientes.

### 3. El onboarding todavía no parece "facil de adoptar"

La mentoría marca esto como clave.

Hay que construir:

- plantilla CSV/XLSX oficial;
- flujo asistido para importar histórico;
- import desde screenshot o extracto usando IA como puente;
- import jobs auditables con preview antes de confirmar.

### 4. El celular no es accesorio, es parte del core

Muchos movimientos nacen desde el teléfono.

Hay que priorizar:

- PWA;
- quick capture de comprobantes o screenshots;
- formularios simples para confirmar movimiento y cuenta;
- revisión rápida de cobros y pagos.

### 5. Falta una operación financiera de cierre

No alcanza con ver data. El usuario necesita cerrar el período y congelar números.

Hay que agregar:

- períodos contables;
- cierre y bloqueo;
- exportación;
- historial por período;
- permisos de lectura o edición.

## Mapa de agentes propuesto

## Agente 1: `product-strategist`

Objetivo:
mantener el foco del producto en agencias y productoras, y bajar cada feature a una promesa vendible.

Responsabilidades:

- validar que cada módulo responda al nicho elegido;
- priorizar MVP versus upsell;
- mantener consistencia entre producto, UX y narrativa comercial;
- evitar volver a un ERP genérico.

Entregables:

- definición de vertical;
- criterio para aceptar o rechazar features;
- roadmap de valor;
- lenguaje del producto.

## Agente 2: `pnl-specialist`

Objetivo:
construir el estado de resultados y la lectura de márgenes por período.

Responsabilidades:

- estructura del P&L para agencias;
- revenue por servicio o producto;
- costos directos, comerciales, administrativos y operativos;
- margen bruto, operativo y neto;
- comparativas por período.

Entregables:

- módulo `P&L`;
- cards de rentabilidad en dashboard;
- breakdown por categoría y por período;
- base para decisiones de retiro y política financiera.

## Agente 3: `cashflow-specialist`

Objetivo:
hacer que caja y política financiera convivan en un solo motor de decisión.

Responsabilidades:

- proyectar caja con políticas distintas;
- mostrar impacto de `profit first` versus "costos primero";
- separar payables por cuenta y prioridad;
- unir cobranzas, pagos y retiros en escenarios claros.

Entregables:

- simulador de políticas;
- timeline de eventos financieros enriquecido;
- alertas por riesgo de caja y riesgo de incumplir política.

## Agente 4: `dashboard-specialist`

Objetivo:
transformar el home en un overview operativo de una agencia, no solo un panel financiero genérico.

Responsabilidades:

- mostrar revenue, cash collected, active clients y amount to collect;
- gráficos de revenue vs costs con net result;
- distribución por cuentas;
- ventas por producto o servicio;
- acciones del día y warning real de caja.

Entregables:

- dashboard principal;
- secciones priorizadas por valor operativo;
- navegación clara a cobranzas, pagos, P&L y cierre.

## Agente 5: `invoices-specialist`

Objetivo:
convertir facturas en un centro de cobranzas y cuentas por pagar.

Responsabilidades:

- diferenciar claramente `receivable` y `payable`;
- priorizar cobros por impacto en caja;
- mostrar pagos pendientes por equipo o proveedor;
- marcar cobranzas y pagos con contexto financiero.

Entregables:

- tablero de cobranzas;
- tablero de pagos;
- revenue pendiente versus cash collected;
- conexión directa con cashflow y cierre contable.

## Agente 6: `movements-specialist`

Objetivo:
hacer que movimientos y cuentas sean la verdad operativa del producto.

Responsabilidades:

- separar movimientos por cuenta;
- validar categoría, fuente y contrapartida;
- soportar carga manual rápida;
- preparar el terreno para importes y capturas desde celular.

Entregables:

- ledger claro por cuenta;
- conciliación simple;
- detección de duplicados;
- base limpia para P&L y cashflow.

## Agente 7: `onboarding-import-specialist`

Objetivo:
resolver la adopción inicial con importación casi guiada.

Responsabilidades:

- plantilla CSV/XLSX estándar;
- import job con preview y errores;
- mapping de columnas;
- flujo asistido con IA para transformar archivos desordenados.

Entregables:

- módulo de importación;
- template descargable;
- documentación del prompt asistido;
- estado de importes y confirmación.

## Agente 8: `mobile-pwa-specialist`

Objetivo:
llevar SYNCRO al uso real desde celular.

Responsabilidades:

- instalar como app con PWA;
- quick actions móviles;
- formularios y tablas realmente usables en mobile;
- soporte para subir screenshot o comprobante.

Entregables:

- manifest e instalación;
- pantallas críticas mobile-first;
- captura rápida de movimientos y validaciones.

## Agente 9: `period-close-specialist`

Objetivo:
introducir cierre contable operativo y exportable.

Responsabilidades:

- crear períodos contables;
- cerrar y bloquear períodos;
- snapshot de resultados y caja;
- exportaciones y trazabilidad.

Entregables:

- módulo de cierre;
- estado por período;
- export de resumen;
- protección contra edición después del cierre.

## Agente 10: `data-layer`

Objetivo:
sostener el cambio de producto en el modelo de datos y la lógica.

Responsabilidades:

- nuevas entidades de políticas, períodos, snapshots e import jobs;
- categorías y seeds del nicho;
- cálculo de P&L y cashflow coherentes;
- sincronización de tipos y store.

## Agente 11: `supabase-architect`

Objetivo:
traducir el pivot a una base durable y multi-tenant.

Responsabilidades:

- tablas y RLS para políticas, cierres, importes y permisos;
- indexes para listados operativos;
- tipos regenerados;
- auditoría mínima para imports y cierres.

## Agente 12: `code-reviewer`

Objetivo:
garantizar que el desarrollo no rompa ni la demo ni la promesa del producto.

Responsabilidades:

- revisar que las features sí respondan al nicho;
- detectar flows muertos en import, mobile, permisos y cierre;
- validar que dashboards y cálculos no se contradigan;
- marcar regresiones antes de cada entrega.

## Orden recomendado de implementación

## Fase 0 - Alinear producto

1. Fijar nicho: agencias y productoras.
2. Reescribir narrativa del producto y los agentes.
3. Definir qué métricas importan para ese negocio.

## Fase 1 - Modelo y motor financiero

1. Extender modelo de datos para políticas, períodos y cuentas.
2. Construir estado de resultados.
3. Conectar P&L con caja y cobranzas.

## Fase 2 - Superficie principal del producto

1. Rediseñar dashboard.
2. Actualizar cashflow con políticas.
3. Convertir invoices en cobranzas y pagos.

## Fase 3 - Adopción

1. Construir import templates.
2. Crear import jobs con preview.
3. Preparar import asistido por IA.

## Fase 4 - Uso real

1. Implementar PWA.
2. Mobile-first en movimientos, cobros y pagos.
3. Captura rápida desde celular.

## Fase 5 - Operación profesional

1. Agregar cierre contable por período.
2. Bloqueo y exportación.
3. Permisos de lectura y edición.

## Dependencias criticas

- No diseñar el P&L sin fijar el nicho.
- No lanzar imports sin antes definir el modelo de cuentas, categorías y períodos.
- No hacer cierre contable sin snapshots consistentes de caja y resultado.
- No optimizar mobile al final de todo: hay que diseñar varios flows pensando en teléfono desde el inicio.

## Riesgos a evitar

- volver a features genéricas que sirven "para cualquier negocio";
- mezclar caja con rentabilidad sin diferenciarlas;
- construir imports mágicos sin preview ni trazabilidad;
- sumar permisos sin modelo claro de roles;
- mantener el dashboard actual y solo agregarle widgets.

## Posibles upsells reales una vez cerrado el core

- servicio asistido de implementación y migración;
- cobranzas automatizadas;
- reporting para contador o estudio;
- forecast avanzado de payroll y payouts;
- benchmarking por tipo de agencia.

## Siguiente recorte tactico sugerido

Si queremos máxima velocidad sin dispersarnos, el siguiente sprint debería atacar solo esto:

1. definir vertical y lenguaje del producto;
2. crear `P&L` y política financiera;
3. rediseñar dashboard con revenue, collected, por cobrar y resultado neto;
4. preparar import template y PWA como siguiente ola.
