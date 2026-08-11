(() => {
  const $ = (id) => document.getElementById(id);
  const text = (id, fallback = 'N/A') => {
    const el = $(id);
    const value = el?.textContent?.trim();
    return value || fallback;
  };

  const reportPreview = $('reportPreview');
  const reportStatus = $('reportStatus');
  const reportGenerated = $('reportGenerated');
  const copyButton = $('copyReport');
  const downloadButton = $('downloadReport');
  const refreshButton = $('refreshReport');

  if (!reportPreview || !reportStatus || !reportGenerated || !copyButton || !downloadButton || !refreshButton) return;

  function snapshot() {
    const now = new Date();
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A';
    const platform = navigator.userAgentData?.platform || navigator.platform || 'N/A';

    const data = {
      generatedAt: now.toISOString(),
      page: location.href,
      network: navigator.onLine ? 'ONLINE' : 'OFFLINE',
      viewport: `${innerWidth} × ${innerHeight} CSS px`,
      pixelRatio: Number.isFinite(devicePixelRatio) ? devicePixelRatio : 'N/A',
      language: navigator.language || 'N/A',
      timezone: tz,
      platform,
      logicalProcessors: navigator.hardwareConcurrency || 'N/A',
      approximateMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GiB` : 'N/A',
      maxTouchPoints: Number.isFinite(navigator.maxTouchPoints) ? navigator.maxTouchPoints : 'N/A',
      domReady: text('perfDom'),
      fullLoad: text('perfLoad'),
      transferred: text('perfTransfer'),
      resources: text('perfResources'),
      navigationType: nav?.type || 'N/A',
      mapLocation: text('geoNow'),
      mappedVisits: text('mappedVisits', '0'),
      mappedCountries: text('mappedCountries', '0'),
      statsLoaded: text('statsLoaded', '0 / 232'),
      testRuns: text('runs', '0'),
      diagnostics: text('terminal', 'Diagnostics log unavailable')
    };

    return data;
  }

  function toReport(data) {
    return [
      'TEST_LAB DIAGNOSTIC REPORT',
      '==========================',
      `Generated: ${data.generatedAt}`,
      `Page: ${data.page}`,
      '',
      '[ENVIRONMENT]',
      `Network: ${data.network}`,
      `Viewport: ${data.viewport}`,
      `Device pixel ratio: ${data.pixelRatio}`,
      `Language: ${data.language}`,
      `Timezone: ${data.timezone}`,
      `Platform: ${data.platform}`,
      `Logical processors: ${data.logicalProcessors}`,
      `Approx. memory: ${data.approximateMemory}`,
      `Max touch points: ${data.maxTouchPoints}`,
      '',
      '[PERFORMANCE]',
      `DOM Ready: ${data.domReady}`,
      `Full Load: ${data.fullLoad}`,
      `Transferred: ${data.transferred}`,
      `Resources: ${data.resources}`,
      `Navigation type: ${data.navigationType}`,
      '',
      '[VISITOR MAP]',
      `Current coarse location status: ${data.mapLocation}`,
      `Mapped visits: ${data.mappedVisits}`,
      `Countries / regions: ${data.mappedCountries}`,
      `Stats loaded: ${data.statsLoaded}`,
      '',
      '[SESSION]',
      `Test runs: ${data.testRuns}`,
      '',
      '[DIAGNOSTICS LOG]',
      data.diagnostics,
      '',
      'Privacy note: This report is generated locally in your browser. It does not include a full IP address or raw geolocation coordinates.'
    ].join('\n');
  }

  function render() {
    const data = snapshot();
    reportGenerated.textContent = new Date(data.generatedAt).toLocaleString('zh-CN', { hour12: false });
    reportPreview.innerHTML = '';

    const items = [
      ['NETWORK', data.network],
      ['VIEWPORT', data.viewport],
      ['DOM READY', data.domReady],
      ['FULL LOAD', data.fullLoad],
      ['MAP STATUS', data.mapLocation],
      ['TEST RUNS', data.testRuns]
    ];

    for (const [label, value] of items) {
      const item = document.createElement('div');
      item.className = 'report-preview__item';
      const small = document.createElement('span');
      small.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = value;
      item.append(small, strong);
      reportPreview.appendChild(item);
    }

    return { data, report: toReport(data) };
  }

  async function copyReport() {
    const { report } = render();
    try {
      await navigator.clipboard.writeText(report);
      reportStatus.textContent = 'Diagnostic report copied to clipboard.';
    } catch {
      const area = document.createElement('textarea');
      area.value = report;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      reportStatus.textContent = ok ? 'Diagnostic report copied to clipboard.' : 'Copy failed. Download the report instead.';
    }
  }

  function downloadReport() {
    const { report } = render();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-lab-report-${stamp}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    reportStatus.textContent = 'Diagnostic report download started.';
  }

  refreshButton.addEventListener('click', () => {
    render();
    reportStatus.textContent = 'Report preview refreshed with current page data.';
  });
  copyButton.addEventListener('click', copyReport);
  downloadButton.addEventListener('click', downloadReport);
  addEventListener('online', render);
  addEventListener('offline', render);
  addEventListener('resize', render, { passive: true });
  addEventListener('load', render, { once: true });
  render();
})();