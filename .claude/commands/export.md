---
description: Back up all farm records.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- export --out=./farm-backup.json
```

Use a new path each time; the command refuses overwriting. Contains private farm and audit data. Store it privately. This is a data export, not an automatic restore tool.
