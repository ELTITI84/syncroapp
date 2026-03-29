# Guía de lenguaje de Syncro

## Qué es Syncro

Syncro ayuda a dueños de micro-pymes a responder tres preguntas sin hablar como un sistema contable:

- Cuánto tengo hoy.
- Cuánto tengo que cobrar y pagar.
- Cuánto me dejó realmente el período.

## Qué no promete

- No reemplaza al contador.
- No automatiza todo.
- No decide por el usuario.
- No habla como ERP, software contable o herramienta enterprise.

## Tono de marca

- Claro, directo y tranquilo.
- Cercano a un dueño de negocio, no a un analista financiero.
- Enfocado en entender la operación y decidir mejor.
- Simple antes que técnico.

## Cómo explicar cada pantalla en 1 frase

- `Inicio`: Te muestra cuánto tenés hoy, qué entra, qué sale y dónde hace falta actuar.
- `Facturas`: Te muestra qué tenés por cobrar, qué ya venció y qué conviene seguir primero.
- `Movimientos`: Ordena ingresos y gastos para que entiendas qué pasó de verdad.
- `Flujo de caja`: Te deja ver si la plata alcanza y en qué momento se puede complicar.
- `Señales`: Resume lo importante para decidir qué mirar primero.

## Palabras que sí usar

- plata
- caja
- saldo
- cobros
- pagos
- ingresos
- gastos
- lo que entra
- lo que sale
- qué mirar primero
- qué cambió
- qué hacer ahora
- cuánto te deja el período

## Palabras que evitar

- ERP
- health score
- score financiero
- AI insights
- automatización total
- optimización financiera
- forecasting engine
- orchestration
- enterprise
- revenue ops
- runway
- workflow intelligence

## Reglas para UI

- Cada título o descripción debe poder entenderse en una lectura rápida.
- Si un término necesita explicación contable, reemplazarlo.
- Priorizar frases con verbo y resultado concreto.
- Hablar de caja, plata, cobrar y pagar antes que de liquidez, runway o forecast.
- Mostrar consecuencias en lenguaje simple: te suma días de caja, ya entró, sigue pendiente.

## Reglas para backend y producto

- Nombres internos pueden ser técnicos, pero textos expuestos al usuario no.
- Mensajes de API, seeds, notificaciones y jobs deben usar el mismo vocabulario simple de UI.
- Si el backend genera textos automáticos, deben seguir esta estructura:
- Qué pasó.
- Por qué importa.
- Qué conviene hacer.
- Evitar etiquetas en inglés en estados o acciones visibles al usuario.

## Fórmulas recomendadas

- Estado: `Hoy tenés X y en los próximos días entran Y / salen Z.`
- Riesgo: `Si no cambia nada, la caja alcanza X días.`
- Acción: `Empezá por X porque destraba Y.`
- Resultado: `En este período te quedaron X después de cobrar y pagar.`
