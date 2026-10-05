/* Kiwi Crossing moved to https://kiwi-crossing.com/. This replaces the old app service worker at /kiwi-crossing/: it deletes the
   app's caches, unregisters itself and sends any open tabs to the new address. */
var BASE="/kiwi-crossing/",NEW="https://kiwi-crossing.com/";
function kcTarget(href){var u=new URL(href),p=u.pathname;p=p.indexOf(BASE)===0?p.slice(BASE.length):"";
p=(p==="privacy.html"||p==="privacy")?"privacy":"";return NEW+p+u.hash;}
self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("fetch", function(e){ if (e.request.mode === "navigate") e.respondWith(Response.redirect(kcTarget(e.request.url), 301)); });
self.addEventListener("activate", function(e){ e.waitUntil((async function(){
  for (const k of await caches.keys()) if (/^ctd(glass)?-/.test(k)) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) { try { await c.navigate(kcTarget(c.url)); } catch (_) {} }
})()); });
