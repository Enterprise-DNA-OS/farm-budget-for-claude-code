---
description: Record a monthly budget, forecast or actual amount.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- entry --farm="My farm" --enterprise="Milking herd" --account="Milk receipts" --month=2030-09 --scenario=forecast --amount=10000 --source="Approved September plan" --by="Operator"
```

Read the existing amounts first. Use scenario budget, forecast or actual. Amount is positive in its account direction, negative for reversals. Use --replace only for an instructed correction. Log the source. Never infer actuals from forecasts.
