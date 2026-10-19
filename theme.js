// applies the saved light/dark choice before first paint (UI preference only, key 'pfdash.theme')
(function(){var t='dark';try{t=localStorage.getItem('pfdash.theme')==='light'?'light':'dark';}catch(e){}
document.documentElement.dataset.theme=t;if(t==='light'){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#f4f6fa');}})();
