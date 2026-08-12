(() => {
  const items = [
    { href: '#testFlow', title: 'Test Flow', meta: 'quick start · guided checks', tags: 'flow quick start guide' },
    { href: '#session', title: 'Session Progress', meta: 'live test session · progress', tags: 'session progress checks' },
    { href: '#textScale', title: 'Text Scale / Reflow', meta: 'accessibility · 100–200%', tags: 'text scale reflow accessibility zoom' },
    { href: '#capabilities', title: 'Capability Matrix', meta: 'browser APIs · feature support', tags: 'browser capability api support' },
    { href: '#contrastChecker', title: 'Color Contrast', meta: 'accessibility · WCAG contrast', tags: 'color contrast wcag accessibility' },
    { href: '#accessibility', title: 'Accessibility Preferences', meta: 'motion · contrast · scheme', tags: 'accessibility motion contrast forced colors scheme' },
    { href: '#performance', title: 'Performance Timeline', meta: 'navigation timing · resources', tags: 'performance timing load resources' },
    { href: '#report', title: 'Diagnostic Report', meta: 'copy · download · compare', tags: 'report copy download diagnostic' },
    { href: '#diagnostics', title: 'Diagnostics Console', meta: 'run test · browser environment', tags: 'diagnostics console run test browser' },
    { href: '#metrics', title: 'Live Metrics', meta: 'clock · viewport · visits', tags: 'metrics clock viewport visits' },
    { href: '#visitorMap', title: 'Visitor Map', meta: 'SVG map · country statistics', tags: 'visitor map svg location countries' },
    { href: 'updates.html', title: 'Update History', meta: 'archives · downloads · commits', tags: 'updates history archive download commits' }
  ];

  const hero = document.querySelector('.hero');
  if (!hero || document.getElementById('sectionFinder')) return;

  const latest = hero.querySelector('.latest-update');
  if (latest) {
    const label = latest.querySelector('.latest-update__label');
    const title = latest.querySelector('h2');
    const description = latest.querySelector('.latest-update__copy p');
    const time = latest.querySelector('time');
    const archive = latest.querySelector('.latest-update__meta span');
    if (label) label.textContent = 'LATEST CHANGE · UPDATE #049';
    if (title) title.textContent = '新增 SECTION FINDER';
    if (description) description.textContent = '新增可搜索的模块目录，可按 performance、map、accessibility 等关键词即时筛选主要测试区域，并直接跳转到目标模块。';
    if (time) { time.dateTime = '2026-08-12T14:02:29+08:00'; time.textContent = '2026-08-12 14:02 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260812-140229.html';
  }

  if (!document.querySelector('link[data-section-finder-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/section-finder.css';
    style.dataset.sectionFinderStyle = 'true';
    document.head.appendChild(style);
  }

  const panel = document.createElement('section');
  panel.className = 'section-finder';
  panel.id = 'sectionFinder';
  panel.setAttribute('aria-labelledby', 'sectionFinderTitle');
  panel.innerHTML = `
    <div class="section-finder__head">
      <div><span class="section-finder__kicker">// FIND A TEST</span><h2 id="sectionFinderTitle">SECTION FINDER</h2></div>
      <p>页面功能越来越多。输入关键词即可筛选测试模块，然后直接跳转；不输入时会显示全部主要区域。</p>
    </div>
    <div class="section-finder__search">
      <label for="sectionFinderInput">SEARCH MODULES</label>
      <div class="section-finder__input-wrap"><span aria-hidden="true">⌕</span><input id="sectionFinderInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try: performance, map, accessibility…"><button type="button" id="sectionFinderClear">CLEAR</button></div>
      <div class="section-finder__status"><span id="sectionFinderCount" role="status" aria-live="polite">${items.length} modules available</span><span>Enter opens the first match</span></div>
    </div>
    <div class="section-finder__grid" id="sectionFinderGrid"></div>`;
  hero.insertAdjacentElement('afterend', panel);

  const input = panel.querySelector('#sectionFinderInput');
  const clear = panel.querySelector('#sectionFinderClear');
  const count = panel.querySelector('#sectionFinderCount');
  const grid = panel.querySelector('#sectionFinderGrid');

  const normalize = value => value.toLocaleLowerCase().trim();
  const render = () => {
    const query = normalize(input.value);
    const matches = items.filter(item => normalize(`${item.title} ${item.meta} ${item.tags}`).includes(query));
    grid.replaceChildren(...matches.map((item, index) => {
      const link = document.createElement('a');
      link.className = 'section-finder__item';
      link.href = item.href;
      link.innerHTML = `<span class="section-finder__index">${String(index + 1).padStart(2, '0')}</span><span><strong>${item.title}</strong><small>${item.meta}</small></span><span class="section-finder__arrow" aria-hidden="true">↗</span>`;
      return link;
    }));
    count.textContent = matches.length ? `${matches.length} module${matches.length === 1 ? '' : 's'} matched` : 'No matching modules';
    panel.classList.toggle('is-empty', matches.length === 0);
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const first = grid.querySelector('a');
    if (!first) return;
    event.preventDefault();
    first.click();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    render();
    input.focus();
  });
  render();
})();