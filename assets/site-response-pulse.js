(() => {
  const init = () => {
    const main = document.getElementById('mainContent');
    if (!main || document.getElementById('sitePulse')) return;

    if (!document.querySelector('link[href="assets/site-response-pulse.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/site-response-pulse.css';
      document.head.appendChild(link);
    }

    const panel = document.createElement('section');
    panel.className = 'site-pulse';
    panel.id = 'sitePulse';
    panel.dataset.state = 'idle';
    panel.setAttribute('aria-labelledby', 'sitePulseTitle');
    panel.innerHTML = `
      <div class="site-pulse__head">
        <div><span class="site-pulse__kicker">// SAME-ORIGIN AVAILABILITY CHECK</span><h2 id="sitePulseTitle">SITE RESPONSE PULSE</h2></div>
        <p class="site-pulse__hint">向本站当前页面发送一个不使用 HTTP 缓存的轻量 HEAD 请求，直观看到 GitHub Pages 是否能返回响应，以及这一次往返耗时。结果只反映当前浏览器到本站的这一刻连接，不代表长期 uptime。</p>
      </div>
      <div class="site-pulse__grid">
        <article class="site-pulse__metric"><span>HTTP STATUS</span><strong id="sitePulseHttp">READY</strong></article>
        <article class="site-pulse__metric"><span>ROUND TRIP</span><strong id="sitePulseLatency">-- ms</strong></article>
        <article class="site-pulse__metric"><span>LAST CHECK</span><strong id="sitePulseTime">NOT RUN</strong></article>
        <article class="site-pulse__metric"><span>SAMPLES</span><strong id="sitePulseCount">0 / 6</strong></article>
      </div>
      <div class="site-pulse__samples" id="sitePulseSamples" aria-label="最近六次响应耗时可视化"></div>
      <div class="site-pulse__footer"><span class="site-pulse__status" id="sitePulseStatus" role="status" aria-live="polite">Ready for a live same-origin response check.</span><button type="button" class="site-pulse__run" id="sitePulseRun">CHECK NOW</button></div>`;

    const anchor = document.getElementById('performance') || document.getElementById('report');
    if (anchor) anchor.insertAdjacentElement('beforebegin', panel);
    else main.appendChild(panel);

    const nav = document.querySelector('.quick-nav');
    if (nav && !nav.querySelector('a[href="#sitePulse"]')) {
      const link = document.createElement('a');
      link.href = '#sitePulse';
      link.textContent = 'SITE PULSE';
      const before = nav.querySelector('a[href="#performance"]');
      before ? nav.insertBefore(link, before) : nav.appendChild(link);
    }

    const http = document.getElementById('sitePulseHttp');
    const latency = document.getElementById('sitePulseLatency');
    const time = document.getElementById('sitePulseTime');
    const count = document.getElementById('sitePulseCount');
    const samplesEl = document.getElementById('sitePulseSamples');
    const status = document.getElementById('sitePulseStatus');
    const button = document.getElementById('sitePulseRun');
    const samples = [];

    const renderSamples = () => {
      samplesEl.replaceChildren();
      const max = Math.max(500, ...samples.map(s => s.ms));
      samples.forEach(sample => {
        const bar = document.createElement('i');
        bar.className = 'site-pulse__bar';
        bar.style.height = `${Math.max(10, Math.min(100, (sample.ms / max) * 100))}%`;
        bar.title = `${sample.ms} ms · HTTP ${sample.code}`;
        samplesEl.appendChild(bar);
      });
      count.textContent = `${samples.length} / 6`;
    };

    const run = async () => {
      button.disabled = true;
      button.textContent = 'CHECKING…';
      panel.dataset.state = 'idle';
      http.textContent = 'CHECKING';
      latency.textContent = '-- ms';
      status.textContent = 'Sending a no-cache HEAD request to this GitHub Pages URL…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const started = performance.now();
      try {
        const target = new URL(location.href);
        target.hash = '';
        target.searchParams.set('_pulse', Date.now().toString());
        const response = await fetch(target, {
          method: 'HEAD',
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal
        });
        const ms = Math.max(0, Math.round(performance.now() - started));
        samples.push({ ms, code: response.status });
        if (samples.length > 6) samples.shift();
        http.textContent = `${response.status} ${response.ok ? 'OK' : 'RESPONSE'}`;
        latency.textContent = `${ms} ms`;
        panel.dataset.state = response.ok ? 'ok' : 'error';
        status.textContent = response.ok
          ? `GitHub Pages responded successfully in about ${ms} ms from this browser.`
          : `The server responded, but HTTP ${response.status} was not a successful status.`;
      } catch (error) {
        const ms = Math.max(0, Math.round(performance.now() - started));
        http.textContent = error?.name === 'AbortError' ? 'TIMEOUT' : 'FAILED';
        latency.textContent = `${ms} ms`;
        panel.dataset.state = 'error';
        status.textContent = error?.name === 'AbortError'
          ? 'No response completed within 6 seconds.'
          : 'The live request failed in this browser. Network, privacy software, or connectivity may be involved.';
      } finally {
        clearTimeout(timeout);
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        renderSamples();
        button.disabled = false;
        button.textContent = 'CHECK AGAIN';
      }
    };

    button.addEventListener('click', run);
    renderSamples();
    run();

    const latestLabel = document.querySelector('.latest-update__label');
    const latestTitle = document.getElementById('latestUpdateTitle');
    const latestText = latestTitle?.nextElementSibling;
    const latestTime = document.querySelector('.latest-update__meta time');
    const latestArchive = latestTime?.nextElementSibling;
    if (latestLabel && latestTitle && latestText && latestTime && latestArchive) {
      latestLabel.textContent = 'LATEST CHANGE · UPDATE #048';
      latestTitle.textContent = '新增 Site Response Pulse';
      latestText.textContent = '新增本站实时响应检查器：通过同源 no-store HEAD 请求显示 HTTP 状态、往返耗时、最近检查时间和最近六次样本，帮助快速确认 GitHub Pages 当前是否真正可达。';
      latestTime.dateTime = '2026-08-12T13:00:24+08:00';
      latestTime.textContent = '2026-08-12 13:00 UTC+8';
      latestArchive.textContent = 'Archive · test+20260812-130024.html';
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();