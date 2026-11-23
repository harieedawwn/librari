const sortP=a=>a.sort((x,y)=>(x.type==y.type?0:x.type=='folder'?-1:1)||x.name.localeCompare(y.name,'vi'));
function updateTop(){const f=ALL.find(x=>x.id===cur);$('#ttl').textContent=f?f.name:'librari';B.classList.toggle('fol',!!cur);const t=$('#top');t.style.width='';requestAnimationFrame(()=>glass(t,...t._p))}
function showDir(id,push){cur=id||null;if(push)history.pushState({d:cur},'');P=sortP(ALL.filter(x=>x.parent===cur));tgt=S=0;render();updateTop()}
function refresh(){P=sortP(ALL.filter(x=>x.parent===cur));render();updateTop()}
$('#back').onclick=()=>{const f=ALL.find(x=>x.id===cur);showDir(f?f.parent:null,false)};
/* đọc thẳng từ repo (luôn mới nhất, không chờ Pages deploy); lỗi thì dùng bản trên Pages */
async function loadLib(){const h={Accept:'application/vnd.github.raw+json'};if(TOK)h.Authorization='Bearer '+TOK;
try{const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/data/library.json?ref=${CFG.branch}&t=${Date.now()}`,{headers:h,cache:'no-store'});if(!r.ok)throw 0;return(await r.json()).items||[]}
catch{try{const r=await fetch('data/library.json?'+Date.now(),{cache:'no-store'});return r.ok?(await r.json()).items||[]:[]}catch{return[]}}}
loadLib().then(it=>{ALL=it;refresh()});
gl($('#top'),20,40);document.querySelectorAll('#tools .bt,#back').forEach(b=>gl(b,12,24));
