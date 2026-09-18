import fs from 'node:fs';
const OUT='output/latest.json';
const SG='https://data.gov.sg/api/action/datastore_search?resource_id=d_f357c61441e2850ca4eae05813ebd37b&limit=100';
const HK='https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/financial/banking-statistics?offset=0';
const get=async u=>{const r=await fetch(u,{headers:{'user-agent':'BondStats-data-sync/1.0'}});if(!r.ok)throw new Error(`${r.status} ${u}`);return r.json()};
const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:null};
const growth=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a/b-1)*100:null;
const avg=a=>{const v=a.filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
const bound=(x,scale=4)=>Number.isFinite(x)?Math.max(-1,Math.min(1,x/scale)):null;
const periodKeys=o=>Object.keys(o).filter(k=>/^\d{4}[A-Za-z]{3}$/.test(k)).sort((a,b)=>{const p=x=>Date.parse(x.slice(0,4)+' '+x.slice(4)+' 1');return p(b)-p(a)});
const findRow=(rows,patterns)=>rows.find(r=>patterns.some(p=>p.test(String(r.DataSeries||r.data_series||''))))||null;
const seriesFromRow=r=>{if(!r)return[];return periodKeys(r).map(k=>({period:k,value:num(r[k])})).filter(x=>Number.isFinite(x.value));};
const metric=(s,n)=>s.length>n?growth(s[0].value,s[n].value):null;
function hkRecords(j){return j?.result?.records||j?.result?.record||[]}
function hkSeries(rows,key){return rows.map(r=>({period:String(r.end_of_month||''),value:num(r[key])})).filter(x=>x.period&&Number.isFinite(x.value)).sort((a,b)=>b.period.localeCompare(a.period))}
function channel(diff,label){if(!Number.isFinite(diff))return{score:null,label:'Unavailable',detail:'Official observation unavailable'};return{score:bound(diff),label:diff>0.35?'Singapore stronger':diff<-.35?'Hong Kong stronger':'Near balance',detail:`relative 3m momentum ${diff>0?'+':''}${diff.toFixed(2)} pp`}}
const [sgj,hkj]=await Promise.all([get(SG),get(HK)]);
const sgr=sgj?.result?.records||[]; const hkr=hkRecords(hkj);
if(!sgr.length||!hkr.length)throw new Error('Official source returned no records');
// Singapore table labels can change; use explicit semantic matching and never substitute invented values.
const sgAssets=seriesFromRow(findRow(sgr,[/^total assets/i,/assets.*total/i]));
const sgDeposits=seriesFromRow(findRow(sgr,[/deposits.*non-bank/i,/non-bank.*deposits/i,/customer deposits/i]));
const sgExternal=seriesFromRow(findRow(sgr,[/external.*liabil/i,/liabilit.*outside singapore/i,/amount due to.*outside/i,/non-resident.*liabil/i]));
const sgBankBase=sgDeposits.length?sgDeposits:sgAssets;
const hkDeposits=hkSeries(hkr,'cust_deposites_total').length?hkSeries(hkr,'cust_deposites_total'):hkSeries(hkr,'total_assets');
const hkExtL=hkSeries(hkr,'total_ext_liab'), hkExtC=hkSeries(hkr,'total_ext_claims');
const hkCross=hkr.map(r=>({period:String(r.end_of_month||''),value:avg([num(r.total_ext_liab),num(r.total_ext_claims)])})).filter(x=>Number.isFinite(x.value)).sort((a,b)=>b.period.localeCompare(a.period));
const sgB3=metric(sgBankBase,3), hkB3=metric(hkDeposits,3), bankDiff=Number.isFinite(sgB3)&&Number.isFinite(hkB3)?sgB3-hkB3:null;
const sgX3=metric(sgExternal,3), hkX3=metric(hkCross,3), crossDiff=Number.isFinite(sgX3)&&Number.isFinite(hkX3)?sgX3-hkX3:null;
const sgB12=metric(sgBankBase,12), hkB12=metric(hkDeposits,12), d12=Number.isFinite(sgB12)&&Number.isFinite(hkB12)?sgB12-hkB12:null;
const banking=channel(bankDiff,'banking'), cross=channel(crossDiff,'crossborder');
const available=[banking.score,cross.score].filter(Number.isFinite);const composite=available.length?avg(available):null;
const singaporeScore=Number.isFinite(composite)?Math.round(50+composite*35):null;const hongKongScore=Number.isFinite(singaporeScore)?100-singaporeScore:null;
const persistAgree=Number.isFinite(bankDiff)&&Number.isFinite(d12)&&Math.sign(bankDiff)===Math.sign(d12)&&Math.abs(bankDiff)>.35&&Math.abs(d12)>.35;
const multiAgree=available.length>=2&&Math.sign(available[0])===Math.sign(available[1])&&Math.abs(available[0])>.08&&Math.abs(available[1])>.08;
const coverage=[Number.isFinite(bankDiff),Number.isFinite(crossDiff),Number.isFinite(d12),available.length>=2].filter(Boolean).length;
const confidence=Math.round((coverage/4)*100);
let verdict={label:'Insufficient evidence',note:'Available official series do not yet support a multi-channel directional conclusion.'};
if(confidence>=75&&multiAgree&&persistAgree){if(composite>.12)verdict={label:'Evidence tilts toward Singapore',note:'Multiple independent official indicators are consistent with a relative shift toward Singapore; this is not proof of direct bilateral capital transfer.'};else if(composite<-.12)verdict={label:'Evidence tilts toward Hong Kong',note:'Multiple independent official indicators are consistent with relative strengthening in Hong Kong; this is not proof of direct bilateral capital transfer.'}}
else if(confidence>=50)verdict={label:'Mixed / unconfirmed',note:'Some relative movement is visible, but the independent confirmation test is not satisfied.'};
const st=(ok,pos,neg)=>!ok?{label:'Unavailable',class:'neutral'}:pos?{label:'Singapore confirmation',class:'positive'}:neg?{label:'Hong Kong confirmation',class:'negative'}:{label:'No clear divergence',class:'neutral'};
const tests=[st(Number.isFinite(bankDiff),bankDiff>.35,bankDiff<-.35),st(Number.isFinite(crossDiff),crossDiff>.35,crossDiff<-.35),{label:persistAgree?'Confirmed across windows':'Not confirmed',class:persistAgree?'positive':'neutral'},{label:multiAgree?'Independent channels agree':'Channels do not agree',class:multiAgree?'positive':'neutral'}];
// Build historical evidence where both banking series overlap. Cross-border history is intentionally not backfilled when SG row is absent.
const map=s=>new Map(s.map(x=>[x.period,x.value]));const sm=map(sgBankBase),hm=map(hkDeposits);const periods=[...sm.keys()].filter(p=>hm.has(p)).sort();const history=[];
for(let i=3;i<periods.length;i++){const p=periods[i],prev=periods[i-3];const d=growth(sm.get(p),sm.get(prev))-growth(hm.get(p),hm.get(prev));if(Number.isFinite(d))history.push({period:p,score:Math.round(50+bound(d)*35)})}
const latestPeriods=[sgBankBase[0]?.period,hkDeposits[0]?.period,sgExternal[0]?.period,hkCross[0]?.period].filter(Boolean).sort();
const data={schema:'bondstats-capital-migration-v1',generated_at:new Date().toISOString(),as_of:latestPeriods[0]||null,singapore_score:singaporeScore,hong_kong_score:hongKongScore,confidence,coverage,verdict,channels:{banking,crossborder:cross,persistence:{label:persistAgree?'Persistent':'Unconfirmed',detail:Number.isFinite(d12)?`relative 12m momentum ${d12>0?'+':''}${d12.toFixed(2)} pp`:'12m comparison unavailable'},confidence:{label:`${confidence}%`,detail:`${coverage}/4 tests available`}},tests,raw:{sg_banking_3m:sgB3,hk_banking_3m:hkB3,sg_crossborder_3m:sgX3,hk_crossborder_3m:hkX3,relative_banking_3m:bankDiff,relative_banking_12m:d12,relative_crossborder_3m:crossDiff},history:history.slice(-36),sources:{singapore:{provider:'Singapore Department of Statistics / Monetary Authority of Singapore',dataset:'d_f357c61441e2850ca4eae05813ebd37b',banking_series:sgDeposits.length?'matched deposits series':'total assets fallback',crossborder_series:sgExternal.length?'matched external-liabilities series':'unavailable'},hong_kong:{provider:'Hong Kong Monetary Authority',endpoint:'banking-statistics'},bis:{provider:'Bank for International Settlements',dataset:'Locational banking statistics',role:'methodological cross-check'}}};
fs.mkdirSync(OUT.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({verdict:data.verdict.label,score:data.singapore_score,confidence,coverage,as_of:data.as_of},null,2));
