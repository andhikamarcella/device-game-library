const CACHE_NAME = "dg-tracker-static-v1";
const ASSET_PATTERNS = [/\.js$/, /\.css$/, /\.(woff2?|ttf|otf)$/, /\.(png|jpg|jpeg|svg|webp)$/];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!ASSET_PATTERNS.some((pattern) => pattern.test(request.url))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) {
        cache.put(request, fetch(request).catch(() => cached));
        return cached;
      }
      try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      } catch (error) {
        return cached ?? Response.error();
      }
    }),
  );
});
