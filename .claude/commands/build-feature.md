---
name: build-feature
description: Builds a complete SYNCRO feature end-to-end using the right specialist agent
---

Feature a implementar: $ARGUMENTS

Seguí estos pasos:
1. Leé los archivos relevantes para entender el estado actual
2. Usá el subagente especialista correspondiente según la feature:
   - Dashboard → dashboard-specialist
   - Cashflow → cashflow-specialist
   - Invoices → invoices-specialist
   - Movements → movements-specialist
   - Insights → insights-specialist
   - Tipos/datos → data-layer
3. Si la feature requiere cambios en los datos primero, delegá a data-layer antes de la UI
4. Al terminar, corrá el subagente code-reviewer sobre los archivos modificados
5. Reportá: qué se implementó, qué falta, issues encontrados por el reviewer

Contexto del proyecto: Next.js 16, shadcn/ui, Zustand store en src/lib/store.ts, mock data en src/lib/data.ts, dark mode forzado.
