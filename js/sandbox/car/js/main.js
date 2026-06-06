import { scene, renderer, camera, composer,
         setTopCamera, cameraLead, targetCameraLead, ZERO_CAMERA_LEAD,
         sx, sz } from './scene.js';
import { carGroup, wheelMeshes, wR_, spawnEffects, updateParticles } from './car.js';
import { keys, joyActive, joyDX, joyDY, joyVisible,
         rawBeta, rawGamma, baseBeta, baseGamma,
         calibrate, sensorOk } from './input.js';
import { dirX, dirZ, prevDirX, prevDirZ, turnBias, stuckTimer,
         leadingClearForDir, moveWithCollision, targetRotY, ROT_SPEED,
         setDir, setPrevDir, setTurnBias, setStuckTimer, setTargetRotY } from './physics.js';
import { GameState, gameState, updateState, GAME_DURATION, timeLeft } from './state.js';
import { gameOn, updateHUD, showGameOver, initUI, startGame } from './ui.js';
import { CONST_SPEED } from './constants.js';

// ─── init ─────────────────────────────────────────────────────────────────────
initUI();

// ─── game loop state ──────────────────────────────────────────────────────────
let particleTimer=0;
let wheelAngle=0;
let last=performance.now();
let wasGameOver=false;

// ─── tick ─────────────────────────────────────────────────────────────────────
function tick(){
  requestAnimationFrame(tick);
  const now=performance.now();
  const dt=Math.min((now-last)/1000,0.05);
  last=now;

  // Read current module-level values each frame (live bindings)
  const _gameOn   = gameOn;
  const _sensorOk = sensorOk;
  const _gState   = gameState;

  if(_gameOn && _sensorOk){
    // ── player steers: key/tilt = desired direction ───────────────────────────
    let wantX=0, wantZ=0;
    if     (keys['ArrowUp']   ||keys['KeyW']) { wantX=0;  wantZ=-1; }
    else if(keys['ArrowDown'] ||keys['KeyS']) { wantX=0;  wantZ=1;  }
    else if(keys['ArrowRight']||keys['KeyD']) { wantX=1;  wantZ=0;  }
    else if(keys['ArrowLeft'] ||keys['KeyA']) { wantX=-1; wantZ=0;  }

    // Virtual joystick: dominant drag axis (only when no key pressed)
    if(wantX===0&&wantZ===0 && joyActive){
      const ax=Math.abs(joyDX), ay=Math.abs(joyDY);
      if(Math.max(ax,ay) > 14){
        if(ax>=ay){ wantX = joyDX>0 ? 1 : -1; wantZ=0; }
        else      { wantZ = joyDY>0 ? 1 : -1; wantX=0; }
      }
    }

    // Sensor: dominant tilt axis — only when no key/joystick and recalibrate button active
    if(wantX===0&&wantZ===0 && !joyVisible){
      const tiltFwd  = rawBeta  - baseBeta;
      const tiltSide = rawGamma - baseGamma;
      const FD = 8;
      const afwd = Math.abs(tiltFwd), aside = Math.abs(tiltSide);
      if(Math.max(afwd, aside) > FD){
        if(afwd >= aside){ wantX=0; wantZ = tiltFwd>0 ? 1 : -1; }
        else             { wantX = tiltSide>0 ? 1 : -1; wantZ=0; }
      }
    }

    // Apply player steer when the new direction's leading edge is clear
    if((wantX!==0||wantZ!==0)&&(wantX!==dirX||wantZ!==dirZ)){
      const wnx=carGroup.position.x+wantX*CONST_SPEED*dt;
      const wnz=carGroup.position.z+wantZ*CONST_SPEED*dt;
      if(leadingClearForDir(wnx,wnz,wantX,wantZ)){
        setPrevDir(dirX,dirZ);
        setDir(wantX,wantZ);
        setStuckTimer(0);
      }
    }

    // ── always move; auto-turn on wall hit ────────────────────────────────────
    const move=moveWithCollision(carGroup.position.x,carGroup.position.z,dirX,dirZ,dt);

    if(move.moved){
      carGroup.position.x=move.x;
      carGroup.position.z=move.z;
      setStuckTimer(0);
    }else{
      setStuckTimer(stuckTimer+dt);

      const rX=-dirZ, rZ=dirX, lX=dirZ, lZ=-dirX, bX=-dirX, bZ=-dirZ;

      const prevIsUseful=(prevDirX!==dirX||prevDirZ!==dirZ)
                        &&(prevDirX!==bX   ||prevDirZ!==bZ);

      let tries;
      if(stuckTimer>0.4){
        tries=[[bX,bZ],[rX,rZ],[lX,lZ]];
        setStuckTimer(0);
      }else if(prevIsUseful){
        const sides=turnBias>0?[[rX,rZ],[lX,lZ]]:[[lX,lZ],[rX,rZ]];
        tries=[[prevDirX,prevDirZ],...sides,[bX,bZ]];
      }else{
        tries=turnBias>0?[[rX,rZ],[lX,lZ],[bX,bZ]]:[[lX,lZ],[rX,rZ],[bX,bZ]];
      }

      for(const [tx,tz] of tries){
        const tnx=carGroup.position.x+tx*CONST_SPEED*dt;
        const tnz=carGroup.position.z+tz*CONST_SPEED*dt;
        if(leadingClearForDir(tnx,tnz,tx,tz)){
          const turnMove=moveWithCollision(carGroup.position.x,carGroup.position.z,tx,tz,dt);
          if(!turnMove.moved)continue;
          setPrevDir(dirX,dirZ);
          setDir(tx,tz);
          carGroup.position.x=turnMove.x;
          carGroup.position.z=turnMove.z;
          setTurnBias(-turnBias);
          setStuckTimer(0);
          break;
        }
      }
    }

    // ── visual rotation toward current direction ──────────────────────────────
    setTargetRotY(Math.atan2(-dirZ, dirX));
    let diff=targetRotY-carGroup.rotation.y;
    while(diff>Math.PI)  diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    carGroup.rotation.y+=Math.sign(diff)*Math.min(Math.abs(diff), ROT_SPEED*dt);

    // ── wheel spin ────────────────────────────────────────────────────────────
    wheelAngle-=CONST_SPEED*dt/wR_;
    wheelMeshes.forEach(w=>w.rotation.y=wheelAngle);

    // ── particles ─────────────────────────────────────────────────────────────
    particleTimer+=dt;
    if(particleTimer>0.055){
      particleTimer=0;
      spawnEffects(carGroup.position.x,carGroup.position.z,dirX,dirZ,CONST_SPEED);
    }
    updateParticles(dt);

    // ── camera ────────────────────────────────────────────────────────────────
    const tgtX=carGroup.position.x;
    const tgtZ=carGroup.position.z;
    targetCameraLead.set(-dirX*32,0,-dirZ*32);
    cameraLead.lerp(targetCameraLead, 1-Math.exp(-2.4*dt));
    setTopCamera(tgtX,tgtZ);

    // ── update game state (timer) ─────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      updateState(dt);

      // HUD
      const _dirX=dirX, _dirZ=dirZ;
      const dirArrow=_dirX>0?'→':_dirX<0?'←':_dirZ<0?'↑':'↓';
      updateHUD(dirArrow);
    }

    // ── check game over ───────────────────────────────────────────────────────
    if(gameState===GameState.GAME_OVER && !wasGameOver){
      wasGameOver=true;
      showGameOver();
    }
    if(gameState!==GameState.GAME_OVER){
      wasGameOver=false;
    }

  }else if(!_gameOn){
    cameraLead.lerp(ZERO_CAMERA_LEAD, 1-Math.exp(-2.4*dt));
    setTopCamera(sx,sz);
  }

  composer.render();
}

tick();
