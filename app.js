'use strict';
(function(){
const KEY='pfdash.v1';
const TOKEN_KEY='pfdash.ghtoken'; // GitHub token: localStorage only, never inside the data
const REPO='Sanarkor/pf-dash-fcf82d4c',BRANCHES=['main','gh-pages'],DATA_PATH='data.json';
const SECTIONS=[
  {k:'pea',   name:'PEA',                 type:'sec', color:'#34d399'},
  {k:'cto',   name:'CTO',                 type:'sec', color:'#60a5fa'},
  {k:'savings',name:'Épargne',            type:'sav', color:'#fbbf24'},
  {k:'crypto',name:'Crypto',              type:'cry', color:'#f472b6'}
];
const CG_MAP={BTC:'bitcoin',ETH:'ethereum',DOGE:'dogecoin',SOL:'solana',HYPE:'hyperliquid',ATH:'aethir',TON:'the-open-network',DOGS:'dogs-2',
  XRP:'ripple',BNB:'binancecoin',ADA:'cardano',USDT:'tether',USDC:'usd-coin',DOT:'polkadot',AVAX:'avalanche-2',LINK:'chainlink',PEPE:'pepe',
  SHIB:'shiba-inu',NOT:'notcoin',SUI:'sui',TRX:'tron',LTC:'litecoin',POL:'polygon-ecosystem-token',MATIC:'polygon-ecosystem-token',
  ATOM:'cosmos',NEAR:'near',ARB:'arbitrum',OP:'optimism',APT:'aptos',XLM:'stellar',BCH:'bitcoin-cash',UNI:'uniswap',WIF:'dogwifcoin',BONK:'bonk',
  JUP:'jupiter-exchange-solana',TIA:'celestia',INJ:'injective-protocol',RENDER:'render-token',FET:'fetch-ai',KAS:'kaspa',ETC:'ethereum-classic'};
const CURS=['EUR','USD','GBP','CHF','CAD','JPY'];

/* ---------- state ---------- */
// legacy (v1) savings sections -> merged 'savings' (v2)
const LEGACY_SAV=[['savRev','',true],['savLbp','La Banque Postale',true],['spouse','Ma femme',false],['kids','Enfant',false]];
function blank(){return {v:2,demo:false,pea:[],cto:[],savings:[],crypto:[],
  settings:{provider:'none',apiKey:'',masked:false,collapsed:{}},fx:{rates:{EUR:1},at:0,src:''},cryptoAt:0,stocksAt:0};}
let S=load();
function load(){
  try{const raw=localStorage.getItem(KEY);if(!raw)return blank();return normalize(JSON.parse(raw));}catch(e){return blank();}
}
function normalize(d){
  const b=blank();if(!d||typeof d!=='object')return b;
  for(const s of SECTIONS){b[s.k]=Array.isArray(d[s.k])?d[s.k].filter(x=>x&&typeof x==='object').map(x=>Object.assign({id:uid()},x)):[];}
  for(const[k,inst,inTotal]of LEGACY_SAV){if(Array.isArray(d[k]))for(const x of d[k]){if(!x||typeof x!=='object')continue;
    b.savings.push(Object.assign({id:uid(),inst,inTotal},x,{inTotal:x.inTotal===undefined?inTotal:!!x.inTotal,inst:x.inst||inst}));}}
  for(const x of b.savings){if(x.inTotal===undefined)x.inTotal=true;x.inTotal=!!x.inTotal;}
  b.demo=!!d.demo;
  if(d.settings&&typeof d.settings==='object')Object.assign(b.settings,d.settings);
  if(!b.settings.collapsed||typeof b.settings.collapsed!=='object')b.settings.collapsed={};
  if(d.fx&&d.fx.rates)b.fx=d.fx;
  b.cryptoAt=+d.cryptoAt||0;b.stocksAt=+d.stocksAt||0;
  b.updatedAt=+d.updatedAt||0;b.cloudAt=+d.cloudAt||0;
  return b;
}
function touch(){S.updatedAt=Date.now();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast('Impossible d\'enregistrer (stockage plein ou bloqué)');}}
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const num=v=>{if(v===null||v===undefined||v==='')return NaN;const n=typeof v==='number'?v:parseFloat(String(v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:NaN;};
const fEUR=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
function eur(n){return isFinite(n)?fEUR.format(n):'—';}
function money(n,c){if(!isFinite(n))return '—';const a=Math.abs(n);const d=a===0?2:a<0.01?6:a<1?4:2;
  try{return new Intl.NumberFormat('fr-FR',{style:'currency',currency:c||'EUR',minimumFractionDigits:2,maximumFractionDigits:d}).format(n);}catch(e){return n.toFixed(d)+' '+c;}}
function qtyf(n){return isFinite(n)?new Intl.NumberFormat('fr-FR',{maximumFractionDigits:8}).format(n):'—';}
function pct(n){return isFinite(n)?(n>=0?'+':'')+n.toFixed(2).replace('.',',')+' %':'';}
function signed(n){return isFinite(n)?(n>=0?'+':'−')+fEUR.format(Math.abs(n)):'';}
function cls(n){return !isFinite(n)||Math.abs(n)<0.005?'mut':n>0?'pos':'neg';}
function ago(t){if(!t)return 'jamais';const s=(Date.now()-t)/1000;if(s<60)return 'à l\'instant';if(s<3600)return 'il y a '+Math.floor(s/60)+' min';if(s<86400)return 'il y a '+Math.floor(s/3600)+' h';
  return new Date(t).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'});}
function el(tag,attrs,...kids){const e=document.createElement(tag);if(attrs)for(const[k,v]of Object.entries(attrs)){
  if(v===undefined||v===null||v===false)continue;if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k==='text')e.textContent=v;else e.setAttribute(k,v===true?'':v);}
  for(const c of kids.flat()){if(c===null||c===undefined||c===false)continue;e.appendChild(typeof c==='string'?document.createTextNode(c):c);}return e;}
function toast(m,ms){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),ms||2600);}
function fx(cur){cur=(cur||'EUR').toUpperCase();if(cur==='EUR')return 1;const r=S.fx.rates[cur];return isFinite(r)&&r>0?r:NaN;} // EUR per 1 unit

/* ---------- valuation ---------- */
function lineVal(sec,l){
  if(sec.type==='sav'){const v=num(l.amount);return {value:isFinite(v)?v:0,cost:NaN,pnl:NaN};}
  const q=num(l.qty)||0;
  if(sec.type==='cry'){
    const p=num(l.price);const pru=num(l.pru);
    const value=isFinite(p)?q*p:(isFinite(pru)?q*pru:0);
    const cost=isFinite(pru)?q*pru:NaN;
    return {value,cost,pnl:isFinite(cost)&&isFinite(p)?value-cost:NaN,missing:!isFinite(p)};
  }
  const r=fx(l.cur);const p=num(l.price);const pru=num(l.pru);
  const cost=isFinite(pru)?q*pru*r:NaN;
  const value=isFinite(p)?q*p*r:(isFinite(cost)?cost:0);
  return {value,cost,pnl:isFinite(p)&&isFinite(cost)?value-cost:NaN,missing:!isFinite(p),fxMissing:!isFinite(r)};
}
function secVal(sec){let value=0,cost=0,pnl=0,hasPnl=false,off=0,offN=0;for(const l of S[sec.k]){const v=lineVal(sec,l);
  if(sec.type==='sav'&&l.inTotal===false){off+=v.value;offN++;continue;}value+=v.value;
  if(isFinite(v.pnl)){pnl+=v.pnl;cost+=v.cost;hasPnl=true;}}return {value,cost,pnl:hasPnl?pnl:NaN,off,offN};}

/* ---------- render ---------- */
const editing={}; // sectionKey -> line id | 'new'
function render(){
  document.body.classList.toggle('masked',!!S.settings.masked);
  $('#demoBanner').classList.toggle('hidden',!S.demo);
  let total=0,tp=0,tc=0,hp=false;const parts=[];
  for(const sec of SECTIONS){const v=secVal(sec);total+=v.value;if(isFinite(v.pnl)){tp+=v.pnl;tc+=v.cost;hp=true;}parts.push({sec,v:v.value});}
  $('#total').textContent=eur(total);
  const tpEl=$('#totalPnl');tpEl.className='pnl amt '+(hp?cls(tp):'mut');
  tpEl.textContent=hp?('Plus/moins-value latente : '+signed(tp)+(tc>0?'  ('+pct(tp/tc*100)+')':'')):'Plus/moins-value : renseigne PRU et cours';
  const st=[];st.push('Crypto : '+ago(S.cryptoAt));st.push('Change : '+(S.fx.at?ago(S.fx.at):'—'));
  st.push('Actions : '+(S.stocksAt?ago(S.stocksAt):'manuel'));
  if(S.cloudAt)st.push(S.updatedAt>S.cloudAt?'En ligne : modifs à sauvegarder':'En ligne : à jour');$('#status').textContent=st.join(' · ');
  drawDonut(parts,total);
  const any=SECTIONS.some(s=>S[s.k].length);$('#empty').classList.toggle('hidden',any);
  const root=$('#sections');root.textContent='';
  for(const sec of SECTIONS)root.appendChild(renderSection(sec));
}
function drawDonut(parts,total){
  const svg=$('#donut');svg.textContent='';const NS='http://www.w3.org/2000/svg';const R=48,C=2*Math.PI*R;
  const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
  svg.appendChild(mk('circle',{cx:60,cy:60,r:R,fill:'none',stroke:'#1f2a3a','stroke-width':14}));
  let off=0;
  if(total>0)for(const p of parts){if(p.v<=0)continue;const len=p.v/total*C;
    svg.appendChild(mk('circle',{cx:60,cy:60,r:R,fill:'none',stroke:p.sec.color,'stroke-width':14,'stroke-dasharray':Math.max(len-1.2,0.01)+' '+(C-Math.max(len-1.2,0.01)),'stroke-dashoffset':-off,transform:'rotate(-90 60 60)'}));off+=len;}
  const t1=mk('text',{x:60,y:56,'text-anchor':'middle',class:'c-lbl'});t1.textContent='Enveloppes';svg.appendChild(t1);
  const t2=mk('text',{x:60,y:71,'text-anchor':'middle',class:'c-val'});t2.textContent=String(parts.filter(p=>p.v>0).length);svg.appendChild(t2);
  const lg=$('#legend');lg.textContent='';
  for(const p of parts){const li=el('li',null,el('span',{class:'dot'}),el('span',{class:'nm',text:p.sec.name}),el('span',{class:'pc',text:total>0?(p.v/total*100).toFixed(1).replace('.',',')+' %':'—'}),el('span',{class:'vl amt',text:eur(p.v)}));
    li.style.setProperty('--c',p.sec.color);lg.appendChild(li);}
}
function renderSection(sec){
  const v=secVal(sec);const collapsed=isCollapsed(sec.k);
  const card=el('section',{class:'card sec'+(collapsed?' collapsed':''),id:'sec-'+sec.k});card.style.setProperty('--c',sec.color);
  const sub=S[sec.k].length+(sec.type==='sav'?' compte(s)':' ligne(s)');
  const toggle=()=>{S.settings.collapsed[sec.k]=!collapsed;save();render();};
  const head=el('div',{class:'sec-head',role:'button',tabindex:'0','aria-expanded':String(!collapsed),'aria-controls':'body-'+sec.k,onclick:toggle,onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}}},
    el('div',{class:'sec-title'},el('span',{class:'bar'}),el('div',null,el('div',{text:sec.name}),el('div',{class:'sec-sub',text:sub}))),
    el('div',{class:'sec-right'},
      el('div',{class:'sec-tot'},el('div',{class:'v amt',text:eur(v.value)}),
        isFinite(v.pnl)?el('div',{class:'pl'},v.cost>0?el('span',{class:'pill amt '+cls(v.pnl),text:pct(v.pnl/v.cost*100)}):null,el('span',{class:'pe amt '+cls(v.pnl),text:signed(v.pnl)})):null,
        v.offN?el('div',{class:'p mut amt',text:'+ '+eur(v.off)+' hors total'}):null),
      el('span',{class:'chev','aria-hidden':'true'})));
  card.appendChild(head);
  const body=el('div',{class:'sec-body',id:'body-'+sec.k});const list=el('div',{class:'lines'});
  let rows=S[sec.k];
  if(sec.type==='sav'){const on=rows.filter(l=>l.inTotal!==false),off=rows.filter(l=>l.inTotal===false);rows=on;
    for(const l of on)list.appendChild(editing[sec.k]===l.id?editForm(sec,l):lineRow(sec,l));
    if(off.length){list.appendChild(el('div',{class:'grp',text:'Hors total · '+eur(v.off)}));for(const l of off)list.appendChild(editing[sec.k]===l.id?editForm(sec,l):lineRow(sec,l));}
    rows=[];}
  for(const l of rows){list.appendChild(editing[sec.k]===l.id?editForm(sec,l):lineRow(sec,l));}
  if(editing[sec.k]==='new')list.appendChild(editForm(sec,null));
  body.appendChild(list);
  if(editing[sec.k]!=='new')body.appendChild(el('button',{class:'add',onclick:()=>{editing[sec.k]='new';render();focusFirst(sec.k);}},'+ Ajouter '+(sec.type==='sav'?'un compte':sec.type==='cry'?'une crypto':'une ligne')));
  card.appendChild(body);return card;
}
function isCollapsed(k){const c=S.settings.collapsed[k];return c===undefined?k==='savings':!!c;}
function focusFirst(k){setTimeout(()=>{const i=document.querySelector('#sec-'+k+' .edit input');if(i)i.focus();},30);}
function lineRow(sec,l){
  const v=lineVal(sec,l);let a,b,tags=[];
  if(sec.type==='sav'){
    a=l.label||'Compte';const bits=[];if(l.inst)bits.push(l.inst);if(isFinite(num(l.rate)))bits.push('Taux '+String(num(l.rate)).replace('.',',')+' %');if(l.note)bits.push(l.note);b=bits.join(' · ')||'Solde manuel';
    if(l.capped)tags.push(el('span',{class:'tag ok',text:'Plafond atteint'}));
    if(l.inTotal===false)tags.push(el('span',{class:'tag off',text:'hors total'}));
  }else if(sec.type==='cry'){
    a=(l.sym||'?').toUpperCase();const bits=[qtyf(num(l.qty))+' '+(l.sym||'').toUpperCase()];
    if(isFinite(num(l.price)))bits.push(money(num(l.price),'EUR'));if(isFinite(num(l.pru)))bits.push('PRU '+money(num(l.pru),'EUR'));b=bits.join(' · ');
    if(v.missing)tags.push(el('span',{class:'tag',text:'cours ?'}));
  }else{
    a=(l.ticker||'?')+(l.name?' · '+l.name:'');const c=(l.cur||'EUR').toUpperCase();
    const bits=[qtyf(num(l.qty))+' × '+(isFinite(num(l.price))?money(num(l.price),c):'—'),'PRU '+money(num(l.pru),c)];
    if(isFinite(num(l.chg))&&l.priceSrc==='auto'&&!l.autoFail)bits.push('jour '+pct(num(l.chg)));
    if(l.priceAt)bits.push((l.autoFail?'dernier ':'')+(l.priceSrc==='auto'?(l.via||'auto')+' ':'saisi ')+ago(l.priceAt));b=bits.join(' · ');
    const wantsAuto=l.src!=='manuel'&&(l.isin||l.apiSym);
    if(v.missing)tags.push(el('span',{class:'tag',text:'cours manquant'}));
    else if(wantsAuto&&!l.autoFail&&l.priceSrc==='auto')tags.push(el('span',{class:'tag ok',text:'live'}));
    else if(wantsAuto&&l.autoFail)tags.push(el('span',{class:'tag',text:'auto ✗ · cours manuel',title:'Source automatique indisponible : dernier cours connu / saisi utilisé'}));
    else tags.push(el('span',{class:'tag off',text:'manuel'}));
    if(v.fxMissing)tags.push(el('span',{class:'tag',text:'change ?'}));
  }
  return el('div',{class:'ln'+(sec.type==='sav'&&l.inTotal===false?' off':''),tabindex:'0',role:'button',onclick:()=>{editing[sec.k]=l.id;render();focusFirst(sec.k);},onkeydown:e=>{if(e.key==='Enter'){editing[sec.k]=l.id;render();focusFirst(sec.k);}}},
    el('div',{class:'a'},sec.type==='sav'?el('input',{type:'checkbox',class:'tot-cb',title:'Compte dans le total','aria-label':'Compte dans le total',checked:l.inTotal!==false,
      onclick:e=>{e.stopPropagation();l.inTotal=e.target.checked;touch();save();render();},onkeydown:e=>e.stopPropagation()}):null,a,...tags),
    el('div',{class:'r'},el('div',{class:'v amt',text:eur(v.value)})),
    el('div',{class:'b amt',text:b}),
    el('div',{class:'r'},isFinite(v.pnl)?el('div',{class:'p amt '+cls(v.pnl),text:signed(v.pnl)+(v.cost>0?' '+pct(v.pnl/v.cost*100):'')}):el('div',{class:'p',text:''})));
}
function inp(name,label,val,opts={}){
  const i=el('input',{name,value:val===undefined||val===null?'':String(val),placeholder:opts.ph||'',inputmode:opts.num?'decimal':null,autocomplete:'off',spellcheck:'false',type:opts.type||'text'});
  if(opts.type==='checkbox'){i.checked=!!val;i.value='1';}
  return el('label',{class:opts.full?'full':null},label,i);
}
function editForm(sec,l){
  const isNew=!l;l=l||{};
  const f=el('form',{class:'edit',onsubmit:e=>{e.preventDefault();commit(sec,l.id,new FormData(f),f);}});
  if(sec.type==='sav'){
    f.append(inp('label','Libellé',l.label,{ph:'ex. Livret A'}),inp('inst','Établissement / titulaire',l.inst,{ph:'ex. banque, prénom'}),inp('amount','Solde (€)',l.amount,{num:1}),inp('rate','Taux % (facultatif)',l.rate,{num:1}));
    const cb=el('input',{type:'checkbox',name:'capped'});cb.checked=!!l.capped;f.append(el('label',{class:'chk'},el('span',null,cb,' Plafond atteint / intérêts compensés')));
    const ct=el('input',{type:'checkbox',name:'inTotal'});ct.checked=l.inTotal!==false;f.append(el('label',{class:'chk'},el('span',null,ct,' Compte dans le total')));
    f.append(inp('note','Note (facultatif)',l.note,{full:1,ph:'ex. intérêts capitalisés au 31/12'}));
  }else if(sec.type==='cry'){
    f.append(inp('sym','Symbole',l.sym,{ph:'BTC'}),inp('qty','Quantité',l.qty,{num:1}),inp('pru','PRU € (facultatif)',l.pru,{num:1}),
      inp('cgId','ID CoinGecko (auto)',l.cgId,{ph:CG_MAP[(l.sym||'').toUpperCase()]||'auto'}),inp('price','Cours € (auto / manuel)',l.price,{num:1,full:1}));
  }else{
    const cur=el('select',{name:'cur'},...CURS.map(c=>{const o=el('option',{value:c,text:c});if((l.cur||(sec.k==='cto'?'USD':'EUR'))===c)o.selected=true;return o;}));
    const src=el('select',{name:'src'},...[['auto','Automatique'],['manuel','Manuel uniquement']].map(([v,t])=>{const o=el('option',{value:v,text:t});if((l.src||'auto')===v)o.selected=true;return o;}));
    f.append(inp('ticker','Ticker',l.ticker,{ph:'ex. CW8'}),inp('name','Nom (facultatif)',l.name),inp('qty','Quantité',l.qty,{num:1}),inp('pru','PRU',l.pru,{num:1}),
      el('label',null,'Devise',cur),inp('price','Dernier cours (secours)',l.price,{num:1}),el('label',null,'Cours',src),
      inp('isin','ISIN (cours auto sans clé)',l.isin,{ph:'ex. FR0011871110'}),inp('apiSym','Symbole Twelve Data / AV',l.apiSym,{ph:'ex. IONQ'}),
      inp('mkt','Place onvista (facultatif)',l.mkt,{ph:'_PAR, _NYS, _NAS…'}));
  }
  const btns=el('div',{class:'btns'});
  if(!isNew)btns.append(el('button',{type:'button',class:'danger',onclick:async()=>{if(await ask('Supprimer cette ligne ?',{ok:'Supprimer',danger:1})){S[sec.k]=S[sec.k].filter(x=>x.id!==l.id);delete editing[sec.k];touch();save();render();}}},'Supprimer'));
  btns.append(el('button',{type:'button',onclick:()=>{delete editing[sec.k];render();}},'Annuler'),el('button',{type:'submit',class:'primary'},'Enregistrer'));
  f.append(btns);
  f.addEventListener('keydown',e=>{if(e.key==='Escape'){delete editing[sec.k];render();}});
  return f;
}
function commit(sec,id,fd,form){
  const g=k=>(fd.get(k)||'').toString().trim();const n=k=>{const v=num(g(k));return isFinite(v)?v:null;};
  let o;
  if(sec.type==='sav'){if(!g('label')&&n('amount')===null){toast('Renseigne au moins un libellé ou un solde');return;}
    o={label:g('label')||'Compte',inst:g('inst'),amount:n('amount')??0,rate:n('rate'),note:g('note'),capped:!!form.querySelector('[name=capped]')?.checked,inTotal:!!form.querySelector('[name=inTotal]')?.checked};}
  else if(sec.type==='cry'){if(!g('sym')){toast('Symbole requis');return;}o={sym:g('sym').toUpperCase(),qty:n('qty')??0,pru:n('pru'),cgId:g('cgId').toLowerCase()};
    const p=n('price');o.price=p;}
  else{if(!g('ticker')){toast('Ticker requis');return;}o={ticker:g('ticker').toUpperCase(),name:g('name'),qty:n('qty')??0,pru:n('pru'),cur:g('cur')||'EUR',apiSym:g('apiSym'),isin:g('isin').toUpperCase(),mkt:g('mkt'),src:g('src')||'auto'};o.price=n('price');
    const ex0=S[sec.k].find(x=>x.id===id);if(ex0&&(ex0.isin!==o.isin))o.ovType='';}
  const arr=S[sec.k];const ex=arr.find(x=>x.id===id);
  if(ex){
    if(sec.type!=='sav'&&o.price!==ex.price){o.priceAt=o.price===null?0:Date.now();o.priceSrc='manuel';o.chg=null;}
    if(sec.type==='cry'&&o.sym!==ex.sym&&!g('cgId'))o.cgId='';
    Object.assign(ex,o);
  }else{o.id=uid();if(sec.type!=='sav'&&o.price!==null){o.priceAt=Date.now();o.priceSrc='manuel';}arr.push(o);}
  delete editing[sec.k];touch();save();render();
  if(sec.type==='cry'&&(!ex||o.price===null||!o.cgId))refreshCrypto(true);
}

/* ---------- prices ---------- */
async function getJSON(url){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),12000);
  try{const r=await fetch(url,{signal:ctl.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}}
async function refreshFx(){
  const need=new Set(['USD']);for(const k of ['pea','cto'])for(const l of S[k])if(l.cur&&l.cur!=='EUR')need.add(l.cur.toUpperCase());
  try{const d=await getJSON('https://api.frankfurter.dev/v1/latest?base=EUR&symbols='+[...need].join(','));
    const rates={EUR:1};for(const[c,r]of Object.entries(d.rates||{}))if(r>0)rates[c]=1/r;S.fx={rates,at:Date.now(),src:'frankfurter ('+d.date+')'};return true;}
  catch(e){try{const d=await getJSON('https://open.er-api.com/v6/latest/EUR');const rates={EUR:1};for(const c of need)if(d.rates&&d.rates[c]>0)rates[c]=1/d.rates[c];
    S.fx={rates,at:Date.now(),src:'open.er-api'};return true;}catch(e2){return false;}}
}
async function resolveCg(sym){
  if(CG_MAP[sym])return CG_MAP[sym];
  try{const d=await getJSON('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(sym));
    const c=(d.coins||[]).filter(x=>(x.symbol||'').toUpperCase()===sym).sort((a,b)=>(a.market_cap_rank||1e9)-(b.market_cap_rank||1e9))[0];return c?c.id:'';}catch(e){return '';}
}
async function refreshCrypto(quiet){
  if(!S.crypto.length)return true;
  for(const l of S.crypto){if(!l.cgId){const id=await resolveCg((l.sym||'').toUpperCase());if(id)l.cgId=id;}}
  const ids=[...new Set(S.crypto.map(l=>l.cgId).filter(Boolean))];if(!ids.length)return false;
  try{const d=await getJSON('https://api.coingecko.com/api/v3/simple/price?vs_currencies=eur&ids='+ids.map(encodeURIComponent).join(','));
    const now=Date.now();for(const l of S.crypto){const p=d[l.cgId]&&d[l.cgId].eur;if(isFinite(p)){l.price=p;l.priceAt=now;l.priceSrc='auto';}}
    S.cryptoAt=now;save();if(quiet)render();return true;}
  catch(e){if(!quiet)toast('CoinGecko indisponible (limite de requêtes ?)');return false;}
}
function today(){return new Date().toISOString().slice(0,10);}
function tdBudget(n){const u=S.settings.tdUse||{};if(u.d!==today()){u.d=today();u.n=0;}
  if(u.n+n>700)return false;u.n+=n;S.settings.tdUse=u;return true;}
const TD_CALLS='pfdash.tdcalls',TD_GAP=31e3,TD_PER_MIN=2,TD_EVERY=4.5*60e3;
function tdGuard(){ // shared by every open tab through localStorage
  const now=Date.now();let c=[];try{c=JSON.parse(localStorage.getItem(TD_CALLS)||'[]').filter(t=>now-t<60e3);}catch(e){c=[];}
  if(c.length>=TD_PER_MIN||(c.length&&now-Math.max(...c)<TD_GAP))return false;
  c.push(now);try{localStorage.setItem(TD_CALLS,JSON.stringify(c));}catch(e){}return true;
}
function tdDue(lines,manual){const at=S.settings.tdSymAt||{};const now=Date.now();
  return [...new Set(lines.filter(l=>l.apiSym).map(l=>l.apiSym.trim()))].filter(s=>manual||now-(at[s]||0)>TD_EVERY).sort((x,y)=>(at[x]||0)-(at[y]||0));}
async function tdOne(sym,lines,key,now){
  if(!tdGuard()||!tdBudget(1))return null;
  S.settings.tdSymAt=Object.assign({},S.settings.tdSymAt,{[sym]:now});
  try{const r=await getJSON('https://api.twelvedata.com/quote?apikey='+encodeURIComponent(key)+'&symbol='+encodeURIComponent(sym));
    const p=r&&!r.code&&num(r.close);if(!isFinite(p))return [];const out=[];
    for(const l of lines)if(l.apiSym&&l.apiSym.trim()===sym){l.price=p;l.chg=isFinite(num(r.percent_change))?num(r.percent_change):null;l.priceAt=now;l.priceSrc='auto';l.via='Twelve Data';l.autoFail=false;out.push(l);}
    return out;}catch(e){return [];}
}
let tdTimer=null;
function tdSchedule(){if(tdTimer)return;tdTimer=setTimeout(async()=>{tdTimer=null;
  const key=(S.settings.apiKey||'').trim();if(S.settings.provider!=='twelvedata'||!key)return;
  const lines=[...S.pea,...S.cto].filter(l=>l.src!=='manuel'&&l.apiSym);const syms=tdDue(lines,false);if(!syms.length)return;
  const r=await tdOne(syms[0],lines,key,Date.now());if(r&&r.length){S.stocksAt=Date.now();save();render();}
  if(syms.length>1||!r)tdSchedule();},TD_GAP+500);}
async function onvista(l){
  const types=l.ovType?[l.ovType]:['FUND','STOCK'];let d=null;
  for(const t of types){try{d=await getJSON('https://api.onvista.de/api/v1/instruments/'+t+'/ISIN:'+encodeURIComponent(l.isin)+'/snapshot');l.ovType=t;break;}catch(e){d=null;}}
  if(!d)return null;
  const list=(d.quoteList&&d.quoteList.list)||[];const cur=(l.cur||'EUR').toUpperCase();
  const pref=[l.mkt,'_PAR','_NMS','_NAS','_NYS','_GER','_AMS','_BRU','_MIL'].filter(Boolean);
  let q=null;for(const m of pref){q=list.find(x=>x.market&&x.market.codeMarket===m&&x.isoCurrency===cur);if(q)break;}
  if(!q)q=list.find(x=>x.isoCurrency===cur);
  if(!q||!isFinite(num(q.last)))return null;
  return {price:num(q.last),chg:num(q.performancePct),via:'onvista '+((q.market&&q.market.name)||'')};
}
async function refreshStocks(manual){
  const lines=[...S.pea,...S.cto].filter(l=>l.src!=='manuel'&&(l.apiSym||l.isin));if(!lines.length)return null;
  const prov=S.settings.provider,key=(S.settings.apiKey||'').trim();const now=Date.now();const done=new Set();
  const setP=(l,r)=>{l.price=r.price;l.chg=isFinite(r.chg)?r.chg:null;l.priceAt=now;l.priceSrc='auto';l.via=r.via;l.autoFail=false;done.add(l);};
  // 1) Twelve Data (free plan 8 credits/min): ONE symbol per call, >=30 s apart, max 2 calls/min across all tabs, each symbol <= every 4.5 min
  if(prov==='twelvedata'&&key){
    const syms=tdDue(lines,manual);
    if(syms.length){const r=await tdOne(syms[0],lines,key,now);if(r)for(const l of r)done.add(l);if(syms.length>1)tdSchedule();}
    for(const l of lines)if(l.apiSym&&l.via==='Twelve Data'&&!l.autoFail&&!done.has(l))done.add(l); // keep last TD quote until its turn
  }
  // 2) Alpha Vantage (optional)
  if(prov==='alphavantage'&&key){for(const l of lines){if(!l.apiSym||done.has(l))continue;
    try{const d=await getJSON('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+encodeURIComponent(l.apiSym)+'&apikey='+encodeURIComponent(key));
      const g=d['Global Quote'];const p=g&&num(g['05. price']);if(isFinite(p))setP(l,{price:p,chg:num(String(g['10. change percent']||'').replace('%','')),via:'Alpha Vantage'});}catch(e){}}}
  // 3) onvista (keyless, CORS) by ISIN — covers Euronext Paris and fallback
  for(const l of lines){if(done.has(l)||!l.isin)continue;try{const r=await onvista(l);if(r)setP(l,r);}catch(e){}}
  let ok=0,fail=0;for(const l of lines){if(done.has(l))ok++;else{l.autoFail=true;fail++;}}
  if(ok)S.stocksAt=now;return {ok,fail};
}
let busy=false;
async function refreshAll(manual){
  if(busy)return;busy=true;$('#btnRefresh').classList.add('spin');
  const msgs=[];
  const fxOk=await refreshFx();if(!fxOk)msgs.push('change indisponible');
  const cOk=await refreshCrypto(false);if(!cOk)msgs.push('crypto indisponible');
  const st=await refreshStocks(manual);
  if(st&&st.fail)msgs.push(st.fail+' cours action en manuel');
  save();render();busy=false;$('#btnRefresh').classList.remove('spin');
  if(manual)toast(msgs.length?'Actualisé — '+msgs.join(', '):'Cours actualisés');
}

/* ---------- demo / io ---------- */
function demo(){
  const d=blank();d.demo=true;d.settings=Object.assign({},S.settings);d.fx=S.fx;
  d.pea=[{id:uid(),ticker:'DEMO-MONDE',name:'Démo ETF Monde',qty:10,pru:100,cur:'EUR',price:112.5,priceAt:Date.now(),priceSrc:'manuel'},
         {id:uid(),ticker:'DEMO-EUR',name:'Démo Action Europe',qty:25,pru:40,cur:'EUR',price:36.2,priceAt:Date.now(),priceSrc:'manuel'}];
  d.cto=[{id:uid(),ticker:'DEMO-US',name:'Démo Tech US',qty:5,pru:150,cur:'USD',price:171,priceAt:Date.now(),priceSrc:'manuel'}];
  d.savings=[{id:uid(),label:'Démo Coffre',inst:'Banque Démo A',amount:1500,rate:2.5,note:'',inTotal:true},
    {id:uid(),label:'Démo Livret',inst:'Banque Démo B',amount:5000,rate:1.5,capped:false,note:'',inTotal:true},
    {id:uid(),label:'Démo Livret plafonné',inst:'Banque Démo B',amount:10000,rate:1.5,capped:true,note:'Démo',inTotal:true},
    {id:uid(),label:'Démo Livret enfant',inst:'Enfant A',amount:800,note:'',inTotal:false}];
  d.crypto=[{id:uid(),sym:'BTC',qty:0.01,pru:50000,cgId:'bitcoin'},{id:uid(),sym:'ETH',qty:0.2,pru:2000,cgId:'ethereum'}];
  return d;
}
function exportJSON(){
  const out=JSON.parse(JSON.stringify(S));out.exportedAt=new Date().toISOString();out.app='pf-dash';
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const a=el('a',{href:URL.createObjectURL(blob),download:'portefeuille-'+new Date().toISOString().slice(0,10)+'.json'});
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);toast('Export téléchargé');
}
function isData(d){return d&&typeof d==='object'&&(SECTIONS.some(s=>Array.isArray(d[s.k]))||LEGACY_SAV.some(x=>Array.isArray(d[x[0]])));}
function applyImport(d){const keepKey=S.settings.apiKey,keepCol=S.settings.collapsed,keepMask=S.settings.masked;S=normalize(d);S.settings.collapsed=keepCol;S.settings.masked=keepMask;if(!S.settings.apiKey&&keepKey)S.settings.apiKey=keepKey;S.cloudAt=0;touch();save();render();refreshAll(false);}
/* in-page modal (window.confirm can be blocked in webviews) */
function ask(msg,opts={}){return new Promise(res=>{
  const prev=document.querySelector('.modal-bg');if(prev)prev.remove();
  const done=v=>{bg.remove();document.removeEventListener('keydown',kd);res(v);};
  const kd=e=>{if(e.key==='Escape')done(false);};
  const ok=el('button',{type:'button',class:opts.danger?'b danger':'b primary',onclick:()=>done(true)},opts.ok||'OK');
  const bg=el('div',{class:'modal-bg',role:'dialog','aria-modal':'true'},el('div',{class:'modal'},
    el('div',{class:'modal-msg',text:msg}),opts.sub?el('div',{class:'hint',text:opts.sub}):null,
    el('div',{class:'row-btns end'},el('button',{type:'button',class:'b',onclick:()=>done(false)},opts.cancel||'Annuler'),ok)));
  document.body.appendChild(bg);document.addEventListener('keydown',kd);setTimeout(()=>ok.focus(),30);
});}
async function decodePayload(str){
  str=String(str||'').trim();const i=str.indexOf('#import=');if(i>=0)str=str.slice(i+8);else if(str.startsWith('import='))str=str.slice(7);
  if(str.startsWith('{'))return JSON.parse(str);
  let b64=decodeURIComponent(str).replace(/\s/g,'').replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
  const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let k=0;k<bin.length;k++)bytes[k]=bin.charCodeAt(k);
  if(bytes[0]===0x7b||bytes[0]===0xef)return JSON.parse(new TextDecoder().decode(bytes));
  if(typeof DecompressionStream==='undefined')throw new Error('nocompress');
  const fmt=(bytes[0]&0x0f)===8&&((bytes[0]<<8)|bytes[1])%31===0?'deflate':'deflate-raw';
  const st=new Blob([bytes]).stream().pipeThrough(new DecompressionStream(fmt));return JSON.parse(await new Response(st).text());
}
let importing=false;
async function importFromText(txt,fromHash){
  if(importing)return;importing=true;
  try{
    let d;try{d=await decodePayload(txt);}catch(e){toast(e.message==='nocompress'?'Navigateur trop ancien pour ce lien compressé : utilise le lien non compressé':'Lien d\'import invalide');return;}
    if(!isData(d)){toast('Données d\'import invalides');return;}
    const has=SECTIONS.some(s=>S[s.k].length);
    const n=SECTIONS.reduce((a,s)=>a+(Array.isArray(d[s.k])?d[s.k].length:0),0);
    if(!await ask('Importer ces données ?',{ok:'Importer',sub:n+' ligne(s) au total.'+(has?' Les données actuelles de ce navigateur seront remplacées.':'')})){toast('Import annulé');return;}
    applyImport(d);toast('Import réussi');
  }finally{importing=false;}
}
function hashImport(){
  const h=location.hash||'';if(h.indexOf('#import=')!==0)return;
  const payload=h;
  try{history.replaceState(null,'',location.pathname+location.search);}catch(e){try{location.hash='';}catch(_){}}
  importFromText(payload,true);
}
function importJSON(file){
  const r=new FileReader();r.onload=async()=>{let d;try{d=JSON.parse(r.result);if(!isData(d))throw 0;}catch(e){toast('Fichier invalide');return;}
    if(!await ask('Remplacer les données actuelles par celles du fichier ?',{ok:'Importer'}))return;
    applyImport(d);toast('Import réussi');};r.readAsText(file);
}


/* ---------- online copy (data.json in the repo) ---------- */
function cleanForCloud(){ // never publish the API key, the GitHub token or local UI state
  const o=JSON.parse(JSON.stringify(S));
  o.settings={provider:o.settings.provider||'none'};
  delete o.cloudAt;o.app='pf-dash';o.demo=false;return o;
}
function applyRemote(d){ // keep this browser's settings (API key, provider, masked, collapsed)
  const st=S.settings;S=normalize(d);
  if(st.provider&&st.provider!=='none'||st.apiKey)S.settings=st;
  else S.settings=Object.assign({},S.settings,{apiKey:'',collapsed:st.collapsed||{},masked:!!st.masked});
  delete S.settings.token;
  S.updatedAt=+d.updatedAt||0;S.cloudAt=S.updatedAt;save();render();refreshAll(false);
}
async function fetchRemote(fresh){
  if(fresh){ // GitHub API: freshest copy (no CDN cache)
    try{const r=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+DATA_PATH+'?ref=gh-pages&t='+Date.now(),
      {cache:'no-store',credentials:'omit',headers:{Accept:'application/vnd.github.raw+json'}});
      if(r.ok){const d=await r.json();if(isData(d))return d;}}catch(e){}
  }
  try{const r=await fetch(DATA_PATH+'?t='+Date.now(),{cache:'no-store',credentials:'omit'});if(!r.ok)return null;const d=await r.json();return isData(d)?d:null;}
  catch(e){return null;}
}
async function syncFromRemote(){
  if(location.hash.indexOf('#import=')===0)return;
  const d=await fetchRemote(false);if(!d)return;
  const ru=+d.updatedAt||0;const has=SECTIONS.some(s=>S[s.k].length);
  if(!has||S.demo){applyRemote(d);toast('Données en ligne chargées');return;}
  if(ru<=(S.updatedAt||0))return;
  if(S.updatedAt&&S.cloudAt&&S.updatedAt<=S.cloudAt){applyRemote(d);toast('Sauvegarde en ligne plus récente chargée');return;}
  if(await ask('Une sauvegarde en ligne plus récente existe. La charger ?',{ok:'Charger',
    sub:'Sauvegarde en ligne du '+new Date(ru).toLocaleString('fr-FR')+'. Les données de ce navigateur seront remplacées (Annuler pour les garder, puis « Sauvegarder en ligne »).'})){applyRemote(d);toast('Sauvegarde en ligne chargée');}
}
function b64utf8(s){const by=new TextEncoder().encode(s);let bin='';for(let i=0;i<by.length;i+=0x8000)bin+=String.fromCharCode.apply(null,by.subarray(i,i+0x8000));return btoa(bin);}
async function ghErr(r,branch,step){let m='';try{m=(await r.json()).message||'';}catch(e){}
  const s=r.status;let hint='';
  if(s===401)hint='Jeton invalide ou expiré';
  else if(s===403)hint='Jeton sans droit d\'écriture : mets Contents sur Read and write pour pf-dash-fcf82d4c';
  else if(s===404)hint='Dépôt introuvable pour ce jeton : sélectionne pf-dash-fcf82d4c dans le jeton';
  else if(s===409||s===422)hint='Conflit de version, réessaie';
  const e=new Error((hint?hint+' — ':'')+branch+' ('+step+') : HTTP '+s+(m?' « '+m+' »':''));e.status=s;return e;}
async function ghPut(branch,content,token,msg,retry){
  const url='https://api.github.com/repos/'+REPO+'/contents/'+DATA_PATH;
  const h={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
  let sha;const g=await fetch(url+'?ref='+encodeURIComponent(branch)+'&t='+Date.now(),{headers:h,cache:'no-store',credentials:'omit'});
  if(g.ok)sha=(await g.json()).sha;else if(g.status!==404)throw await ghErr(g,branch,'lecture'); // 404 = first write: no sha
  const body={message:msg,content,branch};if(sha)body.sha=sha;
  const p=await fetch(url,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},h),body:JSON.stringify(body),credentials:'omit'});
  if(p.ok)return;
  if((p.status===409||p.status===422)&&!retry)return ghPut(branch,content,token,msg,true); // stale sha: re-read once
  throw await ghErr(p,branch,'écriture');
}
let cloudBusy=false;
async function saveOnline(){
  const token=(localStorage.getItem(TOKEN_KEY)||'').trim();
  if(!token){toast('Colle d\'abord ton jeton GitHub dans ⚙ Réglages');return;}
  if(S.demo){toast('Impossible : ce sont les données de démo');return;}
  if(cloudBusy)return;
  if(!await ask('Publier tes données en ligne ?',{ok:'☁️ Sauvegarder',sub:'Le fichier data.json du dépôt (public) sera remplacé par les données de ce navigateur. La clé API et le jeton ne sont jamais envoyés.'}))return;
  cloudBusy=true;toast('Sauvegarde en ligne…');
  try{
    const now=Date.now();const o=cleanForCloud();o.updatedAt=now;o.savedAt=new Date(now).toISOString();
    const content=b64utf8(JSON.stringify(o,null,1));
    for(const br of BRANCHES)await ghPut(br,content,token,'Sauvegarde des données ('+new Date(now).toLocaleString('fr-FR')+')');
    S.updatedAt=now;S.cloudAt=now;save();render();toast('☁️ Sauvegardé en ligne (visible partout d\'ici 1 à 2 min)');
  }catch(e){toast('Échec de la sauvegarde : '+e.message,9000);}
  finally{cloudBusy=false;}
}
async function loadOnline(){
  const d=await fetchRemote(true);if(!d){toast('Aucune sauvegarde en ligne trouvée');return;}
  const n=SECTIONS.reduce((a,s)=>a+(Array.isArray(d[s.k])?d[s.k].length:0),0);
  if(!await ask('Charger la sauvegarde en ligne ?',{ok:'Charger',sub:n+' ligne(s), sauvegarde du '+(d.updatedAt?new Date(+d.updatedAt).toLocaleString('fr-FR'):'?')+'. Les données de ce navigateur seront remplacées.'}))return;
  applyRemote(d);toast('Sauvegarde en ligne chargée');
}

/* ---------- wire ---------- */
$('#btnRefresh').onclick=()=>refreshAll(true);
$('#btnMask').onclick=()=>{S.settings.masked=!S.settings.masked;save();render();};
const dlg=$('#dlgSettings');
function closeDlg(){if(!dlg.open)return;if(dlg.close)dlg.close();else{dlg.removeAttribute('open');dlg.dispatchEvent(new Event('close'));}}
$('#btnSettings').onclick=()=>{$('#setProvider').value=S.settings.provider||'none';$('#setKey').value=S.settings.apiKey||'';$('#setToken').value=localStorage.getItem(TOKEN_KEY)||'';if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');};
$('#btnPaste').onclick=()=>{const t=$('#pasteImport').value;if(!t.trim()){toast('Colle d\'abord le lien ou le JSON');return;}$('#pasteImport').value='';closeDlg();importFromText(t,false);};
$('#btnCloseDlg').onclick=e=>{e.preventDefault();closeDlg();};
dlg.addEventListener('close',()=>{const tk=$('#setToken').value.trim();try{if(tk)localStorage.setItem(TOKEN_KEY,tk);else localStorage.removeItem(TOKEN_KEY);}catch(e){}
  const p=$('#setProvider').value,k=$('#setKey').value.trim();const ch=p!==S.settings.provider||k!==S.settings.apiKey;
  S.settings.provider=p;S.settings.apiKey=k;save();render();if(ch&&p!=='none'&&k)refreshAll(true);});
$('#btnExport').onclick=exportJSON;
$('#btnCloudSave').onclick=()=>{$('#setToken').value&&localStorage.setItem(TOKEN_KEY,$('#setToken').value.trim());closeDlg();saveOnline();};
$('#btnCloudLoad').onclick=()=>{closeDlg();loadOnline();};
$('#btnImport').onclick=()=>$('#fileImport').click();
$('#fileImport').onchange=e=>{const f=e.target.files[0];if(f)importJSON(f);e.target.value='';closeDlg();};
const loadDemo=async()=>{const has=SECTIONS.some(s=>S[s.k].length)&&!S.demo;if(dlg.open)closeDlg();if(has&&!await ask('Remplacer tes données par la démo ?',{ok:'Charger la démo',sub:'Pense à exporter avant.'}))return;S=demo();save();render();refreshAll(false);};
$('#btnDemo').onclick=loadDemo;$('#btnDemo2').onclick=loadDemo;
$('#btnReset').onclick=async()=>{closeDlg();if(!await ask('Effacer toutes les données de ce navigateur ?',{ok:'Tout effacer',danger:1}))return;const st=S.settings;S=blank();S.settings.provider=st.provider;S.settings.apiKey=st.apiKey;save();render();toast('Données effacées');};
$('#btnClearDemo').onclick=()=>{const st=S.settings;S=blank();S.settings.provider=st.provider;S.settings.apiKey=st.apiKey;save();render();};
render();hashImport();syncFromRemote().finally(()=>refreshAll(false));
window.addEventListener('hashchange',hashImport);
window.addEventListener('pageshow',hashImport);
window.addEventListener('focus',hashImport);
setInterval(()=>{if(!document.hidden)refreshAll(false);},5*60e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-S.cryptoAt>5*60e3)refreshAll(false);});
})();
