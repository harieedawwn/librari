/* ---- mật khẩu (PBKDF2) + token mã hóa AES-GCM; "ghi nhớ" = khóa không xuất được trong IndexedDB ---- */
const E=new TextEncoder(),D=new TextDecoder(),ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),hex=u=>[...u].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s)};
const base=pw=>crypto.subtle.importKey('raw',E.encode(pw),'PBKDF2',false,['deriveBits','deriveKey']);
const hx=async pw=>hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:E.encode('librari-v1'),iterations:200000,hash:'SHA-256'},await base(pw),256)));
const ak=async pw=>crypto.subtle.deriveKey({name:'PBKDF2',salt:E.encode('librari-tk-v1'),iterations:200000,hash:'SHA-256'},await base(pw),{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
async function putTok(pw,t){const iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await ak(pw),E.encode(t));localStorage.tk=b64(iv)+'.'+b64(new Uint8Array(ct))}
async function getTok(pw){try{const[i,c]=localStorage.tk.split('.');return D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(i)},await ak(pw),ub(c)))}catch{return null}}
const idb=(m,v)=>new Promise((ok,no)=>{const r=indexedDB.open('librari-k',1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onerror=()=>no(r.error);
r.onsuccess=()=>{const s=r.result.transaction('k',m==='get'?'readonly':'readwrite').objectStore('k'),q=m==='get'?s.get('a'):m==='del'?s.delete('a'):s.put(v,'a');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}});
async function remember(t){const k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));await idb('put',{k,iv,c:await crypto.subtle.encrypt({name:'AES-GCM',iv},k,E.encode(t))})}
async function recall(){try{const a=await idb('get');return a?D.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:a.iv},a.k,a.c)):null}catch{return null}}
async function check(t){const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}`,{headers:{Authorization:'Bearer '+t,Accept:'application/vnd.github+json'},cache:'no-store'});
if(r.status===401)throw Error('Token hết hạn hoặc sai');if(!r.ok)throw Error('GitHub '+r.status);const j=await r.json();if(j.permissions&&!j.permissions.push)throw Error('Token không có quyền ghi')}
const enter=t=>{TOK=t;adm=true;B.classList.add('adm')};
$('#sec').onclick=async()=>{if(adm)return;const t=await recall();if(t){try{await check(t);return enter(t)}catch{}}
dlg('Đăng nhập',`<input id="pw" type="password" placeholder="Mật khẩu" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false"><input id="tk" type="password" placeholder="${localStorage.tk?'Token GitHub (đã lưu)':'Token GitHub'}" autocomplete="off" autocapitalize="off" spellcheck="false"><label class="ck"><input id="sw" type="checkbox"> Hiện chữ đang gõ</label>`,async d=>{
const pw=$('#pw',d).value;if(await hx(pw)!==HASH)throw Error('Sai mật khẩu');const nt=$('#tk',d).value.trim(),t=nt||await getTok(pw);if(!t)throw Error('Cần token GitHub');
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
$('#fi').onchange=async e=>{const f={},add=[];for(const x of e.target.files){if(!/\.html?$/i.test(x.name)&&x.type!='text/html')continue;const id=uid(),buf=new Uint8Array(await x.arrayBuffer());f['files/'+id+'.html']=b64(buf);LOCAL[id]=D.decode(buf);add.push({id,type:'file',parent:cur,name:x.name.replace(/\.html?$/i,'')})}
e.target.value='';if(add.length)busy(()=>commit('Thêm '+add.length+' file',f,j=>j.items.push(...add)))};
$('#nf').onclick=()=>dlg('Thư mục mới','<input type="text" placeholder="Tên thư mục" autocomplete="off">',async d=>{const n=$('input',d).value.trim();if(!n)throw Error('Cần đặt tên');await commit('Thư mục '+n,{},j=>j.items.push({id:uid(),type:'folder',parent:cur,name:n}));return true},'Tạo');
$('#ed').onclick=()=>{const p=P[act];if(!p)return;const id=p.id,bad=p.type=='folder'?[id,...subs(id).map(x=>x.id)]:[],pth=x=>{const f=ALL.find(y=>y.id===x);return f?(f.parent?pth(f.parent)+' / ':'')+f.name:''};
const opts='<option value="">Gốc</option>'+ALL.filter(f=>f.type=='folder'&&!bad.includes(f.id)).map(f=>`<option value="${f.id}"${f.id===p.parent?' selected':''}>${esc(pth(f.id))}</option>`).join('');
const d=dlg('Sửa',`<input type="text" id="nm" value="${esc(p.name)}" autocomplete="off"><select id="pr">${opts}</select>${p.type=='file'?'<label class="ck"><input id="sd" type="checkbox"> Đổi họa tiết thumbnail</label>':''}`,async d=>{
const n=$('#nm',d).value.trim(),t=$('#pr',d).value||null,sd=$('#sd',d)&&$('#sd',d).checked?Math.random().toString(36).slice(2,6):null;if(!n)throw Error('Cần đặt tên');
await commit('Sửa '+n,{},j=>{const x=j.items.find(y=>y.id==id);x.name=n;x.parent=t;if(sd)x.seed=sd});return true},'Lưu','<button type="button" class="bt dn">Xóa</button>');
$('.dn',d).onclick=()=>{d.close();const all=subs(id);dlg('Xóa "'+esc(p.name)+'"?',`<p>${all.length?'Xóa luôn '+all.length+' mục bên trong. ':''}Không thể hoàn tác.</p>`,async()=>{const ids=[id,...all.map(x=>x.id)],f={};[p,...all].filter(x=>x.type=='file').forEach(x=>f['files/'+x.id+'.html']=null);await commit('Xóa '+p.name,f,j=>{j.items=j.items.filter(x=>!ids.includes(x.id))});return true},'Xóa')}};
