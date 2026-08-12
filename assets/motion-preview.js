(() => {
  'use strict';

  const STORAGE_KEY = 'test_web_motion_preview';
  const root = document.documentElement;
  const accessibility = document.getElementById('accessibility');
  if (!accessibility || document.getElementById('motionPreview')) return;

  const style = document.createElement('style');
  style.dataset.motionPreviewStyle = 'true';
  style.textContent = `
    .motion-preview{margin:22px 0;border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:22px;background:rgba(255,255,255,.045)}
    .motion-preview__head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}.motion-preview__kicker{display:block;color:#7c9cff;font-size:12px;letter-spacing:.13em}.motion-preview h2{margin:7px 0 0;font:700 clamp(1.35rem,3vw,2rem)/1.1 Inter,system-ui,sans-serif}.motion-preview__hint{max-width:620px;margin:0;color:#8d96a8;line-height:1.65}
    .motion-preview__body{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.7fr);gap:18px;margin-top:18px}.motion-preview__demo{position:relative;min-height:150px;border:1px solid rgba(255,255,255,.11);border-radius:13px;overflow:hidden;background:linear-gradient(120deg,rgba(124,156,255,.08),rgba(103,232,165,.04))}.motion-preview__orb{position:absolute;top:50%;left:18px;width:42px;height:42px;margin-top:-21px;border-radius:50%;background:#7c9cff;box-shadow:0 0 28px rgba(124,156,255,.48);animation:motionPreviewTravel 2.4s ease-in-out infinite alternate}.motion-preview__demo-label{position:absolute;left:16px;bottom:14px;color:#8d96a8;font-size:12px;letter-spacing:.08em}
    @keyframes motionPreviewTravel{from{transform:translateX(0) scale(.9)}to{transform:translateX(min(58vw,420px)) scale(1.08)}}
    .motion-preview__controls{display:flex;flex-direction:column;gap:10px}.motion-preview__controls button{min-height:44px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:rgba(255,255,255,.04);color:inherit;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;cursor:pointer}.motion-preview__controls button[aria-pressed="true"]{border-color:#7c9cff;background:rgba(124,156,255,.16)}.motion-preview__status{margin:4px 0 0;color:#8d96a8;line-height:1.5;font-size:12px}
    html[data-motion-preview="reduced"] *,html[data-motion-preview="reduced"] *::before,html[data-motion-preview="reduced"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
    html[data-motion-preview="reduced"] .motion-preview__orb{transform:none!important;left:calc(50% - 21px)}
    @media (prefers-reduced-motion:reduce){.motion-preview__orb{animation:none;left:calc(50% - 21px)}}
    @media(max-width:720px){.motion-preview__body{grid-template-columns:1fr}.motion-preview__demo{min-height:125px}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'motion-preview';
  panel.id = 'motionPreview';
  panel.setAttribute('aria-labelledby', 'motionPreviewTitle');
  panel.innerHTML = `
    <div class="motion-preview__head">
      <div><span class="motion-preview__kicker">// MOTION ACCESSIBILITY PREVIEW</span><h2 id="motionPreviewTitle">MOTION PREVIEW</h2></div>
      <p class="motion-preview__hint">一键预览“减少非必要动效”的体验。SYSTEM 跟随设备的 reduced-motion 偏好；REDUCED 会在本站临时压缩动画和过渡，方便检查功能在低动效模式下是否仍清晰可用。</p>
    </div>
    <div class="motion-preview__body">
      <div class="motion-preview__demo" aria-label="动效预览区域"><span class="motion-preview__orb" aria-hidden="true"></span><span class="motion-preview__demo-label">NON-ESSENTIAL MOTION SAMPLE</span></div>
      <div class="motion-preview__controls" role="group" aria-label="动效预览模式">
        <button type="button" data-motion-mode="system" aria-pressed="true">SYSTEM</button>
        <button type="button" data-motion-mode="reduced" aria-pressed="false">REDUCED</button>
        <p class="motion-preview__status" id="motionPreviewStatus" role="status" aria-live="polite">Reading system motion preference…</p>
      </div>
    </div>`;
  accessibility.insertAdjacentElement('afterend', panel);

  const nav = document.querySelector('.quick-nav');
  if (nav && !nav.querySelector('a[href="#motionPreview"]')) {
    const link = document.createElement('a');
    link.href = '#motionPreview';
    link.textContent = 'MOTION';
    const performanceLink = nav.querySelector('a[href="#performance"]');
    nav.insertBefore(link, performanceLink || nav.querySelector('a[href="updates.html"]'));
  }

  const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const buttons = [...panel.querySelectorAll('[data-motion-mode]')];
  const status = document.getElementById('motionPreviewStatus');
  const storedMode = (() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  })();

  function setMode(mode, persist = true) {
    const next = mode === 'reduced' ? 'reduced' : 'system';
    if (next === 'reduced') root.dataset.motionPreview = 'reduced';
    else delete root.dataset.motionPreview;

    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.motionMode === next)));
    const systemReduced = media ? media.matches : false;
    if (status) {
      status.textContent = next === 'reduced'
        ? 'REDUCED · non-essential animation and transition time minimized on this page.'
        : `SYSTEM · device preference reports ${systemReduced ? 'REDUCED MOTION' : 'NO REDUCTION REQUEST'}.`;
    }
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
    }
  }

  buttons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.motionMode)));
  if (media) {
    const refresh = () => {
      const selected = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
      if (!selected || selected.dataset.motionMode === 'system') setMode('system', false);
    };
    if (media.addEventListener) media.addEventListener('change', refresh);
    else if (media.addListener) media.addListener(refresh);
  }

  setMode(storedMode === 'reduced' ? 'reduced' : 'system', false);

  const latestLabel = document.querySelector('.latest-update__label');
  const latestTitle = document.getElementById('latestUpdateTitle');
  const latestCopy = latestTitle ? latestTitle.nextElementSibling : null;
  const latestMeta = document.querySelector('.latest-update__meta');
  if (latestLabel) latestLabel.textContent = 'LATEST CHANGE · UPDATE #060';
  if (latestTitle) latestTitle.textContent = '新增 Motion Preview 低动效可访问性预览';
  if (latestCopy) latestCopy.textContent = '可在 SYSTEM 与 REDUCED 之间切换，直接预览减少非必要动画和过渡后的页面体验，并保留所有现有测试功能。';
  if (latestMeta) {
    const time = latestMeta.querySelector('time');
    const archive = latestMeta.querySelector('span');
    if (time) { time.dateTime = '2026-08-13T01:01:30+08:00'; time.textContent = '2026-08-13 01:01 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260813-010130.html';
  }
})();
