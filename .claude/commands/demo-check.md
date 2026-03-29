---
name: demo-check
description: Validates SYNCRO is ready for the HackITBA demo. Checks all pages, critical flows, and visual consistency.
---

Revisá el estado de SYNCRO para la demo de hackathon usando subagentes en paralelo.

Subagente 1 — Navegación:
Visitá cada ruta (/dashboard, /cashflow, /invoices, /movements, /insights, /clients) y verificá que cargan sin errores. Listá cualquier ruta rota.

Subagente 2 — Demo crítica:
Verificá que existen y funcionan:
- Warning banner de caja negativa en el Dashboard
- Zero day visible en el gráfico de Cashflow
- Al menos 1 insight severity="critical" en Insights
- Al menos 3 facturas overdue en Invoices
- El scenario simulator en Cashflow cambia el gráfico

Subagente 3 — Interacciones:
Verificá que los elementos clickeables hacen algo:
- Cards del dashboard navegan a otras secciones
- Click en fila de invoices abre el Sheet
- Click en fila de movements abre el Sheet
- CTAs de insights navegan correctamente
- Botones de export no están rotos

Devolvé un reporte con semáforo:
🟢 LISTO — 🟡 FUNCIONA PERO MEJORABLE — 🔴 ROTO/FALTANTE

Prioridad: los 🔴 primero, ordenados por impacto en la demo.
