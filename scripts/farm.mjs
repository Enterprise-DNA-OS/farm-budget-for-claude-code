#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const reads={
 farms:'select * from farms order by name',
 enterprises:'select e.*,f.name farm from enterprises e join farms f on f.id=e.farm_id order by f.name,e.name',
 accounts:'select a.*,f.name farm from accounts a join farms f on f.id=a.farm_id order by f.name,a.name',
 cashflow:'select farm_id,farm,currency,month,basis,net_cents,closing_cents,headroom_cents,cells,status from v_cashflow order by farm,month',
 'budget-review':'select * from v_variance order by farm,month,variance_cents',
 'production-review':'select * from v_production order by farm,month',
 'livestock-reconcile':'select * from v_livestock order by farm,month,stock_class',
 'bank-review':`select distinct on(farm_id) farm_id,farm,currency,month as tightest_month,closing_cents,headroom_cents,case when exists(select 1 from v_cashflow x where x.farm_id=v_cashflow.farm_id and x.status='INCOMPLETE') then 'INCOMPLETE' else status end status from v_cashflow order by farm_id,headroom_cents,month`,
 'deadlines':`select o.*,f.name farm from obligations o join farms f on f.id=o.farm_id where o.status='open' order by o.due,f.name`,
 compliance:'select * from v_compliance order by farm,rule,record',
 attention:'select * from v_attention order by farm,kind,record',
 evidence:'select e.*,f.name farm from evidence e join farms f on f.id=e.farm_id order by f.name,e.retain_until',
 history:'select n.*,f.name farm from notes n join farms f on f.id=n.farm_id order by n.created_at,n.id',
};
const tables=['farms','enterprises','accounts','cash_entries','production','livestock','obligations','evidence','notes','import_batches'];
function argsOf(args){const pos=[],opts={};for(const x of args){if(x.startsWith('--')){const i=x.indexOf('=');opts[x.slice(2,i<0?undefined:i)]=i<0?true:x.slice(i+1);}else pos.push(x);}return {pos,opts};}
const req=(v,name)=>{if(typeof v!=='string'||!v.trim())throw Error(`Required ${name}`);return v.trim();};
const one=(v,values,name)=>{if(!values.includes(v))throw Error(`${name} must be ${values.join(', ')}`);return v;};
export function date(v){v=req(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date ${v}`);return v;}
export function month(v){v=req(v,'month');if(/^\d{4}-\d{2}$/.test(v))v+='-01';if(/^\d{4}-\d{2}-01$/.test(v))return date(v);const m=v.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/i);if(m)return `${m[2]}-${String(['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].toLowerCase())+1).padStart(2,'0')}-01`;throw Error(`Invalid month ${v}; use YYYY-MM or Mon YYYY`);}
export function cents(v){let s=req(String(v??''),'amount');let neg=false;if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1);}if(!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s)||neg&&s.startsWith('-'))throw Error(`Invalid amount ${v}; use decimal money without currency symbols`);const [whole,part='']=s.replaceAll(',','').replace('-','').split('.');const n=Number(whole)*100+Number(part.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>1e13)throw Error('Amount outside supported range');return (neg||s.startsWith('-'))?-n:n;}
function number(v,name,integer=false){const n=Number(req(String(v??''),name));if(!Number.isFinite(n)||n<0||integer&&!Number.isSafeInteger(n))throw Error(`${name} must be a nonnegative ${integer?'integer':'number'}`);return n;}
async function resolve(db,t,q,farm=null){q=req(q,t);let rows=await db.query(`select * from ${t}`);if(farm)rows=rows.filter(r=>r.farm_id===farm);const k=q.toLowerCase();let found=rows.filter(r=>(r.name||r.title||'').toLowerCase()===k);if(!found.length)found=rows.filter(r=>r.id.toLowerCase().startsWith(k)||(r.name||r.title||'').toLowerCase().includes(k));if(found.length!==1)throw Error(`${t} ${found.length?'ambiguous':'not found'}: ${q}\n${(found.length?found:rows).map(r=>`${r.id}  ${r.name||r.title}`).join('\n')}`);return found[0];}
async function tx(db,fn,dry=false){await db.exec('BEGIN');try{const r=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function note(db,farm,author,body){await db.query('insert into notes(farm_id,author,body) values($1,$2,$3)',[farm,req(author,'--by'),body]);}
async function context(db,o){const f=await resolve(db,'farms',o.farm);const e=o.enterprise?await resolve(db,'enterprises',o.enterprise,f.id):null;return {f,e};}
function inYear(f,m){if(m<f.start_month||m>=`${Number(f.start_month.slice(0,4))+1}${f.start_month.slice(4)}`)throw Error(`Month ${m} outside farm planning year starting ${f.start_month}`);}
async function saveCash(db,{f,e,a,m,scenario,amount,source},replace){
 inYear(f,m);const params=[f.id,e.id,a.id,m,scenario,amount,source];
 const old=(await db.query('select * from cash_entries where farm_id=$1 and enterprise_id=$2 and account_id=$3 and month=$4 and scenario=$5',params.slice(0,5)))[0];
 if(old){if(Number(old.amount_cents)===amount)return 'unchanged';if(!replace)throw Error(`Existing amount differs for ${a.name} ${m}; review and use --replace`);await db.query('update cash_entries set amount_cents=$6,source_ref=$7 where farm_id=$1 and enterprise_id=$2 and account_id=$3 and month=$4 and scenario=$5',params);return 'updated';}
 await db.query('insert into cash_entries(farm_id,enterprise_id,account_id,month,scenario,amount_cents,source_ref) values($1,$2,$3,$4,$5,$6,$7)',params);return 'inserted';
}
async function importFigured(db,file,o){
 const {f,e}=await context(db,o);if(!e)throw Error('Required --enterprise');const scenario=one(o.scenario,['actual','budget','forecast'],'--scenario');req(o.by,'--by');
 const csv=fs.readFileSync(req(file,'CSV file'),'utf8'),rows=parseCsv(csv);if(!rows.length)throw Error('Empty CSV');
 const headings=Object.keys(rows[0]);if(headings[0]!=='Account')throw Error('First column must be Account. Prepare the monthly report as documented in docs/replace-figured.md');
 const columns=headings.slice(1).map(h=>({h,m:month(h)}));if(!columns.length)throw Error('No monthly columns');if(new Set(columns.map(c=>c.m)).size!==columns.length)throw Error('Duplicate month columns');
 const mapping=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 const seen=new Set(),cells=[];
 for(const [i,row] of rows.entries()){
  const a=await resolve(db,'accounts',mapping[row.Account]||row.Account,f.id);
  if(seen.has(a.id))throw Error(`Duplicate account row ${row.Account}`);seen.add(a.id);
  for(const {h,m} of columns){let amount;try{amount=cents(row[h]);}catch(err){throw Error(`Row ${i+2}, ${h}: ${err.message}`);}if(a.direction==='out')amount=-amount;
   cells.push({f,e,a,m,scenario,amount,source:`figured:${path.basename(file)}:${createHash('sha256').update(csv).digest('hex')}`});}
 }
 return tx(db,async()=>{const counts={inserted:0,updated:0,unchanged:0,preview:Boolean(o['dry-run']),currency:f.currency};for(const c of cells)counts[await saveCash(db,c,Boolean(o.replace))]++;
 if(counts.inserted||counts.updated){await db.query('insert into import_batches(farm_id,enterprise_id,file_hash,filename,scenario,cells) values($1,$2,$3,$4,$5,$6)',[f.id,e.id,createHash('sha256').update(csv).digest('hex'),path.basename(file),scenario,cells.length]);await note(db,f.id,o.by,`Figured ${scenario} import: ${JSON.stringify(counts)}; source ${path.basename(file)}`);}
 return [counts];},Boolean(o['dry-run']));
}
export async function run(db,args){
 const {pos,opts:o}=argsOf(args);const [cmd='help',...p]=pos;
 if(reads[cmd]){const rows=await db.query(reads[cmd]);if(!o.farm)return rows;const f=await resolve(db,'farms',o.farm);return rows.filter(r=>(cmd==='farms'?r.id:r.farm_id)===f.id);}
 if(cmd==='help')return [{commands:[...Object.keys(reads),'farm','add-farm','add-enterprise','add-account','entry','actual-through','record-production','record-stock','add-deadline','complete-deadline','retain-evidence','log','stress-test','draft-bank-note','import figured','export'].join(', '),flags:'--farm=NAME --json; run the matching .claude/commands recipe for write syntax'}];
 if(cmd==='farm'){const f=await resolve(db,'farms',p[0]);return {farm:f,enterprises:await db.query('select * from enterprises where farm_id=$1',[f.id]),notes:await db.query('select author,body,created_at from notes where farm_id=$1 order by created_at',[f.id])};}
 if(cmd==='add-farm'){const country=one(o.country,['NZ','AU'],'--country');const start=month(o.start);return db.query('insert into farms(name,country,currency,start_month,actual_through,opening_cents,overdraft_limit_cents) values($1,$2,$3,$4,($4::date-interval \'1 month\')::date,$5,$6) returning *',[req(p[0],'name'),country,country==='NZ'?'NZD':'AUD',start,cents(o.opening),cents(o.limit)]);}
 if(cmd==='add-enterprise'){const {f}=await context(db,o);return db.query('insert into enterprises(farm_id,name,kind) values($1,$2,$3) returning *',[f.id,req(p[0],'name'),one(o.kind,['dairy','livestock','cropping','overheads'],'--kind')]);}
 if(cmd==='add-account'){const {f}=await context(db,o);return db.query('insert into accounts(farm_id,name,direction) values($1,$2,$3) returning *',[f.id,req(p[0],'name'),one(o.direction,['in','out'],'--direction')]);}
 if(cmd==='entry'){
  const {f,e}=await context(db,o);if(!e)throw Error('Required --enterprise');const a=await resolve(db,'accounts',o.account,f.id);const m=month(o.month),scenario=one(o.scenario,['budget','forecast','actual'],'--scenario');
  const amount=cents(o.amount)*(a.direction==='out'?-1:1);const source=req(o.source,'--source');req(o.by,'--by');
  return tx(db,async()=>{const result=await saveCash(db,{f,e,a,m,scenario,amount,source},Boolean(o.replace));if(result!=='unchanged')await note(db,f.id,o.by,`${scenario} ${a.name} ${m}: ${amount} cents; ${source}; ${result}`);return [{result}];});
 }
 if(cmd==='actual-through'){const {f}=await context(db,o);const m=month(p[0]);inYear(f,m);req(o.by,'--by');req(o.reason,'--reason');return tx(db,async()=>{const rows=await db.query('update farms set actual_through=$2 where id=$1 returning *',[f.id,m]);await note(db,f.id,o.by,`Actual cutoff changed from ${f.actual_through} to ${m}: ${o.reason}`);return rows;});}
 if(cmd==='record-production'){
  const {f,e}=await context(db,o);if(!e)throw Error('Required --enterprise');const m=month(o.month);inYear(f,m);const unit=one(o.unit,['kgMS','kg','tonnes','head'],'--unit');req(o.by,'--by');
  return tx(db,async()=>{const result=await db.query('insert into production(enterprise_id,month,unit,budget_qty,actual_qty) values($1,$2,$3,$4,$5) on conflict(enterprise_id,month,unit) do update set budget_qty=excluded.budget_qty,actual_qty=excluded.actual_qty returning *',[e.id,m,unit,number(o.budget,'--budget'),number(o.actual,'--actual')]);await note(db,f.id,o.by,`Production ${e.name} ${m}: budget ${o.budget}, actual ${o.actual} ${unit}`);return result;});
 }
 if(cmd==='record-stock'){
  const {f,e}=await context(db,o);if(!e)throw Error('Required --enterprise');const m=month(o.month);inYear(f,m);req(o.by,'--by');
  return tx(db,async()=>{const result=await db.query('insert into livestock(enterprise_id,month,stock_class,opening,births,purchases,sales,deaths,closing) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(enterprise_id,month,stock_class) do update set opening=excluded.opening,births=excluded.births,purchases=excluded.purchases,sales=excluded.sales,deaths=excluded.deaths,closing=excluded.closing returning *',[e.id,m,req(o.class,'--class'),...['opening','births','purchases','sales','deaths','closing'].map(k=>number(o[k],`--${k}`,true))]);await note(db,f.id,o.by,`Stock count ${e.name} ${o.class} ${m}: closing ${o.closing}`);return result;});
 }
 if(cmd==='add-deadline'){const {f}=await context(db,o);return db.query('insert into obligations(farm_id,title,due,owner) values($1,$2,$3,$4) returning *',[f.id,req(p[0],'title'),date(o.due),req(o.owner,'--owner')]);}
 if(cmd==='complete-deadline'){const {f}=await context(db,o),d=await resolve(db,'obligations',p[0],f.id);req(o.by,'--by');req(o.reason,'--reason');return tx(db,async()=>{const rows=await db.query("update obligations set status='done',completed_on=current_date where id=$1 returning *",[d.id]);await note(db,f.id,o.by,`Completed ${d.title}: ${o.reason}`);return rows;});}
 if(cmd==='retain-evidence'){const {f}=await context(db,o);req(o.by,'--by');return tx(db,async()=>{const rows=await db.query('insert into evidence(farm_id,name,record_date,reference_date,retain_until,source_ref,legal_hold) values($1,$2,$3,$4,$5,$6,$7) on conflict(farm_id,name) do update set record_date=excluded.record_date,reference_date=excluded.reference_date,retain_until=excluded.retain_until,source_ref=excluded.source_ref,legal_hold=excluded.legal_hold returning *',[f.id,req(p[0],'name'),date(o.date),date(o.reference),date(o.until),req(o.source,'--source'),Boolean(o.hold)]);await note(db,f.id,o.by,`Evidence ${p[0]}: retain through ${o.until}, reference date ${o.reference}, hold ${Boolean(o.hold)}`);return rows;});}
 if(cmd==='log'){const {f}=await context(db,o);await note(db,f.id,o.by,req(p[0],'note'));return [{logged:true}];}
 if(cmd==='stress-test'){
  const {f}=await context(db,o);const income=Number(o['income-pct']??0),cost=Number(o['cost-pct']??0);if(!Number.isFinite(income)||!Number.isFinite(cost)||income < -100||cost < -100||income>1000||cost>1000)throw Error('Scenario percentages must be between -100 and 1000');
  const base=await db.query('select * from v_cashflow where farm_id=$1 order by month',[f.id]);const cells=await db.query('select * from cash_entries where farm_id=$1',[f.id]);let balance=Number(f.opening_cents);
  return base.map(b=>{const net=cells.filter(c=>c.month===b.month&&c.scenario===b.basis).reduce((n,c)=>n+Math.round(Number(c.amount_cents)*(b.basis==='actual'?1:1+(Number(c.amount_cents)>=0?income:cost)/100)),0);balance+=net;return {farm:f.name,currency:f.currency,month:b.month,basis:b.basis,base_closing_cents:b.closing_cents,stressed_closing_cents:balance,headroom_cents:balance+Number(f.overdraft_limit_cents),coverage:b.missing_months?'INCOMPLETE':'Recorded cells only'};});
 }
 if(cmd==='draft-bank-note'){
  const {f}=await context(db,o);const cash=await run(db,['bank-review',`--farm=${f.id}`]);const warnings=await run(db,['attention',`--farm=${f.id}`]);const history=await db.query('select author,body,created_at from notes where farm_id=$1 order by created_at',[f.id]);
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`bank-${f.id}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# DRAFT: seasonal review for ${f.name}\n\nInternal draft. Verify cash coverage and assumptions before sharing.\n\n${human(cash)}\n\n${human(warnings)}\n\nRecorded notes:\n${history.map(n=>`- ${n.author}: ${n.body}`).join('\n')}\n\nRequested discussion: confirm the seasonal limit and the actions on each deadline. No finance application has been sent.\n`,{flag:'wx'});return [{file,status:'draft only'}];
 }
 if(cmd==='import'){if(p[0]!=='figured')throw Error('Only import figured is supported');return importFigured(db,p[1],o);}
 if(cmd==='export'){const result={format:'farm-budget-v1',exported_at:new Date().toISOString()};await tx(db,async()=>{for(const t of tables)result[t]=await db.query(`select * from ${t} order by id`);});if(o.out){fs.writeFileSync(o.out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});return [{file:path.resolve(o.out),tables:tables.length}];}return result;}
 throw Error(`Unknown command ${cmd}; use help`);
}
export function human(value){if(!Array.isArray(value))return JSON.stringify(value,null,2);if(!value.length)return '(none)';const cols=Object.keys(value[0]).filter(k=>!['farm_id','enterprise_id','account_id','created_at','updated_at'].includes(k));return table(value,cols.map(key=>({key,label:key.replace(/_cents$/,'').replaceAll('_',' '),format:key.endsWith('_cents')?(v,r)=>`${r.currency||''} ${(Number(v)/100).toFixed(2)}`.trim():v=>typeof v==='object'?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
