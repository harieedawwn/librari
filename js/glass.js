/* ---- kính lỏng thật: bản đồ khúc xạ SVG (Chromium); trình duyệt khác dùng blur ---- */
const LG=!!window.chrome&&!/iPhone|iPad|Firefox/.test(navigator.userAgent);let gid=0;
function glass(el,bz,sc){const w=el.offsetWidth,hh=el.offsetHeight;if(!LG||!w||!hh)return;
const r=Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius)||0,w/2,hh/2),c=mk('canvas');c.width=w;c.height=hh;
const x=c.getContext('2d'),d=x.createImageData(w,hh);
for(let j=0;j<hh;j++)for(let i=0;i<w;i++){const px=i+.5-w/2,py=j+.5-hh/2,qx=Math.abs(px)-(w/2-r),qy=Math.abs(py)-(hh/2-r),
sd=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r,k=(j*w+i)*4;let A=128,B=128;
if(-sd<bz){const m=Math.pow(1-(-sd)/bz,2);let nx,ny;if(qx>0&&qy>0){const l=Math.hypot(qx,qy);nx=Math.sign(px)*qx/l;ny=Math.sign(py)*qy/l}else if(qx>qy){nx=Math.sign(px);ny=0}else{nx=0;ny=Math.sign(py)}
A=128-nx*m*127;B=128-ny*m*127}
d.data[k]=A;d.data[k+1]=B;d.data[k+2]=128;d.data[k+3]=255}
x.putImageData(d,0,0);const id=el._g||(el._g='lg'+gid++);let f=document.getElementById(id);
if(!f){f=document.createElementNS('http://www.w3.org/2000/svg','filter');f.id=id;$('#defs').appendChild(f)}
for(const[k,v]of Object.entries({filterUnits:'userSpaceOnUse',x:0,y:0,width:w,height:hh,'color-interpolation-filters':'sRGB'}))f.setAttribute(k,v);
f.innerHTML=`<feImage href="${c.toDataURL()}" x="0" y="0" width="${w}" height="${hh}" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="${sc}" xChannelSelector="R" yChannelSelector="G"/>`;
el.style.backdropFilter=`url(#${id}) saturate(1.5) brightness(1.06)`}
const ro=new ResizeObserver(es=>es.forEach(e=>{clearTimeout(e.target._t);e.target._t=setTimeout(()=>glass(e.target,...e.target._p),100)}));
const gl=(el,bz=20,sc=46)=>{el._p=[bz,sc];ro.observe(el)};
