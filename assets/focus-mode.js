(() => {
  const STORAGE_KEY = 'test_web_focus_mode';
  const hero = document.querySelector('.hero');
  if (!hero || document.getElementById('focusModePanel')) return;

  if (!document.querySelector('link[data-focus-mode-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/focus-mode.css';
    style.dataset.focusModeStyle = 'true';
    document.head.appendChild(style);
  }

  if (!document.querySelector('link[data-context-trail-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/breadcrumb-trail.css';
    style.dataset.contextTrailStyle = 'true';
    document.head.appendChild(style);
  }

  const trail = document.createElement('nav');
  trail.className = 'context-trail';
  trail.id = 'contextTrail';
  trail.setAttribute('aria-label', '当前位置');
  trail.innerHTML = `
    <ol class="context-trail__list">
      <li><span class="context-trail__pulse" aria-hidden="true"></span><a href="#mainContent">TEST LAB</a></li>
      <li><a href="#testFlow">TEST WORKSPACE</a></li>
      <li><span id="contextTrailCurrent" aria-current="location">FLOW</span></li>
      <li><a href="updates.html">UPDATE HISTORY</a></li>
    </ol>`;
  hero.insertAdjacentElement('afterend', trail);

  const currentTrail = trail.querySelector('#contextTrailCurrent');
  const quickNav = document.querySelector('.quick-nav');
  const syncTrail = () => {
    const current = quickNav?.querySelector('a[aria-current="location"], a[aria-current="page"]');
    if (currentTrail) currentTrail.textContent = current ? current.textContent.trim() : 'FLOW';
  };
  if (quickNav) {
    const observer = new MutationObserver(syncTrail);
    observer.observe(quickNav, {subtree:true, attributes:true, attributeFilter:['aria-current']});
  }
  window.addEventListener('hashchange', syncTrail, {passive:true});
  syncTrail();

  const panel = document.createElement('section');
  panel.className = 'focus-mode-panel';
  panel.id = 'focusModePanel';
  panel.setAttribute('aria-labelledby', 'focusModeTitle');
  panel.innerHTML = `
    <div class="focus-mode-panel__head">
      <div><span class="focus-mode-panel__kicker">// WORKSPACE FILTER</span><h2 id="focusModeTitle">FOCUS MODE</h2></div>
      <div class="focus-mode-panel__controls" role="group" aria-label="页面工作区模式">
        <button type="button" data-focus-option="full" aria-pressed="true">FULL VIEW</button>
        <button type="button" data-focus-option="focus" aria-pressed="false">FOCUS VIEW</button>
      </div>
    </div>
    <p>需要快速走核心测试流程时，FOCUS VIEW 会暂时收起可选的深度检查面板，只保留测试流程、会话进度、诊断终端、实时指标与访客地图。所有功能都可通过 FULL VIEW 立即恢复。</p>
    <div class="focus-mode-panel__status" role="status" aria-live="polite"><strong id="focusModeState">FULL VIEW</strong><span id="focusModeNote">all test modules visible</span></div>`;

  const finder = document.getElementById('sectionFinder');
  if (finder) finder.insertAdjacentElement('afterend', panel);
  else trail.insertAdjacentElement('afterend', panel);

  const buttons = [...panel.querySelectorAll('[data-focus-option]')];
  const state = panel.querySelector('#focusModeState');
  const note = panel.querySelector('#focusModeNote');

  const apply = mode => {
    const value = mode === 'focus' ? 'focus' : 'full';
    document.body.dataset.focusMode = value;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.focusOption === value)));
    state.textContent = value === 'focus' ? 'FOCUS VIEW' : 'FULL VIEW';
    note.textContent = value === 'focus' ? 'optional deep-dive panels hidden · core workflow stays visible' : 'all test modules visible';
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  };

  buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.focusOption)));
  let initial = 'full';
  try { initial = localStorage.getItem(STORAGE_KEY) || 'full'; } catch (_) {}
  apply(initial);

  const latest = hero.querySelector('.latest-update');
  if (latest) {
    const label = latest.querySelector('.latest-update__label');
    const title = latest.querySelector('h2');
    const description = latest.querySelector('.latest-update__copy p');
    const time = latest.querySelector('time');
    const archive = latest.querySelector('.latest-update__meta span');
    if (label) label.textContent = 'LATEST CHANGE · UPDATE #056';
    if (title) title.textContent = '新增页面当前位置导航';
    if (description) description.textContent = '新增 TEST LAB → TEST WORKSPACE → 当前测试区域 → UPDATE HISTORY 的可见路径导航，并与 Quick Nav 的当前区域状态同步，长页面中更容易确认自己正在查看哪个模块。';
    if (time) { time.dateTime = '2026-08-12T21:04:57+08:00'; time.textContent = '2026-08-12 21:04 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260812-210457.html';
  }

  if (!document.querySelector('script[data-health-overview]')) {
    const health = document.createElement('script');
    health.src = 'assets/health-overview.js';
    health.dataset.healthOverview = 'true';
    document.body.appendChild(health);
  }

  if (!document.querySelector('script[data-guided-tour]')) {
    const tour = document.createElement('script');
    tour.src = 'assets/guided-tour.js';
    tour.dataset.guidedTour = 'true';
    document.body.appendChild(tour);
  }

  if (!document.querySelector('script[data-storage-lab]')) {
    const storageLab = document.createElement('script');
    storageLab.src = 'assets/storage-lab.js';
    storageLab.dataset.storageLab = 'true';
    document.body.appendChild(storageLab);
  }
})();