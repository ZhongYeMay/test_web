(() => {
  const ensureStyles = () => {
    if (document.querySelector('link[href="assets/landmark-inspector.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/landmark-inspector.css';
    document.head.appendChild(link);
  };

  const init = () => {
    ensureStyles();
    const main = document.getElementById('mainContent');
    if (!main || document.getElementById('landmarks')) return;

    const panel = document.createElement('section');
    panel.className = 'landmark-inspector';
    panel.id = 'landmarks';
    panel.setAttribute('aria-labelledby', 'landmarkInspectorTitle');
    panel.innerHTML = `
      <div class="landmark-inspector__head">
        <div><span class="landmark-inspector__kicker">// SEMANTIC STRUCTURE VIEW</span><h2 id="landmarkInspectorTitle">LANDMARK INSPECTOR</h2></div>
        <p class="landmark-inspector__hint">把页面的 header、navigation、main、named regions 与 footer 直接标出来，方便检查长页面的语义结构。高亮只发生在本地浏览器，不修改内容。</p>
      </div>
      <div class="landmark-inspector__controls">
        <button type="button" id="landmarkToggle" aria-pressed="false">SHOW LANDMARKS</button>
        <button type="button" id="landmarkRefresh">RE-SCAN</button>
      </div>
      <div class="landmark-inspector__stats" aria-label="页面 landmark 统计">
        <div class="landmark-inspector__stat"><span>NAVIGATION</span><strong id="landmarkNavCount">0</strong></div>
        <div class="landmark-inspector__stat"><span>NAMED REGIONS</span><strong id="landmarkRegionCount">0</strong></div>
        <div class="landmark-inspector__stat"><span>MAIN</span><strong id="landmarkMainCount">0</strong></div>
        <div class="landmark-inspector__stat"><span>TOTAL FOUND</span><strong id="landmarkTotalCount">0</strong></div>
      </div>
      <span class="landmark-inspector__status" id="landmarkStatus" role="status" aria-live="polite">Ready to scan semantic landmarks.</span>`;

    const anchor = document.querySelector('.viewport-mode') || main.firstElementChild;
    anchor.insertAdjacentElement('afterend', panel);

    const nav = document.querySelector('.quick-nav');
    if (nav && !nav.querySelector('a[href="#landmarks"]')) {
      const link = document.createElement('a');
      link.href = '#landmarks';
      link.textContent = 'LANDMARKS';
      const before = nav.querySelector('a[href="#textScale"]');
      before ? nav.insertBefore(link, before) : nav.appendChild(link);
    }

    const toggle = document.getElementById('landmarkToggle');
    const refresh = document.getElementById('landmarkRefresh');
    const status = document.getElementById('landmarkStatus');
    let enabled = false;
    let marked = [];

    const classify = (el) => {
      if (el.matches('header')) return 'BANNER / HEADER';
      if (el.matches('nav')) return `NAVIGATION${el.getAttribute('aria-label') ? ' · ' + el.getAttribute('aria-label') : ''}`;
      if (el.matches('main')) return 'MAIN';
      if (el.matches('footer')) return 'CONTENTINFO / FOOTER';
      if (el.matches('aside')) return 'COMPLEMENTARY';
      if (el.matches('section[aria-label],section[aria-labelledby]')) return 'REGION';
      return 'LANDMARK';
    };

    const scan = () => {
      marked.forEach(el => {
        el.classList.remove('landmark-debug-target');
        el.removeAttribute('data-landmark-label');
      });
      marked = Array.from(document.querySelectorAll('header, nav, main, footer, aside, section[aria-label], section[aria-labelledby]'));
      const navCount = document.querySelectorAll('nav').length;
      const regionCount = document.querySelectorAll('section[aria-label],section[aria-labelledby]').length;
      const mainCount = document.querySelectorAll('main').length;
      document.getElementById('landmarkNavCount').textContent = String(navCount);
      document.getElementById('landmarkRegionCount').textContent = String(regionCount);
      document.getElementById('landmarkMainCount').textContent = String(mainCount);
      document.getElementById('landmarkTotalCount').textContent = String(marked.length);
      if (enabled) marked.forEach(el => {
        el.dataset.landmarkLabel = classify(el);
        el.classList.add('landmark-debug-target');
      });
      status.textContent = `${marked.length} semantic landmarks found · ${enabled ? 'visual overlay on' : 'overlay off'}.`;
    };

    toggle.addEventListener('click', () => {
      enabled = !enabled;
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.textContent = enabled ? 'HIDE LANDMARKS' : 'SHOW LANDMARKS';
      scan();
    });
    refresh.addEventListener('click', scan);
    scan();

    const latestLabel = document.querySelector('.latest-update__label');
    const latestTitle = document.getElementById('latestUpdateTitle');
    const latestText = latestTitle?.nextElementSibling;
    const latestTime = document.querySelector('.latest-update__meta time');
    const latestArchive = latestTime?.nextElementSibling;
    if (latestLabel && latestTitle && latestText && latestTime && latestArchive) {
      latestLabel.textContent = 'LATEST CHANGE · UPDATE #047';
      latestTitle.textContent = '新增 Landmark Inspector';
      latestText.textContent = '新增语义 Landmark 检查器，可一键高亮 header、navigation、main、命名 region 与 footer，并实时统计页面结构，帮助直观看出辅助技术可导航的主要区域。';
      latestTime.dateTime = '2026-08-12T12:00:10+08:00';
      latestTime.textContent = '2026-08-12 12:00 UTC+8';
      latestArchive.textContent = 'Archive · test+20260812-120010.html';
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();