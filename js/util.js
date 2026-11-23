const $=(s,e=document)=>e.querySelector(s),mk=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* file vừa tải lên (chưa deploy xong) thì dùng bản trong máy */
const LOCAL={},src=u=>LOCAL[u]||u;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
