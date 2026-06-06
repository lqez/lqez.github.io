import { TILE, MAP_W, MAP_H, HALF_W, HALF_H, T } from './constants.js';

// ─── map arrays ──────────────────────────────────────────────────────────────
export const tileMap   = new Uint8Array(MAP_W*MAP_H).fill(T.BUILDING);
export const waterMrk  = new Uint8Array(MAP_W*MAP_H);
export const bldgH     = new Uint8Array(MAP_W*MAP_H);
export const bldgStyle = new Uint8Array(MAP_W*MAP_H);
export const bldgW     = new Uint8Array(MAP_W*MAP_H);
export const bldgD     = new Uint8Array(MAP_W*MAP_H);
export const parkShade = new Uint8Array(MAP_W*MAP_H);

// ─── rng ─────────────────────────────────────────────────────────────────────
let _s = 0xdeadbeef;
function rng() {
  _s = Math.imul(_s^(_s>>>16),0x45d9f3b);
  _s = Math.imul(_s^(_s>>>16),0x45d9f3b);
  _s ^= _s>>>16;
  return (_s>>>0)/0xffffffff;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
export function mi(x,y){return y*MAP_W+x;}
export function hash2(x,y){
  let n=Math.imul(x+101,374761393)^Math.imul(y+211,668265263);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/0xffffffff;
}
export function fillRect(x0,y0,w,h,val,buf=tileMap){
  for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
    const x=x0+dx,y=y0+dy;
    if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H)buf[mi(x,y)]=val;
  }
}

// ─── coord helpers ────────────────────────────────────────────────────────────
export function tileCenter(tx,ty){return{x:(tx-HALF_W+0.5)*TILE,z:(ty-HALF_H+0.5)*TILE};}
export function tileCenterX(wx){return (Math.floor(wx/TILE+HALF_W)-HALF_W+0.5)*TILE;}
export function tileCenterZ(wz){return (Math.floor(wz/TILE+HALF_H)-HALF_H+0.5)*TILE;}
export function tileAt(wx,wz){
  const tx=Math.floor(wx/TILE+HALF_W), ty=Math.floor(wz/TILE+HALF_H);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return T.BUILDING;
  return tileMap[mi(tx,ty)];
}
export function passable(wx,wz){const t=tileAt(wx,wz);return t===T.ROAD||t===T.BRIDGE;}

// ─── resetMap ────────────────────────────────────────────────────────────────
export function resetMap(){
  tileMap.fill(T.BUILDING); waterMrk.fill(0);
  bldgH.fill(0); bldgStyle.fill(0);
  bldgW.fill(0); bldgD.fill(0); parkShade.fill(0);
}

// ─── buildRandom ─────────────────────────────────────────────────────────────
export function buildRandom(){
  // reset RNG seed for deterministic maps
  _s = 0xdeadbeef;

  for(let i=0;i<5;i++){
    if(rng()<0.5){
      const wy=12+Math.floor(rng()*(MAP_H-24));
      const ww=2+Math.floor(rng()*3);
      fillRect(0,wy,MAP_W,ww,T.WATER); fillRect(0,wy,MAP_W,ww,1,waterMrk);
    }else{
      const wx=12+Math.floor(rng()*(MAP_W-24));
      const ww=2+Math.floor(rng()*3);
      fillRect(wx,0,ww,MAP_H,T.WATER); fillRect(wx,0,ww,MAP_H,1,waterMrk);
    }
  }
  for(let y=4;y<MAP_H-4;){
    const w=[1,1,2,2,3,4][Math.floor(rng()*6)];
    fillRect(0,y,MAP_W,w,T.ROAD);
    y+=w+7+Math.floor(rng()*11);
  }
  for(let x=4;x<MAP_W-4;){
    const w=[1,1,2,2,3,4][Math.floor(rng()*6)];
    fillRect(x,0,w,MAP_H,T.ROAD);
    x+=w+7+Math.floor(rng()*11);
  }
  fillRect(HALF_W-1,0,3,MAP_H,T.ROAD);
  fillRect(0,HALF_H-1,MAP_W,3,T.ROAD);

  for(let i=0;i<45;i++){
    const horizontal=rng()<0.5;
    const len=4+Math.floor(rng()*8);
    const w=1+Math.floor(rng()*2);
    const x=3+Math.floor(rng()*(MAP_W-6));
    const y=3+Math.floor(rng()*(MAP_H-6));
    if(Math.abs(x-HALF_W)<4&&Math.abs(y-HALF_H)<4)continue;
    if(horizontal) fillRect(x,y,Math.min(len,MAP_W-x-2),w,T.BUILDING);
    else fillRect(x,y,w,Math.min(len,MAP_H-y-2),T.BUILDING);
  }

  for(let i=0;i<55;i++){
    const horizontal=rng()<0.5;
    const len=8+Math.floor(rng()*16);
    const w=1+Math.floor(rng()*2);
    const x=2+Math.floor(rng()*(MAP_W-4));
    const y=2+Math.floor(rng()*(MAP_H-4));
    if(horizontal) fillRect(x,y,Math.min(len,MAP_W-x-1),w,T.ROAD);
    else fillRect(x,y,w,Math.min(len,MAP_H-y-1),T.ROAD);
  }

  fillRect(HALF_W-1,0,3,MAP_H,T.ROAD);
  fillRect(0,HALF_H-1,MAP_W,3,T.ROAD);
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.ROAD&&waterMrk[i])tileMap[i]=T.BRIDGE;

  // ── large solid parks (green blocks) ──────────────────────────────────────
  for(let i=0;i<14;i++){
    const px=4+Math.floor(rng()*(MAP_W-16)),py=4+Math.floor(rng()*(MAP_H-16));
    const pw=4+Math.floor(rng()*9),ph=4+Math.floor(rng()*9);
    let ok=true;
    const shade=Math.floor(rng()*6);
    loop:for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++)
      if(tileMap[mi(px+dx,py+dy)]!==T.BUILDING){ok=false;break loop;}
    if(ok){
      for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++){
        const id=mi(px+dx,py+dy);
        tileMap[id]=T.PARK;
        parkShade[id]=shade;
      }
    }
  }

  // ── scattered greenery in "green districts" (mixed building + park areas) ──
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING)continue;
    const dX=Math.floor(tx/16), dY=Math.floor(ty/16);
    if(hash2(dX+50,dY+90)<0.6)continue;
    const patch=hash2((tx>>1)+7,(ty>>1)+3)*0.55 + hash2(tx,ty)*0.45;
    if(patch>0.58){
      tileMap[id]=T.PARK;
      parkShade[id]=Math.floor(hash2(tx>>2,ty>>2) * 6);
    }
  }

  // ── larger guaranteed parks (8-18 tiles) ──────────────────────────────────
  for(let i=0;i<8;i++){
    const px=4+Math.floor(rng()*(MAP_W-22)), py=4+Math.floor(rng()*(MAP_H-22));
    const pw=8+Math.floor(rng()*10), ph=8+Math.floor(rng()*10);
    const shade=Math.floor(rng()*6);
    let ok=true;
    loop:for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++)
      if(tileMap[mi(px+dx,py+dy)]!==T.BUILDING){ok=false;break loop;}
    if(ok){
      for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++){
        const id=mi(px+dx,py+dy);
        tileMap[id]=T.PARK; parkShade[id]=shade;
      }
    }
  }

  // ── greedy rectangle tiling ───────────────────────────────────────────────
  const free=(x,y)=> x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&
                     tileMap[mi(x,y)]===T.BUILDING&&bldgW[mi(x,y)]===0;
  function claim(bx,by){
    if(!free(bx,by))return;
    const MAXW=3+Math.floor(rng()*5);
    const MAXD=3+Math.floor(rng()*4);
    let w=0; while(w<MAXW&&free(bx+w,by))w++;
    let d=1;
    grow:while(d<MAXD){
      for(let dx=0;dx<w;dx++) if(!free(bx+dx,by+d))break grow;
      d++;
    }
    bldgW[mi(bx,by)]=w; bldgD[mi(bx,by)]=d;
    for(let dy=0;dy<d;dy++) for(let dx=0;dx<w;dx++)
      if(dx!==0||dy!==0) bldgW[mi(bx+dx,by+dy)]=255;
  }
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++) claim(tx,ty);

  // ── height + style ────────────────────────────────────────────────────────
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING||bldgW[id]===255)continue;
    if(bldgW[id]===0){bldgW[id]=1; bldgD[id]=1;}

    const fx=(tx-HALF_W)/HALF_W, fy=(ty-HALF_H)/HALF_H;
    const center=Math.max(0,1-Math.hypot(fx,fy));
    const districtX=Math.floor(tx/16), districtY=Math.floor(ty/16);
    const districtNoise=hash2(districtX,districtY);
    const localNoise=hash2(tx,ty);
    const big=bldgW[id]>1||bldgD[id]>1;
    const area=bldgW[id]*bldgD[id];

    const dn4        = districtNoise*districtNoise*districtNoise*districtNoise;
    const base       = 1 + center*3;
    const tower      = dn4*14;
    const localSpike = localNoise*localNoise*5;
    const bigBonus   = big ? Math.min(area,16)*0.4 : 0;
    bldgH[id]=Math.max(1,Math.min(18,Math.round(base+tower+localSpike+bigBonus)));
    bldgStyle[id]=(districtX*2+districtY*3+Math.floor(districtNoise*3))%6;
  }
}

// ─── buildParis ──────────────────────────────────────────────────────────────
export function buildParis(){
  // Seine river
  for(let y=74;y<=76;y++) for(let x=0;x<MAP_W;x++){
    const id=mi(x,y);
    tileMap[id]=T.WATER;
    waterMrk[id]=1;
  }

  // Helper: set road tile
  function road(x,y){
    if(x<0||x>=MAP_W||y<0||y>=MAP_H)return;
    tileMap[mi(x,y)]=T.ROAD;
  }

  // Major E-W boulevards
  const ewBoulevards=[
    [16,17],[28,29],[40,41],[52,54],[62,63],[80,81],[92,93],[104,105]
  ];
  for(const [y0,y1] of ewBoulevards)
    for(let y=y0;y<=y1;y++) for(let x=0;x<MAP_W;x++) road(x,y);

  // Major N-S avenues
  const nsAvenues=[
    [16,17],[28,29],[40,41],[52,54],[62,64],[74,75],[86,87],[98,99],[110,111]
  ];
  for(const [x0,x1] of nsAvenues)
    for(let x=x0;x<=x1;x++) for(let y=0;y<MAP_H;y++) road(x,y);

  // Smaller cross streets (1 wide)
  const smallY=[22,34,46,57,69,86,98];
  const smallX=[22,34,46,58,69,80,92,104];
  for(const y of smallY) for(let x=0;x<MAP_W;x++) road(x,y);
  for(const x of smallX) for(let y=0;y<MAP_H;y++) road(x,y);

  // Central plaza (Arc de Triomphe area)
  for(let y=49;y<=57;y++) for(let x=59;x<=68;x++) road(x,y);

  // Convert road-over-water to bridge
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.ROAD&&waterMrk[i])tileMap[i]=T.BRIDGE;

  // Parks — only overwrite BUILDING tiles
  function park(x0,y0,x1,y1){
    const shade=(hash2(x0,y0)*6)|0;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      if(x<0||x>=MAP_W||y<0||y>=MAP_H)continue;
      const id=mi(x,y);
      if(tileMap[id]===T.BUILDING){
        tileMap[id]=T.PARK;
        parkShade[id]=shade;
      }
    }
  }

  // Large named parks
  park(2,8,14,118);       // Bois de Boulogne
  park(66,55,82,68);      // Tuileries Garden
  park(42,84,58,100);     // Luxembourg Gardens
  park(18,80,30,110);     // Champ de Mars
  park(40,16,54,30);      // Parc Monceau
  park(100,8,114,28);     // Parc de la Villette
  park(94,84,112,100);    // Parc de Bercy
  park(88,28,104,46);     // Buttes-Chaumont

  // Small squares
  park(32,62,35,65);
  park(72,28,75,31);
  park(46,68,49,71);

  // Apply per-4x4 block shade for park tiles not already shaded
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]===T.PARK && parkShade[id]===0){
      parkShade[id]=(hash2(Math.floor(tx/4),Math.floor(ty/4)*17)*6)|0;
    }
  }

  // Greedy rectangle tiling for buildings
  const free=(x,y)=> x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&
                     tileMap[mi(x,y)]===T.BUILDING&&bldgW[mi(x,y)]===0;
  function claim(bx,by){
    if(!free(bx,by))return;
    const MAXW=3+Math.floor(hash2(bx*7+1,by*3+2)*5);
    const MAXD=3+Math.floor(hash2(bx*3+5,by*7+9)*4);
    let w=0; while(w<MAXW&&free(bx+w,by))w++;
    let d=1;
    grow:while(d<MAXD){
      for(let dx=0;dx<w;dx++) if(!free(bx+dx,by+d))break grow;
      d++;
    }
    bldgW[mi(bx,by)]=w; bldgD[mi(bx,by)]=d;
    for(let dy=0;dy<d;dy++) for(let dx=0;dx<w;dx++)
      if(dx!==0||dy!==0) bldgW[mi(bx+dx,by+dy)]=255;
  }
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++) claim(tx,ty);

  // Height + style — Haussmann style, mostly low
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING||bldgW[id]===255)continue;
    if(bldgW[id]===0){bldgW[id]=1; bldgD[id]=1;}
    const big=bldgW[id]>1||bldgD[id]>1;
    const hn=hash2(tx,ty);
    const hd=hash2(Math.floor(tx/8)*8, Math.floor(ty/8)*8);
    bldgH[id]=Math.max(2,Math.min(14,Math.round(3+hd*4+hn*2+(big?2:0))));
    bldgStyle[id]=(Math.floor(tx/8)+Math.floor(ty/8)*3)%6;
  }
}
