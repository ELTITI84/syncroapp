---
name: upgrade-mockdata
description: Upgrades all mock data to create a compelling demo narrative for HackITBA judges
---

Mejorá los datos mock de SYNCRO en src/lib/data.ts para que la demo cuente una historia convincente.

La narrativa: TechPyme SRL es una empresa de software argentina con 8 empleados.
- Clientes: Mercado Libre, Naranja X, Despegar, Wenance
- Proveedores: AWS, Notion, Slack, un estudio contable, sueldos
- Problema: cobró tarde 2 facturas grandes y tiene el supplier catch-up en 8 días
- Zero day proyectado: entre 7 y 10 días si no se actúa

Asegurate de que:
1. baseCashBalance + transacciones confirmadas = caja actual positiva pero ajustada
2. scheduledCashEvents creen la situación: payroll + supplier antes que las cobranzas
3. Al menos 3 facturas overdue con empresas argentinas reconocibles
4. Los insights en data.ts reflegen el drama real: moneyImpact y daysImpact realistas
5. El health score salga entre 35-45 (zona roja) para que la demo sea dramática
6. Nombres de empresas en español o reconocibles: "Mercado Libre", "Naranja X", etc.

Validá después: corrí npm run build para asegurarte de que no hay errores de tipos.
