---
description: Test lower forecast income and higher forecast costs.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- stress-test --farm="Kowhai Dairy" --income-pct=-10 --cost-pct=20 --json
```

Read /cashflow first. This is a temporary sensitivity of signed cash receipts and payments, not a saved budget or prediction. Actual months stay unchanged. Negative headroom uses the entered limit only. Explain assumptions and missing coverage.
