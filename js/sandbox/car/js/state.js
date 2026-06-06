import { MAP_W, MAP_H, HALF_W, HALF_H, TILE, T } from './constants.js';
import { tileMap, mi, tileAt } from './map.js';
import { buildScene, sx, sz } from './scene.js';
import { carGroup } from './car.js';
import { resetPhysics } from './physics.js';

export const GameState = Object.freeze({
  MENU:'menu', MAP_SELECT:'map_select',
  LOADING:'loading', PLAYING:'playing',
  GAME_OVER:'game_over'
});

export let gameState = GameState.MENU;
export const GAME_DURATION = 90; // seconds
export let timeLeft = GAME_DURATION;
export let coinsCollected = 0, coinsTotal = 0;
export const coinMap = new Uint8Array(MAP_W * MAP_H); // 1=coin present
export let score = 0;

function isRoadTile(tx,ty){
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return false;
  const t=tileMap[mi(tx,ty)];
  return t===T.ROAD||t===T.BRIDGE;
}

export function startRound(mapType){
  buildScene(mapType);
  resetPhysics();

  // Place coins on road tiles
  coinMap.fill(0);
  coinsTotal = 0;
  coinsCollected = 0;

  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(!isRoadTile(tx,ty)) continue;
    // Skip tiles adjacent to non-road
    const allAdjacentRoad=
      isRoadTile(tx-1,ty) && isRoadTile(tx+1,ty) &&
      isRoadTile(tx,ty-1) && isRoadTile(tx,ty+1);
    if(!allAdjacentRoad) continue;
    // 15% probability
    if(Math.random()<0.15){
      coinMap[id]=1;
      coinsTotal++;
    }
  }

  // Position car at spawn
  carGroup.position.set(sx, 0, sz);

  timeLeft = GAME_DURATION;
  score = 0;
  gameState = GameState.PLAYING;
}

export function updateState(dt, carX, carZ){
  if(gameState!==GameState.PLAYING) return {coinCollected:false};

  timeLeft -= dt;
  if(timeLeft<=0){
    timeLeft=0;
    endRound();
    return {coinCollected:false};
  }

  // Check coin at car tile
  const tx=Math.floor(carX/TILE+HALF_W);
  const ty=Math.floor(carZ/TILE+HALF_H);
  let coinCollected=false;
  if(tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H){
    const id=mi(tx,ty);
    if(coinMap[id]===1){
      coinMap[id]=0;
      coinsCollected++;
      coinCollected=true;
    }
  }

  // Update score
  score = coinsCollected*100 + Math.floor(timeLeft)*10;

  return {coinCollected};
}

export function endRound(){
  score = coinsCollected*100 + Math.floor(timeLeft)*10;
  gameState = GameState.GAME_OVER;
}
