// callshove spotlarının rakip aralığı varsayımına duyarlılığı (docs/ekip/2026-11-11/04). Çalıştırma: node docs/ekip/arac/callshove-duyarlilik.mts
// Çıktı: her spot için gereken equity, temel / %60 dar / %150 geniş / ham-equity sıralı aralıklara karşı equity (20.000 deneme, sabit tohum).
import { evaluate7 } from "../../../src/lib/poker/evaluator.ts";
import { readFileSync } from "node:fs";
const ranges = JSON.parse(readFileSync(new URL("../../../src/data/ranges.json", import.meta.url),"utf8"));
const drills = JSON.parse(readFileSync(new URL("../../../src/data/drills.json", import.meta.url),"utf8"));
const R = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SUITS="shdc";
const rankIdx=(ch:string)=>12-R.indexOf(ch);
const toCard=(c:string)=>rankIdx(c[0])*4+SUITS.indexOf(c[1]);
let seed=777; function rnd(){seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const equity=ranges.equity as Record<string,number>;
const labels=Object.keys(equity);
const combos=(l:string)=>l.length===2?6:l.endsWith("s")?4:12;
function openScore(l:string){let s=equity[l];if(l.length===2)return s+0.06;const hi=rankIdx(l[0]),lo=rankIdx(l[1]);const gap=hi-lo-1;
 if(l.endsWith("s"))s+=0.045;else s-=0.015;if(gap===0)s+=0.035;else if(gap===1)s+=0.022;else if(gap===2)s+=0.01;else if(gap>=4&&hi!==12)s-=0.03;
 if(hi===12&&l.endsWith("s")&&lo<=3)s+=0.012;return s;}
const pushScore=(l:string)=>equity[l]+(openScore(l)-equity[l])*0.5;
// alternative ordering: pure raw equity (no playability)
const rawScore=(l:string)=>equity[l];
function top(score:(l:string)=>number,p:number){const s=[...labels].sort((x,y)=>score(y)-score(x));const o:string[]=[];let n=0;for(const l of s){if((n+combos(l))/1326>p/100+0.004)continue;o.push(l);n+=combos(l);}return o;}
function rc(list:string[]){const out:[number,number][]=[];for(const l of list){const a=rankIdx(l[0]),b=rankIdx(l[1]);for(let s1=0;s1<4;s1++)for(let s2=0;s2<4;s2++){if(l.length===2?s2<=s1:l[2]==="s"?s1!==s2:s1===s2)continue;out.push([a*4+s1,b*4+s2]);}}return out;}
function eqv(h:[number,number],range:[number,number][],trials:number){const live=range.filter(([x,y])=>x!==h[0]&&x!==h[1]&&y!==h[0]&&y!==h[1]);let sc=0;const d:number[]=[];
 for(let t=0;t<trials;t++){const [v1,v2]=live[Math.floor(rnd()*live.length)];d.length=0;for(let c=0;c<52;c++)if(c!==h[0]&&c!==h[1]&&c!==v1&&c!==v2)d.push(c);
 for(let i=0;i<5;i++){const j=i+Math.floor(rnd()*(d.length-i));[d[i],d[j]]=[d[j],d[i]];}const b=d.slice(0,5);const x=evaluate7([h[0],h[1],...b]),y=evaluate7([v1,v2,...b]);sc+=x>y?1:x===y?0.5:0;}return sc/trials;}
const T:Record<string,Record<string,number>>={"6":{BTN:48,SB:68,CO:33},"10":{BTN:36,SB:54,CO:24},"15":{BTN:26,SB:40,CO:17}};
const cs=drills.filter((d:any)=>d.topic==="callshove");
const rows:any[]=[];
for(const d of cs){const m=d.id.match(/^s(\d+)-(\w+)-/);const bb=m[1],pos=m[2];const S=+bb;const dead=pos==="SB"?0:0.5;const req=(S-1)/(2*S+1+dead);
 const p=T[bb][pos];const h:[number,number]=[toCard(d.hero.slice(0,2)),toCard(d.hero.slice(2))];
 const base=eqv(h,rc(ranges.push[bb][pos]),20000);
 const narrow=eqv(h,rc(top(pushScore,p*0.6)),20000);
 const wide=eqv(h,rc(top(pushScore,Math.min(100,p*1.5))),20000);
 const raw=eqv(h,rc(top(rawScore,p)),20000);
 // ICM-lite: require +5 pts more equity
 const flip=(e:number)=>(e>req?1:0)!==d.correct;
 rows.push({id:d.id,req:+req.toFixed(3),correct:d.correct,base:+base.toFixed(3),narrow:+narrow.toFixed(3),wide:+wide.toFixed(3),raw:+raw.toFixed(3),
  fN:flip(narrow),fW:flip(wide),fR:flip(raw),fB:flip(base),icm5:d.correct===1&&base<req+0.05, margin:+(base-req).toFixed(3)});}
console.log(JSON.stringify(rows));
