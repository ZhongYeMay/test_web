(() => {
  const hero = document.querySelector('.hero');
  if (!hero || document.getElementById('guidedTour')) return;

  if (!document.querySelector('link[data-guided-tour-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/guided-tour.css';
    style.dataset.guidedTourStyle = 'true';
    document.head.appendChild(style);
  }

  const actions = hero.querySelector('.actions');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'tourTrigger';
  trigger.className = 'link-btn secondary tour-trigger';
  trigger.textContent = 'GUIDED TOUR';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'guidedTour');
  actions?.insertBefore(trigger, actions.children[1] || null);

  const dialog = document.createElement('dialog');
  dialog.id = 'guidedTour';
  dialog.className = 'guided-tour';
  dialog.setAttribute('aria-labelledby', 'guidedTourTitle');
  dialog.innerHTML = `<div class="guided-tour__inner"><div class="guided-tour__head"><div><span class="guided-tour__kicker">// FIRST-RUN WALKTHROUGH</span><h2 id="guidedTourTitle">GUIDED TEST TOUR</h2></div><button type="button" class="guided-tour__close" aria-label="关闭引导">×</button></div><div class="guided-tour__progress" aria-hidden="true"><i></i><i></i><i></i><i></i></div><article class="guided-tour__step" tabindex="-1"><span class="guided-tour__count"></span><h3></h3><p></p><span class="guided-tour__target"></span></article><div class="guided-tour__footer"><span class="guided-tour__skip">Esc 可随时退出，关闭后焦点会回到启动按钮。</span><div class="guided-tour__actions"><button type="button" data-tour-prev>BACK</button><button type="button" class="is-primary" data-tour-next>NEXT</button></div></div></div>`;
  document.body.appendChild(dialog);

  const steps = [
    {title:'Start with diagnostics', body:'运行核心诊断，确认 JavaScript、浏览器环境和页面基础状态正常。', target:'#diagnostics', label:'TARGET · DIAGNOSTICS'},
    {title:'Check responsive behavior', body:'调整窗口宽度，观察布局、文字和控件是否能在不同视口尺寸下保持可用。', target:'#metrics', label:'TARGET · METRICS / VIEWPORT'},
    {title:'Inspect visitor map', body:'查看本地 SVG 世界地图与粗略访问分布。地图本体不依赖第三方地图脚本。', target:'#visitorMap', label:'TARGET · VISITOR MAP'},
    {title:'Review version history', body:'每次成功更新前都会保存上一版 test.html。历史页可以浏览并下载这些快照。', target:'updates.html', label:'TARGET · UPDATE HISTORY'}
  ];

  let index = 0;
  let highlighted = null;
  const step = dialog.querySelector('.guided-tour__step');
  const count = dialog.querySelector('.guided-tour__count');
  const title = dialog.querySelector('h3');
  const body = dialog.querySelector('.guided-tour__step p');
  const targetLabel = dialog.querySelector('.guided-tour__target');
  const prev = dialog.querySelector('[data-tour-prev]');
  const next = dialog.querySelector('[data-tour-next]');
  const dots = [...dialog.querySelectorAll('.guided-tour__progress i')];

  const clearHighlight = () => {
    highlighted?.classList.remove('tour-target-highlight');
    highlighted = null;
  };

  const render = () => {
    const item = steps[index];
    count.textContent = `STEP ${index + 1} / ${steps.length}`;
    title.textContent = item.title;
    body.textContent = item.body;
    targetLabel.textContent = item.label;
    prev.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? 'FINISH' : 'NEXT';
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i <= index));
    step.focus({preventScroll:true});
  };

  const open = () => {
    clearHighlight();
    index = 0;
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const close = (preserveHighlight = false) => {
    if (!preserveHighlight) clearHighlight();
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    trigger.focus();
  };

  const visitCurrentTarget = () => {
    const item = steps[index];
    if (item.target.endsWith('.html')) {
      window.location.href = item.target;
      return;
    }
    const target = document.querySelector(item.target);
    if (!target) return;
    clearHighlight();
    highlighted = target;
    target.classList.add('tour-target-highlight');
    close(true);
    target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    window.setTimeout(clearHighlight, 1800);
  };

  trigger.addEventListener('click', open);
  dialog.querySelector('.guided-tour__close')?.addEventListener('click', () => close());
  prev.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
  next.addEventListener('click', () => {
    if (index === steps.length - 1) { close(); return; }
    index += 1; render();
  });
  targetLabel.addEventListener('click', visitCurrentTarget);
  targetLabel.setAttribute('role', 'button');
  targetLabel.tabIndex = 0;
  targetLabel.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); visitCurrentTarget(); } });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });

  const latest = hero.querySelector('.latest-update');
  if (latest) {
    latest.querySelector('.latest-update__label').textContent = 'LATEST CHANGE · UPDATE #052';
    latest.querySelector('h2').textContent = '新增 GUIDED TEST TOUR';
    latest.querySelector('.latest-update__copy p').textContent = '新增四步首次使用引导，依次解释诊断、响应式检查、访客地图和版本历史；使用原生 dialog 行为并支持键盘与 Escape 退出。';
    const time = latest.querySelector('time');
    if (time) { time.dateTime = '2026-08-12T16:58:24+08:00'; time.textContent = '2026-08-12 16:58 UTC+8'; }
    const archive = latest.querySelector('.latest-update__meta span');
    if (archive) archive.textContent = 'Archive · test+20260812-165824.html';
  }
})();