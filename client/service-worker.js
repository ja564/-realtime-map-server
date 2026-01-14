
// filepath: d:\server\client\service-worker.js
const CACHE_NAME = 'zhuhai-map-cache-v1';

// 按需把关键静态资源加进来（路径以部署到 Netlify 的根目录为准）
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',        // 如果有 CSS 文件就写，没有就删掉这一行
  'https://api.maptiler.com/maps/streets-v2/style.json?key=6kybY9Exzowy9u4AmHWC',
 '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 安装阶段：预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 请求拦截：优先网络，失败时读缓存（适合你这种需要实时数据的地图）
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 对你的后端 API 直接走网络，不缓存（保持数据实时）
  if (request.url.includes('/api/events')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 把成功的响应写入缓存（仅限 GET）
        if (request.method === 'GET') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || Promise.reject('no-match'))
      )
  );
});
