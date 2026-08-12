(() => {
  if (document.getElementById('healthOverview')) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  if (!document.querySelector('link[data-health-overview-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/health-overview.css';
    style.dataset.healthOverviewStyle = 'true';
    document.head.appendChild(style);
  }

  const panel = document.createElement('section');
  panel.className = 'health-overview';
  panel.id = 'healthOverview';
  panel.dataset.state = 'checking';
  panel.setAttribute('aria-labelledby', 'healthOverviewTitle');
  panel.innerHTML = `
    <div class="health-overview__head">
      <div><span class="health-overview__kicker">// CURRENT PAGE HEALTH</span><h2 id="healthOverviewTitle">SITE HEALTH OVERVIEW</h2></div>
      <div class="health-overview__summary" role="status" aria-live="polite" aria-atomic="true"><i class="health-overview__summary-dot" aria-hidden="true"></i><div><strong id="healthOverall">CHECKING</strong><span id="healthCount">0 / 5 checks ready</span></div></div>
    </div>
    <p class="health-overview__intro">把已经存在于本站的网络、JavaScript、性能、诊断和地图信号汇总成一个入口。它不会启动新的第三方服务，只读取当前页面已有状态。</p>
    <div class="health-overview__grid">
      <article class="health-check" data-health="javascript" data-state="pass"><span>JAVASCRIPT</span><strong>READY</strong><small>Health summary is running.</small></article>
      <article class="health-check" data-health="network" data-state="pending"><span>NETWORK</span><strong>CHECKING</strong><small>Reading browser network status.</small></article>
      <article class="health-check" data-health="performance" data-state="pending"><span>PAGE LOAD</span><strong>MEASURING</strong><small>Waiting for Navigation Timing.</small></article>
      <article class="health-check" data-health="diagnostics" data-state="pending"><span>DIAGNOSTICS</span><strong>NOT RUN</strong><small>Run the core diagnostics once.</small></article>
      <article class="health-check" data-health="map" data-state="pending"><span>VISITOR MAP</span><strong>CHECKING</strong><small>Checking local SVG map readiness.</small></article>
    </div>
    <div class="health-overview__footer"><span class="health-overview__status" id="healthStatus">Collecting current page signals…</span><div class="health-overview__actions"><button type="button" id="healthRun">RUN + REFRESH</button><a href="#diagnostics">VIEW DIAGNOSTICS</a></div></div>`;

  const focus = document.getElementById('focusModePanel');
  if (focus) focus.insertAdjacentElement('afterend', panel);
  else hero.insertAdjacentElement('afterend', panel);

  const getCard = name => panel.querySelector(`[data-health="${name}"]`);
  const setCard = (name, state, title, note) => {
    const card = getCard(name);
    if (!card) return;
    card.dataset.state = state;
    card.querySelector('strong').textContent = title;
    card.querySelector('small').textContent = note;
  };

  const refresh = () => {
    const networkText = document.getElementById('networkStatus')?.textContent || '';
    const online = navigator.onLine !== false && !/OFFLINE/i.test(networkText);
    setCard('network', online ? 'pass' : 'attention', online ? 'ONLINE' : 'OFFLINE', online ? 'Browser reports an active network.' : 'Browser reports no network connection.');

    const loadText = document.getElementById('perfLoad')?.textContent || '';
    const loadMs = Number.parseFloat(loadText.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(loadMs) && loadMs > 0) {
      const slow = loadMs > 2500;
      setCard('performance', slow ? 'attention' : 'pass', slow ? `${Math.round(loadMs)} MS` : 'READY', slow ? 'Full load exceeded 2.5 s on this navigation.' : `Full load ${Math.round(loadMs)} ms on this navigation.`);
    } else {
      setCard('performance', 'pending', 'MEASURING', 'Waiting for Navigation Timing.');
    }

    const runs = Number.parseInt(document.getElementById('runs')?.textContent || '0', 10) || 0;
    setCard('diagnostics', runs > 0 ? 'pass' : 'pending', runs > 0 ? 'RUN' : 'NOT RUN', runs > 0 ? `${runs} diagnostic run${runs === 1 ? '' : 's'} in this page session.` : 'Use RUN + REFRESH or RUN TEST once.');

    const map = document.getElementById('worldMap');
    const mapBase = document.querySelector('.map-base');
    const mapReady = Boolean(map && mapBase && (mapBase.complete || mapBase.getAttribute('src')));
    const mapBusy = document.getElementById('visitorMap')?.getAttribute('aria-busy') === 'true';
    setCard('map', mapReady ? 'pass' : 'attention', mapReady ? (mapBusy ? 'SVG READY' : 'READY') : 'UNAVAILABLE', mapReady ? (mapBusy ? 'Local map is visible; visitor data is still loading.' : 'Local map and visitor panel are available.') : 'Local visitor map could not be confirmed.');

    const cards = [...panel.querySelectorAll('.health-check')];
    const passed = cards.filter(card => card.dataset.state === 'pass').length;
    const attention = cards.filter(card => card.dataset.state === 'attention').length;
    const overall = panel.querySelector('#healthOverall');
    const count = panel.querySelector('#healthCount');
    const status = panel.querySelector('#healthStatus');

    panel.dataset.state = attention ? 'attention' : (passed === cards.length ? 'ready' : 'checking');
    overall.textContent = attention ? 'ATTENTION' : (passed === cards.length ? 'READY' : 'CHECKING');
    count.textContent = `${passed} / ${cards.length} checks ready`;
    status.textContent = attention ? `${attention} check${attention === 1 ? '' : 's'} need attention.` : (passed === cards.length ? 'All summarized signals currently look ready.' : 'Some checks are still waiting for data or interaction.');
  };

  panel.querySelector('#healthRun')?.addEventListener('click', () => {
    document.getElementById('runTest')?.click();
    refresh();
    window.setTimeout(refresh, 350);
    window.setTimeout(refresh, 1200);
  });

  ['online', 'offline', 'load'].forEach(eventName => window.addEventListener(eventName, refresh));
  const observed = ['networkStatus', 'perfLoad', 'runs', 'mapStatus', 'visitorMap'].map(id => document.getElementById(id)).filter(Boolean);
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(refresh);
    observed.forEach(node => observer.observe(node, {subtree:true, childList:true, characterData:true, attributes:true}));
  }
  refresh();
  window.setTimeout(refresh, 500);
  window.setTimeout(refresh, 1800);

  const latest = hero.querySelector('.latest-update');
  if (latest) {
    const label = latest.querySelector('.latest-update__label');
    const title = latest.querySelector('h2');
    const description = latest.querySelector('.latest-update__copy p');
    const time = latest.querySelector('time');
    const archive = latest.querySelector('.latest-update__meta span');
    if (label) label.textContent = 'LATEST CHANGE · UPDATE #051';
    if (title) title.textContent = '新增 SITE HEALTH OVERVIEW';
    if (description) description.textContent = '把网络、JavaScript、页面加载、诊断运行与访客地图状态汇总成一个可见健康概览，并提供 RUN + REFRESH 一键重新检查。';
    if (time) { time.dateTime = '2026-08-12T16:01:57+08:00'; time.textContent = '2026-08-12 16:01 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260812-160157.html';
  }
})();