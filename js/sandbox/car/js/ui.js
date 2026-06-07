import { timeLeft, startRound } from './state.js';
import { calibrate, reqSensor, initJoystick } from './input.js';
import { CONST_SPEED } from './constants.js';

export let gameOn = false;

let overlay, hud, recalBtn, returnBtn;
let mapSelectEl;
let selectedMap = null;
let starting = false;

export function initUI(){
  overlay    = document.getElementById('overlay');
  hud        = document.getElementById('hud');
  recalBtn   = document.getElementById('recalBtn');
  mapSelectEl   = document.getElementById('mapSelect');

  document.getElementById('btnParis').addEventListener('click', () => {
    selectedMap = 'paris';
    startGame();
  });
  document.getElementById('btnRandom').addEventListener('click', () => {
    selectedMap = 'random';
    startGame();
  });

  recalBtn.addEventListener('click', calibrate);

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
  overlay.style.display='flex';
}
