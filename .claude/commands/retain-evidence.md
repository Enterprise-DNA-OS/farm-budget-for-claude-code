---
description: Record evidence and its retention period.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- retain-evidence "September receipts" --farm="My farm" --date=2030-09-30 --reference=2031-03-31 --until=2038-03-31 --source="archive/september" --by="Operator"
```

Read docs/compliance.md and existing evidence first. Have the accountant set the reference date and any longer retention period. --hold records a legal hold; omitting it on an update clears that hold, so require explicit confirmation before clearing. This stores a reference, not a copy of the documents.
