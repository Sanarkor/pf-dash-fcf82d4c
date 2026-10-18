'use strict';
(function(){
const KEY='pfdash.v1';
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
  return b;
}
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
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2600);}
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
  st.push('Actions : '+(S.settings.provider==='none'?'manuel':ago(S.stocksAt)));$('#status').textContent=st.join(' · ');
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
  for(const sec of SECTIONS){const v=secVal(sec);if(!v.offN)continue;
    const li=el('li',{class:'mut off'},el('span',{class:'dot'}),el('span',{class:'nm',text:sec.name+' hors total'}),el('span',{class:'pc',text:''}),el('span',{class:'vl amt',text:eur(v.off)}));li.style.setProperty('--c','#64748b');lg.appendChild(li);}
}
function renderSection(sec){
  const v=secVal(sec);const collapsed=!!S.settings.collapsed[sec.k];
  const card=el('section',{class:'card sec'+(collapsed?' collapsed':''),id:'sec-'+sec.k});card.style.setProperty('--c',sec.color);
  const sub=S[sec.k].length+(sec.type==='sav'?' compte(s)':' ligne(s)');
  const head=el('div',{class:'sec-head',onclick:()=>{S.settings.collapsed[sec.k]=!collapsed;save();render();}},
    el('div',{class:'sec-title'},el('span',{class:'bar'}),el('div',null,el('div',{text:(collapsed?'▸ ':'▾ ')+sec.name}),el('div',{class:'sec-sub',text:sub}))),
    el('div',{class:'sec-tot'},el('div',{class:'v amt',text:eur(v.value)}),
      isFinite(v.pnl)?el('div',{class:'p amt '+cls(v.pnl),text:signed(v.pnl)+(v.cost>0?' ('+pct(v.pnl/v.cost*100)+')':'')}):null,
      v.offN?el('div',{class:'p mut amt',text:'+ '+eur(v.off)+' hors total'}):null));
  card.appendChild(head);
  const body=el('div',{class:'sec-body'});const list=el('div',{class:'lines'});
  for(const l of S[sec.k]){list.appendChild(editing[sec.k]===l.id?editForm(sec,l):lineRow(sec,l));}
  if(editing[sec.k]==='new')list.appendChild(editForm(sec,null));
  body.appendChild(list);
  if(editing[sec.k]!=='new')body.appendChild(el('button',{class:'add',onclick:()=>{editing[sec.k]='new';render();focusFirst(sec.k);}},'+ Ajouter '+(sec.type==='sav'?'un compte':sec.type==='cry'?'une crypto':'une ligne')));
  card.appendChild(body);return card;
}
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
    if(l.priceAt)bits.push((l.priceSrc==='auto'?'auto ':'saisi ')+ago(l.priceAt));b=bits.join(' · ');
    if(v.missing)tags.push(el('span',{class:'tag',text:'cours manquant'}));if(v.fxMissing)tags.push(el('span',{class:'tag',text:'change ?'}));
  }
  return el('div',{class:'ln'+(sec.type==='sav'&&l.inTotal===false?' off':''),tabindex:'0',role:'button',onclick:()=>{editing[sec.k]=l.id;render();focusFirst(sec.k);},onkeydown:e=>{if(e.key==='Enter'){editing[sec.k]=l.id;render();focusFirst(sec.k);}}},
    el('div',{class:'a'},a,...tags),
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
    f.append(inp('ticker','Ticker / ISIN',l.ticker,{ph:'ex. CW8'}),inp('name','Nom (facultatif)',l.name),inp('qty','Quantité',l.qty,{num:1}),inp('pru','PRU',l.pru,{num:1}),
      el('label',null,'Devise',cur),inp('price','Dernier cours',l.price,{num:1}),inp('apiSym','Symbole API (facultatif)',l.apiSym,{ph:'ex. CW8:EURONEXT'}));
  }
  const btns=el('div',{class:'btns'});
  if(!isNew)btns.append(el('button',{type:'button',class:'danger',onclick:()=>{if(confirm('Supprimer cette ligne ?')){S[sec.k]=S[sec.k].filter(x=>x.id!==l.id);delete editing[sec.k];save();render();}}},'Supprimer'));
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
  else{if(!g('ticker')){toast('Ticker requis');return;}o={ticker:g('ticker').toUpperCase(),name:g('name'),qty:n('qty')??0,pru:n('pru'),cur:g('cur')||'EUR',apiSym:g('apiSym')};o.price=n('price');}
  const arr=S[sec.k];const ex=arr.find(x=>x.id===id);
  if(ex){
    if(sec.type!=='sav'&&o.price!==ex.price){o.priceAt=o.price===null?0:Date.now();o.priceSrc='manuel';}
    if(sec.type==='cry'&&o.sym!==ex.sym&&!g('cgId'))o.cgId='';
    Object.assign(ex,o);
  }else{o.id=uid();if(sec.type!=='sav'&&o.price!==null){o.priceAt=Date.now();o.priceSrc='manuel';}arr.push(o);}
  delete editing[sec.k];save();render();
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
async function refreshStocks(){
  const prov=S.settings.provider,key=(S.settings.apiKey||'').trim();if(prov==='none'||!key)return null;
  const lines=[...S.pea,...S.cto].filter(l=>l.apiSym||l.ticker);if(!lines.length)return null;
  const symOf=l=>(l.apiSym||l.ticker).trim();let ok=0,fail=0;const now=Date.now();
  if(prov==='twelvedata'){
    const syms=[...new Set(lines.map(symOf))];
    try{const d=await getJSON('https://api.twelvedata.com/price?apikey='+encodeURIComponent(key)+'&symbol='+syms.map(encodeURIComponent).join(','));
      const get=s=>syms.length===1?d:d[s];
      for(const l of lines){const r=get(symOf(l));const p=r&&num(r.price);if(isFinite(p)){l.price=p;l.priceAt=now;l.priceSrc='auto';ok++;}else fail++;}
    }catch(e){fail=lines.length;}
  }else if(prov==='alphavantage'){
    const cache={};
    for(const l of lines){const s=symOf(l);
      if(!(s in cache)){try{const d=await getJSON('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol='+encodeURIComponent(s)+'&apikey='+encodeURIComponent(key));
        cache[s]=num(d['Global Quote']&&d['Global Quote']['05. price']);}catch(e){cache[s]=NaN;}}
      if(isFinite(cache[s])){l.price=cache[s];l.priceAt=now;l.priceSrc='auto';ok++;}else fail++;}
  }
  if(ok)S.stocksAt=now;return {ok,fail};
}
let busy=false;
async function refreshAll(manual){
  if(busy)return;busy=true;$('#btnRefresh').classList.add('spin');
  const msgs=[];
  const fxOk=await refreshFx();if(!fxOk)msgs.push('change indisponible');
  const cOk=await refreshCrypto(false);if(!cOk)msgs.push('crypto indisponible');
  let st=null;if(manual||Date.now()-S.stocksAt>3600e3)st=await refreshStocks();
  if(st&&st.fail)msgs.push(st.fail+' cours action non trouvé(s)');
  save();render();busy=false;$('#btnRefresh').classList.remove('spin');
  if(manual)toast(msgs.length?'Actualisé — '+msgs.join(', '):'Cours actualisés');
}

/* ---------- demo / io ---------- */
function demo(){
  const d=blank();d.demo=true;d.settings=Object.assign({},S.settings,{collapsed:{}});d.fx=S.fx;
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
function applyImport(d){const keepKey=S.settings.apiKey;S=normalize(d);if(!S.settings.apiKey&&keepKey)S.settings.apiKey=keepKey;save();render();refreshAll(false);}
async function hashImport(){
  const h=location.hash;if(!h.startsWith('#import='))return;
  const clear=()=>history.replaceState(null,'',location.pathname+location.search);
  try{
    let b64=decodeURIComponent(h.slice(8)).replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
    let bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    let txt;
    if(bytes[0]===0x7b||bytes[0]===0xef){txt=new TextDecoder().decode(bytes);}
    else{const fmt=(bytes[0]&0x0f)===8&&((bytes[0]<<8)|bytes[1])%31===0?'deflate':'deflate-raw';
      const st=new Blob([bytes]).stream().pipeThrough(new DecompressionStream(fmt));txt=await new Response(st).text();}
    const d=JSON.parse(txt);if(!isData(d))throw new Error('format');
    clear();
    if(!confirm('Importer ces données ?'+(SECTIONS.some(s=>S[s.k].length)?'\n(Les données actuelles de ce navigateur seront remplacées.)':'')))return;
    applyImport(d);toast('Import réussi');
  }catch(e){clear();toast('Lien d\'import invalide');}
}
function importJSON(file){
  const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!isData(d))throw new Error('format');
    if(!confirm('Remplacer les données actuelles par celles du fichier ?'))return;
    applyImport(d);toast('Import réussi');}
    catch(e){toast('Fichier invalide');}};r.readAsText(file);
}

/* ---------- wire ---------- */
$('#btnRefresh').onclick=()=>refreshAll(true);
$('#btnMask').onclick=()=>{S.settings.masked=!S.settings.masked;save();render();};
const dlg=$('#dlgSettings');
$('#btnSettings').onclick=()=>{$('#setProvider').value=S.settings.provider||'none';$('#setKey').value=S.settings.apiKey||'';dlg.showModal();};
dlg.addEventListener('close',()=>{const p=$('#setProvider').value,k=$('#setKey').value.trim();const ch=p!==S.settings.provider||k!==S.settings.apiKey;
  S.settings.provider=p;S.settings.apiKey=k;save();render();if(ch&&p!=='none'&&k)refreshAll(true);});
$('#btnExport').onclick=exportJSON;
$('#btnImport').onclick=()=>$('#fileImport').click();
$('#fileImport').onchange=e=>{const f=e.target.files[0];if(f)importJSON(f);e.target.value='';dlg.close();};
const loadDemo=()=>{const has=SECTIONS.some(s=>S[s.k].length)&&!S.demo;if(has&&!confirm('Remplacer tes données par la démo ? (pense à exporter avant)'))return;S=demo();save();render();refreshAll(false);if(dlg.open)dlg.close();};
$('#btnDemo').onclick=loadDemo;$('#btnDemo2').onclick=loadDemo;
$('#btnReset').onclick=()=>{if(!confirm('Effacer toutes les données de ce navigateur ?'))return;const st=S.settings;S=blank();S.settings.provider=st.provider;S.settings.apiKey=st.apiKey;save();render();dlg.close();toast('Données effacées');};
$('#btnClearDemo').onclick=()=>{const st=S.settings;S=blank();S.settings.provider=st.provider;S.settings.apiKey=st.apiKey;save();render();};
render();refreshAll(false);hashImport();
window.addEventListener('hashchange',hashImport);
setInterval(()=>{if(!document.hidden)refreshAll(false);},5*60e3);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-S.cryptoAt>5*60e3)refreshAll(false);});
})();
