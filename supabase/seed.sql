insert into farms(id,name,country,currency,start_month,actual_through,opening_cents,overdraft_limit_cents) values
('10000000-0000-0000-0000-000000000001','Kowhai Dairy','NZ','NZD',date_trunc('month',current_date)-interval '2 months',date_trunc('month',current_date)-interval '1 month',1800000,5000000),
('10000000-0000-0000-0000-000000000002','Riverbend Sheep','AU','AUD',date_trunc('month',current_date)-interval '2 months',date_trunc('month',current_date)-interval '2 months',900000,2000000) on conflict do nothing;
insert into enterprises(id,farm_id,name,kind) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Milking herd','dairy'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Breeding flock','livestock') on conflict do nothing;
insert into accounts(id,farm_id,name,direction) values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Milk receipts','in'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Feed payments','out'),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Farm overheads','out'),
('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','Stock receipts','in'),
('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000002','Farm overheads','out') on conflict do nothing;
insert into cash_entries(farm_id,enterprise_id,account_id,month,scenario,amount_cents,source_ref)
select f.id,e.id,a.id,(f.start_month+(i||' months')::interval)::date,s,
 case a.name when 'Milk receipts' then (case when i in (2,3,4) then 1200000 else 7500000 end)
 when 'Stock receipts' then (case when i in (5,10) then 16000000 else 1000000 end)
 when 'Feed payments' then -3200000 else -2500000 end + case when s='actual' and a.direction='out' then -300000 else 0 end,
 'Fictional demonstration cash summary'
from farms f join enterprises e on e.farm_id=f.id join accounts a on a.farm_id=f.id cross join generate_series(0,11) i cross join unnest(array['budget','forecast','actual']) s
where s<>'actual' or (f.start_month+(i||' months')::interval)::date<=f.actual_through on conflict do nothing;
insert into production(id,enterprise_id,month,unit,budget_qty,actual_qty)
select '40000000-0000-0000-0000-000000000001',e.id,f.actual_through,'kgMS',42000,38500 from farms f join enterprises e on e.farm_id=f.id where f.name='Kowhai Dairy' on conflict do nothing;
insert into livestock(id,enterprise_id,month,stock_class,opening,births,purchases,sales,deaths,closing)
select '50000000-0000-0000-0000-000000000001',e.id,f.actual_through,'Ewes',1200,250,0,80,12,1350 from farms f join enterprises e on e.farm_id=f.id where f.name='Riverbend Sheep' on conflict do nothing;
insert into obligations(id,farm_id,title,due,owner) values
('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Bank seasonal limit review',current_date-3,'Moana'),
('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Accountant monthly cash review',current_date+5,'Alex') on conflict do nothing;
insert into evidence(id,farm_id,name,record_date,reference_date,retain_until,source_ref) values
('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Feed invoice archive',current_date-30,current_date,current_date+interval '2 years',''),
('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Stock sale statements',current_date-30,current_date,current_date+interval '6 years','demo://stock-statements') on conflict do nothing;
insert into notes(id,farm_id,author,body) values ('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Moana','Demo: feed supplier expects higher spring payments; discuss the seasonal bank limit before changing the plan.') on conflict do nothing;
