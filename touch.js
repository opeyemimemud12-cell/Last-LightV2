/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — touch controls (window.LLTOUCH)
   Self-contained mobile layer: virtual joystick (move), look pad
   (drag = mouse-look / flight stick / external-cam orbit), and a
   contextual action cluster. Speaks to the game exclusively via
   synthetic Keyboard/Mouse events and the window.__LLSTATE() hook
   the game exposes — no other coupling.
   Auto-activates on touch devices once gameplay begins.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints|0) > 0 ||
               (window.matchMedia && matchMedia('(pointer: coarse)').matches);
if (!IS_TOUCH) return;

var LLT = window.LLTOUCH = { on: false, drag: false };

/* ---------- synthetic input ---------- */
function key(code, type) {
  dispatchEvent(new KeyboardEvent(type, { code: code, key: code.replace('Key','').replace('Digit',''), bubbles: true, cancelable: true }));
}
function keyTap(code) { key(code, 'keydown'); setTimeout(function () { key(code, 'keyup'); }, 60); }
function mouse(type, dx, dy, target) {
  var e = new MouseEvent(type, { button: 0, bubbles: true, cancelable: true });
  try {
    Object.defineProperty(e, 'movementX', { value: dx || 0, configurable: true });
    Object.defineProperty(e, 'movementY', { value: dy || 0, configurable: true });
  } catch (err) {}
  (target || window).dispatchEvent(e);
}
function canvasEl() { return document.querySelector('canvas'); }
function lmbDown() { var c = canvasEl(); if (c) mouse('mousedown', 0, 0, c); }
function lmbUp()   { mouse('mouseup', 0, 0); }

/* ---------- DOM ---------- */
var root = document.createElement('div');
root.id = 'lltouch';
root.innerHTML =
  '<style>' +
  '#lltouch{position:fixed;inset:0;z-index:70;pointer-events:none;display:none;' +
  'font-family:Consolas,monospace;-webkit-user-select:none;user-select:none}' +
  '#lltouch .btn{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;' +
  'border:1px solid #b8862b;border-radius:10px;background:rgba(10,12,10,.55);color:#e8c56a;' +
  'font-size:11px;letter-spacing:.5px;text-align:center;line-height:1.1;padding:2px;' +
  'backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}' +
  '#lltouch .btn:active,.btn.held{background:rgba(184,134,43,.45);color:#fff;border-color:#ffd97a}' +
  '#lltouch .btn.glow{border-color:#ffd97a;box-shadow:0 0 12px rgba(255,217,122,.7);color:#fff}' +
  '#lltouch .big{font-size:13px;font-weight:bold}' +
  '#lljoy{position:absolute;left:18px;bottom:18px;width:138px;height:138px;pointer-events:auto;' +
  'border:1px solid rgba(184,134,43,.5);border-radius:50%;background:rgba(10,12,10,.35)}' +
  '#lljoyk{position:absolute;left:44px;top:44px;width:50px;height:50px;border-radius:50%;' +
  'background:rgba(184,134,43,.45);border:1px solid #e8c56a}' +
  '#lllook{position:absolute;right:0;top:0;width:55%;height:100%;pointer-events:auto}' +
  '</style>' +
  '<div id="lllook"></div>' +
  '<div id="lljoy"><div id="lljoyk"></div></div>';

var B = [];   /* button registry */
var rotHint = null, rotShown = false;
function portraitHint() {
  if (rotShown || !LLT.on) return;
  if (window.innerWidth > window.innerHeight * 1.05) return;
  rotShown = true;
  rotHint = document.createElement('div');
  rotHint.style.cssText = 'position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);' +
    'pointer-events:none;background:rgba(10,12,10,.85);border:1px solid #b8862b;border-radius:10px;' +
    'padding:10px 16px;color:#e8c56a;font-size:13px;letter-spacing:1px;text-align:center;z-index:99';
  rotHint.textContent = '⟳ ROTATE TO LANDSCAPE FOR BEST FLIGHT';
  root.appendChild(rotHint);
  setTimeout(function () { if (rotHint && rotHint.parentNode) rotHint.parentNode.removeChild(rotHint); }, 4000);
}
function btn(id, label, x, y, w, h, cls, dn, up) {
  var el = document.createElement('div');
  el.className = 'btn ' + (cls || '');
  el.id = 'llb_' + id;
  el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
  el.innerHTML = label;
  el.addEventListener('touchstart', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    el.classList.add('held');
    if (dn) dn(ev); else if (up) keyTap(id);   /* default: tap = key by id */
  }, { passive: false });
  el.addEventListener('touchend', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    el.classList.remove('held');
    if (up) up(ev);
  }, { passive: false });
  el.addEventListener('touchcancel', function () { el.classList.remove('held'); if (up) up(); });
  root.appendChild(el);
  B.push({ id: id, el: el });
  return el;
}
function $(id) { return root.querySelector('#llb_' + id); }

function init() {
  if (root.parentNode) return;
  document.body.appendChild(root);
  buildUI();
  wireJoystick();
  wireLook();
  setInterval(poll, 300);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

function buildUI() {
  /* top-left: system row */
  btn('Escape', '❚❚', 12, 10, 46, 40, '', null, null);        /* pause   */
  $('Escape').addEventListener('touchstart', function (ev) { ev.preventDefault(); keyTap('Escape'); });
  btn('KeyM', 'NAV', 64, 10, 46, 40);
  btn('Tab', 'INV', 116, 10, 46, 40);
  btn('KeyC', 'CAM', 168, 10, 46, 40);
  btn('KeyV', 'MIC', 220, 10, 46, 40);

  /* tools 1-5 (on foot, in ship) */
  for (var i = 1; i <= 5; i++) btn('Digit' + i, '' + i, 12 + (i - 1) * 40, 58, 36, 34);

  /* ACTION (big, bottom-right) = LMB: use / tool / place / scan */
  btn('ACT', 'USE', -104, -110, 88, 88, 'big', function () { lmbDown(); }, function () { lmbUp(); });
  btn('KeyE', 'E', -104, -150, 46, 36);                        /* stand / exit / close */
  btn('Space', 'JUMP', -52, -146, 46, 36);                     /* jump / brake */
  btn('ShiftLeft', 'RUN', -104, -190, 46, 36, '', function(){ key('ShiftLeft','keydown'); }, function(){ key('ShiftLeft','keyup'); });

  /* pilot cluster (seated) */
  btn('thrU', 'THR+▲', -190, -70, 60, 40, '', function(){ key('KeyW','keydown'); }, function(){ key('KeyW','keyup'); });
  btn('thrD', 'THR▼', -190, -24, 60, 40, '', function(){ key('KeyS','keydown'); }, function(){ key('KeyS','keyup'); });
  btn('KeyX', 'CUT', -190, -110, 60, 34);
  btn('KeyJ', 'HYPER', -190, -154, 60, 44, '', function(){ key('KeyJ','keydown'); }, function(){ key('KeyJ','keyup'); });
  btn('KeyG', 'GEAR', -252, -70, 56, 40);
  btn('KeyN', 'ALIGN', -252, -24, 56, 40);

  /* build mode cluster */
  btn('KeyR', 'ROT', -190, -110, 60, 34);
  btn('bldX', 'DEMO', -252, -110, 56, 40);
  $('bldX').addEventListener('touchstart', function (ev) { ev.preventDefault(); keyTap('KeyX'); });

  /* rover cluster */
  btn('KeyL', 'LIGHT', -252, -70, 56, 40);
  btn('roverB', 'PWR', -252, -24, 56, 40);
  $('roverB').addEventListener('touchstart', function (ev) { ev.preventDefault(); keyTap('KeyB'); });

  /* station / dock */
  btn('KeyF', 'DOCK', -190, -70, 60, 40);
  btn('KeyT', 'STATION', -190, -24, 60, 40);

  btn('KeyB', 'BUILD', 12, -54, 56, 40);
}

/* ---------- joystick ---------- */
function wireJoystick() {
  var zone = root.querySelector('#lljoy'), knob = root.querySelector('#lljoyk');
  var tid = null, cx = 0, cy = 0, R = 44, cur = {};
  function setK(dx, dy) { knob.style.left = (44 + dx) + 'px'; knob.style.top = (44 + dy) + 'px'; }
  function applyKeys(v) {
    var want = {};
    want.KeyW = v.y < -0.30; want.KeyS = v.y > 0.30;
    want.KeyA = v.x < -0.30; want.KeyD = v.x > 0.30;
    want.ShiftLeft = (Math.abs(v.x) > 0.90 || Math.abs(v.y) > 0.90);
    for (var k in want) {
      if (want[k] && !cur[k]) key(k, 'keydown');
      if (!want[k] && cur[k]) key(k, 'keyup');
    }
    for (var k2 in cur) if (!(k2 in want)) { key(k2, 'keyup'); delete cur[k2]; }
    cur = want;
  }
  zone.addEventListener('touchstart', function (ev) {
    ev.preventDefault();
    var t = ev.changedTouches[0], r = zone.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; tid = t.identifier;
  }, { passive: false });
  zone.addEventListener('touchmove', function (ev) {
    ev.preventDefault();
    for (var i = 0; i < ev.changedTouches.length; i++) {
      var t = ev.changedTouches[i];
      if (t.identifier !== tid) continue;
      var dx = t.clientX - cx, dy = t.clientY - cy, d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      setK(dx, dy);
      applyKeys({ x: dx / R, y: dy / R });
    }
  }, { passive: false });
  function end(ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      if (ev.changedTouches[i].identifier !== tid) continue;
      tid = null; setK(0, 0); applyKeys({ x: 0, y: 0 });
    }
  }
  zone.addEventListener('touchend', end, { passive: false });
  zone.addEventListener('touchcancel', end, { passive: false });
}

/* ---------- look pad (right half) ---------- */
function wireLook() {
  var pad = root.querySelector('#lllook');
  var tid = null, lx = 0, ly = 0, moved = false;
  var K = 1.7;  /* finger → mouse amplification */
  pad.addEventListener('touchstart', function (ev) {
    ev.preventDefault();
    var t = ev.changedTouches[0];
    tid = t.identifier; lx = t.clientX; ly = t.clientY; moved = false;
  }, { passive: false });
  pad.addEventListener('touchmove', function (ev) {
    ev.preventDefault();
    for (var i = 0; i < ev.changedTouches.length; i++) {
      var t = ev.changedTouches[i];
      if (t.identifier !== tid) continue;
      var dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY;
      if (dx || dy) { moved = true; LLT.drag = true; mouse('mousemove', dx * K, dy * K); }
    }
  }, { passive: false });
  function end(ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      if (ev.changedTouches[i].identifier !== tid) continue;
      tid = null; LLT.drag = false;
      /* a clean tap on the pad = LMB (use / tool / place) */
      if (!moved) { lmbDown(); setTimeout(lmbUp, 60); }
    }
  }
  pad.addEventListener('touchend', end, { passive: false });
  pad.addEventListener('touchcancel', end, { passive: false });
}

/* ---------- context polling ---------- */
function st() {
  try { return window.__LLSTATE ? window.__LLSTATE() : {}; } catch (e) { return {}; }
}
function visible(id, show) { var el = $(id); if (el) el.style.display = show ? 'flex' : 'none'; }

function poll() {
  var s = st();
  var splash = document.getElementById('splash');
  var inGame = splash && getComputedStyle(splash).display === 'none';
  var overlay = s.paused || s.term || s.dead || s.win ||
    ['pause', 'death', 'winov', 'netp', 'sset', 'slist'].some(function (id) {
      var el = document.getElementById(id);
      return el && getComputedStyle(el).display !== 'none';
    });
  LLT.on = inGame && !overlay;
  root.style.display = LLT.on ? 'block' : 'none';
  portraitHint();

  /* ACTION glows when something is aimed at (#pr prompt visible) */
  var pr = document.getElementById('pr');
  var aiming = pr && getComputedStyle(pr).display !== 'none';
  var act = $('ACT');
  if (act) { if (aiming) act.classList.add('glow'); else act.classList.remove('glow'); }

  var seated = !!s.seated, rover = !!s.rover, bld = !!s.bld, docked = !!s.docked;
  var foot = !seated && !rover;

  /* pilot cluster */
  visible('thrU', seated); visible('thrD', seated); visible('KeyX', seated);
  visible('KeyJ', seated && s.mode === 'space'); visible('KeyG', seated); visible('KeyN', seated);
  /* build cluster */
  visible('KeyR', bld); visible('bldX', bld);
  /* rover cluster */
  visible('KeyL', rover); visible('roverB', rover);
  /* station */
  visible('KeyF', s.mode === 'space' && !docked && !seated);
  visible('KeyT', docked);
  /* foot-only */
  visible('Space', foot || rover);   /* jump / rover brake */
  visible('ShiftLeft', foot);
  visible('KeyB', foot && !bld);
  for (var i = 1; i <= 5; i++) visible('Digit' + i, foot);
  visible('KeyE', !(!foot && !seated && !rover) || seated || rover || s.term);
  visible('ACT', !bld ? true : true);
  $('ACT').innerHTML = bld ? 'PLACE' : 'USE';
}
})();
