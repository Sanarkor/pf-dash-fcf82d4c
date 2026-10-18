'use strict';
// GoatCounter visit counter (same account as the QCM site, separate path so this page is counted on its own)
(function(){
  var GC='https://sanarkor.goatcounter.com',PATH='/pf-dash-san';
  var pill=document.getElementById('gcPill'),num=document.getElementById('gcNum');
  function show(n){if(!pill||!num)return;num.textContent=n.toLocaleString('fr-FR');pill.title=n+(n>1?' visiteurs uniques':' visiteur unique')+' (GoatCounter)';pill.hidden=false;}
  show(0); // visible even before / without an answer
  fetch(GC+'/counter/'+encodeURIComponent(PATH)+'.json',{credentials:'omit',referrerPolicy:'no-referrer'})
    .then(function(r){return r.status===404?{count_unique:'0'}:(r.ok?r.json():null);})
    .then(function(d){if(!d)return;var n=parseInt(String(d.count_unique||d.count||'0').replace(/[^0-9]/g,''),10);show(isFinite(n)?n:0);})
    .catch(function(){});
})();
