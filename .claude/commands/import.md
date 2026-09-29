---
description: Bring a prepared Figured cash report into the farm.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- import figured ./monthly-cash.csv --farm="My farm" --enterprise="Milking herd" --scenario=actual --by="Operator" --dry-run
```

Read docs/replace-figured.md. Confirm the report is cash, currency matches, month headings and account mapping are correct, and signs agree. Run preview first and compare counts and totals with the source. Remove --dry-run for the instructed import. Changed cells require --replace. All rows commit or roll back together. Preserve original reports.
