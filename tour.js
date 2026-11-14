(function () {
'use strict';

/* ---------- the tour ---------- */
var STOPS = [
  { id: 'intro', short: 'Intro', title: 'Introduction', sub: 'Includes safety notes', audio: 'Disclaimer.mp3', img: 'intro', dur: 57, ll: [51.13030, 0.26366] },
  { id: 'station', short: 'Station', title: 'Tunbridge Wells Station', sub: '', audio: 'Train.mp3', img: 'station', dur: 95, ll: [51.1302233, 0.263371] },
  { id: 'high-street', short: 'High St', title: 'The High Street', sub: '', audio: 'High-Street.mp3', img: 'high-street', dur: 345, ll: [51.1294835, 0.2635699] },
  { id: 'forum', short: 'Forum', title: 'The Forum', sub: 'Music venue', audio: 'Forum.mp3', img: 'forum', dur: 76, ll: [51.1273883, 0.260389] },
  { id: 'church', short: 'Church', title: 'Church of King Charles the Martyr', sub: '', audio: 'Chapel.mp3', img: 'church', dur: 180, ll: [51.1268706, 0.2594122] },
  { id: 'spring', short: 'Spring', title: 'The Chalybeate Spring', sub: '', audio: 'Spring.mp3', img: 'spring', dur: 136, ll: [51.1266707, 0.258696] },
  { id: 'pantiles', short: 'Pantiles', title: 'The Pantiles', sub: '', audio: 'Pantiles.mp3', img: 'pantiles', dur: 115, ll: [51.12625, 0.25815] },
  { id: 'jazz-stand', short: 'Jazz Stand', title: 'The Jazz Stand', sub: 'Includes closing remarks', audio: 'Band-Stand.mp3', img: 'jazz-stand', dur: 167, ll: [51.1257606, 0.2575458] }
];
var N = STOPS.length;
var KEY = 'tw-tour-v1';
var AUDIO_CACHE = 'tw-audio-v1';

/* ---------- saved state (works without storage too) ---------- */
var S = { stop: 0, pos: 0, heard: [], rate: 1, started: false, agreed: false, fs: 16 };
try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') Object.assign(S, o); } } catch (e) {}
if (!(S.stop >= 0 && S.stop < N)) S.stop = 0;
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function $(id) { return document.getElementById(id); }
var _w = {};
function put(id, prop, val) { var k = id + '|' + prop; if (_w[k] === val) return; _w[k] = val; var e = $(id); if (prop === 'text') e.textContent = val; else if (prop.charAt(0) === '@') e.setAttribute(prop.slice(1), val); else e.style[prop] = val; }
function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function stop() { return STOPS[S.stop]; }
function img(s, thumb) { return 'media/' + s.img + (thumb ? '-thumb' : '') + '.jpg'; }
function gmaps(ll) { return 'https://www.google.com/maps/dir/?api=1&destination=' + ll[0] + ',' + ll[1] + '&travelmode=walking'; }
function amaps(ll) { return 'https://maps.apple.com/?daddr=' + ll[0] + ',' + ll[1] + '&dirflg=w'; }
var toastT;
function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3800); }

/* ---------- audio ---------- */
var au = $('au'), view = 'start', loaded = -1, pendingSeek = null, wantPlay = false, mapReturn = 'player';
function dur() { return (au.duration && isFinite(au.duration)) ? au.duration : stop().dur; }
function pos() { return pendingSeek != null ? pendingSeek : (au.currentTime || 0); }
function playing() { return !chiming && !au.paused && !au.ended; }
function load(at, autoplay) {
  wantPlay = !!autoplay; chiming = false;
  if (loaded !== S.stop) { loaded = S.stop; pendingSeek = at || 0; au.src = stop().audio; au.load(); }
  else { try { au.currentTime = at || 0; } catch (e) {} }
  au.playbackRate = S.rate;
  if (autoplay) play();
  icons(); progress(); media();
  keepForOffline(stop().audio);
  if (STOPS[S.stop + 1]) keepForOffline(STOPS[S.stop + 1].audio);
}
au.addEventListener('loadedmetadata', function () {
  if (pendingSeek != null) { try { au.currentTime = Math.min(pendingSeek, au.duration - 0.3); } catch (e) {} pendingSeek = null; }
  au.playbackRate = S.rate; progress();
});
function play() {
  au.playbackRate = S.rate;
  var p = au.play();
  if (p && p.catch) p.catch(function (e) { wantPlay = false; icons(); if (e && e.name === 'NotAllowedError') toast('Press play to start the audio.'); });
  tellOtherTabs();
}
function pause() { au.pause(); }
function toggle() {
  if (playing()) { pause(); return; }
  if (loaded !== S.stop) { load(S.pos, true); return; }
  if (pos() >= dur() - 0.3) seekTo(0);
  play();
}
function seekTo(t) {
  t = Math.max(0, Math.min(dur() - 0.2, t));
  if (pendingSeek != null || loaded !== S.stop) { pendingSeek = t; S.pos = t; }
  else { try { au.currentTime = t; } catch (e) {} }
  S.pos = t; save(); progress(); dock();
}
function seekBy(d) { seekTo(pos() + d); }
['play', 'pause'].forEach(function (ev) { au.addEventListener(ev, function () { if (chiming) return; icons(); media(); if (view === 'map') renderMap(); }); });
au.addEventListener('timeupdate', function () { if (chiming) return; S.pos = au.currentTime; if (Math.floor(S.pos) % 3 === 0) save(); posState(); });
au.addEventListener('ended', function () { if (chiming) { chiming = false; icons(); return; } finishStop(); });
au.addEventListener('error', function () { if (chiming) { chiming = false; return; } if (au.src) toast('This stop did not load. Check your signal, or save the tour to your phone in Settings.'); icons(); });
document.addEventListener('visibilitychange', save);
window.addEventListener('pagehide', save);
(function loop() { if (view === 'player') progress(); else if (view === 'map') dock(); requestAnimationFrame(loop); })();

var PAUSE_I = '<rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/>', PLAY_I = '<path d="M7.5 4.5v15l12-7.5z"/>';
function icons() {
  var p = playing() || (wantPlay && pendingSeek != null);
  $('playIcon').innerHTML = p ? PAUSE_I : PLAY_I; $('dockIcon').innerHTML = p ? PAUSE_I : PLAY_I;
  $('play').setAttribute('aria-label', p ? 'Pause' : 'Play'); $('dockPlay').setAttribute('aria-label', p ? 'Pause' : 'Play');
  dock();
}

/* One tab at a time: a new tab playing pauses any older one. */
var chan = null; try { chan = new BroadcastChannel('tw-tour'); } catch (e) {}
var tabId = Math.random().toString(36).slice(2);
function tellOtherTabs() { if (chan) chan.postMessage({ type: 'playing', from: tabId }); }
if (chan) chan.onmessage = function (e) { if (e.data && e.data.type === 'playing' && e.data.from !== tabId && playing()) { pause(); toast('Paused here because the tour is playing in another tab.'); } };

/* Lock screen and headphone controls */
/* Lock screen / Dynamic Island / Android notification.
   iPhone ignores these details if they arrive before the sound has really started, or if they are
   replaced too often, so: send them when a stop loads, again once it is actually playing (and a moment
   later), and otherwise leave them alone. The audio element's title and the page title are fallbacks
   that phones show when they skip the details. */
var mediaKey = '', handlersSet = false;
function media(force) {
  var s = stop(), title = s.title, sub = 'Stop ' + (S.stop + 1) + ' of ' + N + ' · Tunbridge Wells audio tour';
  try { au.title = title + ' – ' + sub; } catch (e) {}
  if (view !== 'start' && view !== 'resume') document.title = title + ' · Tunbridge Wells Audio Tour';
  try {
    if (!('mediaSession' in navigator)) return;
    var ms = navigator.mediaSession;
    if (force || mediaKey !== s.id || !ms.metadata) {
      mediaKey = s.id;
      var art = [96, 192, 256, 384, 512].map(function (px) { return { src: new URL('media/art/' + s.img + '-' + px + '.jpg', location.href).href, sizes: px + 'x' + px, type: 'image/jpeg' }; });
      ms.metadata = new MediaMetadata({ title: title, artist: sub, album: 'Royal Tunbridge Wells', artwork: art });
    }
    ms.playbackState = playing() ? 'playing' : 'paused';
    if (handlersSet) return; handlersSet = true;
    var h = { play: function () { if (!playing()) toggle(); }, pause: pause, seekbackward: function () { seekBy(-10); }, seekforward: function () { seekBy(10); },
      seekto: function (d) { if (d && d.seekTime != null) seekTo(d.seekTime); },
      previoustrack: function () { if (S.stop > 0) goStop(S.stop - 1, true); }, nexttrack: function () { if (S.stop < N - 1) goStop(S.stop + 1, true); } };
    Object.keys(h).forEach(function (k) { try { ms.setActionHandler(k, h[k]); } catch (e) {} });
  } catch (e) {}
}
au.addEventListener('playing', function () { if (chiming) return; media(true); posState(true); setTimeout(function () { if (!chiming && playing()) { media(true); posState(true); } }, 700); });
au.addEventListener('loadedmetadata', function () { if (!chiming) { media(); posState(true); } });
au.addEventListener('ratechange', function () { if (!chiming) posState(true); });
au.addEventListener('seeked', function () { if (!chiming) posState(true); });
var posAt = 0;
function posState(now) { if (!now && Date.now() - posAt < 5000) return; posAt = Date.now(); try { if (navigator.mediaSession && navigator.mediaSession.setPositionState && isFinite(au.duration)) navigator.mediaSession.setPositionState({ duration: au.duration, playbackRate: au.playbackRate, position: Math.min(au.currentTime, au.duration) }); } catch (e) {} }

/* ---------- views ---------- */
var leaveTimer = {}, ORDER = { start: 0, resume: 0, agree: 1, player: 2, between: 2, end: 3, map: -1 };
function still() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
function show(v) {
  var old = view, from = $('v-' + old);
  view = v;
  // the map comes in from the left (its button is top left); going back slides the other way
  var dir = v === 'map' ? 'l' : (old === 'map' ? 'r' : (ORDER[v] < ORDER[old] ? 'r' : 'up'));
  ['start', 'resume', 'player', 'between', 'agree', 'map', 'end'].forEach(function (n) {
    var el = $('v-' + n);
    clearTimeout(leaveTimer[n]); el.classList.remove('leave', 'leave-l', 'leave-r');
    if (n === v) { el.hidden = false; return; }
    if (n === old && !el.hidden && !still()) {
      el.classList.add('leave', dir === 'l' ? 'leave-r' : dir === 'r' ? 'leave-l' : 'leave');
      leaveTimer[n] = setTimeout(function () { el.hidden = true; el.classList.remove('leave', 'leave-l', 'leave-r'); }, 260);
    } else el.hidden = true;
  });
  var el = $('v-' + v);
  el.classList.remove('enter', 'enter-l', 'enter-r', 'intro'); void el.offsetWidth;
  el.classList.add(dir === 'l' ? 'enter-l' : dir === 'r' ? 'enter-r' : 'enter', 'intro');
  clearTimeout(leaveTimer['intro' + v]); leaveTimer['intro' + v] = setTimeout(function () { el.classList.remove('intro'); }, 1400);
  if (v === 'player') renderPlayer();
  if (v === 'map') renderMap();
  var h = v === 'player' ? 'stop-' + (S.stop + 1) : (v === 'map' ? 'map' : '');
  try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (e) {}
}
/* Sheets (Settings, Credits) slide up on an iOS-style curve and slide away a little faster. */
function openScrim(id, how) {
  var sc = $(id); clearTimeout(leaveTimer[id]);
  sc.classList.remove('closing', 'push', 'pop'); if (how) sc.classList.add(how);
  sc.hidden = false;
}
function closeScrim(id, now) {
  var sc = $(id); if (sc.hidden) return;
  if (now || still()) { sc.hidden = true; return; }
  sc.classList.add('closing');
  leaveTimer[id] = setTimeout(function () { sc.hidden = true; sc.classList.remove('closing'); }, 200);
}
function gearSpin(on) { document.querySelectorAll('[data-settings]').forEach(function (b) { b.classList.toggle('spin', on); }); }
function sheet(on, how) { if (on) { openScrim('s-settings', how); renderSettings(); } else closeScrim('s-settings', how === 'now'); gearSpin(on); }
function finishStop() {
  if (S.heard.indexOf(S.stop) < 0) S.heard.push(S.stop);
  S.pos = 0; save(); chime(); icons();
  if (S.stop === N - 1) { show('end'); return; }
  if (S.stop === 0 && !S.agreed) { askAgree({ then: 'between' }); return; }
  renderBetween(); show('between');
}
function goStop(i, autoplay) {
  i = Math.max(0, Math.min(N - 1, i));
  if (i > 0 && !S.agreed) { pause(); askAgree({ then: 'stop', i: i, autoplay: autoplay }); return; }
  if (i !== S.stop) { pause(); S.stop = i; S.pos = 0; }
  S.started = true; save(); show('player'); load(S.pos, autoplay);
}
function nextStop() {
  pause(); if (S.heard.indexOf(S.stop) < 0) S.heard.push(S.stop); save();
  if (S.stop === 0 && !S.agreed) { askAgree({ then: 'between' }); return; }
  if (S.stop < N - 1) { renderBetween(); show('between'); } else show('end');
}

/* Soft chime at the end of each stop. It plays through the tour's own audio player
   (not Web Audio), so Safari's privacy protection has nothing to flag. */
var chiming = false;
function warm() {}
function chime() {
  try { chiming = true; loaded = -1; pendingSeek = null; au.src = 'media/chime.mp3'; au.playbackRate = 1; var p = au.play(); if (p && p.catch) p.catch(function () { chiming = false; }); } catch (e) { chiming = false; }
}

/* ---------- player ---------- */
function words(s) { var t = window.TRANSCRIPTS && window.TRANSCRIPTS[s.audio.replace('.mp3', '')]; return t && t.length ? t : null; }
var follow = true, followAt = 0, lastLine = -2, H0 = 220, HMIN = 72;
// the big picture: as tall as the screen allows while leaving room for the words (taller than before)
function heroBase() { var h = window.innerHeight, w = $('hero').clientWidth || 340; return Math.round(Math.max(120, Math.min(360, w * 0.82, h * (h < 700 ? 0.3 : 0.37)))); }
function renderPlayer() {
  var s = stop(), n = STOPS[S.stop + 1], w = words(s);
  $('stopLabel').textContent = 'Stop ' + (S.stop + 1) + ' of ' + N;
  $('photo').src = img(s); $('photo').alt = 'Illustration: ' + s.title;
  $('stopTitle').textContent = s.title; $('stopSub').textContent = s.sub;
  $('heroTitleText').textContent = s.title; $('heroSubText').textContent = 'Stop ' + (S.stop + 1) + ' of ' + N;
  $('prev').disabled = S.stop === 0;
  $('dirBtn').href = gmaps((n || s).ll); $('dirBtn').setAttribute('aria-label', 'Walking directions to ' + (n || s).title);
  $('upNextText').textContent = n ? n.title : 'End of the tour';
  var box = $('lines'); box.innerHTML = '';
  if (w) w.forEach(function (l, i) {
    var b = document.createElement('button'); b.textContent = l.text; b.style.fontSize = S.fs + 'px';
    b.addEventListener('click', function () { seekTo(l.t + 0.01); follow = true; $('follow').hidden = true; if (!playing()) { warm(); toggle(); } });
    box.appendChild(b);
  });
  else box.innerHTML = '<p class="none">The words for this stop are not available yet.</p>';
  $('smaller').hidden = $('bigger').hidden = !w;
  H0 = heroBase(); $('reader').scrollTop = 0; lastLine = -2; follow = true; $('follow').hidden = true;
  heroPinned = false; setHero(false, true); progress(true);
}
/* The picture is either full size or a small square thumbnail. It moves between the two with a
   transform and a clip (drawn by the phone's graphics chip, no re-layout), and the words below slide
   up with it in the same movement. */
var heroSmall = false, heroPinned = false, userAt = 0;
$('reader').addEventListener('scroll', function () {
  if (view !== 'player' || !words(stop())) return;
  var y = $('reader').scrollTop, byHand = Date.now() - userAt < 900;
  if (!heroSmall && y > 36 && (!heroPinned || byHand)) { heroPinned = false; setHero(true); }
  else if (heroSmall && byHand && y <= 0) setHero(false);
}, { passive: true });
function setHero(small, instant) {
  var hero = $('hero'), im = $('heroImg'), rw = hero.nextElementSibling, W = hero.clientWidth || 1;
  var still = instant || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var before = rw.getBoundingClientRect().top;
  heroSmall = small;
  if (still) hero.classList.add('noanim');
  hero.style.height = (small ? HMIN : H0) + 'px';
  im.style.height = H0 + 'px';
  if (small) {
    var side = Math.min(W, H0), s = HMIN / side, ix = (W - side) / 2, iy = (H0 - side) / 2;
    im.style.transform = 'translate(' + (HMIN / 2 - W / 2).toFixed(1) + 'px, ' + (HMIN / 2 - H0 / 2).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    im.style.clipPath = im.style.webkitClipPath = 'inset(' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px round ' + (14 / s).toFixed(1) + 'px)';
  } else {
    im.style.transform = 'translate(0px, 0px) scale(1)';
    im.style.clipPath = im.style.webkitClipPath = 'inset(0px 0px round 20px)';
  }
  hero.classList.toggle('small', small);
  $('tools').classList.toggle('on', small && !!words(stop()));
  if (still) { void hero.offsetWidth; hero.classList.remove('noanim'); rw.style.transform = ''; return; }
  var delta = before - rw.getBoundingClientRect().top;
  if (Math.abs(delta) > 0.5) {
    rw.style.transition = 'none'; rw.style.transform = 'translateY(' + delta.toFixed(1) + 'px)';
    void rw.offsetWidth;
    rw.style.transition = ''; rw.style.transform = 'translateY(0px)';
  }
  if (words(stop()) && small) { lastLine = -2; progress(true); }
}
$('heroImg').addEventListener('click', function () { if (!words(stop())) return; heroPinned = heroSmall; setHero(!heroSmall); });
function userScrolled() { userAt = Date.now(); follow = false; followAt = Date.now(); if (words(stop())) $('follow').hidden = false; }
$('reader').addEventListener('touchmove', userScrolled, { passive: true });
$('reader').addEventListener('wheel', userScrolled, { passive: true });
$('follow').addEventListener('click', function () { follow = true; $('follow').hidden = true; lastLine = -2; progress(true); });
function lineAt(t, w) { var i = 0; for (var k = 0; k < w.length; k++) if (t >= w[k].t - 0.15) i = k; return i; }
function progress(force) {
  if (view !== 'player') return;
  var t = pos(), d = dur(), pct = Math.min(100, t / d * 100);
  // the bar and knob slide with transforms, which the phone can draw without re-laying out the page
  put('fill', 'transform', 'translateX(' + (pct - 100).toFixed(2) + '%)'); put('knob', 'transform', 'translateX(' + pct.toFixed(2) + '%)');
  put('tNow', 'text', fmt(t)); put('tDur', 'text', '-' + fmt(d - t));
  put('seek', '@aria-valuemax', String(Math.round(d))); put('seek', '@aria-valuenow', String(Math.round(t))); put('seek', '@aria-valuetext', fmt(t) + ' of ' + fmt(d));
  var w = words(stop()); if (!w) return;
  var started = t > 0.05 || playing(), i = lineAt(t, w), key = started ? i : -1;
  if (key === lastLine && !force) return;
  var kids = $('lines').children;
  for (var k = 0; k < kids.length; k++) kids[k].className = !started ? '' : (k === i ? 'now' : (k < i ? 'past' : ''));
  if (!follow && Date.now() - followAt > 8000) { follow = true; $('follow').hidden = true; }
  if (follow && started && kids[i]) {
    var r = $('reader'), target = kids[i].offsetTop - r.offsetTop - r.clientHeight * 0.3;
    // while the picture is big, leave the words still; once they need to move, the picture shrinks first
    if (!heroSmall) { if (target > 36 && !heroPinned) { lastLine = key; setHero(true); return; } target = 0; }
    // once the small picture shows the title, scroll the repeated heading out of view
    var floor = heroSmall ? kids[0].offsetTop - r.offsetTop - 12 : 0;
    r.scrollTo({ top: Math.max(floor, target), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  lastLine = key;
}
function setFs(v) { S.fs = Math.max(14, Math.min(26, v)); save(); var kids = $('lines').children; for (var k = 0; k < kids.length; k++) kids[k].style.fontSize = S.fs + 'px'; lastLine = -2; progress(true); }
$('smaller').addEventListener('click', function () { setFs(S.fs - 2); });
$('bigger').addEventListener('click', function () { setFs(S.fs + 2); });
window.addEventListener('resize', function () { if (view === 'player') { H0 = heroBase(); setHero(heroSmall, true); } });
$('play').addEventListener('click', function () { warm(); toggle(); });
$('back10').addEventListener('click', function () { seekBy(-10); });
$('fwd10').addEventListener('click', function () { seekBy(10); });
$('prev').addEventListener('click', function () { if (S.stop > 0) goStop(S.stop - 1, true); });
$('next').addEventListener('click', nextStop);
$('upNext').addEventListener('click', nextStop);
(function () {
  var el = $('seek'), drag = false;
  function at(e) { var r = el.getBoundingClientRect(); seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur()); }
  el.addEventListener('pointerdown', function (e) { drag = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
  el.addEventListener('pointermove', function (e) { if (drag) at(e); });
  el.addEventListener('pointerup', function () { drag = false; });
  el.addEventListener('pointercancel', function () { drag = false; });
  el.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') seekBy(-5); if (e.key === 'ArrowRight') seekBy(5); });
})();

/* ---------- map ---------- */
function mapSVG(from, to) {
  if (!window.TWMap) return '';
  if (to == null) return TWMap.draw({ current: S.stop, heard: S.heard, label: 'Cartoon map of the walk from the Great Hall to the Pantiles. You are at stop ' + (S.stop + 1) + '.' });
  return TWMap.draw({ from: from, to: to, heard: S.heard, label: 'Close-up map from stop ' + (from + 1) + ' to stop ' + (to + 1) + '.' });
}
function renderMap() {
  $('mapSvg').innerHTML = mapSVG(S.stop, null);
  requestAnimationFrame(function () { var box = $('mapSvg'), pin = box.querySelector('[data-stop="' + S.stop + '"]'), svg = box.querySelector('svg'); if (!pin || !svg) return; var k = svg.getBoundingClientRect().width / 640; box.scrollLeft = Math.max(0, pin.cx.baseVal.value * k - box.clientWidth / 2); });
  var tl = $('timeline'); tl.innerHTML = '<div class="tl-progress" id="tlp"></div>';
  STOPS.forEach(function (s, i) {
    var b = document.createElement('button');
    b.className = 'event' + (i === S.stop ? ' here' : '') + (S.heard.indexOf(i) >= 0 ? ' heard' : ''); b.style.setProperty('--i', i);
    b.innerHTML = '<span class="det"><b></b><span></span></span><img alt="" src="' + img(s, true) + '">';
    b.querySelector('b').textContent = (i + 1) + '. ' + s.title;
    b.querySelector('.det span').textContent = (i === S.stop ? (playing() ? 'Playing now' : 'Current stop') : (S.heard.indexOf(i) >= 0 ? 'Heard · ' : '') + fmt(s.dur)) + (s.sub ? ' · ' + s.sub : '');
    b.addEventListener('click', function () { if (i === S.stop) { show('player'); if (!playing()) { warm(); toggle(); } return; } warm(); goStop(i, true); });
    tl.appendChild(b);
  });
  requestAnimationFrame(function () { var here = tl.querySelector('.event.here'); if (here) $('tlp').style.height = Math.max(0, here.offsetTop + here.offsetHeight / 2 - 18) + 'px'; });
  dock();
}
function dock() {
  if (view !== 'map') return;
  var s = stop(), t = pos(), d = dur();
  put('dockImg', '@src', img(s, true)); put('dockTitle', 'text', s.title);
  put('dockSub', 'text', 'Stop ' + (S.stop + 1) + ' · ' + (playing() ? 'playing' : 'paused') + ' · ' + fmt(t) + ' / ' + fmt(d));
  put('dockBar', 'transform', 'translateX(' + (Math.min(100, t / d * 100) - 100).toFixed(2) + '%)');
}
$('dockOpen').addEventListener('click', function () { show('player'); });
$('dockPlay').addEventListener('click', function () { warm(); toggle(); });
$('dockBack').addEventListener('click', function () { seekBy(-10); });
$('dockFwd').addEventListener('click', function () { seekBy(10); });
$('mapBack').addEventListener('click', function () { show(mapReturn === 'map' ? 'player' : mapReturn); if (mapReturn === 'between') renderBetween(); });
document.querySelectorAll('[data-go="map"]').forEach(function (b) { b.addEventListener('click', function () { mapReturn = view === 'resume' || view === 'end' ? 'player' : view; show('map'); }); });
var gear = document.querySelector('#v-player [data-settings] svg').outerHTML;
document.querySelectorAll('[data-settings]').forEach(function (b) { b.querySelector('svg').outerHTML = gear; b.addEventListener('click', function () { sheet(true); }); });
var route = 'https://www.google.com/maps/dir/' + STOPS.map(function (s) { return s.ll[0] + ',' + s.ll[1]; }).join('/') + '/data=!4m2!4m1!3e2';
$('routeGoogle').href = route;
$('routeApple').href = 'https://maps.apple.com/?saddr=' + STOPS[0].ll.join(',') + '&daddr=' + STOPS[N - 1].ll.join(',') + '&dirflg=w';
$('startGoogle').href = gmaps(STOPS[0].ll); $('startApple').href = amaps(STOPS[0].ll);

/* ---------- between stops ---------- */
function renderBetween() {
  var n = STOPS[S.stop + 1];
  $('betweenLabel').textContent = 'Stop ' + (S.stop + 1) + ' finished';
  $('betweenEyebrow').textContent = 'Up next · stop ' + (S.stop + 2) + ' of ' + N;
  $('betweenTitle').textContent = n.title;
  $('betweenImg').src = img(n); $('betweenImg').alt = 'Illustration: ' + n.title;
  $('betweenMap').innerHTML = mapSVG(S.stop, S.stop + 1);
  if (window.TWMap) { var lg = TWMap.leg(S.stop); $('legTime').textContent = 'About ' + lg.minutes + (lg.minutes === 1 ? ' minute' : ' minutes') + ' · ' + lg.metres + ' m'; $('legGuide').textContent = TWMap.guide(S.stop); }
  $('betweenGoogle').href = gmaps(n.ll); $('betweenApple').href = amaps(n.ll);
  $('imHereLabel').textContent = 'I’m here · play ' + (S.stop + 2);
  $('replayLabel').textContent = 'Replay ' + (S.stop + 1);
}
$('imHere').addEventListener('click', function () { warm(); goStop(S.stop + 1, true); });
$('replay').addEventListener('click', function () { warm(); S.pos = 0; goStop(S.stop, true); seekTo(0); });

/* ---------- agreement (once, after the introduction) ---------- */
var afterAgree = null;
function askAgree(next) {
  afterAgree = next; $('agreeBox').checked = false; $('agreeBtn').disabled = true;
  $('agreeLabel').textContent = next.then === 'stop' && next.i > 1 ? 'Start the walk at stop ' + (next.i + 1) : 'Start the walk';
  show('agree');
}
$('agreeBox').addEventListener('change', function () { $('agreeBtn').disabled = !$('agreeBox').checked; });
$('agreeBtn').addEventListener('click', function () {
  if (!$('agreeBox').checked) return;
  S.agreed = true; S.agreedAt = new Date().toISOString(); S.started = true;
  if (S.heard.indexOf(0) < 0) S.heard.push(0);
  save(); warm();
  var n = afterAgree || { then: 'between' }; afterAgree = null;
  if (n.then === 'stop') { goStop(n.i, n.autoplay); return; }
  S.stop = 0; S.pos = 0; save(); renderBetween(); show('between');
});
$('agreeReplay').addEventListener('click', function () { warm(); afterAgree = null; S.stop = 0; S.pos = 0; loaded = -1; save(); show('player'); load(0, true); });

/* ---------- settings ---------- */
function renderSpeed() { $('rate').value = S.rate; $('rateVal').textContent = S.rate + '×'; }
function renderSettings() { renderSpeed(); offlineStatus(); }
/* ---------- credits & licences (data in credits.js) ---------- */
function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function crRow(n, head, lines) { return '<div class="cr"><span class="crn" aria-hidden="true">' + n + '</span><div><b>' + head + '</b>' + lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div></div>'; }
function renderCredits() {
  var C = window.CREDITS || { stops: [], fonts: [] }, html = '';
  STOPS.forEach(function (s, i) {
    var c = C.stops.filter(function (x) { return x.stop === i + 1; })[0] || {}, lines = [];
    if (c.none) lines.push(esc(c.none));
    (c.items || []).forEach(function (it) {
      var name = it.title ? '“' + esc(it.title) + '”' : '';
      if (name && it.link) name = '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + name + '</a>';
      if (it.by) name += (name ? ' by ' : 'By ') + esc(it.by);
      var src = [it.source, it.licence].filter(Boolean).map(esc).join(' · ');
      lines.push('<span class="crwhat">' + esc(it.what) + '</span>');
      if (name) lines.push(name);
      if (src) lines.push(src);
      if (!it.source && !it.licence) lines.push('<span class="crtodo">' + (name ? 'Source and licence to be added' : 'Track details to be added') + '</span>');
    });
    html += crRow(i + 1, esc(s.title), lines);
  });
  if (C.chime) html += crRow('♪', 'End-of-stop chime', [esc(C.chime)]);
  $('crMusic').innerHTML = html;
  $('crFonts').innerHTML = (C.fonts || []).map(function (f) { return crRow('Aa', esc(f.name), [esc(f.by), esc(f.licence)]); }).join('');
}
function credits(on, how) { if (on) { renderCredits(); openScrim('s-credits', how); $('s-credits').querySelector('.sheet').scrollTop = 0; } else closeScrim('s-credits', how === 'now'); gearSpin(on); }
$('openCredits').addEventListener('click', function () { sheet(false, 'now'); credits(true, 'push'); });
$('crBack').addEventListener('click', function () { credits(false, 'now'); sheet(true, 'pop'); });
$('crClose').addEventListener('click', function () { credits(false); });
$('s-credits').addEventListener('click', function (e) { if (e.target === $('s-credits')) credits(false); });
$('rate').addEventListener('input', function () { S.rate = parseFloat($('rate').value); au.playbackRate = S.rate; save(); renderSpeed(); });
$('rateReset').addEventListener('click', function () { S.rate = 1; au.playbackRate = 1; save(); renderSpeed(); });
document.querySelector('[data-close]').addEventListener('click', function () { sheet(false); });
$('s-settings').addEventListener('click', function (e) { if (e.target === $('s-settings')) sheet(false); });
$('restartTour').addEventListener('click', function () { sheet(false); warm(); goStop(0, true); seekTo(0); });
$('clearAll').addEventListener('click', function () {
  pause(); S = { stop: 0, pos: 0, heard: [], rate: 1, started: false, agreed: false, fs: 16 }; save(); loaded = -1;
  try { caches.delete(AUDIO_CACHE); } catch (e) {}
  sheet(false); show('start'); toast('Progress and downloads cleared.');
});

/* ---------- offline: save audio to the phone ---------- */
var hasCache = 'caches' in window;
function keepForOffline(file) {
  if (!hasCache || !navigator.serviceWorker) return;
  caches.open(AUDIO_CACHE).then(function (c) { return c.match(file).then(function (hit) { if (!hit) return fetch(file).then(function (r) { if (r.ok && r.status === 200) return c.put(file, r); }); }); }).catch(function () {});
}
function offlineStatus() {
  if (!hasCache || !navigator.serviceWorker) { $('offlineText').textContent = 'This browser can’t save the tour for offline use. It will still play with signal.'; $('saveOffline').hidden = true; return; }
  caches.open(AUDIO_CACHE).then(function (c) { return Promise.all(STOPS.map(function (s) { return c.match(s.audio); })); }).then(function (hits) {
    var n = hits.filter(Boolean).length;
    $('offlineText').textContent = n === N ? 'All 8 stops are saved on this phone. The tour plays with no signal.' : (n ? n + ' of 8 stops saved. ' : '') + 'Save all 8 stops to this phone (about 21 MB) so the tour plays with no signal. Best done on wifi.';
    $('saveOffline').hidden = n === N;
  }).catch(function () {});
}
/* Save the whole tour as soon as the page opens, one stop at a time, current stop first. */
var saving = null;
function saveAll(loud) {
  if (!hasCache) return Promise.resolve();
  if (saving) return saving;
  var order = STOPS.map(function (s, i) { return i; }).sort(function (a, b) { return (a === S.stop ? -1 : 0) - (b === S.stop ? -1 : 0); });
  var done = 0, btn = $('saveOffline');
  btn.disabled = true; btn.textContent = 'Saving…'; $('dlBar').hidden = false;
  saving = caches.open(AUDIO_CACHE).then(function (c) {
    return order.reduce(function (p, i) {
      var f = STOPS[i].audio;
      return p.then(function () { return c.match(f); }).then(function (hit) { return hit || fetch(f).then(function (r) { if (!r.ok || r.status !== 200) throw new Error('load'); return c.put(f, r); }); })
        .then(function () { done++; $('dlFill').style.width = (done / N * 100) + '%'; saveChip(done); });
    }, Promise.resolve());
  }).then(function () { saveChip(N); if (loud) toast('Saved. The whole tour now plays without signal.'); })
    .catch(function () { saveChip(-1); if (loud) toast('Saving stopped. Check your connection and try again.'); })
    .then(function () { saving = null; btn.disabled = false; btn.textContent = 'Save the tour to this phone'; $('dlBar').hidden = true; offlineStatus(); });
  return saving;
}
function saveChip(done) {
  var c = $('saveChip'); if (!c) return;
  c.hidden = false;
  if (done === N) { c.className = 'savechip done'; c.textContent = 'Saved to your phone · plays without signal'; }
  else if (done < 0) { c.className = 'savechip'; c.textContent = 'Not fully saved yet · will try again when you have signal'; }
  else { c.className = 'savechip'; c.textContent = 'Saving the tour to your phone… ' + done + ' of ' + N; }
}
$('saveOffline').addEventListener('click', function () { saveAll(true); });
if (hasCache) {
  var startSaving = function () { saveChip(0); saveAll(false); };
  if (document.readyState === 'complete') setTimeout(startSaving, 300); else window.addEventListener('load', function () { setTimeout(startSaving, 300); });
  window.addEventListener('online', function () { saveAll(false); });
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}

/* ---------- start / resume / end ---------- */
$('startBtn').addEventListener('click', function () { warm(); S.started = true; S.stop = 0; S.pos = 0; save(); goStop(0, true); });
function renderResume() {
  var s = stop();
  $('resumeImg').src = img(s, true); $('resumeTitle').textContent = s.title;
  $('resumeWhere').textContent = 'Stop ' + (S.stop + 1) + ' of ' + N + (S.pos > 1 ? ' · at ' + fmt(S.pos) : '');
  $('resumeGoLabel').textContent = S.pos > 1 ? 'Carry on from ' + fmt(S.pos) : 'Play stop ' + (S.stop + 1);
}
$('resumeGo').addEventListener('click', function () { warm(); show('player'); load(S.pos, true); });
$('resumeCard').addEventListener('click', function () { $('resumeGo').click(); });
$('resumeRestart').addEventListener('click', function () { warm(); S.pos = 0; show('player'); load(0, true); });
$('resumeFresh').addEventListener('click', function () { warm(); S.heard = []; goStop(0, true); seekTo(0); });
$('againBtn').addEventListener('click', function () { warm(); S.heard = []; goStop(0, true); seekTo(0); });
$('shareBtn').addEventListener('click', function () {
  var url = location.href.split('#')[0];
  if (navigator.share) { navigator.share({ title: 'Royal Tunbridge Wells audio tour', text: 'A free audio walking tour of Tunbridge Wells.', url: url }).catch(function () {}); return; }
  try { navigator.clipboard.writeText(url).then(function () { toast('Link copied.'); }, function () { toast('Copy the link from the address bar.'); }); } catch (e) { toast('Copy the link from the address bar.'); }
});

/* ---------- boot ---------- */
function route_() {
  var h = (location.hash || '').replace('#', ''), m = /^stop-(\d+)$/.exec(h);
  if (m) { var i = Math.max(0, Math.min(N - 1, parseInt(m[1], 10) - 1)); if (i > 0 && !S.agreed) { askAgree({ then: 'stop', i: i, autoplay: false }); return; } if (i !== S.stop) { S.stop = i; S.pos = 0; } S.started = true; save(); show('player'); load(S.pos, false); return; }
  if (h === 'map') { show('map'); return; }
  if (S.started && (S.pos > 1 || S.heard.length)) { renderResume(); show('resume'); return; }
  show('start');
}
window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (h !== (view === 'player' ? 'stop-' + (S.stop + 1) : view)) route_(); });
window.__tour = { S: function () { return S; }, au: au, view: function () { return view; } };
route_();
})();
