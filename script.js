const grid = document.getElementById("grid");
const gallery = document.getElementById("gallery");
const galleryGrid = document.getElementById("gallery-grid");
const btnGallery = document.getElementById("btn-gallery");
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const btnBack = document.getElementById("btn-back");

const imageFiles = [
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
];

const baseDir = "Bilder Gewak/";
const allSlides = imageFiles
    .filter(name => name !== "hauptfolie.png")
    .map(name => encodeURI(baseDir + name));
const karussellSlides = [encodeURI(baseDir + "hauptfolie.png"), ...allSlides];

let presentationIndex = 0;
let isPlaying = false;
let holdTimer = null;
let gridPauseTimer = null;
let playSessionId = 0;

const fullscreen = document.getElementById("fullscreen");
const fullscreenImg = document.getElementById("fullscreen-img");
const closeFullscreenBtn = document.getElementById("close-fullscreen");

const ENTER_DURATION_MS = 1200;
const EXIT_DURATION_MS = 1200;
const HOLD_FIRST_MS = 20000;
const HOLD_OTHERS_MS = 4000;
const GRID_PAUSE_MS = 2000;

const PREWARM_COUNT = 3;
const MAX_CACHE = 30;
const preloadCache = new Map();
const indexQueue = [];

async function decodeSrc(src) {
    let img = preloadCache.get(src);
    if (!img) {
        img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = src;
        preloadCache.set(src, img);
        if (preloadCache.size > MAX_CACHE) {
            const firstKey = preloadCache.keys().next().value;
            preloadCache.delete(firstKey);
        }
    }
    try {
        if ('decode' in img) await img.decode();
    } catch { }
    return img;
}

async function prepareNext(fromIndex) {
    indexQueue.length = 0;
    for (let i = 1; i <= PREWARM_COUNT; i++) {
        indexQueue.push((fromIndex + i) % karussellSlides.length);
    }
    for (const idx of indexQueue) {
        const src = karussellSlides[idx];
        decodeSrc(src);
    }
}

async function showSlide(index) {
    if (isPlaying) return;
    isPlaying = true;
    const mySession = ++playSessionId;
    
    const imgSrc = karussellSlides[index];
    const welcome = document.querySelector('.welcome-text');
    if (welcome) welcome.style.display = 'none';

    fullscreenImg.setAttribute('fetchpriority', index === 0 ? 'high' : 'auto');

    fullscreen.classList.remove('hidden');
    requestAnimationFrame(() => fullscreen.classList.add('visible'));
    gsap.set(fullscreenImg, { opacity: 0, scale: 0.8, rotation: 0 });

    await decodeSrc(imgSrc);
    if (mySession !== playSessionId) return;

    fullscreenImg.src = imgSrc;

        const holdTime = index === 0 ? HOLD_FIRST_MS : HOLD_OTHERS_MS;
    prepareNext(index);

        gsap.to(fullscreenImg, {
            duration: ENTER_DURATION_MS / 1000,
                opacity: 1, 
                scale: 1, 
        ease: 'power1.out'
    });

    holdTimer = setTimeout(() => {
        if (mySession !== playSessionId) return;
        gsap.to(fullscreenImg, {
                    duration: EXIT_DURATION_MS / 1000,
                    opacity: 0,
                    scale: 0.9,
            ease: 'power1.in',
            onComplete: () => {
                if (mySession !== playSessionId) return;
                fullscreen.classList.remove('visible');
                    setTimeout(() => {
                    if (mySession !== playSessionId) return;
                    fullscreen.classList.add('hidden');
                        if (welcome) welcome.style.display = '';
                    presentationIndex = (presentationIndex + 1) % karussellSlides.length;
                        isPlaying = false;
                    gridPauseTimer = setTimeout(() => {
                        if (mySession !== playSessionId) return;
                        if (!isPlaying) showSlide(presentationIndex);
                        }, GRID_PAUSE_MS);
                    }, 300);
            }
                });
        }, holdTime);
}

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isPlaying) showSlide(presentationIndex);
    } else if (e.key === 'Escape') {
        stopSlideshow();
    }
});

function goHome() {
    if (gallery) gallery.classList.add('hidden');
    if (grid) grid.classList.remove('hidden');
    if (btnGallery) btnGallery.classList.remove('hidden');
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnStop) btnStop.classList.remove('hidden');
    if (btnBack) btnBack.classList.add('hidden');
}

function goGallery() {
    stopSlideshow();
    if (grid) grid.classList.add('hidden');
    if (gallery) gallery.classList.remove('hidden');
    populateGalleryOnce();
    if (btnGallery) btnGallery.classList.add('hidden');
    if (btnStart) btnStart.classList.add('hidden');
    if (btnStop) btnStop.classList.add('hidden');
    if (btnBack) btnBack.classList.remove('hidden');
}

function populateGalleryOnce() {
    if (!galleryGrid || galleryGrid.dataset.init === '1') return;
    const frag = document.createDocumentFragment();
    karussellSlides.forEach((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.addEventListener('click', () => {
            openFullscreenFromGallery(src);
        });
        frag.appendChild(img);
    });
    galleryGrid.appendChild(frag);
    galleryGrid.dataset.init = '1';
}

function openFullscreenFromGallery(src) {
    fullscreen.classList.remove('hidden');
    requestAnimationFrame(() => fullscreen.classList.add('visible'));
    fullscreenImg.src = src;
    gsap.set(fullscreenImg, { opacity: 0, scale: 0.95, rotation: 0 });
    decodeSrc(src).then(() => {
        gsap.to(fullscreenImg, {
            duration: ENTER_DURATION_MS / 1000,
            opacity: 1,
            scale: 1,
            ease: 'power1.out'
        });
    });
    if (closeFullscreenBtn) closeFullscreenBtn.classList.remove('hidden');
}

function closeFullscreenFromGallery() {
    gsap.to(fullscreenImg, {
        duration: EXIT_DURATION_MS / 1000,
        opacity: 0,
        scale: 0.95,
        ease: 'power1.in',
        onComplete: () => {
            fullscreen.classList.remove('visible');
            setTimeout(() => fullscreen.classList.add('hidden'), 300);
            if (closeFullscreenBtn) closeFullscreenBtn.classList.add('hidden');
        }
    });
}

if (btnGallery) btnGallery.addEventListener('click', () => { location.hash = '#gallery'; });
if (btnStart) btnStart.addEventListener('click', () => { location.hash = '#home'; if (!isPlaying) showSlide(presentationIndex); });
if (btnStop) btnStop.addEventListener('click', () => { stopSlideshow(); });
if (btnBack) btnBack.addEventListener('click', () => { location.hash = '#home'; });
if (closeFullscreenBtn) closeFullscreenBtn.addEventListener('click', closeFullscreenFromGallery);

function applyRoute() {
    if (location.hash === '#gallery') goGallery();
    else goHome();
}

window.addEventListener('hashchange', applyRoute);
applyRoute();

function stopSlideshow() {
    playSessionId++;
    isPlaying = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (gridPauseTimer) { clearTimeout(gridPauseTimer); gridPauseTimer = null; }
    if (fullscreen) {
        gsap.killTweensOf(fullscreenImg);
        fullscreen.classList.remove('visible');
        setTimeout(() => { if (fullscreen) fullscreen.classList.add('hidden'); }, 300);
        const welcome = document.querySelector('.welcome-text');
        if (welcome) welcome.style.display = '';
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}