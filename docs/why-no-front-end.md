# Why no front end

A farm's seasonal review is a set of questions about cash, production, stock and deadlines. The database stores the answers. Claude Code, Codex, OpenCode or Cursor runs the same recipes against those records.

`npm run view` writes read-only HTML. `npm run docs` writes bank review packs and stock reconciliation working papers. Neither hosts a server. Open the files in a browser and print to PDF. They contain private farm records; keep them in your own storage.

A screen gives field staff mobile entry, offline synchronisation, graphical planning and controlled logins. This free base does not. Enterprise DNA can scope those interfaces and connections into your version. A shared database requires deployment-specific access control, backup and recovery; the CLI assumes trusted operators. PGlite is a single-process local store. Do not point two processes at the same local data folder.

This is a cash planning model, not a three-way accounting engine. It does not calculate GST, profit, balance sheets, livestock valuations, depreciation, borrowing eligibility or filed returns. Cash figures retain the report's treatment of tax. The bank review compares balances with the operator's entered cash limit. Keep the ledger and accountant in charge of statutory work.

The twelve-month planning window starts at the farm's start_month. Changing to the next year needs a checked opening balance and a migration or a new farm planning record; /customise can add multi-year seasons. Actuals replace forecast months only through the explicit actual_through cutoff. Sensitivity changes forecast receipts and payments and leaves actuals alone. Blank months show incomplete. Complete account coverage still needs reconciliation to the source.

Your code has an MIT licence. Database hosting, backups and the coding agent may have charges. Omni by Enterprise DNA brings your records across, builds your rules and runs the result for a setup fee, then a retainer.

Coverage check: each month needs an explicit cell for every account and activity combination already recorded for that farm. Missing cells mark that month and later balances incomplete. The bank review flags incomplete coverage anywhere in the season. Enter zero only when confirmed by the source. An account absent from the entire database still requires manual reconciliation.
