-- Require an explicit cell for every known account/activity pair in each month.
create or replace view v_cashflow as
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
 sum(case when cells=0 or cells < (select count(distinct (enterprise_id,account_id)) from cash_entries c where c.farm_id=totals.farm_id) then 1 else 0 end) over(partition by farm_id order by month)::int missing_months from totals
) select *, (closing_cents+overdraft_limit_cents)::bigint headroom_cents,
 case when missing_months>0 then 'INCOMPLETE' when closing_cents+overdraft_limit_cents<0 then 'OVER LIMIT' else 'Within limit' end status from running;
