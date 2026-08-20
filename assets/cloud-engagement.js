(() => {
  const SUPABASE_URL = 'https://uaxnhmaczwjldvjhcysk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_iDbZIez-vw84GJ30GY2GpA_s6R6Qm4K';
  const MANIFEST_URL = 'https://raw.githubusercontent.com/ZhongYeMay/novavideos/main/videos.json';
  const CLIENT_KEY = 'nova-video-cloud-client-v1';
  const NICK_KEY = 'nova-video-cloud-nickname-v1';
  const FAVORITE_KEY = 'nova-video-engagement-v1';
  const DURATION_KEY = 'nova-video-runtime-duration-v1';
  const player = document.getElementById('player');
  const playerMeta = document.querySelector('.playermeta');
  const sourcePanel = document.getElementById('sourcePanel');
  const grid = document.getElementById('videoGrid');
  if (!player || !playerMeta || typeof openVideo !== 'function') return;

  const stats = new Map();
  const metadata = new Map();
  let currentId = '';
  let countedThisOpen = false;
  let commentsOpen = false;

  function makeClientId() {
    try {
      const existing = localStorage.getItem(CLIENT_KEY);
      if (existing && existing.length >= 8) return existing;
      const value = crypto.randomUUID ? crypto.randomUUID() : `nv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_KEY, value);
      return value;
    } catch {
      return `nv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }
  const clientId = makeClientId();

  async function rpc(name, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${text.slice(0, 160)}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const fmt = value => new Intl.NumberFormat('zh-CN').format(Math.max(0, Number(value) || 0));
  const itemById = id => Array.isArray(items) ? items.find(item => String(item?.id) === String(id)) : null;

  function readFavoriteState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  function setFavorite(id, value) {
    const state = readFavoriteState();
    if (!state.favorites || typeof state.favorites !== 'object') state.favorites = {};
    if (value) state.favorites[id] = true; else delete state.favorites[id];
    try { localStorage.setItem(FAVORITE_KEY, JSON.stringify(state)); } catch {}
  }
  function isFavorite(id) {
    return Boolean(readFavoriteState().favorites?.[id]);
  }

  document.querySelector('.engagement-panel')?.remove();
  document.querySelector('.local-play-count')?.remove();
  document.querySelector('.release-description')?.remove();

  const description = document.createElement('div');
  description.className = 'release-description';
  description.hidden = true;
  playerMeta.appendChild(description);

  const status = document.createElement('div');
  status.className = 'cloud-status';
  status.setAttribute('aria-live', 'polite');
  status.innerHTML = '<span>☁ ChattingHub Pro 云端</span><span><strong data-cloud-views>0</strong> 次观看</span><span><strong data-cloud-likes>0</strong> 赞</span><span><strong data-cloud-comments>0</strong> 评论</span>';
  playerMeta.appendChild(status);

  const panel = document.createElement('section');
  panel.className = 'cloud-engagement-panel';
  panel.setAttribute('aria-label', '云端视频互动');
  panel.innerHTML = `
    <div class="cloud-engagement-actions" role="group" aria-label="视频操作">
      <button type="button" data-cloud-action="like" aria-pressed="false">♡ 点赞 <span class="count" data-like-count>0</span></button>
      <button type="button" data-cloud-action="favorite" aria-pressed="false">☆ 收藏</button>
      <button type="button" data-cloud-action="download">↓ 下载</button>
      <button type="button" data-cloud-action="share">↗ 转发</button>
      <button type="button" data-cloud-action="comment" aria-expanded="false">💬 评论 <span class="count" data-comment-count>0</span></button>
    </div>
    <div class="cloud-comment-panel" hidden>
      <div class="cloud-comment-heading"><strong>公开评论</strong><span>评论保存在 ChattingHub Pro 云端，其他访客也能看到。</span></div>
      <form class="cloud-comment-form">
        <input type="text" maxlength="32" placeholder="昵称（可选）" aria-label="评论昵称">
        <textarea maxlength="300" rows="3" placeholder="写下公开评论（最多 300 字）" aria-label="评论内容" required></textarea>
        <div class="row"><span data-comment-limit>0 / 300</span><button type="submit">发表评论</button></div>
      </form>
      <div class="cloud-comment-list" aria-live="polite"></div>
      <div class="cloud-note">点赞、评论和观看次数为全站共享云端数据；收藏和继续观看仍只保存在当前浏览器。</div>
    </div>`;
  playerMeta.appendChild(panel);

  const viewsEl = status.querySelector('[data-cloud-views]');
  const likesEl = status.querySelector('[data-cloud-likes]');
  const commentsEl = status.querySelector('[data-cloud-comments]');
  const likeButton = panel.querySelector('[data-cloud-action="like"]');
  const likeCountEl = panel.querySelector('[data-like-count]');
  const favoriteButton = panel.querySelector('[data-cloud-action="favorite"]');
  const downloadButton = panel.querySelector('[data-cloud-action="download"]');
  const shareButton = panel.querySelector('[data-cloud-action="share"]');
  const commentButton = panel.querySelector('[data-cloud-action="comment"]');
  const commentCountEl = panel.querySelector('[data-comment-count]');
  const commentPanel = panel.querySelector('.cloud-comment-panel');
  const commentForm = panel.querySelector('.cloud-comment-form');
  const nicknameInput = commentForm.querySelector('input');
  const commentInput = commentForm.querySelector('textarea');
  const commentLimit = panel.querySelector('[data-comment-limit]');
  const commentList = panel.querySelector('.cloud-comment-list');

  try { nicknameInput.value = localStorage.getItem(NICK_KEY) || ''; } catch {}

  function setStats(id, row) {
    if (!id) return;
    stats.set(String(id), {
      views: Math.max(0, Number(row?.views) || 0),
      likes: Math.max(0, Number(row?.likes) || 0),
      comments: Math.max(0, Number(row?.comments) || 0),
      liked: Boolean(row?.liked)
    });
  }

  function renderCurrent() {
    if (!currentId) return;
    const row = stats.get(currentId) || { views: 0, likes: 0, comments: 0, liked: false };
    viewsEl.textContent = fmt(row.views);
    likesEl.textContent = fmt(row.likes);
    commentsEl.textContent = fmt(row.comments);
    likeCountEl.textContent = fmt(row.likes);
    commentCountEl.textContent = fmt(row.comments);
    likeButton.setAttribute('aria-pressed', row.liked ? 'true' : 'false');
    likeButton.textContent = `${row.liked ? '♥' : '♡'} 点赞 `;
    likeButton.appendChild(likeCountEl);
    const favorited = isFavorite(currentId);
    favoriteButton.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    favoriteButton.textContent = favorited ? '★ 已收藏' : '☆ 收藏';
  }

  function renderCards() {
    document.querySelectorAll('.card[data-id]').forEach(card => {
      const id = String(card.dataset.id || '');
      const item = itemById(id);
      if (!item?.remote || !item.src) return;
      const info = card.querySelector('.info');
      if (!info) return;
      let line = info.querySelector('.cloud-stat-line');
      if (!line) {
        line = document.createElement('small');
        line.className = 'cloud-stat-line';
        info.appendChild(line);
      }
      const row = stats.get(id) || { views: 0, likes: 0, comments: 0 };
      line.textContent = `${fmt(row.views)} 次观看 · ${fmt(row.likes)} 赞 · ${fmt(row.comments)} 评论`;
    });
  }

  async function refreshStats() {
    const ids = [...new Set((Array.isArray(items) ? items : []).filter(item => item?.remote && item.src).map(item => String(item.id)))];
    if (!ids.length) return;
    try {
      const rows = await rpc('nova_get_stats', { p_video_ids: ids });
      (Array.isArray(rows) ? rows : []).forEach(row => setStats(row.video_id, row));
      renderCards();
      if (currentId) await refreshCurrentState();
    } catch (error) {
      console.warn('NOVA VIDEO: cloud stats refresh failed', error);
    }
  }

  async function refreshCurrentState() {
    if (!currentId) return;
    try {
      const rows = await rpc('nova_get_video_state', { p_video_id: currentId, p_client_id: clientId });
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) setStats(currentId, row);
      renderCurrent();
      renderCards();
    } catch (error) {
      console.warn('NOVA VIDEO: cloud state refresh failed', error);
    }
  }

  async function loadComments() {
    if (!currentId) return;
    commentList.innerHTML = '<p class="cloud-comment-empty">正在读取云端评论…</p>';
    try {
      const rows = await rpc('nova_list_comments', { p_video_id: currentId, p_limit: 50 });
      commentList.innerHTML = '';
      if (!Array.isArray(rows) || !rows.length) {
        commentList.innerHTML = '<p class="cloud-comment-empty">还没有公开评论。</p>';
        return;
      }
      rows.forEach(entry => {
        const article = document.createElement('article');
        article.className = 'cloud-comment-item';
        const avatar = document.createElement('span');
        avatar.className = 'cloud-comment-avatar';
        avatar.textContent = String(entry.author || '匿').slice(0, 1).toUpperCase();
        const body = document.createElement('div');
        const top = document.createElement('div');
        top.className = 'cloud-comment-top';
        const author = document.createElement('strong');
        author.textContent = String(entry.author || '匿名用户');
        const time = document.createElement('time');
        const date = new Date(entry.created_at);
        time.dateTime = Number.isFinite(date.getTime()) ? date.toISOString() : '';
        time.textContent = Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN') : '';
        top.append(author, time);
        const text = document.createElement('p');
        text.textContent = String(entry.content || '');
        body.append(top, text);
        article.append(avatar, body);
        commentList.appendChild(article);
      });
    } catch (error) {
      commentList.innerHTML = '<p class="cloud-comment-empty">云端评论暂时无法读取，请稍后再试。</p>';
      console.warn('NOVA VIDEO: comment load failed', error);
    }
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  function applyRuntimeDuration(id, seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const row = metadata.get(String(id));
    const releaseDuration = String(row?.duration || '').trim();
    if (releaseDuration && releaseDuration !== '--:--') return;
    const formatted = formatDuration(seconds);
    const item = itemById(id);
    if (item) item.duration = formatted;
    try {
      const stored = JSON.parse(localStorage.getItem(DURATION_KEY) || '{}');
      stored[id] = formatted;
      localStorage.setItem(DURATION_KEY, JSON.stringify(stored));
    } catch {}
    document.querySelectorAll(`.card[data-id="${CSS.escape(String(id))}"] .dur`).forEach(node => { node.textContent = formatted; });
  }

  function renderDescription(id) {
    const row = metadata.get(String(id));
    const text = String(row?.description || '').trim();
    description.hidden = !text;
    description.textContent = text ? `简介 · ${text}` : '';
  }

  async function refreshMetadata() {
    try {
      const response = await fetch(`${MANIFEST_URL}?cloudMeta=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      metadata.clear();
      (Array.isArray(manifest.videos) ? manifest.videos : []).filter(Boolean).forEach(row => metadata.set(String(row.id), row));
      if (currentId) renderDescription(currentId);
    } catch (error) {
      console.warn('NOVA VIDEO: manifest metadata refresh failed', error);
    }
  }

  const previousOpenVideo = openVideo;
  openVideo = function(id) {
    currentId = String(id || '');
    countedThisOpen = false;
    previousOpenVideo(id);
    renderDescription(currentId);
    refreshCurrentState();
    if (commentsOpen) loadComments();
  };

  player.addEventListener('play', async () => {
    if (!currentId || countedThisOpen) return;
    const item = itemById(currentId);
    if (!item?.remote || !item.src) return;
    countedThisOpen = true;
    try {
      const views = await rpc('nova_record_view', { p_video_id: currentId, p_client_id: clientId });
      const row = stats.get(currentId) || { views: 0, likes: 0, comments: 0, liked: false };
      row.views = Math.max(0, Number(views) || row.views || 0);
      stats.set(currentId, row);
      renderCurrent();
      renderCards();
    } catch (error) {
      countedThisOpen = false;
      console.warn('NOVA VIDEO: cloud view count failed', error);
    }
  });

  player.addEventListener('loadedmetadata', () => {
    if (currentId) applyRuntimeDuration(currentId, player.duration);
  });

  likeButton.addEventListener('click', async () => {
    if (!currentId) return;
    likeButton.disabled = true;
    const nowLiked = Boolean(stats.get(currentId)?.liked);
    try {
      const rows = await rpc('nova_set_like', { p_video_id: currentId, p_client_id: clientId, p_liked: !nowLiked });
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) setStats(currentId, row);
      renderCurrent();
      renderCards();
    } catch (error) {
      if (typeof toastMsg === 'function') toastMsg('云端点赞失败，请稍后重试');
      console.warn('NOVA VIDEO: cloud like failed', error);
    } finally {
      likeButton.disabled = false;
    }
  });

  favoriteButton.addEventListener('click', () => {
    if (!currentId) return;
    const next = !isFavorite(currentId);
    setFavorite(currentId, next);
    renderCurrent();
    if (typeof toastMsg === 'function') toastMsg(next ? '已收藏到当前浏览器' : '已取消收藏');
  });

  downloadButton.addEventListener('click', () => {
    const video = itemById(currentId);
    if (!video?.src) return;
    const anchor = document.createElement('a');
    anchor.href = video.src;
    anchor.download = `${String(video.title || 'nova-video').replace(/[\\/:*?"<>|]/g, '_')}.mp4`;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  });

  shareButton.addEventListener('click', async () => {
    if (!currentId) return;
    const video = itemById(currentId);
    const target = new URL(location.href);
    target.searchParams.set('v', currentId);
    target.hash = 'recommend';
    try {
      if (navigator.share) await navigator.share({ title: video?.title || 'NOVA VIDEO', url: target.href });
      else {
        await navigator.clipboard.writeText(target.href);
        if (typeof toastMsg === 'function') toastMsg('播放链接已复制');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('NOVA VIDEO: share failed', error);
    }
  });

  commentButton.addEventListener('click', () => {
    commentsOpen = !commentsOpen;
    commentPanel.hidden = !commentsOpen;
    commentButton.setAttribute('aria-expanded', commentsOpen ? 'true' : 'false');
    if (commentsOpen) loadComments();
  });

  commentInput.addEventListener('input', () => { commentLimit.textContent = `${commentInput.value.length} / 300`; });
  nicknameInput.addEventListener('change', () => {
    try { localStorage.setItem(NICK_KEY, nicknameInput.value.trim().slice(0, 32)); } catch {}
  });

  commentForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentId) return;
    const content = commentInput.value.trim();
    if (!content) return;
    const author = nicknameInput.value.trim().slice(0, 32) || '匿名用户';
    const submit = commentForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await rpc('nova_add_comment', { p_video_id: currentId, p_client_id: clientId, p_author: author, p_content: content });
      try { localStorage.setItem(NICK_KEY, nicknameInput.value.trim().slice(0, 32)); } catch {}
      commentInput.value = '';
      commentLimit.textContent = '0 / 300';
      await refreshCurrentState();
      await loadComments();
      if (typeof toastMsg === 'function') toastMsg('评论已同步到云端');
    } catch (error) {
      const rateLimited = String(error.message).includes('rate limit');
      if (typeof toastMsg === 'function') toastMsg(rateLimited ? '评论过于频繁，请稍后再试' : '云端评论失败，请稍后重试');
      console.warn('NOVA VIDEO: cloud comment failed', error);
    } finally {
      submit.disabled = false;
    }
  });

  const scheduleCards = (() => {
    let timer = 0;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => { renderCards(); refreshStats(); }, 120);
    };
  })();
  if (grid) new MutationObserver(scheduleCards).observe(grid, { childList: true });
  const tagSections = document.getElementById('tagSections');
  if (tagSections) new MutationObserver(scheduleCards).observe(tagSections, { childList: true });
  if (sourcePanel) new MutationObserver(() => {
    if (sourcePanel.dataset.state === 'online') setTimeout(() => { refreshMetadata(); refreshStats(); }, 120);
  }).observe(sourcePanel, { attributes: true, attributeFilter: ['data-state'] });

  refreshMetadata();
  setTimeout(refreshStats, 250);
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    refreshStats();
    if (commentsOpen) loadComments();
  }, 30000);
})();
