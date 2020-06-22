function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const GAME_READY = 0;
const GAME_PLAY = 1;
const GAME_END = 2;

const HORSE_RUN = 0;
const HORSE_JUMP = 1;
const HORSE_STOP = 2;
const HORSE_TROT = 3;
const HORSE_KICK = 4;
const HORSE_BOW = 5;

const obstacles = [
  "075199CK89_set", "078986CK37_set", "073442CP89_set", "048263CK8W_set",
  "077725CKAC_set", "071319CKL3_set", "076236CKAE_set", "071966CK9R_set",
  "063912CKAA_set", "119696B+00_set", "066302CK5P_set", "074774CK37_set",
  "067831CK36_set", "074863CK89_set", "DT40WWNOIR_set", "120642B+00_set",
  "119697B+00_set", "219690B+00_set", "201126Z+91_set", "172041Z+D3_set",
  "172212Z+05_set", "201050Z+L5_set", "182036G+BO_set", "079001CK89_set",
  "080200CK01_set", "064983CCI9_set",
];
const _stage = document.getElementById("stage");
const _horse = document.getElementById("horse");
const _highscore = document.getElementById("highscore");
const _score = document.getElementById("score");

var game_state = GAME_READY;
var horse_state = HORSE_TROT;
var level = 0;
var highscore = 0;
var time = 0;
var respawn = 0;
var timers = {};
var objects = [];
var jumping = 0;
var MIN_RESPAWN = 50;
var MAX_RESPAWN = 250;

function create_object() {
  const object = document.createElement('img');
  object.className = 'object';
  object.style.left = '1000px';
  object.style.height = getRandomInt(20, 32) + 'px';
  object.src = 'https://assets.hermes.com/is/image/hermesproduct/' + obstacles[getRandomInt(0, obstacles.length)];

  _stage.appendChild(object);
  objects.push(object);
}

function scroll_grass(x) {
  var grasses = document.getElementsByClassName('grass');
  for (var i = 0; i < grasses.length; i++) {
    var grass = grasses[i];
    var left = parseInt(grass.style.left);
    left -= x;
    if (left <= -180) {
      left = 720;
    }
    grass.style.left = left + 'px';
  }
}

function logic() {
  if (game_state === GAME_PLAY) {
    scroll_grass(4);

    time += 1;
    _score.innerHTML = time;

    if (jumping > 0) {
      jumping -= 1;
    }

    if (respawn > 0) {
      respawn -= 1;
    } else {
      create_object();
      if (MAX_RESPAWN > MIN_RESPAWN && getRandomInt(0, 2) === 0) {
        MAX_RESPAWN -= 1;
      }
      respawn = getRandomInt(50, parseInt(MAX_RESPAWN));
    }

    var newObjects = [];
    objects.forEach((object) => {
      var left = parseInt(object.style.left);
      left -= 4;
      object.style.left = left + 'px';

      if (left < 84 && left > 40) {
        if (jumping > 72 || jumping <= 20) {
          crash();
        }
      }

      if (left > -200) {
        newObjects.push(object);
      } else {
        _stage.removeChild(object);
      }
    });

    delete objects;
    objects = newObjects;
  } else if (game_state === GAME_READY) {
    scroll_grass(1);
  }
}

function update_highscore(score) {
  highscore = score;
  _highscore.innerHTML = highscore;
}

function crash() {
  change_horse(HORSE_STOP, true);
  game_state = GAME_END;

  if (time > highscore) {
    update_highscore(time);
  }
}

function change_horse(state, force) {
  if (jumping > 0 && force !== true) {
    return;
  }

  horse_state = state;

  if (timers['reset_horse'] !== null) {
    window.clearTimeout(timers['reset_horse']);
  }

  _horse.src = "https://assets.hermes.com/is/content/hermesedito/Loader/loader-" + state + ".gif";

  if (state === HORSE_JUMP) {
    timers['reset_horse'] = window.setTimeout(reset_horse, 1800);
    jumping = 80;
  }
}

function reset_horse() {
  change_horse(HORSE_RUN);
  timers['reset_horse'] = null;
}

function reset_stage() {
  objects.forEach((object) => {
    _stage.removeChild(object);
  });
  level = 0;
  time = 0;
  respawn = getRandomInt(0, 100);
  MAX_RESPAWN = 250;
  timers = {};
  objects = [];
  jumping = 0;
}

function action() {
  switch(game_state) {
    case GAME_READY:
      game_state = GAME_PLAY;
      change_horse(HORSE_RUN);
      break;
    case GAME_PLAY:
      change_horse(HORSE_JUMP);
      break;
    case GAME_END:
      game_state = GAME_READY;
      reset_stage();
      change_horse(HORSE_TROT);
      break;
  }
}

function init_game() {
  document.addEventListener('keydown', action);
  if ('ontouchstart' in document.documentElement) {
    document.addEventListener('touchstart', action);
  } else {
    document.addEventListener('click', action);
  }

  change_horse(HORSE_TROT);
  timers['logic'] = window.setInterval(logic, 16);
}

function reset_game() {
  document.removeEventListener('keydown', action);
  document.removeEventListener('click', action);
  document.removeEventListener('touchstart', action);
  window.clearInterval(timers['logic']);
}
