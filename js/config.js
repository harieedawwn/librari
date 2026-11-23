/* ---- cấu hình ---- */
const CFG={owner:'harieedawwn',repo:'librari',branch:'main'};
const HASH='a4751b67782b2f2d11706aff9822d2a721492cf282b61d3760e082967de8f615';
let P=[],ALL=[],cur=null,adm=false,TOK=null;
const B=document.body,uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const kidsOf=x=>ALL.filter(y=>y.parent===x),subs=x=>kidsOf(x).flatMap(y=>[y,...subs(y.id)]);
/* ---- họa tiết thumbnail tự tạo, màu phẳng, hợp tông vàng ---- */
const PAL=[['#f6c744','#d99a00','#fff1b0'],['#ffd966','#c77d00','#fff8dc'],['#e8a900','#7a4a00','#ffe08a'],['#fbbf24','#92400e','#fff3c4'],['#ffe08a','#d48806','#7a4a00'],['#f0b429','#5a3a00','#ffeaa7'],['#fff0b3','#e8a900','#8a5a00']];
function rng(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>(h=Math.imul(h^h>>>15,2246822507),h=Math.imul(h^h>>>13,3266489909),((h^=h>>>16)>>>0)/4294967296)}
function art(seed){const r=rng(seed),p=PAL[r()*PAL.length|0],k=r()*6|0;let o='<rect width="200" height="200" fill="'+p[0]+'"/>';
if(k==0)for(let i=0;i<8;i++)o+='<circle cx="'+r()*200+'" cy="'+r()*200+'" r="'+(16+r()*52)+'" fill="'+p[i%2+1]+'" opacity="'+(.25+r()*.4)+'"/>';
if(k==1)for(let i=0;i<8;i++)o+='<circle cx="30" cy="170" r="'+(20+i*20)+'" fill="none" stroke="'+p[i%2+1]+'" stroke-width="'+(4+r()*7)+'" opacity=".6"/>';
if(k==2)for(let i=0;i<7;i++)o+='<path d="M-10 '+(i*30+r()*14)+' Q 50 '+(i*30-34)+' 100 '+(i*30)+' T 210 '+(i*30+10)+'" fill="none" stroke="'+p[i%2+1]+'" stroke-width="'+(5+r()*9)+'" opacity=".55" stroke-linecap="round"/>';
if(k==3)for(let y=0;y<9;y++)for(let x=0;x<9;x++)o+='<circle cx="'+(x*24+10)+'" cy="'+(y*24+10)+'" r="'+(1.5+r()*8)+'" fill="'+p[1+(x+y)%2]+'" opacity=".6"/>';
if(k==4)for(let i=0;i<7;i++)o+='<polygon points="'+[0,1,2].map(()=>(r()*200|0)+','+(r()*200|0)).join(' ')+'" fill="'+p[1+i%2]+'" opacity="'+(.3+r()*.35)+'"/>';
if(k==5)for(let i=-6;i<12;i++)o+='<rect x="'+(i*24)+'" y="-30" width="'+(7+r()*15)+'" height="270" fill="'+p[1+i%2]+'" opacity=".45" transform="rotate(28 100 100)"/>';
return'<svg class="art" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+o+'</svg>'}
const FOLDER='<svg viewBox="0 0 120 100"><path d="M8 22a8 8 0 0 1 8-8h27l10 11h51a8 8 0 0 1 8 8v8H8z" fill="#c77d00"/><path d="M8 34a8 8 0 0 1 8-8h88a8 8 0 0 1 8 8v52a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="#f2b705"/><path d="M8 40h104" stroke="#fff3c4" stroke-width="3" opacity=".7"/></svg>';
