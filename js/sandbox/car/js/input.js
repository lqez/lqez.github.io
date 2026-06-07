// ─── keyboard ────────────────────────────────────────────────────────────────
export const keys={};
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys[e.code]=true;
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});

// ─── sensor ──────────────────────────────────────────────────────────────────
export let rawBeta=0, rawGamma=0, baseBeta=0, baseGamma=0;
export let sensorOk=false;
window.addEventListener('deviceorientation',e=>{rawBeta=e.beta??0;rawGamma=e.gamma??0;});

export async function reqSensor(){
  if(typeof DeviceOrientationEvent?.requestPermission==='function'){
    const r=await DeviceOrientationEvent.requestPermission();
    return r==='granted';
  }
  return true;
}
export function calibrate(){baseBeta=rawBeta;baseGamma=rawGamma;sensorOk=true;}

// ─── virtual joystick (touch hold 0.5s) ──────────────────────────────────────
let joyEl, stickEl;
const JOY_R   = 48;
export let joyVisible = false;
export let joyActive  = false;
export let joyDX = 0, joyDY = 0;
let joyOX = 0, joyOY = 0;
let touchId = null;
let holdTimer = null, hideTimer = null;

function showJoystick(x,y){
  clearTimeout(hideTimer);          // cancel any pending fade-out cleanup
  joyOX=x; joyOY=y; joyDX=0; joyDY=0;
  joyEl.style.left=x+'px'; joyEl.style.top=y+'px';
  stickEl.style.transform='translate(-50%,-50%)';
  joyEl.classList.add('on');        // instant activation (transition:0s)
  if(recalBtnRef) recalBtnRef.classList.add('faded');
  joyVisible=true; joyActive=true;
}
function moveStick(x,y){
  let dx=x-joyOX, dy=y-joyOY;
  const d=Math.hypot(dx,dy);
  if(d>JOY_R){ dx=dx/d*JOY_R; dy=dy/d*JOY_R; }
  joyDX=dx; joyDY=dy;
  stickEl.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function fadeOutJoystick(){
  // Begin a 1s CSS fade-out (base transition:opacity 1s), then remove.
  joyEl.classList.remove('on');
  if(recalBtnRef) recalBtnRef.classList.remove('faded');
  clearTimeout(hideTimer);
  hideTimer=setTimeout(()=>{ joyVisible=false; }, 1000);
}

let recalBtnRef = null;
let getGameOn = ()=>false;

export function initJoystick(canvasEl, recalBtn, gameOnGetter){
  joyEl   = document.getElementById('joystick');
  stickEl = document.getElementById('stick');
  recalBtnRef = recalBtn;
  if(gameOnGetter) getGameOn = gameOnGetter;

  canvasEl.addEventListener('touchstart',e=>{
    if(getGameOn()) e.preventDefault();
    if(!getGameOn()||touchId!==null) return;
    const t=e.changedTouches[0];
    touchId=t.identifier;
    const x=t.clientX, y=t.clientY;
    clearTimeout(holdTimer);
    holdTimer=setTimeout(()=>showJoystick(x,y),500);
  },{passive:false});

  canvasEl.addEventListener('touchmove',e=>{
    if(touchId===null) return;
    const t=[...e.changedTouches].find(c=>c.identifier===touchId);
    if(!t) return;
    if(joyActive){ e.preventDefault(); moveStick(t.clientX,t.clientY); }
  },{passive:false});

  function endTouch(e){
    if(touchId===null) return;
    if(![...e.changedTouches].some(c=>c.identifier===touchId)) return;
    touchId=null;
    clearTimeout(holdTimer);
    if(joyActive){
      joyActive=false; joyDX=0; joyDY=0;
      stickEl.style.transform='translate(-50%,-50%)';
      fadeOutJoystick();
    }
  }
  canvasEl.addEventListener('touchend',endTouch);
  canvasEl.addEventListener('touchcancel',endTouch);
}
