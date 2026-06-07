import { timeLeft, startRound } from './state.js';
import { calibrate, reqSensor, initJoystick } from './input.js';
import { CONST_SPEED } from './constants.js';

export let gameOn = false;

let overlay, startBtn, hud, recalBtn, returnBtn;
let mapSelectEl, startPanelEl, startDescEl;
let selectedMap = null;
let starting = false;

export function initUI(){
  overlay    = document.getElementById('overlay');
  startBtn   = document.getElementById('startBtn');
  hud        = document.getElementById('hud');
  recalBtn   = document.getElementById('recalBtn');
  mapSelectEl   = document.getElementById('mapSelect');
  startPanelEl  = document.getElementById('startPanel');
  startDescEl   = document.getElementById('startDesc');

  document.getElementById('btnParis').addEventListener('click', () => {
    selectedMap = 'paris';
    mapSelectEl.style.display = 'none';
    startDescEl.innerHTML = '🗼 파리 지도로 주행합니다.<br><small style="color:#888">모바일: 센서 접근 허용 필요</small>';
    startPanelEl.style.display = 'flex';
  });
  document.getElementById('btnRandom').addEventListener('click', () => {
    selectedMap = 'random';
    mapSelectEl.style.display = 'none';
    startDescEl.innerHTML = '🎲 랜덤 도시 지도로 주행합니다.<br><small style="color:#888">모바일: 센서 접근 허용 필요</small>';
    startPanelEl.style.display = 'flex';
  });

  startBtn.addEventListener('click', startGame);
  recalBtn.addEventListener('click', calibrate);

  // Keyboard shortcut: any key starts if map selected
  window.addEventListener('keydown', e=>{
    if(!gameOn && selectedMap) startGame();
  });

  // Init joystick (pass canvas and recalBtn)
  const canvasEl = document.getElementById('c');
  initJoystick(canvasEl, recalBtn, ()=>gameOn);
  returnBtn = document.getElementById('returnBtn');
  returnBtn.addEventListener('click', returnToMenu);
}

export async function startGame(){
  if(gameOn||starting||!selectedMap)return;
  starting=true;
  const ok=await reqSensor();
  if(!ok){starting=false;alert('센서 권한이 필요합니다.');return;}
  startRound(selectedMap);
  calibrate();
  overlay.style.display='none';
  hud.style.display='block';
  recalBtn.style.display='block';
  gameOn=true;
  starting=false;
}

export function updateHUD(dirArrow){
  if(!hud) return;
  hud.textContent=`${dirArrow} ${(CONST_SPEED*3.6).toFixed(0)} km/h\n⏱ ${Math.ceil(timeLeft)}s`;
}

export function showGameOver(){
  hud.style.display='none';
  recalBtn.style.display='none';
  returnBtn.style.display='block';
}

function returnToMenu(){
  returnBtn.style.display='none';
  gameOn=false;
  selectedMap=null;
  mapSelectEl.style.display='flex';
  startPanelEl.style.display='none';
  overlay.style.display='flex';
}
