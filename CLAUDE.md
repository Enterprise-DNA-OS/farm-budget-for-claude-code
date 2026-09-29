# Farm Budget for Claude Code: operating instructions

Read the operator's brief, then the relevant command in .claude/commands. One database and one recipe library serve Claude Code, Codex, OpenCode and Cursor.

## Who this is for

Farm owners, rural accountants and farm managers reviewing seasonal cash, production and livestock counts. Demo businesses are fictional. Fill in the operator's actual business context before working with real records.

## Rules

- Read the farm and history before a write or draft. Never invent a balance, actual result, bank limit or evidence date.
- Never send, file a return, apply for finance or delete records. Drafts stay in drafts/.
- Resolve ambiguous names by showing candidates. Every command supports --json.
- Positive entry amounts follow the account direction. Payments become negative cash. Reversals use negative inputs. Do not combine currencies or production units.
- Keep the accounting ledger, original source documents and tax work separate. The system is cash planning, not audited accounts.
- Confirm complete reconciliation before moving the actual-through cutoff. Missing months are flagged, but absent accounts cannot be inferred.
- Writes require the operator's instruction. Read existing records before upserts; stock, production and evidence updates replace the matching monthly record. Clearing a legal hold requires explicit approval.
- Use DATA_DIR for isolated local data. DATABASE_URL uses Postgres with trusted operators; access control and backups require deployment work. Never run demo against real farm data. Hosted demo seeding requires ALLOW_DEMO_SEED=yes.

## Routing

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

## Layout

scripts/farm.mjs is the CLI. scripts/lib/db.mjs selects PGlite or Postgres. supabase/migrations holds numbered schema changes. supabase/seed.sql holds idempotent fictional data. views.json and documents.json drive local HTML output in brand.json. docs/replace-figured.md defines the prepared report import; docs/compliance.md defines the limited checks.

Run npm test after a code or schema change. /customise writes the next migration and updates affected commands and documents. Never edit an applied migration. No frontend or sending service runs here.

Built and operated through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/figured

Coverage check: each month needs an explicit cell for every account and activity combination already recorded for that farm. Missing cells mark that month and later balances incomplete. The bank review flags incomplete coverage anywhere in the season. Enter zero only when confirmed by the source. An account absent from the entire database still requires manual reconciliation.
