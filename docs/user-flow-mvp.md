# SYNCRO MVP User Flow

Este documento explica el flujo general del usuario dentro del MVP de SYNCRO.

La lógica principal del producto es:

1. entender cuánto dinero tengo hoy;
2. entender cuánto entra y cuánto sale;
3. detectar cuándo me quedo sin caja;
4. mostrar qué acción concreta tomar para evitarlo.

## Idea central del flujo

SYNCRO no es solo una app para mirar métricas.

El flujo del usuario está pensado para responder siempre:

- qué está pasando;
- por qué está pasando;
- qué debería hacer ahora.

## Flujo general del producto

## 1. Ingreso a la app

El usuario entra a SYNCRO y accede a su `workspace`.

En ese momento la app ya sabe:

- a qué empresa pertenece;
- qué cuentas financieras tiene;
- qué facturas están abiertas;
- qué movimientos fueron confirmados;
- qué eventos futuros afectan la caja.

## 2. Dashboard

El dashboard es el punto de entrada principal.

El usuario debería ver primero:

- `warning critical` si la caja proyectada se vuelve negativa;
- `current cash`;
- `incoming cash`;
- `outgoing cash`;
- `risk` en días hasta caja negativa;
- gráfico de cashflow;
- `AI insights`;
- `what to do today`.

### Qué hace el usuario acá

- entiende la situación general del negocio;
- detecta si hay peligro real de quedarse sin caja;
- ve cuáles son las principales causas;
- recibe acciones priorizadas.

### Qué puede clickear

- alerta crítica -> lleva a `Cashflow`;
- insight -> lleva a la sección donde está el problema;
- acción recomendada -> lleva a `Invoices`, `Movements` o `Cashflow`.

## 3. Cashflow

Después del dashboard, el usuario baja al módulo de cashflow para entender el problema en profundidad.

Ve:

- `current balance`;
- `base proyectada`;
- `zero day`;
- `average daily burn`;
- gráfico de proyección;
- simulator de escenarios.

### Qué hace el usuario acá

- mira cómo evoluciona la caja en el tiempo;
- identifica qué evento provoca la caída;
- prueba escenarios para ver si una acción mejora la situación.

### Ejemplo de uso

Caso:

- hoy tengo caja positiva;
- en 8 días caigo a negativo;
- si cobro una factura antes o si muevo un pago, el gráfico mejora.

Entonces el usuario entiende no solo que hay riesgo, sino cómo evitarlo.

### Cómo se conecta con otras secciones

- si el problema es una factura no cobrada -> va a `Invoices`;
- si el problema es un gasto o pago detectado -> va a `Movements`;
- si el problema es una recomendación -> vuelve a `Insights` o `What to do today`.

## 4. Movements

Este módulo sirve para revisar el dinero que ya salió o entró, y también lo detectado automáticamente.

Se divide conceptualmente en tres bloques:

- movimientos confirmados;
- movimientos detectados por IA;
- posibles duplicados.

### Qué hace el usuario acá

- filtra por categoría o fecha;
- confirma o rechaza movimientos detectados;
- revisa duplicados;
- clasifica gastos;
- mejora la calidad de los datos.

### Por qué esto importa

Si movements está mal:

- el dashboard se vuelve engañoso;
- el breakdown de gastos pierde sentido;
- el cashflow proyectado se deforma;
- los insights pueden recomendar mal.

### Resultado esperado

Cuando el usuario termina acá:

- la foto real de caja mejora;
- los gastos quedan más claros;
- los movimientos dudosos dejan de contaminar el análisis.

## 5. Invoices

Este módulo muestra facturas por cobrar y por pagar.

El usuario ve:

- listado general de facturas;
- cuánto está vencido;
- cuánto vence en 7 días;
- cuánto vence más adelante;
- orden por fecha de vencimiento y emisión.

### Qué hace el usuario acá

- revisa prioridades de cobro;
- entiende qué pagos tiene que afrontar;
- detecta si el problema es de timing y no de rentabilidad;
- marca facturas como pagadas si corresponde.

### Casos típicos

Caso 1:

- una factura por cobrar está vencida;
- si entra en 3 días, evita caja negativa.

Caso 2:

- una factura por pagar vence antes de que entren cobros;
- eso empuja el `zero day`.

### Conexión con el resto

- desde `Insights`, el usuario llega filtrado a la factura relevante;
- desde `What to do today`, puede abrir directamente la factura prioritaria;
- desde `Cashflow`, puede identificar qué invoice está generando el pico de riesgo.

## 6. Insights

Este módulo interpreta los datos y le da sentido al usuario.

Ve:

- `financial health score`;
- `expense breakdown`;
- recomendaciones categorizadas por `critical`, `high`, `medium`, `low`.

Cada insight debe responder:

- qué pasa;
- por qué importa;
- qué acción tomar;
- qué beneficio tendría.

### Qué hace el usuario acá

- entiende el diagnóstico;
- prioriza dónde actuar;
- entra al lugar exacto donde resolver el problema.

### Ejemplo

Insight:

- “Si cobrás la factura de Cliente A antes de 3 días, cubrís el pago de Proveedor X”.

Acción:

- click;
- abre `Invoices` filtrado;
- el usuario actúa.

## 7. What to do today

Este bloque vive conceptualmente en dashboard, pero cruza todo el producto.

Es una lista ordenada por prioridad.

Ejemplos:

- llamar a un cliente;
- revisar una factura vencida;
- rechazar un gasto duplicado;
- confirmar un movimiento detectado;
- mover un pago futuro en el simulator.

### Qué hace el usuario acá

- deja de navegar a ciegas;
- sabe cuál es la próxima mejor acción;
- puede actuar rápido sin entender toda la base financiera primero.

## Flujo resumido del usuario

```text
Login
  -> Dashboard
    -> veo warning, caja, riesgo, insights y acciones
    -> si necesito entender el riesgo, voy a Cashflow
    -> si necesito cobrar o pagar, voy a Invoices
    -> si necesito revisar datos reales, voy a Movements
    -> si necesito diagnóstico, voy a Insights
```

## Flujo por problema

## Problema: “me voy a quedar sin caja”

1. El usuario entra al dashboard.
2. Ve warning crítico.
3. Entra a cashflow.
4. Detecta el `zero day`.
5. Ve qué evento lo causa.
6. Prueba el simulator.
7. Toma acción en invoices o movements.

## Problema: “no sé qué factura priorizar”

1. Entra a dashboard.
2. Ve un insight o acción recomendada.
3. Hace click.
4. Va a invoices filtrado.
5. Ve qué factura está vencida o por vencer.
6. Actúa.

## Problema: “no entiendo por qué gasto tanto”

1. Entra a insights.
2. Mira `expense breakdown`.
3. Ve categorías dominantes.
4. Hace click en recomendación.
5. Va a movements filtrado por categoría.
6. Decide si hay algo para recortar.

## Cómo se conectan los módulos

## Dashboard -> Cashflow

Para entender por qué aparece el riesgo y cuándo ocurre.

## Dashboard -> Invoices

Para cobrar o pagar lo que está moviendo la caja.

## Dashboard -> Movements

Para validar que la foto actual de dinero sea correcta.

## Insights -> Invoices

Cuando el problema está en cobros o vencimientos.

## Insights -> Movements

Cuando el problema está en gastos o duplicados.

## What to do today -> Cashflow

Cuando una acción tiene impacto directo en el escenario proyectado.

## Objetivo del MVP

El MVP no busca automatizar toda la empresa.

Busca que un usuario pueda:

- entender el riesgo financiero rápido;
- ver qué lo está causando;
- decidir qué acción tomar hoy;
- comprobar cómo esa acción mejora la caja.

## Resumen

El flujo ideal de SYNCRO MVP es:

- primero mostrar claridad;
- después mostrar explicación;
- finalmente empujar acción.

Si el usuario abre la app y en pocos minutos entiende el riesgo y sabe qué hacer, el MVP está funcionando bien.
