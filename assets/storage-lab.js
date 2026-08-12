(() => {
  if (document.getElementById('storageLab')) return;

  if (!document.querySelector('link[data-storage-lab-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/storage-lab.css';
    style.dataset.storageLabStyle = 'true';
    document.head.appendChild(style);
  }

  const KEY = 'test_web_storage_lab_probe';
  const panel = document.createElement('section');
  panel.className = 'storage-lab';
  panel.id = 'storageLab';
  panel.setAttribute('aria-labelledby', 'storageLabTitle');
  panel.innerHTML = `
    <div class="storage-lab__head">
      <div><span class="storage-lab__kicker">// CLIENT STORAGE PROBE</span><h2 id="storageLabTitle">WEB STORAGE LAB</h2></div>
      <p class="storage-lab__hint">在当前浏览器中实际写入、读取并清除一个本站专用测试值。LOCAL STORAGE 可跨页面会话保留；SESSION STORAGE 只属于当前标签页会话。测试值不包含个人信息，也不会上传。</p>
    </div>
    <div class="storage-lab__grid">
      <article class="storage-lab__card" data-storage-card="local">
        <div class="storage-lab__card-top"><span>LOCAL STORAGE</span><strong data-storage-state="local">READY</strong></div>
        <div class="storage-lab__value" data-storage-value="local">No probe value stored.</div>
        <div class="storage-lab__actions"><button type="button" data-storage-action="write" data-storage-kind="local">WRITE TEST</button><button type="button" data-storage-action="verify" data-storage-kind="local">VERIFY</button><button type="button" data-storage-action="clear" data-storage-kind="local">CLEAR</button></div>
      </article>
      <article class="storage-lab__card" data-storage-card="session">
        <div class="storage-lab__card-top"><span>SESSION STORAGE</span><strong data-storage-state="session">READY</strong></div>
        <div class="storage-lab__value" data-storage-value="session">No probe value stored.</div>
        <div class="storage-lab__actions"><button type="button" data-storage-action="write" data-storage-kind="session">WRITE TEST</button><button type="button" data-storage-action="verify" data-storage-kind="session">VERIFY</button><button type="button" data-storage-action="clear" data-storage-kind="session">CLEAR</button></div>
      </article>
    </div>
    <div class="storage-lab__footer"><div><div class="storage-lab__status" id="storageLabStatus" role="status" aria-live="polite"><strong>READY</strong> · choose a storage area to run a real read/write probe.</div><div class="storage-lab__legend"><span><b>LOCAL</b> · origin-scoped persistent storage</span><span><b>SESSION</b> · current top-level browsing session</span></div></div><button type="button" class="storage-lab__clear" id="storageClearAll">CLEAR BOTH TEST VALUES</button></div>`;

  const session = document.getElementById('session');
  if (session) session.insertAdjacentElement('afterend', panel);
  else document.getElementById('mainContent')?.prepend(panel);

  const quickNav = document.querySelector('.quick-nav');
  if (quickNav && !quickNav.querySelector('a[href="#storageLab"]')) {
    const link = document.createElement('a');
    link.href = '#storageLab';
    link.textContent = 'STORAGE';
    const sessionLink = quickNav.querySelector('a[href="#session"]');
    if (sessionLink) sessionLink.insertAdjacentElement('afterend', link);
    else quickNav.appendChild(link);
  }

  const status = panel.querySelector('#storageLabStatus');
  const getArea = kind => kind === 'local' ? window.localStorage : window.sessionStorage;
  const stamp = () => `${new Date().toISOString()} · ${Math.random().toString(36).slice(2, 10)}`;

  const render = kind => {
    const card = panel.querySelector(`[data-storage-card="${kind}"]`);
    const state = panel.querySelector(`[data-storage-state="${kind}"]`);
    const value = panel.querySelector(`[data-storage-value="${kind}"]`);
    try {
      const stored = getArea(kind).getItem(KEY);
      card.classList.remove('is-error');
      state.textContent = stored ? 'VALUE FOUND' : 'EMPTY';
      value.textContent = stored || 'No probe value stored.';
      return stored;
    } catch (error) {
      card.classList.add('is-error');
      state.textContent = 'BLOCKED';
      value.textContent = error?.name || 'Storage access unavailable';
      return null;
    }
  };

  const announce = message => { status.innerHTML = message; };

  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-storage-action]');
    if (!button) return;
    const kind = button.dataset.storageKind;
    const label = kind === 'local' ? 'LOCAL STORAGE' : 'SESSION STORAGE';
    try {
      const area = getArea(kind);
      if (button.dataset.storageAction === 'write') {
        area.setItem(KEY, stamp());
        render(kind);
        announce(`<strong>WRITE OK</strong> · ${label} accepted and returned the test value.`);
      } else if (button.dataset.storageAction === 'verify') {
        const value = render(kind);
        announce(value ? `<strong>VERIFY OK</strong> · ${label} still contains the probe value.` : `<strong>EMPTY</strong> · ${label} has no test value to verify.`);
      } else if (button.dataset.storageAction === 'clear') {
        area.removeItem(KEY);
        render(kind);
        announce(`<strong>CLEARED</strong> · removed only the TEST_LAB probe key from ${label}.`);
      }
    } catch (error) {
      render(kind);
      announce(`<strong>BLOCKED</strong> · ${label} access failed (${error?.name || 'unknown error'}).`);
    }
  });

  panel.querySelector('#storageClearAll')?.addEventListener('click', () => {
    let cleared = 0;
    for (const kind of ['local', 'session']) {
      try { getArea(kind).removeItem(KEY); cleared += 1; } catch (_) {}
      render(kind);
    }
    announce(`<strong>CLEAR COMPLETE</strong> · ${cleared}/2 storage areas accepted removal of the TEST_LAB probe key.`);
  });

  render('local');
  render('session');

  const latest = document.querySelector('.hero .latest-update');
  if (latest) {
    latest.querySelector('.latest-update__label')?.replaceChildren(document.createTextNode('LATEST CHANGE · UPDATE #054'));
    const title = latest.querySelector('h2');
    const description = latest.querySelector('.latest-update__copy p');
    const time = latest.querySelector('time');
    const archive = latest.querySelector('.latest-update__meta span');
    if (title) title.textContent = '新增 Web Storage Lab';
    if (description) description.textContent = '新增可交互的 Local Storage / Session Storage 实测面板，可写入、验证和清除本站专用测试值，并直接观察两种存储作用域的差异。';
    if (time) { time.dateTime = '2026-08-12T19:03:04+08:00'; time.textContent = '2026-08-12 19:03 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260812-190304.html';
  }
})();