/* Service worker: keeps the tour working without signal.
   - The page, styles, script and images are saved on first visit.
   - Audio is saved stop by stop as you listen, or all at once from Settings.
   - Saved audio is served with byte ranges, which iPhones need to play and seek. */
var SHELL = 'tw-shell-v13';
var AUDIO = 'tw-audio-v1';
var FILES = ['./', 'index.html', 'tour.css', 'tour.js', 'map.js', 'credits.js', 'media/fonts/LICENSE.txt', 'transcripts.js', 'media/icon-192.png', 'media/icon-180.png', 'media/chime.mp3', 'media/fonts/poppins-latin-300-normal.woff2', 'media/fonts/poppins-latin-400-normal.woff2', 'media/fonts/poppins-latin-500-normal.woff2', 'media/fonts/poppins-latin-600-normal.woff2', 'media/fonts/young-serif-latin-400-normal.woff2'];
['intro', 'station', 'high-street', 'forum', 'church', 'spring', 'pantiles', 'jazz-stand'].forEach(function (n) { FILES.push('media/' + n + '.jpg', 'media/' + n + '-thumb.jpg', 'media/art/' + n + '-512.jpg', 'media/art/' + n + '-256.jpg', 'media/art/' + n + '-96.jpg', 'media/art/' + n + '-192.jpg', 'media/art/' + n + '-384.jpg'); });

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('tw-') === 0 && k !== SHELL && k !== AUDIO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function ranged(req, res) {
  return res.arrayBuffer().then(function (buf) {
    var size = buf.byteLength, h = req.headers.get('range');
    var base = { 'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes' };
    if (!h) return new Response(buf, { status: 200, headers: Object.assign({ 'Content-Length': String(size) }, base) });
    var m = /bytes=(\d*)-(\d*)/.exec(h), start, end;
    if (m && m[1] === '' && m[2] !== '') { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; }
    else { start = m && m[1] ? parseInt(m[1], 10) : 0; end = m && m[2] ? parseInt(m[2], 10) : size - 1; }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    return new Response(buf.slice(start, end + 1), { status: 206, headers: Object.assign({ 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': String(end - start + 1) }, base) });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  var file = url.pathname.split('/').pop();
  if (/\.mp3$/i.test(file)) {
    e.respondWith(caches.open(AUDIO).then(function (c) { return c.match(file); }).then(function (hit) { return hit || caches.match(req, { ignoreSearch: true }); }).then(function (hit) { return hit ? ranged(req, hit) : fetch(req); }));
    return;
  }
  // Page and assets: answer from the saved copy at once, refresh it in the background.
  e.respondWith(caches.open(SHELL).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
