/* ---- lưới ô vuông (5 ô / dòng), cuộn dọc; kéo-thả để chuyển file vào / ra thư mục ---- */
const cv=$('#cv'),stage=$('#stage'),track=$('#track'),fine=matchMedia('(pointer:fine)').matches;
let cards=[],S=0,drag=null,pd=null,sup=false;
const M={x:-999,y:-999,sx:-999,sy:-999,on:false};
const PIN='<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 6 3 3v2h-4v6l-1 2-1-2v-6H7v-2l3-3z" fill="currentColor"/></svg>',DOTS='<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/></svg>';
function card(p,i){const f=p.type==='folder',c=mk('div','card ok'+(f?' fo':'')+(p.pin?' pinned':''));c._p=p;c.tabIndex=0;c.setAttribute('role','button');c.style.setProperty('--d',Math.min(i,12)*40+'ms');c.setAttribute('aria-label',p.name);
const n=f?ALL.filter(x=>x.parent===p.id).length:0;
c.innerHTML=`<span class="ph">${f?`<span class="ico">${FOLDER}</span>`:art(p.name+(p.seed||''))}<span class="tt">${esc(p.name)}${f?`<small>${n} mục</small>`:''}</span></span>${p.pin?`<span class="pn">${PIN}</span>`:''}<button class="eb" aria-label="Sửa">${DOTS}</button>`;return c}
function render(){track.textContent='';cards=P.map(card);track.append(...cards);if(!cards.length)track.append(mk('p','em','Chưa có gì ở đây'))}
track.addEventListener('click',e=>{if(sup)return;const c=e.target.closest('.card');if(!c)return;if(e.target.closest('.eb'))return openEdit(c._p);openP(c._p)});
track.addEventListener('keydown',e=>{const c=e.target.closest('.card');if(c&&e.target===c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openP(c._p)}});
track.addEventListener('contextmenu',e=>{if(adm)e.preventDefault()});
/* kéo-thả (chuột: kéo; cảm ứng: giữ lâu rồi kéo) */
const tgOf=e=>{const el=document.elementFromPoint(e.clientX,e.clientY);if(!el)return null;const b=el.closest('#back');if(b&&B.classList.contains('fol'))return{el:b,id:(ALL.find(x=>x.id===cur)||{}).parent||null};
const c=el.closest('.card.fo');return c&&c._p.id!==drag.c._p.id?{el:c,id:c._p.id}:null};
function startDrag(e){if(!pd)return;const c=pd.c,r=c.getBoundingClientRect(),g=c.cloneNode(true);g.classList.add('ghost');g.style.width=r.width*.85+'px';g.style.height=r.height*.85+'px';B.append(g);
drag={c,g,ox:r.width*.425,oy:r.height*.425,t:null};c.classList.add('dgsrc');B.classList.add('dragging');navigator.vibrate&&navigator.vibrate(12);moveDrag(e)}
function moveDrag(e){drag.g.style.transform=`translate(${e.clientX-drag.ox}px,${e.clientY-drag.oy}px) rotate(3deg)`;const t=tgOf(e);if(drag.t&&(!t||t.el!==drag.t.el))drag.t.el.classList.remove('tg');if(t)t.el.classList.add('tg');drag.t=t}
function endDrag(ok){const d=drag;drag=null;d.g.remove();d.c.classList.remove('dgsrc');B.classList.remove('dragging');d.t&&d.t.el.classList.remove('tg');sup=true;setTimeout(()=>sup=false,80);if(ok&&d.t)moveItem(d.c._p,d.t.id)}
function moveItem(p,t){if(p.parent===t)return;if(p.type==='folder'&&(t===p.id||subs(p.id).some(x=>x.id===t)))return;busy(()=>commit('Chuyển '+p.name,{},j=>{j.items.find(x=>x.id==p.id).parent=t}))}
track.addEventListener('pointerdown',e=>{if(!adm||e.button||e.target.closest('.eb'))return;const c=e.target.closest('.card');if(!c)return;
pd={c,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse'};if(pd.touch)pd.t=setTimeout(()=>startDrag(e),320)});
addEventListener('pointermove',e=>{M.x=e.clientX;M.y=e.clientY;M.on=e.pointerType==='mouse'&&!e.target.closest('.card,button,a,#top,.ov');
if(drag)return moveDrag(e);if(!pd)return;const d=Math.hypot(e.clientX-pd.x,e.clientY-pd.y);if(pd.touch){if(d>10){clearTimeout(pd.t);pd=null}}else if(d>8)startDrag(e)});
addEventListener('pointerup',e=>{if(pd)clearTimeout(pd.t);if(drag){moveDrag(e);endDrag(true)}pd=null});
addEventListener('pointercancel',()=>{if(pd)clearTimeout(pd.t);if(drag)endDrag(false);pd=null});
addEventListener('touchmove',e=>{if(drag)e.preventDefault()},{passive:false});
document.documentElement.addEventListener('pointerleave',()=>M.on=false);
addEventListener('resize',()=>fit());
/* ---- WebGL2 nền ---- */
const G=cv.getContext('webgl2',{antialias:false,alpha:false});let fit=()=>{},dpr=1,Ls=0;
if(G){const cs=(t,s)=>{const x=G.createShader(t);G.shaderSource(x,s);G.compileShader(x);if(!G.getShaderParameter(x,G.COMPILE_STATUS))throw Error(G.getShaderInfoLog(x));return x};
const pg=G.createProgram();G.attachShader(pg,cs(G.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 v=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(v*2.-1.,0.,1.);}'));G.attachShader(pg,cs(G.FRAGMENT_SHADER,FS));G.linkProgram(pg);G.useProgram(pg);
const U={};['uRes','uOff','uM','uT','uS','uL'].forEach(n=>U[n]=G.getUniformLocation(pg,n));
fit=()=>{dpr=Math.min(devicePixelRatio||1,1.5);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;G.viewport(0,0,cv.width,cv.height)};fit();
var draw=t=>{M.sx+=(M.x-M.sx)*.3;M.sy+=(M.y-M.sy)*.3;Ls+=((fine&&M.on&&!drag?78:0)-Ls)*.18;const s=(innerWidth<600?.78:1)*dpr;
G.uniform2f(U.uRes,cv.width,cv.height);G.uniform2f(U.uOff,0,S*.4*dpr);G.uniform2f(U.uM,M.sx*dpr,M.sy*dpr);G.uniform1f(U.uT,t/1000);G.uniform1f(U.uS,s);G.uniform1f(U.uL,Ls*s);G.drawArrays(G.TRIANGLES,0,3)}}
else cv.style.background='#2a6a6c';
const frame=t=>{requestAnimationFrame(frame);if(document.hidden||$('#view').style.display==='block')return;S=stage.scrollTop;if(G)draw(t)};
requestAnimationFrame(frame);
