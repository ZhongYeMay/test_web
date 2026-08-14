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
