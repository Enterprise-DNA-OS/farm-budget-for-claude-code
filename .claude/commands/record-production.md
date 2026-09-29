---
description: Record a monthly production result.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- record-production --farm="My farm" --enterprise="Milking herd" --month=2030-09 --unit=kgMS --budget=10000 --actual=9200 --by="Operator"
```

Read current production first. This replaces that month and unit on a repeated key and logs the new values. Require an operator-provided result. Units: kgMS, kg, tonnes, head.
