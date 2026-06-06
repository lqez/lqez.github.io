import { buildScene, sx, sz } from './scene.js';
import { carGroup } from './car.js';
import { resetPhysics } from './physics.js';

export const GameState = Object.freeze({
  MENU:'menu', PLAYING:'playing', GAME_OVER:'game_over'
});

export let gameState = GameState.MENU;
export const GAME_DURATION = 90;
export let timeLeft = GAME_DURATION;

export function startRound(mapType){
  buildScene(mapType);
  resetPhysics();
  carGroup.position.set(sx, 0, sz);
  timeLeft = GAME_DURATION;
  gameState = GameState.PLAYING;
}

export function updateState(dt){
  if(gameState!==GameState.PLAYING) return;
  timeLeft -= dt;
  if(timeLeft<0.001){ timeLeft=0; gameState=GameState.GAME_OVER; }
}

