/* Cartoon map of the walk, drawn from real coordinates and turned on its side
   so the route runs left to right. TWMap.draw({ current, from, to }) returns SVG. */
(function () {
'use strict';
// The walking route, in order (latitude, longitude).
var PATH = [
  [51.13030, 0.26366], [51.13022, 0.26337],
  [51.12995, 0.26345], [51.12965, 0.26352], [51.12948, 0.26357], [51.12925, 0.26325],
  [51.12880, 0.26255], [51.12830, 0.26175], [51.12790, 0.26100], [51.12739, 0.26039],
  [51.12715, 0.26000], [51.12687, 0.25941], [51.12680, 0.25905], [51.12667, 0.25870],
  [51.12625, 0.25815], [51.12576, 0.25755]
];
// Where each stop sits on PATH.
var AT = [0, 1, 4, 9, 11, 13, 14, 15];
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
var RS = STREETS.map(function (s) { return s.pts.map(rot); }), RG = GREENS.map(function (g) { return g.pts.map(rot); });
function inPoly(p, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function segDist(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
// Little cartoon buildings along both sides of each street, kept off parks and other roads.
var BUILDINGS = (function () {
  var out = [], n = 0;
  RS.forEach(function (pts, si) {
    for (var k = 0; k < pts.length - 1; k++) {
      var a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      for (var d = 10; d < len - 6; d += 21) {
        [-1, 1].forEach(function (side) {
          var c = [a[0] + ux * d - uy * side * 15, a[1] + uy * d + ux * side * 15];
          if (RG.some(function (g) { return inPoly(c, g); })) return;
          var close = RS.some(function (q, qi) { for (var j = 0; j < q.length - 1; j++) if (segDist(c, q[j], q[j + 1]) < (qi === si ? 9 : 13)) return true; return false; });
          if (close) return;
          out.push({ c: c, ang: Math.atan2(uy, ux) * 180 / Math.PI, w: 13 + (n % 3) * 2, h: 8 + (n % 2) * 2, col: ['var(--m-bld)', 'var(--m-roof)', 'var(--m-bld2)', 'var(--m-glass)'][n++ % 4] });
        });
      }
    }
  });
  return out;
})();
function legMetres(i) { var d = 0; for (var k = AT[i]; k < AT[i + 1]; k++) d += dist(PATH[k], PATH[k + 1]); return d; }

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
// Landmark badges: a white disc with a small drawing, joined to its stop by a short line.
var DRAW = {
  hall: '<path d="M4 9.5 12 5l8 4.5z" fill="var(--m-roof)" stroke="var(--m-ink)" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 10.5v6M10 10.5v6M14 10.5v6M17.5 10.5v6" stroke="var(--m-ink)" stroke-width="1.6" stroke-linecap="round"/><path d="M4.5 18h15" stroke="var(--m-ink)" stroke-width="1.6" stroke-linecap="round"/>',
  train: '<rect x="6.5" y="4.5" width="11" height="12" rx="3" fill="var(--m-roof)" stroke="var(--m-ink)" stroke-width="1.3"/><rect x="8.5" y="6.5" width="7" height="4" rx="1" fill="var(--card)" stroke="var(--m-ink)" stroke-width="1"/><circle cx="9.5" cy="13.5" r="1" fill="var(--m-ink)"/><circle cx="14.5" cy="13.5" r="1" fill="var(--m-ink)"/><path d="M8 19.5l1.5-3M16 19.5l-1.5-3" stroke="var(--m-ink)" stroke-width="1.3" stroke-linecap="round"/>',
  shop: '<rect x="5.5" y="10" width="13" height="9" rx="1" fill="var(--card)" stroke="var(--m-ink)" stroke-width="1.3"/><path d="M4.5 10h15l-1.5-4.5h-12z" fill="var(--m-bld)" stroke="var(--m-ink)" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.5 5.6 8 10M12 5.6V10M15.5 5.6 16 10" stroke="var(--m-ink)" stroke-width="1"/><rect x="10.5" y="13.5" width="3" height="5.5" fill="var(--m-roof)"/>',
  music: '<path d="M9.5 16.5V7l8-2v9.5" fill="none" stroke="var(--m-ink)" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="7.8" cy="16.6" rx="2.2" ry="1.8" fill="var(--accent)"/><ellipse cx="15.8" cy="14.6" rx="2.2" ry="1.8" fill="var(--accent)"/>',
  church: '<path d="M12 3v3M10.6 4.3h2.8" stroke="var(--m-ink)" stroke-width="1.2" stroke-linecap="round"/><path d="M10 11V8l2-2 2 2v3" fill="var(--m-bld)" stroke="var(--m-ink)" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 19.5V13l6-3 6 3v6.5z" fill="var(--m-bld)" stroke="var(--m-ink)" stroke-width="1.3" stroke-linejoin="round"/><path d="M11 19.5v-3a1 1 0 0 1 2 0v3" fill="var(--m-ink)"/>',
  spring: '<path d="M12 4c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z" fill="var(--m-water)" stroke="var(--m-ink)" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.8 13.5a2.3 2.3 0 0 0 2.2 2.2" stroke="var(--card)" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M5 20h14" stroke="var(--m-water)" stroke-width="1.6" stroke-linecap="round"/>',
  columns: '<path d="M4.5 7.5h15" stroke="var(--m-ink)" stroke-width="1.8" stroke-linecap="round"/><path d="M5 5.5h14" stroke="var(--m-roof)" stroke-width="2.2" stroke-linecap="round"/><path d="M7 8.5v9M10.3 8.5v9M13.7 8.5v9M17 8.5v9" stroke="var(--m-ink)" stroke-width="1.7" stroke-linecap="round"/><path d="M4.5 19h15" stroke="var(--m-ink)" stroke-width="1.8" stroke-linecap="round"/>',
  bandstand: '<path d="M4.5 9.5C6 6 9 4.5 12 4.5S18 6 19.5 9.5z" fill="var(--m-roof)" stroke="var(--m-ink)" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 10v7M12 10v7M17.5 10v7" stroke="var(--m-ink)" stroke-width="1.5" stroke-linecap="round"/><rect x="4.5" y="17" width="15" height="2.5" rx="1" fill="var(--m-bld)" stroke="var(--m-ink)" stroke-width="1.1"/>'
};
function icon(kind, x, y, px, py) {
  var s = '<path d="M' + px.toFixed(1) + ' ' + py.toFixed(1) + ' L' + x.toFixed(1) + ' ' + y.toFixed(1) + '" stroke="var(--m-ink)" stroke-width="1" opacity="0.35"/>';
  s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><circle r="14.5" cy="1.2" fill="#000" opacity="0.10"/><circle r="14" fill="var(--card)" stroke="var(--m-edge)" stroke-width="1"/>';
  return s + '<g transform="translate(-11 -11.5) scale(0.92)">' + (DRAW[kind] || '') + '</g></g>';
}

function draw(o) {
  o = o || {};
  var zoom = o.from != null && o.to != null;
  var W = zoom ? 360 : 640, H = zoom ? 240 : 250, pad = zoom ? 36 : 34;
  // Area to show (in rotated metres).
  var pts = (zoom ? PATH.slice(AT[o.from], AT[o.to] + 1) : PATH).map(rot);
  var x0 = Math.min.apply(0, pts.map(function (p) { return p[0]; })), x1 = Math.max.apply(0, pts.map(function (p) { return p[0]; }));
  var y0 = Math.min.apply(0, pts.map(function (p) { return p[1]; })), y1 = Math.max.apply(0, pts.map(function (p) { return p[1]; }));
  var minSpan = zoom ? 170 : 0;
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sw = Math.max(x1 - x0, minSpan), sh = Math.max(y1 - y0, minSpan * H / W);
  var sc = Math.min((W - 2 * pad) / sw, (H - 2 * pad) / sh);
  function P(ll) { var r = rot(ll); return [W / 2 + (r[0] - cx) * sc, H / 2 + (r[1] - cy) * sc]; }
  function line(list) { return list.map(function (ll, i) { var p = P(ll); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
  var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="twmap' + (zoom ? '' : ' wide') + '" role="img" aria-label="' + esc(o.label || 'Map of the walk') + '">';
  out += '<defs><clipPath id="mclip' + (zoom ? 'z' : 'f') + '"><rect width="' + W + '" height="' + H + '" rx="16"/></clipPath></defs>';
  out += '<g clip-path="url(#mclip' + (zoom ? 'z' : 'f') + ')"><rect width="' + W + '" height="' + H + '" fill="var(--m-bg)"/>';
  // parks with cartoon trees
  GREENS.forEach(function (g) {
    out += '<path d="' + line(g.pts) + 'Z" fill="var(--m-park)"/>';
    var c = g.pts.reduce(function (a, p) { return [a[0] + p[0] / g.pts.length, a[1] + p[1] / g.pts.length]; }, [0, 0]), pc = P(c);
    for (var t = 0; t < 9; t++) { var ang = t * 2.4, r = 14 + t * 6; var tx = pc[0] + Math.cos(ang) * r, ty = pc[1] + Math.sin(ang) * r * 0.6; out += '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="' + (5 + (t % 3)) + '" fill="var(--m-tree)"/>'; }
    out += '<text x="' + pc[0].toFixed(1) + '" y="' + (pc[1] + 4).toFixed(1) + '" class="ml park">' + esc(g.name) + '</text>';
  });
  // buildings
  BUILDINGS.forEach(function (b) {
    var sx = W / 2 + (b.c[0] - cx) * sc, sy = H / 2 + (b.c[1] - cy) * sc;
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
    out += '<rect x="' + (-b.w * sc / 2).toFixed(1) + '" y="' + (-b.h * sc / 2).toFixed(1) + '" width="' + (b.w * sc).toFixed(1) + '" height="' + (b.h * sc).toFixed(1) + '" rx="' + Math.max(1, 2 * sc).toFixed(1) + '" fill="' + b.col + '" opacity="0.85" transform="translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ') rotate(' + b.ang.toFixed(1) + ')"/>';
  });
  // railway
  out += '<path d="' + line(RAIL) + '" stroke="var(--m-rail)" stroke-width="4" fill="none"/><path d="' + line(RAIL) + '" stroke="var(--m-bg)" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';
  // streets
  STREETS.forEach(function (s) { out += '<path d="' + line(s.pts) + '" stroke="var(--m-edge)" stroke-width="' + (s.walk ? 13 : 11) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; });
  STREETS.forEach(function (s) { out += '<path d="' + line(s.pts) + '" stroke="' + (s.walk ? 'var(--m-walk)' : 'var(--m-road)') + '" stroke-width="' + (s.walk ? 10 : 8) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; });
  // the whole route, dotted
  out += '<path class="mroute" d="' + line(PATH) + '" stroke="var(--m-route)" stroke-width="3" stroke-dasharray="0.1 7" stroke-linecap="round" fill="none" opacity="0.8"/>';
  if (zoom) {
    var leg = PATH.slice(AT[o.from], AT[o.to] + 1);
    out += '<path d="' + line(leg) + '" stroke="var(--card)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7"/>';
    out += '<path d="' + line(leg) + '" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    // arrows showing which way to walk
    var sp = leg.map(P), acc = 0, next = 26;
    for (var k = 0; k < sp.length - 1; k++) {
      var a = sp[k], b = sp[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), deg = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      while (next <= acc + L) { var f = (next - acc) / L, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        out += '<path d="M-3.5 -4.5 L2 0 L-3.5 4.5" fill="none" stroke="var(--card)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')"/>'; next += 30; }
      acc += L;
    }
  }
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
    else { var side = (i % 2 ? 1 : -1); ix = p[0]; iy = p[1] + side * (zoom ? 34 : 36); }
    if (!zoom && i === 0) { ix = p[0] - 30; iy = p[1] - 30; }
    if (!zoom && i === 1) { ix = p[0] + 6; iy = p[1] + 38; }
    out += icon(ICON[i], Math.max(16, Math.min(W - 16, ix)), Math.max(16, Math.min(H - 16, iy)), p[0], p[1]);
    var r = here || dest ? 12 : (zoom ? 9.5 : 9);
    if (here) out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="17" fill="var(--accent)" opacity="0.18"/>';
    out += '<g class="mpin" style="--i:' + i + '">';
    out += '<circle data-stop="' + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + (here ? 'var(--accent)' : dest ? 'var(--m-dest)' : heard ? 'var(--teal)' : 'var(--card)') + '" stroke="' + (here || dest ? 'var(--accent)' : 'var(--m-ink)') + '" stroke-width="' + (dest ? 2.5 : 1.5) + '"/>';
    out += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 3.6).toFixed(1) + '" class="mn" fill="' + (here ? 'var(--card)' : 'var(--m-ink)') + '">' + (i + 1) + '</text></g>';
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
