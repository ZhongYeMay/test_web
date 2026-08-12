(() => {
  'use strict';

  const STORAGE_KEY = 'test_web_perf_baseline_v1';

  function installPanel() {
    if (document.getElementById('performanceBaseline')) return document.getElementById('performanceBaseline');
    const performancePanel = document.getElementById('performance');
    if (!performancePanel) return null;
    const section = document.createElement('section');
    section.className = 'performance-baseline';
    section.id = 'performanceBaseline';
    section.setAttribute('aria-labelledby', 'performanceBaselineTitle');
    section.innerHTML = `<div class="performance-baseline__head"><div><span class="performance-baseline__kicker">// BEFORE / AFTER PERFORMANCE</span><h2 id="performanceBaselineTitle">PERFORMANCE BASELINE COMPARE</h2></div><p class="performance-baseline__hint">把当前访问保存为浏览器本地基线。重新加载页面或稍后再次测试后，可直接比较 DOM Ready、Full Load、传输量与资源请求数量的变化。</p></div><div class="performance-baseline__meta"><span>SAVED BASELINE</span><strong id="baselineSavedAt">NO BASELINE SAVED</strong></div><div class="performance-baseline__table"><div class="performance-baseline__row performance-baseline__row--labels" aria-hidden="true"><span>METRIC</span><span>BASELINE</span><span>CURRENT</span><span>DELTA</span></div>${[['dom','DOM READY'],['load','FULL LOAD'],['transfer','TRANSFERRED'],['resources','RESOURCES']].map(([key,label])=>`<div class="performance-baseline__row" data-baseline-row="${key}"><strong>${label}</strong><span class="performance-baseline__value" data-value="baseline">—</span><span class="performance-baseline__value" data-value="current">—</span><span class="performance-baseline__delta" data-value="delta" data-state="neutral">WAITING</span></div>`).join('')}</div><div class="performance-baseline__footer"><span class="performance-baseline__status" id="baselineStatus" role="status" aria-live="polite">Preparing local performance comparison…</span><div class="performance-baseline__actions"><button type="button" id="compareBaseline">COMPARE NOW</button><button type="button" id="clearBaseline">CLEAR BASELINE</button><button type="button" class="performance-baseline__primary" id="saveBaseline">SAVE BASELINE</button></div></div>`;
    performancePanel.insertAdjacentElement('afterend', section);
    return section;
  }

  function updateLatestCard() {
    const label = document.querySelector('.latest-update__label');
    const title = document.getElementById('latestUpdateTitle');
    const copy = title?.nextElementSibling;
    const meta = document.querySelector('.latest-update__meta');
    if (label) label.textContent = 'LATEST CHANGE · UPDATE #059';
    if (title) title.textContent = '新增 Performance Baseline 性能前后对比';
    if (copy) copy.textContent = '保存一次当前页面性能作为浏览器本地基线，之后重新加载或再次测试即可直观看到 DOM Ready、Full Load、传输量和资源请求的变化。';
    if (meta) meta.innerHTML = '<time datetime="2026-08-13T00:03:18+08:00">2026-08-13 00:03 UTC+8</time><span>Archive · test+20260813-000318.html</span><a href="updates.html">VIEW FULL HISTORY →</a>';
  }

  const panel = installPanel();
  updateLatestCard();
  if (!panel || !window.performance) return;

  const status = document.getElementById('baselineStatus');
  const savedAt = document.getElementById('baselineSavedAt');
  const rows = {
    dom: document.querySelector('[data-baseline-row="dom"]'),
    load: document.querySelector('[data-baseline-row="load"]'),
    transfer: document.querySelector('[data-baseline-row="transfer"]'),
    resources: document.querySelector('[data-baseline-row="resources"]')
  };

  const safeStorage = {
    get() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    },
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  };

  function snapshot() {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    if (!nav) return null;
    const resourceBytes = resources.reduce((sum, entry) => sum + (Number(entry.transferSize) || 0), 0);
    return {
      savedAt: Date.now(),
      dom: Math.max(0, Math.round(nav.domContentLoadedEventEnd || 0)),
      load: Math.max(0, Math.round(nav.loadEventEnd || performance.now())),
      transfer: Math.max(0, Math.round((Number(nav.transferSize) || 0) + resourceBytes)),
      resources: resources.length
    };
  }

  function format(key, value) {
    if (!Number.isFinite(value)) return '—';
    if (key === 'transfer') {
      if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB`;
      return `${Math.round(value / 1024)} KB`;
    }
    if (key === 'resources') return String(value);
    return `${Math.round(value)} ms`;
  }

  function formatDelta(key, current, baseline) {
    const delta = current - baseline;
    if (!Number.isFinite(delta)) return { text: '—', state: 'neutral' };
    if (delta === 0) return { text: 'NO CHANGE', state: 'neutral' };
    const abs = Math.abs(delta);
    const unit = key === 'transfer' ? (abs >= 1024 * 1024 ? `${(abs / 1024 / 1024).toFixed(2)} MB` : `${Math.round(abs / 1024)} KB`) : key === 'resources' ? String(abs) : `${Math.round(abs)} ms`;
    return { text: `${delta > 0 ? '+' : '−'}${unit}`, state: delta < 0 ? 'better' : 'worse' };
  }

  function render(baseline, current) {
    const hasBaseline = baseline && ['dom', 'load', 'transfer', 'resources'].every((key) => Number.isFinite(baseline[key]));
    savedAt.textContent = hasBaseline ? new Date(baseline.savedAt).toLocaleString() : 'NO BASELINE SAVED';

    Object.entries(rows).forEach(([key, row]) => {
      if (!row) return;
      const baseEl = row.querySelector('[data-value="baseline"]');
      const currentEl = row.querySelector('[data-value="current"]');
      const deltaEl = row.querySelector('[data-value="delta"]');
      baseEl.textContent = hasBaseline ? format(key, baseline[key]) : '—';
      currentEl.textContent = current ? format(key, current[key]) : '—';
      deltaEl.className = 'performance-baseline__delta';
      if (hasBaseline && current) {
        const delta = formatDelta(key, current[key], baseline[key]);
        deltaEl.textContent = delta.text;
        deltaEl.dataset.state = delta.state;
      } else {
        deltaEl.textContent = 'WAITING';
        deltaEl.dataset.state = 'neutral';
      }
    });

    if (!hasBaseline) {
      status.textContent = 'Save this visit as a baseline, then reload or test again to compare.';
    } else if (current) {
      status.textContent = 'Current navigation has been compared with your saved browser-local baseline.';
    }
  }

  function compare() {
    const current = snapshot();
    render(safeStorage.get(), current);
  }

  document.getElementById('saveBaseline')?.addEventListener('click', () => {
    const current = snapshot();
    if (!current) {
      status.textContent = 'Navigation Timing is not available in this browser.';
      return;
    }
    if (safeStorage.set(current)) {
      render(current, current);
      status.textContent = 'Baseline saved locally. Reload the page or run another visit, then compare again.';
    } else {
      status.textContent = 'Baseline could not be saved because browser storage is unavailable.';
    }
  });

  document.getElementById('compareBaseline')?.addEventListener('click', compare);
  document.getElementById('clearBaseline')?.addEventListener('click', () => {
    safeStorage.clear();
    render(null, snapshot());
    status.textContent = 'Saved performance baseline cleared.';
  });

  window.addEventListener('load', () => window.setTimeout(compare, 350), { once: true });
  render(safeStorage.get(), snapshot());
})();
