/* ---- mật khẩu (PBKDF2) + token mã hóa AES-GCM; "ghi nhớ" = khóa không xuất được trong IndexedDB ---- */
const E=new TextEncoder(),D=new TextDecoder(),ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),hex=u=>[...u].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s)};
const base=pw=>crypto.subtle.importKey('raw',E.encode(pw),'PBKDF2',false,['deriveBits','deriveKey']);
const hx=async pw=>hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:E.encode('hd-pf-v1'),iterations:200000,hash:'SHA-256'},await base(pw),256)));
const ak=async(pw,sl='hd-tk-v1')=>crypto.subtle.deriveKey({name:'PBKDF2',salt:E.encode(sl),iterations:200000,hash:'SHA-256'},await base(pw),{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
async function putTok(pw,t){const iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await ak(pw),E.encode(t));localStorage.tk=b64(iv)+'.'+b64(new Uint8Array(ct))}
async function getTok(pw){for(const sl of['hd-tk-v1','librari-tk-v1'])try{const[i,c]=localStorage.tk.split('.');return D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(i)},await ak(pw,sl),ub(c)))}catch{}return null}
const idb=(m,v,nm='kho')=>new Promise((ok,no)=>{const r=indexedDB.open(nm,1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onerror=()=>no(r.error);
r.onsuccess=()=>{const s=r.result.transaction('k',m==='get'?'readonly':'readwrite').objectStore('k'),q=m==='get'?s.get('a'):m==='del'?s.delete('a'):s.put(v,'a');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}});
async function remember(t){const k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));await idb('put',{k,iv,c:await crypto.subtle.encrypt({name:'AES-GCM',iv},k,E.encode(t))})}
async function recall(){for(const nm of['kho','librari-k'])try{const a=await idb('get',0,nm);if(a)return D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:a.iv},a.k,a.c))}catch{}return null}
async function recallOld(){try{const a=await idb('get');return a?D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:a.iv},a.k,a.c)):null}catch{return null}}
async function check(t){const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}`,{headers:{Authorization:'Bearer '+t,Accept:'application/vnd.github+json'},cache:'no-store'});
if(r.status===401)throw Error('Token hết hạn hoặc sai');if(!r.ok)throw Error('GitHub '+r.status);const j=await r.json();if(j.permissions&&!j.permissions.push)throw Error('Token không có quyền ghi')}
const enter=t=>{TOK=t;adm=true;B.classList.add('adm');loadLib().then(it=>{if(it.length||!ALL.length){ALL=it;refresh()}})};
$('#sec').onclick=async()=>{if(adm)return;const t=await recall();if(t){try{await check(t);return enter(t)}catch{}}
dlg('Đăng nhập',`<input id="pw" type="password" placeholder="Mật khẩu" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false"><input id="tk" type="password" placeholder="${localStorage.tk?'Token GitHub (đã lưu - để trống nếu không đổi)':'Token GitHub (chỉ nhập 1 lần)'}" autocomplete="off" autocapitalize="off" spellcheck="false"><label class="ck"><input id="sw" type="checkbox"> Hiện chữ đang gõ</label><p style="font-size:14px;opacity:.7">Nhớ tắt bộ gõ tiếng Việt (Unikey/Telex) khi gõ mật khẩu.</p>`,async d=>{
const pw=$('#pw',d).value;if(await hx(pw)!==HASH)throw Error('Sai mật khẩu');const nt=$('#tk',d)?$('#tk',d).value.trim():'',t=nt||await getTok(pw);if(!t)throw Error('Chưa đọc được token đã lưu, hãy dán token GitHub vào ô bên dưới');
await check(t);if(nt)await putTok(pw,t);await remember(t);enter(t);return true},'Vào');
$('#sw').onchange=e=>{$('#pw').type=$('#tk').type=e.target.checked?'text':'password'}};
$('#out').onclick=()=>{adm=false;TOK=null;B.classList.remove('adm');idb('del').catch(()=>{})};
/* ---- ghi vào repo: mọi thay đổi gom thành MỘT commit (Git Data API) ---- */
async function api(p,m='GET',b){const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/${p}`,{method:m,cache:'no-store',headers:{Authorization:'Bearer '+TOK,Accept:'application/vnd.github+json'},body:b?JSON.stringify(b):undefined});
if(!r.ok)throw Error('GitHub '+r.status+': '+((await r.json().catch(()=>({}))).message||''));return r.json()}
async function commit(msg,files,fn){const ent=Object.entries(files);
const blobs=await Promise.all(ent.filter(e=>e[1]).map(async([path,c])=>({path,mode:'100644',type:'blob',sha:(await api('git/blobs','POST',{content:c,encoding:'base64'})).sha})));
for(let n=0;;n++){const head=(await api('git/ref/heads/'+CFG.branch)).object.sha,bt=(await api('git/commits/'+head)).tree.sha;
let j={items:[]};try{const f=await api('contents/data/library.json?ref='+head);j=JSON.parse(D.decode(ub(f.content.replace(/\n/g,''))))}catch{}
fn(j);const jb=(await api('git/blobs','POST',{content:b64(E.encode(JSON.stringify(j))),encoding:'base64'})).sha;
const tree=(await api('git/trees','POST',{base_tree:bt,tree:[...blobs,{path:'data/library.json',mode:'100644',type:'blob',sha:jb},...ent.filter(e=>!e[1]).map(([path])=>({path,mode:'100644',type:'blob',sha:null}))]})).sha;
const c=(await api('git/commits','POST',{message:msg,tree,parents:[head]})).sha;
try{await api('git/refs/heads/'+CFG.branch,'PATCH',{sha:c});ALL=j.items;refresh();return}catch(e){if(n>1)throw e}}}
const busy=async f=>{B.style.cursor='progress';try{await f()}catch(e){dlg('Lỗi',`<p>${esc(e.message)}</p>`,null,'')}B.style.cursor=''};
/* ---- tải lên / thư mục / sửa ---- */
$('#add').onclick=()=>$('#fi').click();
async function upl(files){const f={},add=[];for(const x of files){if(!/\.html?$/i.test(x.name)&&x.type!='text/html')continue;const id=uid(),buf=new Uint8Array(await x.arrayBuffer());f['files/'+id+'.html']=b64(buf);LOCAL[id]=D.decode(buf);add.push({id,type:'file',parent:cur,name:x.name.replace(/\.html?$/i,'')})}
if(add.length)busy(()=>commit('Thêm '+add.length+' file',f,j=>j.items.push(...add)))}
$('#fi').onchange=e=>{upl([...e.target.files]);e.target.value=''};
addEventListener('dragover',e=>{if(adm&&e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
addEventListener('drop',e=>{if(adm&&e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();upl([...e.dataTransfer.files])}});
$('#nf').onclick=()=>dlg('Thư mục mới','<input type="text" placeholder="Tên thư mục" autocomplete="off">',async d=>{const n=$('input',d).value.trim();if(!n)throw Error('Cần đặt tên');await commit('Thư mục '+n,{},j=>j.items.push({id:uid(),type:'folder',parent:cur,name:n}));return true},'Tạo');
function openEdit(p){const id=p.id,bad=p.type=='folder'?[id,...subs(id).map(x=>x.id)]:[],pth=x=>{const f=ALL.find(y=>y.id===x);return f?(f.parent?pth(f.parent)+' / ':'')+f.name:''};
const opts='<option value="">Gốc</option>'+ALL.filter(f=>f.type=='folder'&&!bad.includes(f.id)).map(f=>`<option value="${f.id}"${f.id===p.parent?' selected':''}>${esc(pth(f.id))}</option>`).join('');
const d=dlg('Sửa',`<input type="text" id="nm" value="${esc(p.name)}" autocomplete="off"><select id="pr">${opts}</select><label class="ck"><input id="pi" type="checkbox"${p.pin?' checked':''}> Ghim lên đầu</label>${p.type=='file'?'<label class="ck"><input id="sd" type="checkbox"> Đổi họa tiết thumbnail</label>':''}`,async d=>{
const n=$('#nm',d).value.trim(),t=$('#pr',d).value||null,sd=$('#sd',d)&&$('#sd',d).checked?Math.random().toString(36).slice(2,6):null;const pin=$('#pi',d).checked;if(!n)throw Error('Cần đặt tên');
await commit('Sửa '+n,{},j=>{const x=j.items.find(y=>y.id==id);x.name=n;x.parent=t;if(pin)x.pin=1;else delete x.pin;if(sd)x.seed=sd});return true},'Lưu','<button type="button" class="bt dn">Xóa</button>');
$('.dn',d).onclick=()=>{d.close();delItem(p)}}
function delItem(p){const id=p.id,all=subs(id);dlg('Xóa "'+esc(p.name)+'"?',`<p>${all.length?'Xóa luôn '+all.length+' mục bên trong. ':''}Không thể hoàn tác.</p>`,async()=>{const ids=[id,...all.map(x=>x.id)],f={};[p,...all].filter(x=>x.type=='file').forEach(x=>f['files/'+x.id+'.html']=null);await commit('Xóa '+p.name,f,j=>{j.items=j.items.filter(x=>!ids.includes(x.id))});return true},'Xóa')}
/* ---- chuột phải: menu thao tác nhanh ---- */
const cmClose=()=>{const m=$('.cm');m&&m.remove()};
function cmShow(x,y,rows){cmClose();const m=mk('div','cm');m.oncontextmenu=e=>e.preventDefault();
rows.forEach(r=>{if(r==='-')return m.append(mk('hr'));if(r.h)return m.append(mk('div','ch',esc(r.h)));const b=mk('button',r.d?'dn':'',esc(r.t));b.onclick=()=>{cmClose();r.f()};m.append(b)});
B.append(m);const w=m.offsetWidth,h=m.offsetHeight;m.style.left=Math.max(6,Math.min(x,innerWidth-w-6))+'px';m.style.top=Math.max(6,Math.min(y,innerHeight-h-6))+'px';m.style.maxHeight=innerHeight-12+'px'}
const upd=(msg,fn)=>busy(()=>commit(msg,{},fn));
function cmItem(x,y,p){const id=p.id;
const dest=()=>{const bad=p.type=='folder'?[id,...subs(id).map(z=>z.id)]:[],pth=z=>{const f=ALL.find(q=>q.id===z);return f?(f.parent?pth(f.parent)+' / ':'')+f.name:''},rows=[{h:'Chuyển tới'}];
if(p.parent)rows.push({t:'Gốc',f:()=>moveItem(p,null)});ALL.filter(f=>f.type=='folder'&&!bad.includes(f.id)&&f.id!==p.parent).forEach(f=>rows.push({t:pth(f.id),f:()=>moveItem(p,f.id)}));if(rows.length==1)rows.push({t:'(Không có thư mục nào khác)',f:()=>{}});cmShow(x,y,rows)};
cmShow(x,y,[{t:p.type=='folder'?'Mở thư mục':'Mở',f:()=>openP(p)},'-',{t:'Chuyển tới…',f:dest},{t:p.pin?'Bỏ ghim':'Ghim lên đầu',f:()=>upd((p.pin?'Bỏ ghim ':'Ghim ')+p.name,j=>{const q=j.items.find(z=>z.id==id);if(q.pin)delete q.pin;else q.pin=1})},
{t:'Đổi tên',f:()=>dlg('Đổi tên','<input type="text" id="nm" value="'+esc(p.name)+'" autocomplete="off">',async d=>{const n=$('#nm',d).value.trim();if(!n)throw Error('Cần đặt tên');await commit('Đổi tên '+n,{},j=>{j.items.find(z=>z.id==id).name=n});return true},'Lưu')},
...(p.type=='file'?[{t:'Đổi họa tiết',f:()=>upd('Đổi họa tiết',j=>{j.items.find(z=>z.id==id).seed=Math.random().toString(36).slice(2,6)})}]:[]),{t:'Chỉnh sửa…',f:()=>openEdit(p)},'-',{t:'Xóa',d:1,f:()=>delItem(p)}])}
$('#stage').addEventListener('contextmenu',e=>{if(!adm||drag||(pd&&pd.touch))return;e.preventDefault();const c=e.target.closest('.card');
if(c)cmItem(e.clientX,e.clientY,c._p);else cmShow(e.clientX,e.clientY,[{t:'Tải HTML lên',f:()=>$('#fi').click()},{t:'Thư mục mới',f:()=>$('#nf').click()}])});
addEventListener('pointerdown',e=>{if(!e.target.closest('.cm'))cmClose()},true);addEventListener('keydown',e=>{if(e.key==='Escape')cmClose()});$('#stage').addEventListener('scroll',cmClose);
