---
description: Record the monthly livestock reconciliation.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- record-stock --farm="My farm" --enterprise="Milking herd" --month=2030-09 --class=Cows --opening=100 --births=0 --purchases=2 --sales=3 --deaths=1 --closing=98 --by="Operator"
```

Read the current record first. This replaces the selected stock class and month. Closing must be a real counted value, not an invented balancing number. Report every arithmetic difference. This does not file NAIT or NLIS records or calculate tax valuations.
