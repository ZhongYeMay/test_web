(() => {
  'use strict';

  const mount = () => {
    let panel = document.getElementById('assetHealth');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'asset-health';
      panel.id = 'assetHealth';
      panel.setAttribute('aria-labelledby', 'assetHealthTitle');
      panel.innerHTML = '<div class="asset-health__head"><div><span class="asset-health__kicker">// DEPLOYMENT RESOURCE CHECK</span><h2 id="assetHealthTitle">ASSET HEALTH CHECK</h2></div><p class="asset-health__hint">检查当前页面实际引用的同源 CSS、JavaScript 与图片资源，快速发现 GitHub Pages 部署后出现的 404、加载失败或异常慢资源。重新检查只发送轻量 HEAD 请求，不上传页面数据。</p></div><div class="asset-health__stats"><div class="asset-health__stat"><span>LOCAL ASSETS</span><strong id="assetHealthTotal">0</strong></div><div class="asset-health__stat"><span>RESPONDING</span><strong id="assetHealthOk">0</strong></div><div class="asset-health__stat"><span>FAILED</span><strong id="assetHealthFailed">0</strong></div><div class="asset-health__stat"><span>PAGE TRANSFER</span><strong id="assetHealthTransfer">—</strong></div></div><ul class="asset-health__list" id="assetHealthList" aria-label="本地资源检查结果"></ul><div class="asset-health__footer"><span class="asset-health__status" id="assetHealthStatus" role="status" aria-live="polite">Waiting for page assets…</span><button type="button" class="asset-health__refresh" id="assetHealthRefresh">RECHECK ASSETS</button></div>';
      const anchor = document.getElementById('testFlow');
      if (anchor) anchor.insertAdjacentElement('afterend', panel);
      else document.getElementById('mainContent')?.prepend(panel);
    }

    const nav = document.querySelector('.quick-nav');
    if (nav && !nav.querySelector('a[href="#assetHealth"]')) {
      const link = document.createElement('a');
      link.href = '#assetHealth';
      link.textContent = 'ASSETS';
      nav.querySelector('a[href="updates.html"]')?.insertAdjacentElement('beforebegin', link);
    }
    return panel;
  };

  const panel = mount();
  if (!panel) return;

  const totalEl = document.getElementById('assetHealthTotal');
  const okEl = document.getElementById('assetHealthOk');
  const failedEl = document.getElementById('assetHealthFailed');
  const transferEl = document.getElementById('assetHealthTransfer');
  const listEl = document.getElementById('assetHealthList');
  const statusEl = document.getElementById('assetHealthStatus');
  const refreshButton = document.getElementById('assetHealthRefresh');

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'cache / n/a';
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatMs = (ms) => Number.isFinite(ms) ? `${Math.max(0, Math.round(ms))} ms` : 'n/a';

  const typeFor = (element, url) => {
    if (element.tagName === 'LINK') return 'CSS';
    if (element.tagName === 'SCRIPT') return 'JS';
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith('.svg')) return 'SVG';
    if (/\.(png|jpe?g|webp|gif|avif)$/.test(path)) return 'IMG';
    return element.tagName;
  };

  const collectAssets = () => {
    const nodes = [
      ...document.querySelectorAll('link[rel="stylesheet"][href]'),
      ...document.querySelectorAll('script[src]'),
      ...document.querySelectorAll('img[src]')
    ];
    const seen = new Set();
    return nodes.flatMap((element) => {
      const raw = element.href || element.src;
      if (!raw) return [];
      const url = new URL(raw, location.href);
      if (url.origin !== location.origin || seen.has(url.href)) return [];
      seen.add(url.href);
      return [{ url: url.href, type: typeFor(element, url.href) }];
    });
  };

  const timingFor = (url) => {
    if (!performance?.getEntriesByName) return null;
    const entries = performance.getEntriesByName(url, 'resource');
    return entries.length ? entries[entries.length - 1] : null;
  };

  const probe = async (asset) => {
    let responseStatus = null;
    let ok = true;
    try {
      const response = await fetch(asset.url, { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' });
      responseStatus = response.status;
      ok = response.ok;
    } catch {
      ok = false;
    }
    const timing = timingFor(asset.url);
    return {
      ...asset,
      ok,
      status: responseStatus,
      duration: timing?.duration ?? NaN,
      transferSize: timing?.transferSize ?? 0
    };
  };

  const runPool = async (items, concurrency = 5) => {
    const results = new Array(items.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await probe(items[index]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
  };

  const render = (results) => {
    const failed = results.filter((item) => !item.ok);
    const transfer = results.reduce((sum, item) => sum + (Number.isFinite(item.transferSize) ? item.transferSize : 0), 0);
    totalEl.textContent = String(results.length);
    okEl.textContent = String(results.length - failed.length);
    failedEl.textContent = String(failed.length);
    transferEl.textContent = formatBytes(transfer);

    const sorted = [...results].sort((a, b) => Number(a.ok) - Number(b.ok) || (b.duration || 0) - (a.duration || 0));
    listEl.replaceChildren(...sorted.slice(0, 14).map((item) => {
      const row = document.createElement('li');
      row.className = `asset-health__row ${item.ok ? 'is-ok' : 'is-failed'}`;
      const name = decodeURIComponent(new URL(item.url).pathname.split('/').pop() || '/');
      row.innerHTML = `<span class="asset-health__type">${item.type}</span><strong title="${item.url}">${name}</strong><span>${item.ok ? (item.status || 'OK') : (item.status || 'ERROR')}</span><span>${formatMs(item.duration)}</span><span>${formatBytes(item.transferSize)}</span>`;
      return row;
    }));

    panel.dataset.health = failed.length ? 'attention' : 'ready';
    statusEl.textContent = failed.length
      ? `${failed.length} local asset${failed.length === 1 ? '' : 's'} need attention.`
      : `All ${results.length} local page assets responded successfully.`;
  };

  const scan = async () => {
    const assets = collectAssets();
    panel.setAttribute('aria-busy', 'true');
    refreshButton.disabled = true;
    statusEl.textContent = `Checking ${assets.length} same-origin assets…`;
    try {
      render(await runPool(assets));
    } finally {
      panel.setAttribute('aria-busy', 'false');
      refreshButton.disabled = false;
    }
  };

  refreshButton.addEventListener('click', scan);
  if (document.readyState === 'complete') scan();
  else window.addEventListener('load', scan, { once: true });
})();
