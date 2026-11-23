/* ---- nền: bản đồ đồng mức trôi chậm + thấu kính theo chuột ---- */
const FS=`#version 300 es
precision highp float;
uniform vec2 uRes,uOff,uM;uniform float uT,uS,uL;out vec4 o;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
float fb(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}
float ht(vec2 b){return clamp((fb(b*.0021+vec2(uT*.012,-uT*.008))-.22)*2.4,0.,.999);}
vec3 pal(float i){vec3 c=vec3(.62,.40,.04);
c=i>.5?vec3(.74,.50,.06):c;c=i>1.5?vec3(.87,.62,.08):c;c=i>2.5?vec3(.96,.74,.14):c;c=i>3.5?vec3(.99,.83,.30):c;
c=i>4.5?vec3(1.,.89,.48):c;c=i>5.5?vec3(1.,.94,.66):c;c=i>6.5?vec3(1.,.97,.82):c;return c;}
vec3 bg(vec2 p){vec2 b=(p+uOff)/uS;float e=1.5,h0=ht(b);
float L=h0*8.,g=length(vec2(ht(b+vec2(e,0.))-h0,ht(b+vec2(0.,e))-h0))*8./e+1e-4;
float fr=fract(L),d=min(fr,1.-fr)/g,band=floor(L),ln=fr<.5?band:band+1.,w=mod(ln,4.)<.5?1.7:.75;
return mix(pal(band),vec3(.36,.22,.02),(1.-smoothstep(w-.6,w+.6,d))*.65);}
void main(){vec2 f=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);vec3 c;vec2 d=f-uM;float L=length(d),R=uL;
if(R>1.&&L<R+1.5){float t=L/R,k=.62+.38*t*t,e=smoothstep(.55,1.,t);
c=vec3(bg(uM+d*k*(1.-.10*e)).r,bg(uM+d*k*(1.-.16*e)).g,bg(uM+d*k*(1.-.22*e)).b);
vec2 n=d/max(L,1.);c+=pow(max(dot(n,normalize(vec2(-.7,-.8))),0.),3.)*smoothstep(.8,1.,t)*.5;
c=mix(c,vec3(1.),.5*(1.-smoothstep(0.,1.6*uS,abs(L-R+1.))));
c=mix(bg(f),c,1.-smoothstep(R-1.,R+1.,L));}
else c=bg(f);o=vec4(c,1.);}`;
