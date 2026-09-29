---
description: Add a cash receipt or payment category.
---

Read CLAUDE.md. Use operator-provided values in place of the examples.

```bash
npm run farm -- add-account "Milk receipts" --farm="My farm" --direction=in
```

Direction in means receipts. Direction out means payments. Negative inputs represent reversals. Keep loan receipts, principal payments and tax payments as explicit cash categories when needed; these are not profit accounts.
