(() => {
  const STORAGE_KEY = 'test_web_session_notes_v1';
  if (document.getElementById('sessionNotes')) return;

  if (!document.querySelector('link[data-session-notes-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/session-notes.css';
    style.dataset.sessionNotesStyle = 'true';
    document.head.appendChild(style);
  }

  const panel = document.createElement('section');
  panel.className = 'session-notes';
  panel.id = 'sessionNotes';
  panel.setAttribute('aria-labelledby', 'sessionNotesTitle');
  panel.innerHTML = `
    <div class="session-notes__head">
      <div>
        <span class="session-notes__kicker">// LOCAL TEST SCRATCHPAD</span>
        <h2 id="sessionNotesTitle">TEST NOTES</h2>
      </div>
      <span class="session-notes__privacy">LOCAL ONLY</span>
    </div>
    <p class="session-notes__intro">边测试边记录异常、设备差异或复现步骤。内容只保存在当前浏览器的 localStorage，不会上传；请不要在这里填写密码、令牌或其他敏感信息。</p>
    <label class="session-notes__label" for="sessionNotesInput">SESSION SCRATCHPAD</label>
    <textarea id="sessionNotesInput" rows="7" spellcheck="true" placeholder="例如：375px 宽度下布局正常；地图加载约 1.2s；Safari 需要再次复测……"></textarea>
    <div class="session-notes__meta">
      <span id="sessionNotesStats">0 chars · 0 lines</span>
      <span id="sessionNotesSaved" role="status" aria-live="polite">NOT SAVED YET</span>
    </div>
    <div class="session-notes__actions">
      <button type="button" id="sessionNotesExport">EXPORT TXT</button>
      <button type="button" id="sessionNotesClear">CLEAR NOTES</button>
    </div>`;

  const anchor = document.getElementById('focusModePanel') || document.getElementById('testFlow');
  if (anchor) anchor.insertAdjacentElement('afterend', panel);
  else document.querySelector('main')?.prepend(panel);

  const quickNav = document.querySelector('.quick-nav');
  if (quickNav && !quickNav.querySelector('a[href="#sessionNotes"]')) {
    const link = document.createElement('a');
    link.href = '#sessionNotes';
    link.textContent = 'NOTES';
    const updates = quickNav.querySelector('a[href="updates.html"]');
    if (updates) updates.insertAdjacentElement('beforebegin', link);
    else quickNav.appendChild(link);
  }

  const input = panel.querySelector('#sessionNotesInput');
  const stats = panel.querySelector('#sessionNotesStats');
  const saved = panel.querySelector('#sessionNotesSaved');
  const exportButton = panel.querySelector('#sessionNotesExport');
  const clearButton = panel.querySelector('#sessionNotesClear');
  let saveTimer = 0;

  const updateStats = () => {
    const text = input.value;
    const lines = text ? text.split(/\r?\n/).length : 0;
    stats.textContent = `${text.length} chars · ${lines} ${lines === 1 ? 'line' : 'lines'}`;
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, input.value);
      const now = new Date();
      saved.textContent = `SAVED · ${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
      panel.dataset.storage = 'available';
    } catch (_) {
      saved.textContent = 'LOCAL STORAGE UNAVAILABLE';
      panel.dataset.storage = 'unavailable';
    }
  };

  try {
    input.value = localStorage.getItem(STORAGE_KEY) || '';
    if (input.value) saved.textContent = 'RESTORED FROM THIS BROWSER';
  } catch (_) {
    saved.textContent = 'LOCAL STORAGE UNAVAILABLE';
    panel.dataset.storage = 'unavailable';
  }
  updateStats();

  input.addEventListener('input', () => {
    updateStats();
    saved.textContent = 'EDITING…';
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(save, 350);
  });

  exportButton.addEventListener('click', () => {
    const header = `TEST LAB SESSION NOTES\nExported: ${new Date().toISOString()}\nURL: ${location.href}\n\n`;
    const blob = new Blob([header, input.value || '(no notes)'], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-lab-notes-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    saved.textContent = 'TXT EXPORTED';
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    updateStats();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    saved.textContent = 'NOTES CLEARED';
    input.focus();
  });
})();
