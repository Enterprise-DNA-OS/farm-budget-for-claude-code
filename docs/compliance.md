# Farm record checks

Sources checked 29 September 2026. These checks flag recorded evidence metadata, not the contents of your documents. They do not certify tax compliance, calculate tax, file a return, check animal traceability or replace an accountant. The ledger and original evidence remain with their existing systems. No records are automatically deleted.

| Rule | Source | Implemented check |
|---|---|---|
| NZ-RECORDS-7 | [Inland Revenue: records of income and expenses](https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses) | A source reference is present and retain_until is at least seven years after the entered reference_date. |
| AU-RECORDS-5 | [ATO: overview of record-keeping rules for business](https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business) | A source reference is present and retain_until is at least five years after the entered reference_date. |
| LEGAL-HOLD | An instruction recorded by the business or its adviser | Every evidence record marked legal_hold is flagged for review, regardless of its date. |

Set the reference date with your accountant. For NZ records, use the end of the applicable tax year or taxable period. [IRD Smart Business, record keeping](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir300---ir399/ir320/ir320.pdf) describes this period. For AU general business records, use the later of preparation or obtaining the record and completion of the transaction. Longer periods apply in some cases, including assets, losses, disputes and statutory extensions; set the longer date or a hold. The software cannot discover those exceptions from a filename.

Run `npm run farm -- compliance --json`. The view `v_compliance` applies the rules above. `retain-evidence` records dates and a source reference and logs the change. A reference such as a local archive path is evidence of a recorded location, not proof that the document exists, is readable or has a tested backup. Verify those separately. No command downloads or uploads a document.

`attention` also flags overdue or near-term business deadlines, stale actuals, stock arithmetic differences and cash limits. These are operating checks, not statutory rules. Bank limits are the amounts entered by the operator, not invented lender covenants. Negative headroom means the entered overdraft limit is exceeded; it is not a lending decision.
