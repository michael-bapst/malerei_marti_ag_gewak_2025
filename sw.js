const CACHE_VERSION = 'v2-2025-01-15';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './site.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

const IMAGE_FILES = [
  "00-13-scaled.jpg","011.JPG","017.JPG","053.JPG","0808a.jpg","1.JPG","13.jpg","14-1-scaled.jpg","18-scaled.jpg","2.JPG",
  "2016-05-10-13.13.09-2-scaled.jpg","2017-06-13 14.17.50.jpg","2017-06-13-14.25.53-scaled.jpg","2017-07-01 11.30.07.jpg","2017-07-26 08.48.52 (2).jpg","2017-07-26 08.59.31.jpg","2017-07-26 09.11.32.jpg","2017-07-26 09.14.52.jpg","2017-07-26 09.29.48.jpg","2017-07-26 09.33.55.jpg",
  "2017-07-26 09.59.17.jpg","2017-07-26 10.05.03.jpg","20170809_111010.jpg","2018-09-26 16.16.19.jpg","20190424_172554.jpg","20190701_155543.jpg","20200828_132220.jpg","20200922_144427-scaled.jpg","20200922_144916.jpg","20201020_131249.jpg",
  "20201020_131456.jpg","20210224_104216.jpg","20210702_141519.jpg","20210707_161657-scaled.jpg","20210813_103314.jpg","2022-06-17 08.41.18.jpg","2022-06-17 08.41.23.jpg","2022-06-27 10.54.10.jpg","2022-06-27 10.55.21.jpg","2022-07-20 08.07.45.jpg",
  "2022-08-09 11.10.42.jpg","2022-08-09 11.19.05.jpg","20220531_110403-scaled.jpg","20220608_074131.jpg","20220608_093753.jpg","20220608_101210.jpg","20220608_101258.jpg","20220615_094956.jpg","20220615_101738.jpg","20220615_101924.jpg",
  "2023-07-07 13.23.30.jpg","2023-07-07 13.23.54.jpg","2024-05-01 08.50.11.jpg","2024-05-01 08.51.27.jpg","2024-05-01 08.51.43.jpg","2024-05-01 08.52.17.jpg","2024-09-04 16.22.16.jpg","2025-05-13 11.38.05.jpg","2025-05-24 08.00.05.jpg","2025-05-27 10.20.42.jpg",
  "2025-06-26 09.50.40.jpg","2025-06-26 09.52.19.jpg","2025-07-10 09.10.17.jpg","2025-08-12 10.27.26.jpg","2025-08-26 09.35.25.jpg","2025-08-26 09.45.39.jpg","2025-08-26 09.46.19.jpg","2025-08-27 14.31.52.jpg","2025-09-02 18.33.30.jpg","2025-09-02 18.35.52.jpg",
  "2025-09-03 09.52.09.jpg","2025-09-03 09.52.37.jpg","20250826_161207.jpg","20250829_141945.jpg","20250829_142025.jpg","21.jpg","22-scaled.jpg","6.jpg","8.jpg","Deko 022.JPG",
  "DSC00041.JPG","DSC00168-scaled.jpg","DSC00172.JPG","DSC01035.JPG","DSC01593.JPG","DSC01595-2-scaled.jpg","DSC01601 (2).JPG","DSC01712.JPG","EFH Ammengasse, Kallnach (2).jpg","hauptfolie.png",
  "Hurni Rebenweg Kallnach 05.jpg","IMG-20160718-WA0002.jpg","Köhli Krosenrain Kallnach 05 (3).jpg","MFH Schützenrain 11und 11A, Ortschwaben 006.JPG","P1000443.JPG","P1000453.JPG","P1000459.JPG","P1000461.JPG","P1000774.JPG","P1000782.JPG",
  "P1000793 (2).JPG","P1010022.JPG","P1010024.JPG","P1010081.JPG","P1010082.JPG","P1010089.JPG","P1010099.JPG","P1010103.JPG","P1010104.JPG","P1010113 (2).JPG",
  "P1010163.JPG","P1010173.JPG","p1010206.jpg","P1010910 - Kopie.JPG","Pfarrhaus (14).JPG","Renovation Fassade , Bargen 2009 (15).JPG","Wohn.- Geschäftshaus, Bargen 3.jpg"
].map(n => encodeURI(`./Bilder Gewak/${n}`));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(APP_SHELL_CACHE);
    await shell.addAll(APP_SHELL);

    const imgCache = await caches.open(IMAGES_CACHE);

    const limit = 8;
    let i = 0;
    async function worker() {
      while (i < IMAGE_FILES.length) {
        const url = IMAGE_FILES[i++];
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) await imgCache.put(url, res.clone());
        } catch (_) { }
      }
    }
    await Promise.all(Array.from({ length: limit }, worker));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => ![APP_SHELL_CACHE, IMAGES_CACHE].includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.includes('/Bilder%20Gewak/')) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGES_CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      try {
        const res = await fetch(event.request);
        cache.put(event.request, res.clone());
        return res;
      } catch {
        return new Response('', { status: 404 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      const shell = await caches.open(APP_SHELL_CACHE);
      shell.put(event.request, res.clone());
      return res;
    } catch {
      const shell = await caches.open(APP_SHELL_CACHE);
      return (await shell.match('./index.html')) || new Response('', { status: 404 });
    }
  })());
});