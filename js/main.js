const sortP=a=>a.sort((x,y)=>(x.type==y.type?0:x.type=='folder'?-1:1)||x.name.localeCompare(y.name,'vi'));
function updateTop(){const f=ALL.find(x=>x.id===cur);$('#ttl').textContent=f?f.name:'librari';B.classList.toggle('fol',!!cur);const t=$('#top');t.style.width='';requestAnimationFrame(()=>glass(t,...t._p))}
function showDir(id,push){cur=id||null;if(push)history.pushState({d:cur},'');P=sortP(ALL.filter(x=>x.parent===cur));tgt=S=0;render();updateTop()}
function refresh(){P=sortP(ALL.filter(x=>x.parent===cur));render();updateTop()}
$('#back').onclick=()=>{const f=ALL.find(x=>x.id===cur);showDir(f?f.parent:null,false)};
fetch('data/library.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():{items:[]}).then(j=>{ALL=j.items||[];refresh()}).catch(()=>render());
gl($('#top'),20,40);document.querySelectorAll('#tools .bt,#back').forEach(b=>gl(b,12,24));
