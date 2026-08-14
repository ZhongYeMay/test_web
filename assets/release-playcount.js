(() => {
  const MANIFEST_URL = 'https://raw.githubusercontent.com/ZhongYeMay/novavideos/main/videos.json';
  const PLAY_KEY = 'nova-video-local-plays-v1';
  const DURATION_KEY = 'nova-video-runtime-duration-v1';
  const playerEl = document.getElementById('player');
  const playerMeta = document.querySelector('.playermeta');
  const sourcePanel = document.getElementById('sourcePanel');
  if (!playerEl || !playerMeta || typeof openVideo !== 'function') return;

  let metadata = new Map();
  let currentId = '';
  let countedThisOpen = false;

  const readObject = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  };
  const writeObject = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const itemById = id => Array.isArray(items) ? items.find(item => item && item.id === id) : null;

  const playBadge = document.createElement('div');
  playBadge.className = 'local-play-count';
  playBadge.setAttribute('aria-live', 'polite');
  playerMeta.appendChild(playBadge);

  const description = document.createElement('div');
  description.className = 'release-description';
  description.hidden = true;
  playerMeta.appendChild(description);

  function readCounts() { return readObject(PLAY_KEY); }
  function countFor(id) { return Math.max(0, Number(readCounts()[id]) || 0); }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  function refreshPlayBadge(id) {
    playBadge.textContent = `▶ 本机播放 ${countFor(id)} 次`;
  }

  function refreshDescription(id) {
    const row = metadata.get(String(id));
    const text = String(row?.description || '').trim();
    description.hidden = !text;
    description.textContent = text ? `简介 · ${text}` : '';
  }

  function refreshCardCounts() {
    document.querySelectorAll('.card[data-id]').forEach(card => {
      const id = card.dataset.id;
      const item = itemById(id);
      if (!item?.remote) return;
      const info = card.querySelector('.info');
      if (!info) return;
      let label = info.querySelector('.card-local-plays');
      if (!label) {
        label = document.createElement('small');
        label.className = 'card-local-plays';
        info.appendChild(label);
      }
      label.textContent = `本机播放 ${countFor(id)} 次`;
    });
  }

  function applyRuntimeDuration(id, seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const item = itemById(id);
    const row = metadata.get(String(id));
    const releaseDuration = String(row?.duration || '').trim();
    if (releaseDuration && releaseDuration !== '--:--') return;
    const formatted = formatDuration(seconds);
    const stored = readObject(DURATION_KEY);
    stored[id] = formatted;
    writeObject(DURATION_KEY, stored);
    if (item) item.duration = formatted;
    document.querySelectorAll(`.card[data-id="${CSS.escape(String(id))}"] .dur`).forEach(node => { node.textContent = formatted; });
  }

  function applyStoredDurations() {
    const stored = readObject(DURATION_KEY);
    document.querySelectorAll('.card[data-id]').forEach(card => {
      const id = card.dataset.id;
      const row = metadata.get(String(id));
      const releaseDuration = String(row?.duration || '').trim();
      if (releaseDuration && releaseDuration !== '--:--') return;
      const value = stored[id];
      if (!value) return;
      const item = itemById(id);
      if (item) item.duration = value;
      let badge = card.querySelector('.dur');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'dur';
        card.querySelector('.thumb')?.appendChild(badge);
      }
      badge.textContent = value;
    });
  }

  async function refreshReleaseMetadata() {
    try {
      const response = await fetch(`${MANIFEST_URL}?releaseMeta=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      metadata = new Map((Array.isArray(manifest.videos) ? manifest.videos : []).filter(Boolean).map(row => [String(row.id), row]));
      if (currentId) {
        refreshDescription(currentId);
        refreshPlayBadge(currentId);
      }
      applyStoredDurations();
      refreshCardCounts();
    } catch (error) {
      console.warn('NOVA VIDEO: Release metadata refresh failed', error);
    }
  }

  const previousOpenVideo = openVideo;
  openVideo = function(id) {
    currentId = String(id || '');
    countedThisOpen = false;
    previousOpenVideo(id);
    refreshDescription(currentId);
    refreshPlayBadge(currentId);
  };

  playerEl.addEventListener('play', () => {
    if (!currentId || countedThisOpen) return;
    const item = itemById(currentId);
    if (!item?.remote || !item.src) return;
    countedThisOpen = true;
    const counts = readCounts();
    counts[currentId] = Math.max(0, Number(counts[currentId]) || 0) + 1;
    writeObject(PLAY_KEY, counts);
    refreshPlayBadge(currentId);
    refreshCardCounts();
  });

  playerEl.addEventListener('loadedmetadata', () => {
    if (!currentId) return;
    applyRuntimeDuration(currentId, playerEl.duration);
  });

  new MutationObserver(() => {
    applyStoredDurations();
    refreshCardCounts();
  }).observe(document.getElementById('main') || document.body, { childList: true, subtree: true });

  new MutationObserver(() => {
    if (sourcePanel?.dataset.state === 'online') refreshReleaseMetadata();
  }).observe(sourcePanel || document.body, { attributes: true, attributeFilter: ['data-state'] });

  refreshReleaseMetadata();
  refreshCardCounts();
})();
