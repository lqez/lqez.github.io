import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { TILE, MAP_W, MAP_H, HALF_W, HALF_H, T } from './constants.js';
import { resetMap, buildRandom, buildParis,
         tileMap, bldgW, bldgD, bldgH, bldgStyle, parkShade,
         mi, tileCenter, tileCenterX, tileCenterZ } from './map.js';

// ─── renderer ────────────────────────────────────────────────────────────────
const canvas   = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 200, 440);

export const camera = new THREE.PerspectiveCamera(42,1,1,700);
camera.up.set(0,0,-1);

// ─── lighting ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 2.2));
scene.add(new THREE.HemisphereLight(0x99ccff, 0x66aa44, 1.2));
const sun = new THREE.DirectionalLight(0xfff0cc, 2.0);
sun.position.set(60,90,50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-200,right:200,top:200,bottom:-200,near:1,far:500});
scene.add(sun);

// ─── ground plane (map-independent, created once) ────────────────────────────
const gnd = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP_W*TILE,MAP_H*TILE),
  new THREE.MeshToonMaterial({color:0xaa9966})
);
gnd.rotation.x=-Math.PI/2; gnd.position.y=-0.1; gnd.receiveShadow=true;
scene.add(gnd);

export const D = new THREE.Object3D();

// ─── module-level mesh refs (set by buildScene) ──────────────────────────────
let mRoad, mBridge, mPark, mWater, mBldgs=[];
let markMeshes=[];

// Park green palette
const PARK_GREENS = [0x4a7a56,0x3d6b47,0x527a3a,0x466e40,0x3b6650,0x597848];

// ─── spawn position (exported, mutated by buildScene) ────────────────────────
export let sx=0, sz=0;

// ─── camera helpers ──────────────────────────────────────────────────────────
const CAM_H=190;
const BASE_CAMERA_UP = new THREE.Vector3(0,0,-1);
export const CAMERA_POS_LEAD = 32;
export const cameraLead = new THREE.Vector3();
export const targetCameraLead = new THREE.Vector3();
export const ZERO_CAMERA_LEAD = new THREE.Vector3();

export function setTopCamera(x,z){
  camera.position.set(x+cameraLead.x,CAM_H,z+cameraLead.z);
  camera.up.copy(BASE_CAMERA_UP);
  camera.lookAt(x,0,z);
}
setTopCamera(sx,sz);

// ─── post-processing: barrel distortion ──────────────────────────────────────
const BarrelShader = {
  uniforms: {
    tDiffuse: { value: null },
    k:        { value: 0.32 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float k;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv - 0.5;
      float r2 = dot(uv, uv);
      vec2 distorted = uv * (1.0 + k * r2);
      distorted /= (1.0 + k * 0.5);
      gl_FragColor = texture2D(tDiffuse, distorted + 0.5);
    }
  `,
};

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new ShaderPass(BarrelShader));

function onResize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h);
  composer.setSize(w,h);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',onResize);
onResize();

// ─── buildScene ───────────────────────────────────────────────────────────────
export function buildScene(mapType){
  // Remove old meshes before adding new ones
  [mRoad,mBridge,mPark,mWater,...mBldgs].forEach(m=>{ if(m) scene.remove(m); });
  mBldgs=[];
  markMeshes.forEach(m=>scene.remove(m)); markMeshes=[];

  resetMap();

  if(mapType==='paris') buildParis();
  else buildRandom();

  // ─── scene geometry ───────────────────────────────────────────────────────
  const cnt = new Array(5).fill(0);
  for(let i=0;i<MAP_W*MAP_H;i++)cnt[tileMap[i]]++;

  const flatGeo  = new THREE.BoxGeometry(TILE,0.5,TILE);
  const bldgBase = new THREE.BoxGeometry(TILE*0.84,1,TILE*0.84);

  const matRoad   = new THREE.MeshToonMaterial({color:0x555566});
  const matBridge = new THREE.MeshToonMaterial({color:0x997755});
  const matWater  = new THREE.MeshToonMaterial({color:0x3399dd});

  const BLDG_COLORS = [0xb8afa3,0x9ba7ad,0xa8a18f,0x8fa196,0xb0a4b8,0xaaa48d];
  const bldgCnt = new Array(6).fill(0);
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.BUILDING&&bldgW[i]!==255)bldgCnt[bldgStyle[i]]++;

  function iMesh(geo,mat,n){
    const m=new THREE.InstancedMesh(geo,mat,Math.max(1,n));
    m.castShadow=m.receiveShadow=true;
    scene.add(m);return m;
  }

  mRoad   = iMesh(flatGeo, matRoad,   cnt[T.ROAD]);
  mBridge = iMesh(flatGeo, matBridge, cnt[T.BRIDGE]);
  mPark   = iMesh(flatGeo, new THREE.MeshToonMaterial({color:0xffffff}), Math.max(1,cnt[T.PARK]));
  mWater  = iMesh(flatGeo, matWater,  cnt[T.WATER]);
  mBldgs  = BLDG_COLORS.map((c,i)=>
    iMesh(bldgBase, new THREE.MeshToonMaterial({color:c}), Math.max(1,bldgCnt[i]))
  );

  const bi=[0,0,0,0,0,0];
  let ri=0,bri=0,pi=0,wi=0;

  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty), tp=tileMap[id];
    const {x,z}=tileCenter(tx,ty);
    D.rotation.set(0,0,0);
    if(tp===T.ROAD){
      D.position.set(x,0.25,z);D.scale.set(1,1,1);D.updateMatrix();
      mRoad.setMatrixAt(ri++,D.matrix);
    }else if(tp===T.BRIDGE){
      D.position.set(x,0.25,z);D.scale.set(1,1,1);D.updateMatrix();
      mBridge.setMatrixAt(bri++,D.matrix);
    }else if(tp===T.PARK){
      D.position.set(x,0.2,z); D.scale.set(1,1,1); D.updateMatrix();
      mPark.setMatrixAt(pi, D.matrix);
      const shade = parkShade[id] % 6;
      mPark.setColorAt(pi, new THREE.Color(PARK_GREENS[shade]));
      pi++;
    }else if(tp===T.WATER){
      D.position.set(x,-0.15,z);D.scale.set(1,1,1);D.updateMatrix();
      mWater.setMatrixAt(wi++,D.matrix);
    }else if(tp===T.BUILDING){
      if(bldgW[id]===255)continue;
      const ci=bldgStyle[id], h=Math.max(1,bldgH[id]), bh=h*TILE*0.22;
      const fw=Math.max(1,bldgW[id]), fd=Math.max(1,bldgD[id]);
      const bx=x+(fw-1)*TILE*0.5, bz=z+(fd-1)*TILE*0.5;
      D.position.set(bx,bh/2+0.4,bz);D.scale.set(fw,bh,fd);D.updateMatrix();
      mBldgs[ci].setMatrixAt(bi[ci]++,D.matrix);
    }
  }
  [mRoad,mBridge,mPark,mWater,...mBldgs].forEach(m=>m.instanceMatrix.needsUpdate=true);
  if(mPark.instanceColor) mPark.instanceColor.needsUpdate=true;

  // ─── road markings ────────────────────────────────────────────────────────
  const roadMarkGeo = new THREE.PlaneGeometry(1,1);
  const roadDotGeo = new THREE.CircleGeometry(1,18);
  const MARK_Y = 0.535;
  const MARK_EDGE = TILE*0.08;
  const WHITE_LINE_W = TILE*0.055;
  const WHITE_DOT_R = WHITE_LINE_W*0.62;
  const YELLOW_LINE_W = TILE*0.07;
  const MIN_CENTER_LEN = 7;
  function makeQuarterArcGeometry(inner,outer,segments=14){
    const verts=[];
    for(let i=0;i<segments;i++){
      const a0=(i/segments)*Math.PI/2, a1=((i+1)/segments)*Math.PI/2;
      const i0=[Math.cos(a0)*inner,0,Math.sin(a0)*inner];
      const o0=[Math.cos(a0)*outer,0,Math.sin(a0)*outer];
      const i1=[Math.cos(a1)*inner,0,Math.sin(a1)*inner];
      const o1=[Math.cos(a1)*outer,0,Math.sin(a1)*outer];
      verts.push(...i0,...o0,...i1, ...o0,...o1,...i1);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.computeVertexNormals();
    return geo;
  }
  const roadArcGeo = makeQuarterArcGeometry(
    Math.max(0.01,MARK_EDGE-WHITE_LINE_W*0.5),
    MARK_EDGE+WHITE_LINE_W*0.5
  );
  const roadWhiteMat = new THREE.MeshBasicMaterial({color:0xf7f4e8,opacity:0.82,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const roadYellowMat = new THREE.MeshBasicMaterial({color:0xffd84a,opacity:0.48,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const whiteMarks = [], whiteDots = [], whiteArcs = [], yellowMarks = [];

  function isRoadish(tx,ty){
    if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return false;
    const t=tileMap[mi(tx,ty)];
    return t===T.ROAD||t===T.BRIDGE;
  }
  function isBuildingTile(tx,ty){
    if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return true;
    return tileMap[mi(tx,ty)]===T.BUILDING;
  }
  function addMark(list,x,z,w,d,rot=0){
    list.push({x,z,w,d,rot});
  }
  function addDot(list,x,z,r){list.push({x,z,r});}
  function addArc(list,x,z,rot){list.push({x,z,rot});}
  function edgeX(ex){return (ex-HALF_W)*TILE;}
  function edgeZ(ey){return (ey-HALF_H)*TILE;}

  function addWhiteV(ex,start,end,roadSide){
    const x=edgeX(ex)+roadSide*MARK_EDGE;
    const z=(edgeZ(start)+edgeZ(end+1))*0.5;
    addMark(whiteMarks,x,z,WHITE_LINE_W,(end-start+1)*TILE);
    addDot(whiteDots,x,edgeZ(start),WHITE_DOT_R);
    addDot(whiteDots,x,edgeZ(end+1),WHITE_DOT_R);
  }
  function addWhiteH(ey,start,end,roadSide){
    const x=(edgeX(start)+edgeX(end+1))*0.5;
    const z=edgeZ(ey)+roadSide*MARK_EDGE;
    addMark(whiteMarks,x,z,(end-start+1)*TILE,WHITE_LINE_W);
    addDot(whiteDots,edgeX(start),z,WHITE_DOT_R);
    addDot(whiteDots,edgeX(end+1),z,WHITE_DOT_R);
  }

  for(let ex=0;ex<=MAP_W;ex++){
    for(const roadSide of [-1,1]){
      let start=-1;
      for(let ty=0;ty<MAP_H;ty++){
        const road=roadSide>0?isRoadish(ex,ty):isRoadish(ex-1,ty);
        const wall=roadSide>0?isBuildingTile(ex-1,ty):isBuildingTile(ex,ty);
        if(road&&wall){if(start<0)start=ty;}
        else if(start>=0){addWhiteV(ex,start,ty-1,roadSide);start=-1;}
      }
      if(start>=0)addWhiteV(ex,start,MAP_H-1,roadSide);
    }
  }

  for(let ey=0;ey<=MAP_H;ey++){
    for(const roadSide of [-1,1]){
      let start=-1;
      for(let tx=0;tx<MAP_W;tx++){
        const road=roadSide>0?isRoadish(tx,ey):isRoadish(tx,ey-1);
        const wall=roadSide>0?isBuildingTile(tx,ey-1):isBuildingTile(tx,ey);
        if(road&&wall){if(start<0)start=tx;}
        else if(start>=0){addWhiteH(ey,start,tx-1,roadSide);start=-1;}
      }
      if(start>=0)addWhiteH(ey,start,MAP_W-1,roadSide);
    }
  }

  for(let ey=1;ey<MAP_H;ey++) for(let ex=1;ex<MAP_W;ex++){
    const x=edgeX(ex), z=edgeZ(ey);
    const nwB=isBuildingTile(ex-1,ey-1), neB=isBuildingTile(ex,ey-1);
    const swB=isBuildingTile(ex-1,ey),   seB=isBuildingTile(ex,ey);
    const nwR=isRoadish(ex-1,ey-1), neR=isRoadish(ex,ey-1);
    const swR=isRoadish(ex-1,ey),   seR=isRoadish(ex,ey);

    if(nwB&&neR&&swR)addArc(whiteArcs,x,z,0);
    if(neB&&nwR&&seR)addArc(whiteArcs,x,z,-Math.PI/2);
    if(seB&&neR&&swR)addArc(whiteArcs,x,z,Math.PI);
    if(swB&&nwR&&seR)addArc(whiteArcs,x,z,Math.PI/2);
  }

  function addYellowH(ey,start,end){
    const x=(edgeX(start)+edgeX(end+1))*0.5;
    addMark(yellowMarks,x,edgeZ(ey),(end-start+1)*TILE,YELLOW_LINE_W);
  }
  function addYellowV(ex,start,end){
    const z=(edgeZ(start)+edgeZ(end+1))*0.5;
    addMark(yellowMarks,edgeX(ex),z,YELLOW_LINE_W,(end-start+1)*TILE);
  }
  function roadWidthAcrossZ(tx,ey){
    let up=0,down=0;
    for(let y=ey-1;y>=0&&isRoadish(tx,y);y--)up++;
    for(let y=ey;y<MAP_H&&isRoadish(tx,y);y++)down++;
    return {up,down};
  }
  function roadWidthAcrossX(ex,ty){
    let left=0,right=0;
    for(let x=ex-1;x>=0&&isRoadish(x,ty);x--)left++;
    for(let x=ex;x<MAP_W&&isRoadish(x,ty);x++)right++;
    return {left,right};
  }

  for(let ey=1;ey<MAP_H;ey++){
    let start=-1;
    for(let tx=0;tx<MAP_W;tx++){
      const {up,down}=roadWidthAcrossZ(tx,ey);
      const twoLane=isRoadish(tx,ey-1)&&isRoadish(tx,ey)&&
        up===down&&up+down>=2&&
        isRoadish(tx-1,ey-1)&&isRoadish(tx+1,ey-1)&&
        isRoadish(tx-1,ey)&&isRoadish(tx+1,ey);
      if(twoLane){if(start<0)start=tx;}
      else if(start>=0){
        if(tx-start>=MIN_CENTER_LEN)addYellowH(ey,start,tx-1);
        start=-1;
      }
    }
    if(start>=0&&MAP_W-start>=MIN_CENTER_LEN)addYellowH(ey,start,MAP_W-1);
  }

  for(let ex=1;ex<MAP_W;ex++){
    let start=-1;
    for(let ty=0;ty<MAP_H;ty++){
      const {left,right}=roadWidthAcrossX(ex,ty);
      const twoLane=isRoadish(ex-1,ty)&&isRoadish(ex,ty)&&
        left===right&&left+right>=2&&
        isRoadish(ex-1,ty-1)&&isRoadish(ex-1,ty+1)&&
        isRoadish(ex,ty-1)&&isRoadish(ex,ty+1);
      if(twoLane){if(start<0)start=ty;}
      else if(start>=0){
        if(ty-start>=MIN_CENTER_LEN)addYellowV(ex,start,ty-1);
        start=-1;
      }
    }
    if(start>=0&&MAP_H-start>=MIN_CENTER_LEN)addYellowV(ex,start,MAP_H-1);
  }

  function wideRoadAt(tx,ty){
    if(!isRoadish(tx,ty))return false;
    let near=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
      if(dx!==0||dy!==0)near+=isRoadish(tx+dx,ty+dy)?1:0;
    const cross=(isRoadish(tx-1,ty)&&isRoadish(tx+1,ty))+
                (isRoadish(tx,ty-1)&&isRoadish(tx,ty+1));
    return near>=5||cross===2;
  }
  function drawSafetyZone(cx,cz,w,d){
    const thick=TILE*0.075;
    addMark(yellowMarks,cx,cz-d*0.5, w, thick);
    addMark(yellowMarks,cx,cz+d*0.5, w, thick);
    addMark(yellowMarks,cx-w*0.5,cz, thick, d);
    addMark(yellowMarks,cx+w*0.5,cz, thick, d);

    const stripes=Math.max(3,Math.floor(Math.min(w,d)/(TILE*0.38)));
    const len=Math.min(w,d)*0.7;
    for(let i=0;i<stripes;i++){
      const t=stripes===1?0:i/(stripes-1);
      addMark(yellowMarks,cx+(t-0.5)*w*0.68,cz,TILE*0.055,len,Math.PI/4);
    }
  }

  const wideSeen = new Uint8Array(MAP_W*MAP_H);
  for(let ty=1;ty<MAP_H-1;ty++) for(let tx=1;tx<MAP_W-1;tx++){
    const start=mi(tx,ty);
    if(wideSeen[start]||!wideRoadAt(tx,ty))continue;

    let minX=tx,maxX=tx,minY=ty,maxY=ty,count=0;
    const stack=[[tx,ty]];
    wideSeen[start]=1;
    while(stack.length){
      const [cx,cy]=stack.pop();
      count++;
      minX=Math.min(minX,cx); maxX=Math.max(maxX,cx);
      minY=Math.min(minY,cy); maxY=Math.max(maxY,cy);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const nx=cx+dx, ny=cy+dy;
        if(nx<1||nx>=MAP_W-1||ny<1||ny>=MAP_H-1)return;
        const id=mi(nx,ny);
        if(wideSeen[id]||!wideRoadAt(nx,ny))return;
        wideSeen[id]=1; stack.push([nx,ny]);
      });
    }

    const cw=maxX-minX+1, cd=maxY-minY+1;
    if(count<3||cw<2||cd<2)continue;
    const c0=tileCenter(Math.floor((minX+maxX)/2),Math.floor((minY+maxY)/2));
    const boxW=Math.min(TILE*3.2,Math.max(TILE*1.25,cw*TILE*0.62));
    const boxD=Math.min(TILE*3.2,Math.max(TILE*1.25,cd*TILE*0.62));
    drawSafetyZone(c0.x,c0.z,boxW,boxD);
  }

  function makeRoadMarks(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadMarkGeo,mat,list.length);
    list.forEach(({x,z,w,d,rot},i)=>{
      D.rotation.set(-Math.PI/2,0,rot);
      D.position.set(x,MARK_Y,z);
      D.scale.set(w,d,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }
  function makeRoadDots(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadDotGeo,mat,list.length);
    list.forEach(({x,z,r},i)=>{
      D.rotation.set(-Math.PI/2,0,0);
      D.position.set(x,MARK_Y+0.002,z);
      D.scale.set(r,r,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }
  function makeRoadArcs(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadArcGeo,mat,list.length);
    list.forEach(({x,z,rot},i)=>{
      D.rotation.set(0,rot,0);
      D.position.set(x,MARK_Y+0.004,z);
      D.scale.set(1,1,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }

  [
    makeRoadMarks(whiteMarks,roadWhiteMat),
    makeRoadArcs(whiteArcs,roadWhiteMat),
    makeRoadDots(whiteDots,roadWhiteMat),
    makeRoadMarks(yellowMarks,roadYellowMat),
  ].forEach(m=>{ if(m) markMeshes.push(m); });

  // Car spawn
  const {x:_sx, z:_sz} = tileCenter(HALF_W, HALF_H);
  sx = _sx; sz = _sz;
}
