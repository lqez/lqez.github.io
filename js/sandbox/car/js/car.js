import * as THREE from 'three';
import { TILE } from './constants.js';
import { scene } from './scene.js';

// ─── car + character: cartoon 3D top-view vehicle ───────────────────────────
// Car faces local +X direction.
export const carGroup  = new THREE.Group();
export const carVisual = new THREE.Group();
carGroup.add(carVisual);
scene.add(carGroup);

const blobShadow = new THREE.Mesh(
  new THREE.CircleGeometry(TILE * 0.55, 20),
  new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.38, depthWrite:false})
);
blobShadow.rotation.x = -Math.PI / 2;
blobShadow.position.y = 0.06;
carGroup.add(blobShadow);

const R = TILE * 0.24;

// materials
const redMat    = new THREE.MeshToonMaterial({ color: 0xd71920 });
const darkRedMat= new THREE.MeshToonMaterial({ color: 0x8f1016 });
const blackMat  = new THREE.MeshToonMaterial({ color: 0x151515 });
const tireMat   = new THREE.MeshToonMaterial({ color: 0x050505 });
const metalMat  = new THREE.MeshToonMaterial({ color: 0xd9d9d9 });
const whiteMat  = new THREE.MeshToonMaterial({ color: 0xffffff });
const skinMat   = new THREE.MeshToonMaterial({ color: 0xffd1a6 });
const glassMat  = new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
const eyeMat    = new THREE.MeshBasicMaterial({ color: 0x111111 });
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

function addBox(parent, size, pos, mat, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = cast; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function addSphere(parent, radius, pos, scale, mat, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, seg, Math.max(8, seg * 0.7)), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function addCylinder(parent, radiusTop, radiusBottom, height, pos, rot, mat, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, seg), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

// ── vehicle body ──────────────────────────────────────────────────────────────
addBox(carVisual, [R*2.9, R*0.52, R*2.15], [0, R*0.48+0.32, 0], redMat);

addCylinder(carVisual, R*0.42, R*0.42, R*2.35,
  [R*1.65, R*0.45+0.28, 0], [Math.PI/2, 0, 0], redMat, 20);

[-R*0.55, R*0.55].forEach(z =>
  addBox(carVisual, [R*0.12, R*0.12, R*0.28], [R*1.66, R*0.86, z], stripeMat, false));

addBox(carVisual, [R*1.12, R*0.70, R*1.50], [-R*0.62, R*0.95+0.32, 0], darkRedMat);
addBox(carVisual, [R*0.34, R*1.55, R*1.55], [-R*1.14, R*1.65+0.32, 0], redMat);

[-R*0.82, R*0.82].forEach(z =>
  addCylinder(carVisual, R*0.08, R*0.08, R*1.95,
    [-R*0.82, R*1.72+0.32, z], [0, 0, 0], metalMat, 12));

addSphere(carVisual, R*0.72, [R*0.72, R*0.92+0.32, 0], [1.25, 0.46, 0.95], redMat);
addSphere(carVisual, R*0.56, [-R*0.10, R*1.20+0.32, 0], [0.95, 0.34, 0.78], glassMat);

// ── wheels ────────────────────────────────────────────────────────────────────
export const wheelMeshes = [];
const wheelRadius = R * 0.70;
const wheelWidth  = R * 0.52;
export const wR_ = wheelRadius; // alias used by tick() for spin rate
const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);

[
  [ R*0.85, wheelRadius+0.10,  R*1.22],
  [ R*0.85, wheelRadius+0.10, -R*1.22],
  [-R*1.05, wheelRadius+0.10,  R*1.22],
  [-R*1.05, wheelRadius+0.10, -R*1.22],
].forEach(([wx, wy, wz]) => {
  const wheel = new THREE.Mesh(wheelGeo, tireMat);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(wx, wy, wz);
  wheel.castShadow = true; wheel.receiveShadow = true;
  carVisual.add(wheel);
  wheelMeshes.push(wheel);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelRadius*0.42, wheelRadius*0.42, wheelWidth*1.05, 14),
    metalMat
  );
  hub.rotation.x = Math.PI / 2;
  hub.position.copy(wheel.position);
  hub.castShadow = true;
  carVisual.add(hub);
});

// ─── particles ───────────────────────────────────────────────────────────────
const PCOUNT=60, SCOUNT=35;
const pebbleGeo = new THREE.DodecahedronGeometry(0.24,0);
const smokeGeo  = new THREE.SphereGeometry(0.42,6,5);
const pebbleMat = new THREE.MeshToonMaterial({color:0x998866});

const pebbleMeshes = Array.from({length:PCOUNT},()=>{
  const m=new THREE.Mesh(pebbleGeo,pebbleMat); m.visible=false; scene.add(m); return m;
});
const smokeMeshes = Array.from({length:SCOUNT},()=>{
  const m=new THREE.Mesh(smokeGeo,
    new THREE.MeshBasicMaterial({color:0xddddcc,transparent:true,opacity:0}));
  m.visible=false; scene.add(m); return m;
});

const pData = Array.from({length:PCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:0.6}));
const sData = Array.from({length:SCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:1.0}));
let pHead=0, sHead=0;

export function spawnEffects(x,z,fwX,fwZ,spd){
  if(spd<5)return;
  const px=-fwZ, pz=fwX; // perpendicular (local +Z in world)
  const rCX=x-fwX*R*1.05, rCZ=z-fwZ*R*1.05;

  // rear-right and rear-left wheel world positions
  const wpos=[
    [rCX+px*R*1.22, rCZ+pz*R*1.22],
    [rCX-px*R*1.22, rCZ-pz*R*1.22],
  ];

  for(const [wx,wz] of wpos){
    const idx=pHead%PCOUNT; pHead++;
    const p=pData[idx], m=pebbleMeshes[idx];
    const lat=(Math.random()-0.5)*2.5;
    const bs=4+Math.random()*10;
    p.active=true;
    p.vx=-fwX*bs+px*lat; p.vy=4+Math.random()*12; p.vz=-fwZ*bs+pz*lat;
    p.life=1.0; p.maxLife=0.35+Math.random()*0.3;
    m.position.set(wx+(Math.random()-0.5)*0.5, 0.3, wz+(Math.random()-0.5)*0.5);
    m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
    m.visible=true;
  }

  // smoke from car body center
  const sidx=sHead%SCOUNT; sHead++;
  const s=sData[sidx], sm=smokeMeshes[sidx];
  s.active=true;
  s.vx=(Math.random()-0.5)*0.6; s.vy=0.6+Math.random()*1.0; s.vz=(Math.random()-0.5)*0.6;
  s.life=1.0; s.maxLife=0.8+Math.random()*0.4;
  sm.position.set(x,1.2,z); sm.scale.setScalar(0.9);
  sm.material.opacity=0.42; sm.visible=true;
}

export function updateParticles(dt){
  for(let i=0;i<PCOUNT;i++){
    const p=pData[i]; if(!p.active)continue;
    p.life-=dt/p.maxLife;
    if(p.life<=0){p.active=false;pebbleMeshes[i].visible=false;continue;}
    const m=pebbleMeshes[i];
    m.position.x+=p.vx*dt; m.position.y+=p.vy*dt; m.position.z+=p.vz*dt;
    p.vy-=22*dt;
    m.rotation.x+=p.vx*dt*3; m.rotation.z+=p.vz*dt*3;
    if(m.position.y<0.15){
      m.position.y=0.15; p.vy*=-0.25; p.vx*=0.55; p.vz*=0.55;
    }
  }
  for(let i=0;i<SCOUNT;i++){
    const s=sData[i]; if(!s.active)continue;
    s.life-=dt/s.maxLife;
    if(s.life<=0){s.active=false;smokeMeshes[i].visible=false;continue;}
    const m=smokeMeshes[i];
    m.position.x+=s.vx*dt; m.position.y+=s.vy*dt; m.position.z+=s.vz*dt;
    m.scale.setScalar(1+(1-s.life)*3);
    m.material.opacity=s.life*0.48;
  }
}
