import { TILE, CAR_HL, CAR_HW, CONST_SPEED } from './constants.js';
import { passable, tileCenterX, tileCenterZ } from './map.js';

// ─── direction state ──────────────────────────────────────────────────────────
export let dirX = 0, dirZ = -1;
export let prevDirX = 0, prevDirZ = -1;
export let turnBias = 1;
export let stuckTimer = 0;
export let targetRotY = Math.atan2(-(-1), 0);
export const ROT_SPEED = 18;

export function resetPhysics(){
  dirX=0; dirZ=-1; prevDirX=0; prevDirZ=-1;
  turnBias=1; stuckTimer=0;
  targetRotY=Math.atan2(1,0);
}

// ─── collision helpers ────────────────────────────────────────────────────────
export function cornersForDir(px,pz,ndX,ndZ){
  const rpX=-ndZ, rpZ=ndX;
  return[
    [px+ndX*CAR_HL+rpX*CAR_HW, pz+ndZ*CAR_HL+rpZ*CAR_HW],
    [px+ndX*CAR_HL-rpX*CAR_HW, pz+ndZ*CAR_HL-rpZ*CAR_HW],
    [px-ndX*CAR_HL+rpX*CAR_HW, pz-ndZ*CAR_HL+rpZ*CAR_HW],
    [px-ndX*CAR_HL-rpX*CAR_HW, pz-ndZ*CAR_HL-rpZ*CAR_HW],
  ];
}
export function leadingPointsForDir(px,pz,ndX,ndZ){
  const rpX=-ndZ, rpZ=ndX;
  const noseX=px+ndX*CAR_HL, noseZ=pz+ndZ*CAR_HL;
  return[
    [noseX+rpX*CAR_HW, noseZ+rpZ*CAR_HW],
    [noseX-rpX*CAR_HW, noseZ-rpZ*CAR_HW],
    [noseX, noseZ],
  ];
}
export function blockedCornersForDir(px,pz,ndX,ndZ){
  return cornersForDir(px,pz,ndX,ndZ).filter(([cx,cz])=>!passable(cx,cz));
}
export function clearForDir(px,pz,ndX,ndZ){
  return blockedCornersForDir(px,pz,ndX,ndZ).length===0;
}
export function leadingClearForDir(px,pz,ndX,ndZ){
  return leadingPointsForDir(px,pz,ndX,ndZ).every(([cx,cz])=>passable(cx,cz));
}
export function canMoveToward(px,pz,nx,nz,ndX,ndZ){
  if(clearForDir(nx,nz,ndX,ndZ))return true;
  const currentHits=blockedCornersForDir(px,pz,ndX,ndZ).length;
  const nextHits=blockedCornersForDir(nx,nz,ndX,ndZ).length;
  return currentHits>0&&nextHits<=currentHits&&leadingClearForDir(nx,nz,ndX,ndZ);
}
export function pushFromWalls(px,pz,ndX,ndZ,dt){
  const hits=blockedCornersForDir(px,pz,ndX,ndZ);
  if(hits.length===0)return {x:px,z:pz};

  let pushX=0, pushZ=0;
  hits.forEach(([cx,cz])=>{
    pushX+=px-cx;
    pushZ+=pz-cz;
  });
  const len=Math.hypot(pushX,pushZ);
  if(len<0.001)return {x:px,z:pz};

  const step=Math.min(TILE*0.22, CONST_SPEED*dt*0.85);
  const ux=pushX/len, uz=pushZ/len;
  for(const mul of [1,0.6,0.35]){
    const tx=px+ux*step*mul;
    const tz=pz+uz*step*mul;
    if(clearForDir(tx,tz,ndX,ndZ))return {x:tx,z:tz};
    const nextHits=blockedCornersForDir(tx,tz,ndX,ndZ).length;
    if(nextHits<=hits.length&&leadingClearForDir(tx,tz,ndX,ndZ))
      return {x:tx,z:tz};
  }
  return {x:px,z:pz};
}
export function moveWithCollision(px,pz,ndX,ndZ,dt){
  const spd=CONST_SPEED*dt;
  const rpX=-ndZ, rpZ=ndX;
  const nx=px+ndX*spd, nz=pz+ndZ*spd;

  // Fully clear — move straight
  if(clearForDir(nx,nz,ndX,ndZ))
    return {x:nx,z:nz,moved:true};

  const maxAlign=Math.min(TILE*0.32,spd*0.9);
  const alignX=rpX===0?0:Math.max(-maxAlign,Math.min(maxAlign,tileCenterX(px)-px));
  const alignZ=rpZ===0?0:Math.max(-maxAlign,Math.min(maxAlign,tileCenterZ(pz)-pz));
  if((alignX!==0||alignZ!==0)&&
     passable(px+alignX,pz+alignZ)&&
     clearForDir(nx+alignX,nz+alignZ,ndX,ndZ))
    return {x:nx+alignX,z:nz+alignZ,moved:true};

  // Wall slide: fewer blocked corners + leading edge still open
  if(canMoveToward(px,pz,nx,nz,ndX,ndZ)){
    const pushed=pushFromWalls(nx,nz,ndX,ndZ,dt);
    return {x:pushed.x,z:pushed.z,moved:true};
  }

  return {x:px,z:pz,moved:false};
}

// ─── mutable setters (called from main.js tick) ───────────────────────────────
export function setDir(x,z){ dirX=x; dirZ=z; }
export function setPrevDir(x,z){ prevDirX=x; prevDirZ=z; }
export function setTurnBias(v){ turnBias=v; }
export function setStuckTimer(v){ stuckTimer=v; }
export function setTargetRotY(v){ targetRotY=v; }
