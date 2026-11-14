/* Cartoon map of the walk, drawn from real coordinates and turned on its side
   so the route runs left to right. TWMap.draw({ current, from, to }) returns SVG. */
(function () {
'use strict';
// The walking route, in order (latitude, longitude).
var PATH = [
  [51.13030, 0.26394], [51.13052, 0.26388], [51.13050, 0.26355], [51.13022, 0.26337],
  [51.12995, 0.26345], [51.12965, 0.26352], [51.12948, 0.26357], [51.12925, 0.26325],
  [51.12880, 0.26255], [51.12830, 0.26175], [51.12790, 0.26100], [51.12739, 0.26039],
  [51.12715, 0.26000], [51.12687, 0.25941], [51.12680, 0.25905], [51.12667, 0.25870],
  [51.12625, 0.25815], [51.12576, 0.25755]
];
// Where each stop sits on PATH.
var AT = [0, 3, 6, 11, 13, 15, 16, 17];
var ICON = ['hall', 'train', 'shop', 'music', 'church', 'spring', 'columns', 'bandstand'];
var GUIDE = [
  'Cross over to the station entrance, opposite the Great Hall.',
  'Walk down Mount Pleasant Road to the top of the High Street.',
  'Follow the High Street downhill, past the shops.',
  'Keep going to the bottom of the High Street. The church is on the corner.',
  'Cross towards the Pantiles. The spring is just inside the entrance.',
  'Walk into the Pantiles, under the colonnade.',
  'Carry on along the Pantiles to the band stand.'
];
var STREETS = [
  { name: 'Mount Pleasant Rd', pts: [[51.1328, 0.26405], [51.1306, 0.2639], [51.12948, 0.26357]] },
  { name: 'High Street', pts: [[51.12948, 0.26357], [51.12880, 0.26255], [51.12790, 0.26100], [51.12687, 0.25941]], label: 0.45 },
  { name: 'London Road', pts: [[51.1333, 0.26045], [51.1310, 0.26075], [51.1290, 0.25995], [51.1275, 0.2593], [51.12687, 0.25941], [51.1262, 0.2580], [51.1250, 0.2564]], label: 0.3 },
  { name: 'Grove Hill Rd', pts: [[51.12948, 0.26357], [51.1293, 0.2655], [51.1290, 0.2685]] },
  { name: 'Nevill St', pts: [[51.12687, 0.25941], [51.1260, 0.2598], [51.1246, 0.2604]] },
  { name: 'The Pantiles', pts: [[51.12680, 0.25905], [51.12625, 0.25815], [51.12560, 0.25735]], label: 0.55, walk: true }
];
var RAIL = [[51.1340, 0.26322], [51.1306, 0.26328], [51.1288, 0.2640], [51.1262, 0.2652]];
var GREENS = [
  { name: 'The Common', pts: [[51.1340, 0.2548], [51.1340, 0.2601], [51.1310, 0.26045], [51.1289, 0.25965], [51.1272, 0.2588], [51.1259, 0.2571], [51.1248, 0.2557], [51.1240, 0.2540], [51.1340, 0.2540]] },
  { name: 'Calverley Grounds', pts: [[51.1332, 0.2648], [51.1332, 0.2700], [51.1298, 0.2700], [51.1298, 0.2658], [51.1314, 0.2647]] }
];

var LAT0 = 51.1285, COS = Math.cos(LAT0 * Math.PI / 180), K = 111320;
function m(p) { return [(p[1] - 0.2610) * COS * K, -(p[0] - LAT0) * K]; } // metres, y down
var A = (function () { var a = m(PATH[0]), b = m(PATH[PATH.length - 1]); return Math.atan2(b[1] - a[1], b[0] - a[0]); })();
function rot(p) { var q = m(p), c = Math.cos(-A), s = Math.sin(-A); return [q[0] * c - q[1] * s, q[0] * s + q[1] * c]; }
function dist(a, b) { var x = m(a), y = m(b); return Math.hypot(x[0] - y[0], x[1] - y[1]); }
function legMetres(i) { var d = 0; for (var k = AT[i]; k < AT[i + 1]; k++) d += dist(PATH[k], PATH[k + 1]); return d; }

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function icon(kind, x, y) {
  var g = '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" class="mi">';
  var s = {
    hall: '<rect x="-9" y="-6" width="18" height="11" rx="1.5" fill="var(--m-bld)"/><path d="M-11 -6 L0 -13 L11 -6Z" fill="var(--m-roof)"/><path d="M-5 -4v8M0 -4v8M5 -4v8" stroke="var(--m-ink)" stroke-width="1.2"/>',
    train: '<rect x="-8" y="-9" width="16" height="15" rx="4" fill="var(--m-bld)"/><rect x="-5" y="-6" width="10" height="5" rx="1" fill="var(--m-glass)"/><circle cx="-4" cy="3" r="1.5" fill="var(--m-ink)"/><circle cx="4" cy="3" r="1.5" fill="var(--m-ink)"/>',
    shop: '<rect x="-9" y="-5" width="18" height="11" rx="1.5" fill="var(--m-bld)"/><path d="M-10 -5h20l-2 -5h-16z" fill="var(--m-roof)"/><rect x="-3" y="0" width="6" height="6" fill="var(--m-glass)"/>',
    music: '<circle cx="0" cy="-2" r="9" fill="var(--m-bld)"/><path d="M-1 3V-7l5 -1.5V1" stroke="var(--m-ink)" stroke-width="1.6" fill="none"/><circle cx="-2.5" cy="3" r="2" fill="var(--m-ink)"/><circle cx="2.5" cy="1.5" r="2" fill="var(--m-ink)"/>',
    church: '<rect x="-7" y="-3" width="14" height="9" fill="var(--m-bld)"/><path d="M-8 -3 L0 -9 L8 -3Z" fill="var(--m-roof)"/><rect x="-2" y="-16" width="4" height="8" fill="var(--m-bld)"/><path d="M0 -21v4M-1.6 -19.5h3.2" stroke="var(--m-ink)" stroke-width="1.2"/>',
    spring: '<path d="M0 -12C5 -5 7 -2 7 2a7 7 0 0 1 -14 0c0 -4 2 -7 7 -14z" fill="var(--m-water)"/><path d="M-3 2a3 3 0 0 0 3 3" stroke="#fff" stroke-width="1.3" fill="none"/>',
    columns: '<rect x="-11" y="-9" width="22" height="3" rx="1" fill="var(--m-roof)"/><path d="M-8 -6v11M-3 -6v11M2 -6v11M7 -6v11" stroke="var(--m-bld2)" stroke-width="2.4"/><rect x="-11" y="5" width="22" height="2" fill="var(--m-roof)"/>',
    bandstand: '<path d="M-11 -5 L0 -12 L11 -5Z" fill="var(--m-roof)"/><path d="M-8 -5v9M0 -5v9M8 -5v9" stroke="var(--m-bld2)" stroke-width="2"/><rect x="-11" y="4" width="22" height="3" rx="1" fill="var(--m-roof)"/>'
  }[kind] || '';
  return g + s + '</g>';
}

function draw(o) {
  o = o || {};
  var zoom = o.from != null && o.to != null;
  var W = 360, H = zoom ? 230 : 210, pad = zoom ? 34 : 22;
  // Area to show (in rotated metres).
  var pts = (zoom ? PATH.slice(AT[o.from], AT[o.to] + 1) : PATH).map(rot);
  var x0 = Math.min.apply(0, pts.map(function (p) { return p[0]; })), x1 = Math.max.apply(0, pts.map(function (p) { return p[0]; }));
  var y0 = Math.min.apply(0, pts.map(function (p) { return p[1]; })), y1 = Math.max.apply(0, pts.map(function (p) { return p[1]; }));
  var minSpan = zoom ? 240 : 0;
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sw = Math.max(x1 - x0, minSpan), sh = Math.max(y1 - y0, minSpan * H / W);
  var sc = Math.min((W - 2 * pad) / sw, (H - 2 * pad) / sh);
  function P(ll) { var r = rot(ll); return [W / 2 + (r[0] - cx) * sc, H / 2 + (r[1] - cy) * sc]; }
  function line(list) { return list.map(function (ll, i) { var p = P(ll); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="twmap" role="img" aria-label="' + esc(o.label || 'Map of the walk') + '">';
  out += '<defs><clipPath id="mclip' + (zoom ? 'z' : 'f') + '"><rect width="' + W + '" height="' + H + '" rx="16"/></clipPath></defs>';
  out += '<g clip-path="url(#mclip' + (zoom ? 'z' : 'f') + ')"><rect width="' + W + '" height="' + H + '" fill="var(--m-bg)"/>';
  // parks with cartoon trees
  GREENS.forEach(function (g) {
    out += '<path d="' + line(g.pts) + 'Z" fill="var(--m-park)"/>';
    var c = g.pts.reduce(function (a, p) { return [a[0] + p[0] / g.pts.length, a[1] + p[1] / g.pts.length]; }, [0, 0]), pc = P(c);
    for (var t = 0; t < 9; t++) { var ang = t * 2.4, r = 14 + t * 6; var tx = pc[0] + Math.cos(ang) * r, ty = pc[1] + Math.sin(ang) * r * 0.6; out += '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="' + (5 + (t % 3)) + '" fill="var(--m-tree)"/>'; }
    out += '<text x="' + pc[0].toFixed(1) + '" y="' + (pc[1] + 4).toFixed(1) + '" class="ml park">' + esc(g.name) + '</text>';
  });
  // railway
  out += '<path d="' + line(RAIL) + '" stroke="var(--m-rail)" stroke-width="4" fill="none"/><path d="' + line(RAIL) + '" stroke="var(--m-bg)" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';
  // streets
  STREETS.forEach(function (s) { out += '<path d="' + line(s.pts) + '" stroke="var(--m-edge)" stroke-width="' + (s.walk ? 13 : 11) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; });
  STREETS.forEach(function (s) { out += '<path d="' + line(s.pts) + '" stroke="' + (s.walk ? 'var(--m-walk)' : 'var(--m-road)') + '" stroke-width="' + (s.walk ? 10 : 8) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; });
  // the whole route, dotted
  out += '<path d="' + line(PATH) + '" stroke="var(--m-route)" stroke-width="3" stroke-dasharray="0.1 7" stroke-linecap="round" fill="none" opacity="0.8"/>';
  if (zoom) out += '<path d="' + line(PATH.slice(AT[o.from], AT[o.to] + 1)) + '" stroke="var(--accent)" stroke-width="5.5" stroke-dasharray="0.1 9" stroke-linecap="round" fill="none"/>';
  // street names (kept upright)
  STREETS.forEach(function (s) {
    var f = s.label != null ? s.label : 0.5, a = P(s.pts[0]), b = P(s.pts[s.pts.length - 1]);
    var k = Math.min(s.pts.length - 2, Math.floor(f * (s.pts.length - 1))), p = P(s.pts[k]), q = P(s.pts[k + 1]);
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, deg = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
    if (deg > 90) deg -= 180; if (deg < -90) deg += 180;
    if (mx < 10 || mx > W - 10 || my < 8 || my > H - 8) return;
    out += '<text class="ml street" transform="translate(' + mx.toFixed(1) + ' ' + (my - 9).toFixed(1) + ') rotate(' + deg.toFixed(1) + ')">' + esc(s.name) + '</text>';
  });
  // landmarks and stop pins
  var pf = zoom ? P(PATH[AT[o.from]]) : null, pt = zoom ? P(PATH[AT[o.to]]) : null;
  function away(p, q) { var dx = p[0] - q[0], dy = p[1] - q[1], d = Math.hypot(dx, dy); return d < 1 ? [0, -1] : [dx / d, dy / d]; }
  function clampX(x, w) { return Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x)); }
  function clampY(y) { return Math.max(14, Math.min(H - 14, y)); }
  var tags = [], perp = [0, -1];
  if (zoom) { var dv = away(pt, pf); perp = [dv[1], -dv[0]]; if (perp[1] > 0) perp = [-perp[0], -perp[1]]; }
  AT.forEach(function (pi, i) {
    var p = P(PATH[pi]);
    if (p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) return;
    var here = zoom ? i === o.from : i === o.current, dest = zoom && i === o.to, heard = (o.heard || []).indexOf(i) >= 0;
    var ix, iy;
    if (zoom && (here || dest)) { ix = p[0] - perp[0] * (here ? 1 : -1) * 30; iy = p[1] - perp[1] * (here ? 1 : -1) * 30; }
    else { var side = (i % 2 ? 1 : -1); ix = p[0]; iy = p[1] + side * (zoom ? 30 : 24); }
    if (!zoom && i === 0) { ix = p[0] - 20; iy = p[1] - 18; }
    out += icon(ICON[i], Math.max(14, Math.min(W - 14, ix)), clampY(iy));
    var r = here || dest ? 11 : (zoom ? 8.5 : 7.5);
    if (here) out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="17" fill="var(--accent)" opacity="0.18"/>';
    out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + (here ? 'var(--accent)' : dest ? 'var(--m-dest)' : heard ? 'var(--teal)' : 'var(--card)') + '" stroke="' + (here || dest ? 'var(--accent)' : 'var(--m-ink)') + '" stroke-width="' + (dest ? 2.5 : 1.5) + '"/>';
    out += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 3.6).toFixed(1) + '" class="mn" fill="' + (here ? 'var(--card)' : 'var(--m-ink)') + '">' + (i + 1) + '</text>';
    if (zoom && (here || dest)) {
      var tag = here ? 'You are here' : 'Stop ' + (i + 1), tw = tag.length * 6.4 + 18, sg = here ? 1 : -1;
      tags.push({ x: clampX(p[0] + perp[0] * sg * 28, tw), y: clampY(p[1] + perp[1] * sg * 28), w: tw, tag: tag, here: here });
    }
  });
  tags.forEach(function (t) { out += '<g transform="translate(' + t.x.toFixed(1) + ' ' + t.y.toFixed(1) + ')"><rect x="' + (-t.w / 2).toFixed(1) + '" y="-10" width="' + t.w.toFixed(1) + '" height="20" rx="10" fill="' + (t.here ? 'var(--accent)' : 'var(--m-ink)') + '"/><text y="4" class="mtag">' + t.tag + '</text></g>'; });
  // compass
  var nx = W - 22, ny = 22, na = -A - Math.PI / 2;
  out += '<g transform="translate(' + nx + ' ' + ny + ')"><circle r="13" fill="var(--card)" opacity="0.9"/><g transform="rotate(' + (na * 180 / Math.PI + 90).toFixed(1) + ')"><path d="M0 -9 L3.5 2 L0 0 L-3.5 2Z" fill="var(--m-ink)"/></g></g>';
  out += '<text x="' + nx + '" y="' + (ny + 25) + '" class="ml" style="font-size:9px">N</text>';
  out += '</g></svg>';
  return out;
}
window.TWMap = {
  draw: draw,
  guide: function (i) { return GUIDE[i] || ''; },
  leg: function (i) { var d = legMetres(i); return { metres: Math.round(d / 10) * 10, minutes: Math.max(1, Math.round(d / 75)) }; },
  total: function () { var d = 0; for (var i = 0; i < AT.length - 1; i++) d += legMetres(i); return d; }
};
})();
