# Replace Figured's farm planning layer

Keep your accounting ledger and source documents. This imports monthly cash report amounts, not an entire Figured account. The free version has no live Xero, MYOB, QuickBooks, bank or production feed.

## Get the report out

Figured's [report export guide](https://help.figured.com/en/articles/1073236-can-i-export-my-reports-to-excel-or-into-a-spreadsheet), checked 29 September 2026, describes copying a saved report through Actions, or an unsaved report through Share Report, to the clipboard, then pasting into a spreadsheet. Formulas are not copied. Its [reports overview](https://help.figured.com/en/articles/112300-reports-overview) describes separate budget, actual and forecast report views.

1. Choose a monthly cash report for one farm, one enterprise and one scenario. Keep actual, budget and forecast reports separate. Do not import a profit-and-loss report as cash. Preserve the original report and its date for comparison.
2. Paste it into a spreadsheet. Keep only leaf account rows and monthly amounts. Remove report titles, grouping headings, totals, opening and closing balances, and year-total columns. Rename the first heading Account. Use YYYY-MM or Mon YYYY for each month heading. Save as UTF-8 CSV.
3. The farm's currency must match the report. Check whether the report is GST inclusive or exclusive and keep that basis consistent across budget, forecast and actuals. Record it with /log. Opening cash belongs in the farm, not in the imported account rows.
4. Create the farm, enterprises and accounts using the recipes. Each account has an in or out direction. Import receipt amounts as positive, ordinary payment amounts as positive under out accounts, and refunds or reversals as negative. The importer converts out amounts to negative cash. Never double-invert an already signed payment report.
5. Match every Account label to an existing account. An optional JSON object maps report labels to account names: {"Milk Sales":"Milk receipts"}. Unknown and ambiguous accounts fail with candidate lists. A total or heading row fails unless you incorrectly map it as a real account; verify the prepared spreadsheet yourself.

## One import command once the report is prepared

```bash
npm run farm -- import figured ./monthly-cash.csv --farm="Kowhai Dairy" --enterprise="Milking herd" --scenario=actual --by="Moana"
```

Add `--dry-run` to preview, `--map=./account-map.json` for different labels. Months must fall in the farm's twelve-month planning year. Blank cells are rejected; enter zero only when the source confirms zero. Thousands separators and parentheses for negatives are supported. Currency symbols, formulas and malformed numbers are rejected. No exchange conversion runs.

The whole file commits or rolls back. Importing equal amounts again reports unchanged and creates no extra entries. Changed amounts are refused unless you deliberately add `--replace`; changes get an audit note with the file hash on each cash entry. Removed rows are never deleted. Check the original reports against the imported balances and account totals, then set `actual-through` to the final fully reconciled month. A partially entered month must remain forecast until it is complete. The system detects absent months and missing budget/actual pairs; it cannot prove that an unrecorded account exists.

`tests/fixtures/figured-monthly-cash.csv` is a synthetic prepared-format example, not an export captured from a Figured subscription. Figured report layouts vary, so preparation and account mapping are real work. Enterprise DNA does that work in the custom version. Do a checked trial before moving your review process.

## What carries over

Farm, enterprise, account, month, scenario and cash amount after mapping. Import provenance includes filename, SHA-256 and the operator's name. Enter production quantities and stock movements separately using record-production and record-stock; they are not reconstructed from cash.

## What stays separate

Ledger transactions, invoices, attachments, livestock tax values, bank connections, permissions, reporting layouts, formulas, scenario assumptions and edit history. Archive originals and export the new system with `npm run farm -- export --out=backup.json`. This is a complete domain-data backup; restore requires a tested mapping or database restore, not an undocumented import command. Keep both systems until your accountant has checked opening balances, monthly totals, stock counts and retention dates.

Coverage check: each month needs an explicit cell for every account and activity combination already recorded for that farm. Missing cells mark that month and later balances incomplete. The bank review flags incomplete coverage anywhere in the season. Enter zero only when confirmed by the source. An account absent from the entire database still requires manual reconciliation.
