var V = "rg-v1";
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
var CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) {
      return c.addAll(CORE).then(function () {
        return Promise.all(CDN.map(function (u) {
          return fetch(u, {mode: "no-cors"}).then(function (r) { return c.put(u, r); }).catch(function () {});
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === "navigate") {
      e.respondWith(fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(V).then(function (c) { c.put("./index.html", cp); });
        return res;
      }).catch(function () { return caches.match("./index.html"); }));
      return;
    }
    e.respondWith(caches.match(r).then(function (m) { return m || fetch(r); }));
    return;
  }
  if (/cdnjs|fonts\.(googleapis|gstatic)/.test(u.host)) {
    e.respondWith(caches.match(r).then(function (m) {
      var f = fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(V).then(function (c) { c.put(r, cp); });
        return res;
      }).catch(function () { return m; });
      return m || f;
    }));
  }
});
