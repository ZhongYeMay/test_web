(() => {
  const STORAGE_KEY = 'test_web_pinned_tools_v1';
  const DEFAULTS = ['diagnostics', 'webVitals', 'visitorMap'];
  const tools = [
    ['testFlow', 'TEST FLOW', 'Quick-start checklist'],
    ['session', 'SESSION', 'Core-check progress'],
    ['textScale', 'TEXT SCALE', '200% reflow test'],
    ['capabilities', 'CAPABILITIES', 'Browser feature matrix'],
    ['contrastChecker', 'CONTRAST', 'Color contrast checker'],
    ['accessibility', 'ACCESSIBILITY', 'User preference signals'],
    ['performance', 'PERFORMANCE', 'Navigation timing'],
    ['webVitals', 'WEB VITALS', 'LCP · INP · CLS'],
    ['report', 'REPORT', 'Portable diagnostics'],
    ['diagnostics', 'DIAGNOSTICS', 'Run browser checks'],
    ['metrics', 'METRICS', 'Live page metrics'],
    ['visitorMap', 'VISITOR MAP', 'Visitor distribution']
  ];

  const safeRead = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(parsed)) return parsed.filter((id) => tools.some(([toolId]) => toolId === id));
    } catch (_) {}
    return [...DEFAULTS];
  };

  let pinned = safeRead();
  let storageAvailable = true;
  try {
    localStorage.setItem(`${STORAGE_KEY}_probe`, '1');
    localStorage.removeItem(`${STORAGE_KEY}_probe`);
  } catch (_) {
    storageAvailable = false;
  }

  const main = document.getElementById('mainContent');
  const anchor = document.getElementById('testFlow');
  if (!main || !anchor) return;

  const section = document.createElement('section');
  section.className = 'pinned-tools';
  section.id = 'pinnedTools';
  section.setAttribute('aria-labelledby', 'pinnedToolsTitle');
  section.innerHTML = `
    <div class="pinned-tools__head">
      <div>
        <span class="pinned-tools__kicker">// PERSONAL QUICK ACCESS</span>
        <h2 id="pinnedToolsTitle">PINNED TOOLS</h2>
        <p class="pinned-tools__hint">把常用测试固定在这里，减少在长页面里反复查找。固定项目只保存在当前浏览器。</p>
      </div>
      <button type="button" class="pinned-tools__customize" id="pinnedToolsCustomize" aria-expanded="false" aria-controls="pinnedToolsEditor">CUSTOMIZE</button>
    </div>
    <div class="pinned-tools__list" id="pinnedToolsList" aria-label="已固定的测试工具"></div>
    <div class="pinned-tools__editor" id="pinnedToolsEditor" hidden>
      <div class="pinned-tools__options" id="pinnedToolsOptions" aria-label="选择要固定的测试工具"></div>
      <div class="pinned-tools__editor-foot">
        <span class="pinned-tools__status" id="pinnedToolsStatus" role="status" aria-live="polite"></span>
        <button type="button" class="pinned-tools__reset" id="pinnedToolsReset">RESET DEFAULTS</button>
      </div>
    </div>`;
  main.insertBefore(section, anchor);

  const nav = document.querySelector('.quick-nav');
  if (nav && !nav.querySelector('a[href="#pinnedTools"]')) {
    const flowLink = nav.querySelector('a[href="#testFlow"]');
    const link = document.createElement('a');
    link.href = '#pinnedTools';
    link.textContent = 'PINNED';
    if (flowLink) flowLink.insertAdjacentElement('afterend', link);
    else nav.appendChild(link);
  }

  const list = document.getElementById('pinnedToolsList');
  const options = document.getElementById('pinnedToolsOptions');
  const status = document.getElementById('pinnedToolsStatus');
  const editor = document.getElementById('pinnedToolsEditor');
  const customize = document.getElementById('pinnedToolsCustomize');
  const reset = document.getElementById('pinnedToolsReset');

  const availableTools = () => tools.filter(([id]) => document.getElementById(id));
  const save = () => {
    if (!storageAvailable) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned)); } catch (_) { storageAvailable = false; }
  };

  const render = () => {
    const available = availableTools();
    pinned = pinned.filter((id) => available.some(([toolId]) => toolId === id));
    list.replaceChildren();
    options.replaceChildren();

    const selected = available.filter(([id]) => pinned.includes(id));
    if (!selected.length) {
      const empty = document.createElement('p');
      empty.className = 'pinned-tools__empty';
      empty.textContent = 'No tools pinned yet · choose CUSTOMIZE to add quick links.';
      list.appendChild(empty);
    } else {
      selected.forEach(([id, label, note]) => {
        const link = document.createElement('a');
        link.className = 'pinned-tool';
        link.href = `#${id}`;
        link.innerHTML = `<strong>${label}</strong><span>${note}</span>`;
        list.appendChild(link);
      });
    }

    available.forEach(([id, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pinned-tools__option';
      button.dataset.pinTool = id;
      button.setAttribute('aria-pressed', String(pinned.includes(id)));
      button.textContent = label;
      button.addEventListener('click', () => {
        if (pinned.includes(id)) pinned = pinned.filter((item) => item !== id);
        else pinned = [...pinned, id];
        save();
        render();
        status.textContent = `${pinned.length} tool${pinned.length === 1 ? '' : 's'} pinned${storageAvailable ? ' · saved locally' : ' · session only'}.`;
      });
      options.appendChild(button);
    });

    status.textContent = `${pinned.length} tool${pinned.length === 1 ? '' : 's'} pinned${storageAvailable ? ' · saved locally' : ' · storage unavailable'}.`;
  };

  customize.addEventListener('click', () => {
    const opening = editor.hidden;
    editor.hidden = !opening;
    customize.setAttribute('aria-expanded', String(opening));
    customize.textContent = opening ? 'DONE' : 'CUSTOMIZE';
    if (opening) options.querySelector('button')?.focus();
  });

  reset.addEventListener('click', () => {
    pinned = DEFAULTS.filter((id) => document.getElementById(id));
    save();
    render();
    status.textContent = 'Default pins restored.';
  });

  render();
  window.setTimeout(render, 1200);
})();