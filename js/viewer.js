/* ---- hộp thoại (dạng form như bản gốc) ---- */
function dlg(t,body,go,ok='Lưu',extra=''){const o=mk('div','ov'),d=mk('form','dg',`<h2>${t}</h2>${body}<div class="acts end">${extra}<button type="button" class="bt x">Hủy</button>${ok?`<button class="bt pri">${ok}</button>`:''}</div><p class="er" role="alert"></p>`);
o.append(d);B.append(o);const er=$('.er',d),sb=$('.pri',d);$('.x',d).onclick=()=>o.remove();o.onpointerdown=e=>{if(e.target===o)o.remove()};d.close=()=>o.remove();
d.onsubmit=async e=>{e.preventDefault();if(!sb||sb.disabled)return;sb.disabled=true;er.textContent='Đang xử lý…';try{if(await go(d))o.remove();else er.textContent=''}catch(x){er.textContent=x.message}sb.disabled=false};
const f=$('input:not([type=file]):not([type=checkbox]),textarea',d);if(f)f.focus();return d}
/* ---- mở thư mục / xem file toàn màn hình ---- */
let vurl=null,qt,skip=0;
const wake=()=>{const v=$('#view');v.classList.remove('q');clearTimeout(qt);qt=setTimeout(()=>v.classList.add('q'),2500)};
async function openP(p){if(p.type==='folder')return showDir(p.id,true);
const v=$('#view'),f=mk('iframe');let html=LOCAL[p.id];
if(html==null){try{const r=await fetch('files/'+p.id+'.html',{cache:'no-store'});if(r.ok)html=await r.text();else throw 0}catch{try{const h={Accept:'application/vnd.github.raw+json'};if(TOK)h.Authorization='Bearer '+TOK;
const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/files/${p.id}.html?ref=${CFG.branch}`,{headers:h,cache:'no-store'});if(r.ok)html=await r.text()}catch{}}}
if(html==null)return dlg('Chưa mở được','<p>File chưa sẵn sàng, thử lại sau ít giây.</p>',null,'');
vurl=URL.createObjectURL(new Blob([html],{type:'text/html'}));
f.allow='fullscreen;autoplay;accelerometer;gyroscope;microphone;camera;clipboard-write;web-share';f.setAttribute('allowfullscreen','');f.src=vurl;
$('iframe',v)?.remove();v.prepend(f);v.style.display='block';B.style.overflow='hidden';wake();history.pushState({v:1},'')}
function closeView(pop){const v=$('#view');v.style.display='none';$('iframe',v)?.remove();vurl&&vurl.startsWith('blob:')&&URL.revokeObjectURL(vurl);vurl=null;if(document.fullscreenElement)document.exitFullscreen();if(!pop&&history.state&&history.state.v){skip=1;history.back()}}
$('#vx').onclick=()=>closeView();
addEventListener('popstate',()=>{if(skip){skip=0;return}if($('#view').style.display==='block')closeView(1);else if(cur){const f=ALL.find(x=>x.id===cur);showDir(f?f.parent:null,false)}});
$('#vf').onclick=()=>{const v=$('#view');document.fullscreenElement?document.exitFullscreen():(v.requestFullscreen||v.webkitRequestFullscreen||(()=>{})).call(v)};
$('#vb').addEventListener('pointerenter',wake);$('#vb').addEventListener('touchstart',wake,{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#view').style.display==='block')closeView()});
