(() => {
  'use strict';

  const button = document.getElementById('printSnapshot');
  if (!button || typeof window.print !== 'function') return;

  const status = document.getElementById('reportStatus');
  const report = document.getElementById('report');
  if (!report) return;

  const header = document.createElement('div');
  header.className = 'print-snapshot-header';
  header.setAttribute('aria-hidden', 'true');
  report.before(header);

  const stamp = () => {
    const when = new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date());
    header.innerHTML = `<strong>TEST LAB · DIAGNOSTIC SNAPSHOT</strong><span>Generated ${when} · ${location.href}</span>`;
  };

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  button.addEventListener('click', () => {
    const refresh = document.getElementById('refreshReport');
    if (refresh) refresh.click();
    stamp();
    announce('Print snapshot prepared. Use the browser dialog to print or save as PDF.');
    window.print();
  });

  window.addEventListener('beforeprint', () => {
    stamp();
    document.documentElement.dataset.printSnapshot = 'active';
  });

  window.addEventListener('afterprint', () => {
    delete document.documentElement.dataset.printSnapshot;
    announce('Print snapshot closed. The live diagnostic report is still available here.');
  });
})();
