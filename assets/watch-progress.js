(() => {
  const STORAGE_KEY = 'nova-video-progress-v1';
  const MIN_SECONDS = 5;
  const COMPLETE_RATIO = 0.95;
  const gridEl = document.getElementById('videoGrid');
  const continueGrid = document.getElementById('continueGrid');
  const continueEmpty = document.getElementById('continueEmpty');
  const clearButton = document.getElementById('clearWatchProgress');
  if (!gridEl || !continueGrid || !continueEmpty || !clearButton || typeof openVideo !== 'function') return;

  let currentId = '';
  let lastSavedSecond = -1;

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function usable(entry) {
    return entry && Number.isFinite(entry.time) && Number.isFinite(entry.duration) && entry.duration > 0 && entry.time >= MIN_SECONDS && entry.time / entry.duration < COMPLETE_RATIO;
  }

  function progressFor(id) {
    const entry = readState()[id];
    return usable(entry) ? entry : null;
  }

  function itemById(id) {
    return Array.isArray(items) ? items.find(item => item.id === id) : null;
  }

  function renderContinue() {
    const state = readState();
    const entries = Object.entries(state)
      .filter(([, entry]) => usable(entry))
      .map(([id, entry]) => ({ id, entry, item: itemById(id) }))
      .filter(row => row.item && row.item.src)
      .sort((a, b) => (b.entry.updatedAt || 0) - (a.entry.updatedAt || 0))
      .slice(0, 6);

    continueGrid.innerHTML = '';
    continueEmpty.hidden = entries.length > 0;
    clearButton.hidden = entries.length === 0;

    entries.forEach(({ id, entry, item }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'continue-card';
      button.dataset.id = id;
      const percent = Math.min(100, Math.max(0, (entry.time / entry.duration) * 100));

      const art = document.createElement('span');
      art.className = 'continue-art';
      if (item.thumbnail) {
        const image = document.createElement('img');
        image.src = item.thumbnail;
        image.alt = '';
        image.loading = 'lazy';
        art.appendChild(image);
      } else {
        const icon = document.createElement('span');
        icon.className = 'continue-icon';
        icon.textContent = item.icon || '▶';
        art.appendChild(icon);
      }

      const progress = document.createElement('span');
      progress.className = 'continue-progress';
      progress.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('i');
      fill.style.width = `${percent}%`;
      progress.appendChild(fill);
      art.appendChild(progress);

      const copy = document.createElement('span');
      copy.className = 'continue-copy';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('small');
      meta.textContent = `${item.channel || 'NOVA Creator'} · ${formatTime(entry.time)} / ${formatTime(entry.duration)}`;
      copy.append(title, meta);
      button.append(art, copy);
      button.setAttribute('aria-label', `继续播放 ${item.title}，从 ${formatTime(entry.time)} 开始`);
      button.addEventListener('click', () => openVideo(id));
      continueGrid.appendChild(button);
    });
  }

  function refreshCardProgress() {
    const state = readState();
    gridEl.querySelectorAll('.card[data-id]').forEach(card => {
      const entry = state[card.dataset.id];
      let bar = card.querySelector('.watch-progress');
      if (!usable(entry)) {
        if (bar) bar.remove();
        return;
      }
      if (!bar) {
        bar = document.createElement('span');
        bar.className = 'watch-progress';
        bar.setAttribute('aria-hidden', 'true');
        bar.appendChild(document.createElement('i'));
        card.querySelector('.thumb')?.appendChild(bar);
      }
      const fill = bar.querySelector('i');
      if (fill) fill.style.width = `${Math.min(100, (entry.time / entry.duration) * 100)}%`;
    });
  }

  function refreshUI() {
    renderContinue();
    refreshCardProgress();
  }

  const originalOpenVideo = openVideo;
  openVideo = function(id) {
    currentId = id;
    lastSavedSecond = -1;
    originalOpenVideo(id);
  };

  player.addEventListener('loadedmetadata', () => {
    const entry = progressFor(currentId);
    if (!entry || !Number.isFinite(player.duration) || player.duration <= 0) return;
    const resumeAt = Math.min(entry.time, Math.max(0, player.duration - 1));
    if (resumeAt >= MIN_SECONDS) {
      player.currentTime = resumeAt;
      toastMsg(`从 ${formatTime(resumeAt)} 继续播放`);
    }
  });

  player.addEventListener('timeupdate', () => {
    if (!currentId || !Number.isFinite(player.duration) || player.duration <= 0) return;
    const second = Math.floor(player.currentTime);
    if (second < MIN_SECONDS || second === lastSavedSecond || second % 2 !== 0) return;
    lastSavedSecond = second;
    const state = readState();
    state[currentId] = { time: player.currentTime, duration: player.duration, updatedAt: Date.now() };
    writeState(state);
    refreshUI();
  });

  player.addEventListener('ended', () => {
    if (!currentId) return;
    const state = readState();
    delete state[currentId];
    writeState(state);
    refreshUI();
  });

  clearButton.addEventListener('click', () => {
    writeState({});
    refreshUI();
    toastMsg('已清除本浏览器的观看进度');
  });

  new MutationObserver(refreshUI).observe(gridEl, { childList: true });
  refreshUI();
})();

(() => {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-nav{display:none}
    @media(max-width:620px){
      .main{padding-bottom:calc(112px + env(safe-area-inset-bottom,0px))}
      .toast{bottom:calc(82px + env(safe-area-inset-bottom,0px))}
      .mobile-nav{position:fixed;z-index:70;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:6px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(24,24,27,.94);box-shadow:0 18px 44px rgba(0,0,0,.4);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .mobile-nav a{min-width:0;min-height:48px;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#b7b7c1;font-size:10px;font-weight:800;line-height:1.1;text-align:center;touch-action:manipulation}
      .mobile-nav a .mobile-nav-icon{font-size:18px;line-height:1}
      .mobile-nav a.active,.mobile-nav a[aria-current="location"]{background:var(--panel2);color:var(--text)}
      .light .mobile-nav{border-color:rgba(0,0,0,.1);background:rgba(255,255,255,.94);box-shadow:0 18px 44px rgba(0,0,0,.15)}
    }
  `;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.setAttribute('aria-label', '移动端主导航');
  nav.innerHTML = `
    <a href="#main" data-mobile-section="main" class="active" aria-current="location"><span class="mobile-nav-icon" aria-hidden="true">⌂</span><span>首页</span></a>
    <a href="#recommend" data-mobile-section="recommend"><span class="mobile-nav-icon" aria-hidden="true">▶</span><span>推荐</span></a>
    <a href="#continueWatching" data-mobile-section="continueWatching"><span class="mobile-nav-icon" aria-hidden="true">↻</span><span>继续</span></a>
    <a href="#shorts" data-mobile-section="shorts"><span class="mobile-nav-icon" aria-hidden="true">▥</span><span>Shorts</span></a>
    <a href="https://github.com/ZhongYeMay/novavideos" target="_blank" rel="noopener"><span class="mobile-nav-icon" aria-hidden="true">＋</span><span>视频源</span></a>
  `;
  document.body.appendChild(nav);

  const internalLinks = [...nav.querySelectorAll('[data-mobile-section]')];
  const sectionIds = ['main', 'continueWatching', 'recommend', 'shorts'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  function setActive(id) {
    internalLinks.forEach(link => {
      const active = link.dataset.mobileSection === id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  internalLinks.forEach(link => link.addEventListener('click', event => {
    const target = document.getElementById(link.dataset.mobileSection);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    setActive(link.dataset.mobileSection);
  }));

  let ticking = false;
  function updateActiveFromScroll() {
    ticking = false;
    const marker = window.scrollY + Math.min(window.innerHeight * 0.32, 220);
    let current = 'main';
    sections.forEach(section => {
      if (section.offsetTop <= marker) current = section.id;
    });
    setActive(current);
  }
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActiveFromScroll);
  }, { passive: true });
  addEventListener('resize', updateActiveFromScroll);
  updateActiveFromScroll();
})();

(() => {
  const form = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const recommend = document.getElementById('recommend');
  if (!form || !searchInput || !recommend || typeof apply !== 'function') return;

  form.classList.add('search-combobox');
  searchInput.setAttribute('role', 'combobox');
  searchInput.setAttribute('aria-autocomplete', 'list');
  searchInput.setAttribute('aria-controls', 'searchSuggestions');
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.setAttribute('autocomplete', 'off');

  const list = document.createElement('div');
  list.id = 'searchSuggestions';
  list.className = 'search-suggestions';
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  const live = document.createElement('span');
  live.className = 'search-sr';
  live.setAttribute('aria-live', 'polite');
  form.append(list, live);

  const style = document.createElement('style');
  style.textContent = `
    .search-combobox{position:relative}
    .search-suggestions{position:absolute;z-index:95;top:calc(100% + 8px);left:0;right:0;max-height:min(420px,60vh);overflow:auto;padding:7px;border:1px solid var(--line);border-radius:16px;background:rgba(24,24,27,.98);box-shadow:0 22px 60px rgba(0,0,0,.42);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
    .search-suggestions[hidden]{display:none}.search-option{width:100%;min-height:48px;border:0;border-radius:11px;padding:9px 11px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;background:transparent;color:var(--text);text-align:left;cursor:pointer}.search-option:hover,.search-option.active,.search-option[aria-selected="true"]{background:var(--panel2)}
    .search-option-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:rgba(124,140,255,.12);font-size:15px}.search-option-copy{min-width:0;display:grid;gap:2px}.search-option-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.search-option-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:11px}.search-option-kind{padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--muted);font-size:10px;font-weight:900}.search-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .light .search-suggestions{background:rgba(255,255,255,.98);box-shadow:0 22px 50px rgba(0,0,0,.16)}
    @media(max-width:620px){.search-suggestions{position:fixed;top:66px;left:10px;right:10px;max-height:55dvh}.search-option{min-height:52px}}
    @media(prefers-reduced-transparency:reduce){.search-suggestions{backdrop-filter:none;-webkit-backdrop-filter:none}}
  `;
  document.head.appendChild(style);

  let suggestions = [];
  let activeIndex = -1;

  function currentItems() {
    return Array.isArray(items) ? items.filter(Boolean) : [];
  }

  function buildSuggestions(query) {
    const q = query.trim().toLowerCase();
    const rows = [];
    const seen = new Set();
    const source = currentItems();

    function add(label, kind, meta, icon, score) {
      const key = `${kind}:${label.toLowerCase()}`;
      if (!label || seen.has(key)) return;
      seen.add(key);
      rows.push({ label, kind, meta, icon, score });
    }

    source.forEach((item, index) => {
      const title = String(item.title || '');
      const channel = String(item.channel || '');
      const category = String(item.category || '');
      const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const haystack = [title, channel, category, ...tags].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return;
      const lowerTitle = title.toLowerCase();
      const score = q ? (lowerTitle.startsWith(q) ? 0 : lowerTitle.includes(q) ? 1 : 2) : index + 3;
      add(title, item.remote ? '视频' : 'DEMO', [channel, category].filter(Boolean).join(' · '), item.remote ? '▶' : '◇', score);
      if (category && (!q || category.toLowerCase().includes(q))) add(category, '分类', `${source.filter(v => v.category === category).length} 个视频`, '▦', score + 0.5);
      tags.forEach(tag => {
        if (!q || tag.toLowerCase().includes(q)) add(tag, '标签', '按标签筛选', '#', score + 1);
      });
    });

    return rows.sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, 'zh-CN')).slice(0, 7);
  }

  function closeSuggestions() {
    list.hidden = true;
    activeIndex = -1;
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.removeAttribute('aria-activedescendant');
  }

  function setActive(index) {
    const options = [...list.querySelectorAll('.search-option')];
    if (!options.length) return;
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, i) => {
      const active = i === activeIndex;
      option.classList.toggle('active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const selected = options[activeIndex];
    searchInput.setAttribute('aria-activedescendant', selected.id);
    selected.scrollIntoView({ block: 'nearest' });
  }

  function choose(row) {
    searchInput.value = row.label;
    closeSuggestions();
    apply();
    recommend.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function renderSuggestions() {
    suggestions = buildSuggestions(searchInput.value);
    activeIndex = -1;
    list.innerHTML = '';
    if (!suggestions.length) {
      closeSuggestions();
      live.textContent = searchInput.value.trim() ? '没有搜索建议' : '';
      return;
    }

    suggestions.forEach((row, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = `searchSuggestion${index}`;
      option.className = 'search-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');

      const icon = document.createElement('span');
      icon.className = 'search-option-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = row.icon;

      const copy = document.createElement('span');
      copy.className = 'search-option-copy';
      const strong = document.createElement('strong');
      strong.textContent = row.label;
      const small = document.createElement('small');
      small.textContent = row.meta || (demoMode ? '演示建议' : 'NOVA VIDEOS');
      copy.append(strong, small);

      const kind = document.createElement('span');
      kind.className = 'search-option-kind';
      kind.textContent = row.kind;
      option.append(icon, copy, kind);
      option.addEventListener('mousedown', event => event.preventDefault());
      option.addEventListener('click', () => choose(row));
      list.appendChild(option);
    });

    list.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    live.textContent = `${suggestions.length} 条搜索建议`;
  }

  searchInput.addEventListener('focus', renderSuggestions);
  searchInput.addEventListener('input', renderSuggestions);
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      if (list.hidden) renderSuggestions();
      if (!list.hidden) { event.preventDefault(); setActive(activeIndex + 1); }
    } else if (event.key === 'ArrowUp' && !list.hidden) {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === 'Enter' && !list.hidden && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault();
      closeSuggestions();
    }
  });

  form.addEventListener('submit', closeSuggestions);
  document.addEventListener('pointerdown', event => {
    if (!form.contains(event.target)) closeSuggestions();
  });

  new MutationObserver(() => {
    if (document.activeElement === searchInput) renderSuggestions();
  }).observe(document.getElementById('videoGrid'), { childList: true });
})();
