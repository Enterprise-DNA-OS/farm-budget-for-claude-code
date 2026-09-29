<h1 align="center">Farm Budget for Claude Code</h1>

<p align="center">
  <strong>The open-source farm budgeting and forecasting system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Figured data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=figured">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/figured?utm_source=github&utm_medium=readme&utm_campaign=figured">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-figured">Instead of Figured</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

A farm cash planning system: monthly budgets, forecasts and actuals, production quantities, livestock counts, bank review deadlines and evidence records. Ask for the next seasonal cash gap or the stock count that needs checking. Your database stays yours.

Figured's official regional pricing, checked 29 September 2026, lists Farm Manager at [NZ$100 per month](https://www.figured.com/en-nz/pricing) or [A$80 per month](https://www.figured.com/en-au/pricing). Twelve monthly payments are NZ$1,200 or A$960. These are subscription prices, not verified customer invoices. Figured already offers planning and reporting; this project provides a base you can change around your own process.

The code has an MIT licence. Hosting, backups and your chosen coding agent can cost money. **Omni by Enterprise DNA** brings your records across, builds your fields and rules, and runs your version. One setup fee, then a retainer. A different stack or web front end can be scoped into your version.

## Quick start

```bash
npm install
npm test
npm run demo
npm run farm -- cashflow --farm="Kowhai Dairy"
npm run farm -- stress-test --farm="Kowhai Dairy" --income-pct=-10 --cost-pct=20
npm run view
npm run docs
```

Node 20 or newer. The embedded PGlite database needs no separate install. Two fictional farms include an overdraft gap, stale actuals, an eight-head stock difference, a late bank review and an incomplete archive. Demo dates are relative to first seed; repeat seeding leaves existing records alone.

Use a separate DATA_DIR for real work. Shared Postgres uses DATABASE_URL and npm run migrate. Demo seeding refuses Postgres unless ALLOW_DEMO_SEED=yes; use only a disposable database for that test. Commands run one local database process at a time.

## The commands

| Command | Job |
|---|---|
| `/farms` | List the planning year, cash opening, cutoff and limit for each farm |
| `/enterprises` | List the dairy, livestock, cropping and overhead activities |
| `/accounts` | List cash accounts and their receipt or payment direction |
| `/cashflow` | Review monthly cash and seasonal overdraft headroom |
| `/budget-review` | Review signed actual-minus-budget cash variance and missing pairs |
| `/production-review` | Compare production quantities with plan, keeping units separate |
| `/livestock-reconcile` | Reconcile opening stock, movements and counted closing stock |
| `/bank-review` | Find the tightest cash month under the entered overdraft limit |
| `/deadlines` | Read outstanding bank, accountant and farm deadlines |
| `/compliance` | Review record references, retention dates and legal holds |
| `/attention` | Review overdue work, cash warnings, stale actuals and stock mismatches |
| `/evidence` | Read evidence locations and retention metadata |
| `/history` | Read the farm decision and import audit notes |
| `/farm` | Read one farm and its full notes |
| `/add-farm` | Add a farm planning year |
| `/add-enterprise` | Add an activity to a farm |
| `/add-account` | Add a cash receipt or payment category |
| `/entry` | Record a monthly budget, forecast or actual amount |
| `/actual-through` | Set the final reconciled actual month |
| `/record-production` | Record a monthly production result |
| `/record-stock` | Record the monthly livestock reconciliation |
| `/add-deadline` | Record a farm, accountant or bank deadline |
| `/complete-deadline` | Record completed review work |
| `/retain-evidence` | Record evidence and its retention period |
| `/log` | Log a cash assumption or review decision |
| `/stress-test` | Test lower forecast income and higher forecast costs |
| `/draft-bank-note` | Draft a seasonal cash discussion for the bank |
| `/import` | Bring a prepared Figured cash report into the farm |
| `/export` | Back up all farm records |
| `/weekly-review` | Prepare the Monday farm review |
| `/customise` | Change fields or rules through a tested migration |
| `/new-view` | Add a branded read-only HTML view |

The one CLI is `npm run farm -- <command>`. `--json` returns structured data. Names match case-insensitively; ids accept prefixes. Missing or ambiguous names list candidates and exit 1. See each recipe for write examples.

## Ten questions answered today

These combine your own records and rules. We have not verified that Figured cannot answer each one.

- Which forecast month first exceeds the entered overdraft limit? `npm run farm -- cashflow`
- What happens to headroom if receipts fall and payments rise? `npm run farm -- stress-test --farm="Kowhai Dairy" --income-pct=-10 --cost-pct=20`
- Which stock class has an unexplained head-count difference? `npm run farm -- livestock-reconcile`
- Which cash accounts were worse than budget in reconciled months? `npm run farm -- budget-review`
- Which recorded budget or actual pairs are missing? `npm run farm -- budget-review`
- Which farm has stale actuals or a blank cash month? `npm run farm -- attention`
- How far did milk production fall below its own plan? `npm run farm -- production-review`
- Which bank or accountant deadline needs an owner this week? `npm run farm -- deadlines`
- Which archive has a missing reference or short retention date? `npm run farm -- compliance`
- What recorded assumptions support the next bank discussion? `npm run farm -- history`

## Your first hour: ten things to ask for

1. Show Kowhai Dairy's cash by month.
2. Find the tightest month under its recorded bank limit.
3. Explain the milk production variance.
4. Show the sheep count discrepancy.
5. List the late bank review and its owner.
6. Test lower receipts and higher payments without changing the plan.
7. Draft the bank discussion from cash and history.
8. Preview a prepared Figured cash report import.
9. Put our name, logo and colours in brand.json.
10. Add our adviser field with /customise and a read-only summary with /new-view.

## Instead of Figured

Read [the switch guide](docs/replace-figured.md). Figured documents copying reports into a spreadsheet. Prepare the monthly cash rows, map account labels and import once. The importer previews, rejects unknown accounts and blank amounts, rolls back a whole failed file and protects existing amounts unless a replacement is explicitly requested. It does not import an entire Figured account or preserve report formulas.

## Documents and views

`npm run docs` produces a bank review pack and a stock reconciliation working paper per farm. `npm run view` produces seasonal and production summaries. All use brand.json and escape record text. Outputs stay local; they contain internal farm records. `/draft-bank-note` writes a draft and sends nothing.

[Record checks](docs/compliance.md) cover retention metadata and evidence references against cited NZ and AU rules. They do not certify compliance or inspect the archived files. The entered overdraft is a planning limit, not a lender covenant calculation.

## Planning boundaries

This is a twelve-month cash model with an explicit actuals cutoff. Budgets remain separate; forecasts apply only after the cutoff. Sensitivity changes forecast cash only. Payments are negative, receipts positive, with reversals supported. Opening cash and the bank limit must be supplied by the operator. Missing months are flagged; reconcile all accounts to the source before relying on a balance. Keep GST treatment consistent across reports.

Keep your ledger, tax returns, livestock valuations and bank feeds in their existing systems. [Why no front end](docs/why-no-front-end.md) explains mobile entry, offline work, access control and the current planning scope. Windows and Linux CI run the same temporary-database smoke tests.

## Want it installed and run for you?

[Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=figured). Enterprise DNA maps the reports, builds connections and interfaces, and operates your version through Omni by Enterprise DNA. Setup fee, then a retainer.

## License

MIT. Copyright (c) 2026 Enterprise DNA.

Coverage check: each month needs an explicit cell for every account and activity combination already recorded for that farm. Missing cells mark that month and later balances incomplete. The bank review flags incomplete coverage anywhere in the season. Enter zero only when confirmed by the source. An account absent from the entire database still requires manual reconciliation.
