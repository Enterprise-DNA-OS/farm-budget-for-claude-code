create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table farms (
 id uuid primary key default gen_random_uuid(), name text not null unique, country text not null check(country in ('NZ','AU')),
 currency text not null check(currency in ('NZD','AUD')), start_month date not null check(extract(day from start_month)=1),
 actual_through date not null check(extract(day from actual_through)=1), opening_cents bigint not null default 0,
 overdraft_limit_cents bigint not null default 0 check(overdraft_limit_cents>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((country='NZ' and currency='NZD') or (country='AU' and currency='AUD')),
 check(actual_through>=start_month-interval '1 month' and actual_through<start_month+interval '12 months')
);
create table enterprises (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), name text not null,
 kind text not null check(kind in ('dairy','livestock','cropping','overheads')), unique(farm_id,name), unique(id,farm_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table accounts (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), name text not null,
 direction text not null check(direction in ('in','out')), unique(farm_id,name), unique(id,farm_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table cash_entries (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), enterprise_id uuid not null, account_id uuid not null,
 month date not null check(extract(day from month)=1), scenario text not null check(scenario in ('budget','forecast','actual')),
 amount_cents bigint not null, source_ref text not null, unique(farm_id,enterprise_id,account_id,month,scenario),
 foreign key(enterprise_id,farm_id) references enterprises(id,farm_id), foreign key(account_id,farm_id) references accounts(id,farm_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table production (
 id uuid primary key default gen_random_uuid(), enterprise_id uuid not null references enterprises(id), month date not null check(extract(day from month)=1),
 unit text not null check(unit in ('kgMS','kg','tonnes','head')), budget_qty numeric(14,3) not null check(budget_qty>=0),
 actual_qty numeric(14,3) not null check(actual_qty>=0), unique(enterprise_id,month,unit),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table livestock (
 id uuid primary key default gen_random_uuid(), enterprise_id uuid not null references enterprises(id), month date not null check(extract(day from month)=1),
 stock_class text not null, opening integer not null check(opening>=0), births integer not null default 0 check(births>=0),
 purchases integer not null default 0 check(purchases>=0), sales integer not null default 0 check(sales>=0), deaths integer not null default 0 check(deaths>=0),
 closing integer not null check(closing>=0), unique(enterprise_id,month,stock_class),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table obligations (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), title text not null, due date not null,
 owner text not null, status text not null default 'open' check(status in ('open','done')), completed_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='open' and completed_on is null) or (status='done' and completed_on is not null))
);
create table evidence (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), name text not null, record_date date not null,
 reference_date date not null, retain_until date not null, source_ref text not null, legal_hold boolean not null default false,
 unique(farm_id,name), check(reference_date>=record_date),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), author text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms(id), enterprise_id uuid not null references enterprises(id),
 file_hash text not null, filename text not null, scenario text not null, cells integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['farms','enterprises','accounts','cash_entries','production','livestock','obligations','evidence','notes','import_batches'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t); end loop; end $$;

create view v_cashflow as
with months as (
 select f.*, g::date as month from farms f cross join lateral generate_series(f.start_month,f.start_month+interval '11 months',interval '1 month') g
), totals as (
 select m.id farm_id,m.name farm,m.currency,m.month,m.opening_cents,m.overdraft_limit_cents,
 case when m.month<=m.actual_through then 'actual' else 'forecast' end basis,
 coalesce(sum(c.amount_cents) filter(where c.scenario=case when m.month<=m.actual_through then 'actual' else 'forecast' end),0)::bigint net_cents,
 count(c.id) filter(where c.scenario=case when m.month<=m.actual_through then 'actual' else 'forecast' end)::int cells,
 coalesce(sum(c.amount_cents) filter(where c.scenario='budget'),0)::bigint budget_cents
 from months m left join cash_entries c on c.farm_id=m.id and c.month=m.month group by m.id,m.name,m.currency,m.month,m.opening_cents,m.overdraft_limit_cents,m.actual_through
), running as (
 select *, (opening_cents+sum(net_cents) over(partition by farm_id order by month))::bigint closing_cents,
 sum(case when cells=0 then 1 else 0 end) over(partition by farm_id order by month)::int missing_months from totals
) select *, (closing_cents+overdraft_limit_cents)::bigint headroom_cents,
 case when missing_months>0 then 'INCOMPLETE' when closing_cents+overdraft_limit_cents<0 then 'OVER LIMIT' else 'Within limit' end status from running;

create view v_variance as
select f.id farm_id,f.name farm,f.currency,e.name enterprise,a.name account,c.month,
 coalesce(sum(c.amount_cents) filter(where c.scenario='budget'),0)::bigint budget_cents,
 coalesce(sum(c.amount_cents) filter(where c.scenario='actual'),0)::bigint actual_cents,
 (coalesce(sum(c.amount_cents) filter(where c.scenario='actual'),0)-coalesce(sum(c.amount_cents) filter(where c.scenario='budget'),0))::bigint variance_cents,
 case when count(*) filter(where c.scenario='actual')=0 then 'Missing actual' when count(*) filter(where c.scenario='budget')=0 then 'Missing budget' else 'Comparable' end coverage
from cash_entries c join farms f on f.id=c.farm_id join enterprises e on e.id=c.enterprise_id join accounts a on a.id=c.account_id
where c.month between f.start_month and f.actual_through group by f.id,f.name,f.currency,e.name,a.name,c.month;

create view v_production as select f.id farm_id,f.name farm,e.name enterprise,p.month,p.unit,p.budget_qty,p.actual_qty,
 p.actual_qty-p.budget_qty variance_qty,round(100*(p.actual_qty-p.budget_qty)/nullif(p.budget_qty,0),1) variance_pct
from production p join enterprises e on e.id=p.enterprise_id join farms f on f.id=e.farm_id;

create view v_livestock as select f.id farm_id,f.name farm,e.name enterprise,l.month,l.stock_class,l.opening,l.births,l.purchases,l.sales,l.deaths,l.closing,
 l.opening+l.births+l.purchases-l.sales-l.deaths expected_closing,
 l.closing-(l.opening+l.births+l.purchases-l.sales-l.deaths) difference
from livestock l join enterprises e on e.id=l.enterprise_id join farms f on f.id=e.farm_id;

create view v_compliance as
select f.id farm_id,f.name farm,e.name record,
 case when f.country='NZ' then 'NZ-RECORDS-7' else 'AU-RECORDS-5' end rule,
 case when trim(e.source_ref)='' then 'Missing source reference' else 'Retention date too early' end issue,
 case when f.country='NZ' then 'https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses'
 else 'https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business' end source
from evidence e join farms f on f.id=e.farm_id
where trim(e.source_ref)='' or e.retain_until<(e.reference_date+case when f.country='NZ' then interval '7 years' else interval '5 years' end)::date
union all
select f.id,f.name,e.name,'LEGAL-HOLD','Legal hold: retain until reviewed','Business-specific instruction, not a statutory time limit'
from evidence e join farms f on f.id=e.farm_id where e.legal_hold;

create view v_attention as
select f.id farm_id,f.name farm,'Deadline' kind,o.title record,o.due::text detail from obligations o join farms f on f.id=o.farm_id where o.status='open' and o.due<=current_date+14
union all select farm_id,farm,'Stock mismatch',enterprise||' / '||stock_class,'Difference '||difference::text from v_livestock where difference<>0
union all select id,name,'Stale actuals',name,actual_through::text from farms where actual_through<(date_trunc('month',current_date)-interval '1 month')::date
union all select farm_id,farm,'Cash warning',month::text,status from v_cashflow where status<>'Within limit'
union all select farm_id,farm,'Record check',record,issue from v_compliance;
