(() => {
  const TAG_REFRESH_MS = 60 * 60 * 1000;
  const ENGAGEMENT_KEY = 'nova-video-engagement-v1';
  const chipsEl = document.getElementById('chips');
  const sourcePanelEl = document.getElementById('sourcePanel');
  const recommendEl = document.getElementById('recommend');
  const gridEl = document.getElementById('videoGrid');
  const emptyEl = document.getElementById('empty');
  const resultEl = document.getElementById('resultText');
  const searchInputEl = document.getElementById('searchInput');
  const refreshSourceEl = document.getElementById('refreshSource');
  const playerMetaEl = document.querySelector('.playermeta');
  if (!chipsEl || !sourcePanelEl || !recommendEl || !gridEl || !playerMetaEl) return;

  let manifestRows = [];
  let actualTags = [];
  let currentVideoId = '';
  let deepLinkOpened = false;

  const safeText = value => String(value ?? '');
  const itemById = id => Array.isArray(items) ? items.find(item => item.id === id) : null;

  function readEngagement() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? {
        likes: parsed.likes && typeof parsed.likes === 'object' ? parsed.likes : {},
        favorites: parsed.favorites && typeof parsed.favorites === 'object' ? parsed.favorites : {},
        comments: parsed.comments && typeof parsed.comments === 'object' ? parsed.comments : {}
      } : { likes: {}, favorites: {}, comments: {} };
    } catch {
      return { likes: {}, favorites: {}, comments: {} };
    }
  }

  function writeEngagement(state) {
    try { localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(state)); } catch {}
  }

  function bindCard(card) {
    const target = card.querySelector('.thumb');
    if (!target) return;
    const go = () => openVideo(card.dataset.id);
    target.addEventListener('click', go);
    target.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        go();
      }
    });
  }

  const sectionsEl = document.createElement('div');
  sectionsEl.id = 'tagSections';
  sectionsEl.className = 'tag-sections';
  sectionsEl.setAttribute('aria-label', '按视频 tag 浏览');
  gridEl.insertAdjacentElement('afterend', sectionsEl);

  function setChipActive(tag) {
    chipsEl.querySelectorAll('.chip').forEach(button => {
      const active = button.dataset.filter === tag;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function useFilter(tag) {
    filter = tag;
    setChipActive(tag);
    apply();
    syncBrowseMode();
  }

  function rebuildTagControls() {
    const tags = actualTags;
    chipsEl.innerHTML = '';
    ['全部', ...tags].forEach((tag, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chip${index === 0 ? ' active' : ''}`;
      button.dataset.filter = tag;
      button.textContent = tag === '全部' ? '全部视频' : `#${tag}`;
      button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      button.addEventListener('click', () => useFilter(tag));
      chipsEl.appendChild(button);
    });
    filter = '全部';

    const navGroups = document.querySelectorAll('.side .nav');
    const tagNav = navGroups[1];
    if (tagNav) {
      tagNav.innerHTML = '';
      if (tags.length) {
        tags.forEach(tag => {
          const link = document.createElement('a');
          link.href = '#recommend';
          link.textContent = `#　${tag}`;
          link.dataset.tagFilter = tag;
          link.addEventListener('click', event => {
            event.preventDefault();
            useFilter(tag);
            recommendEl.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
          });
          tagNav.appendChild(link);
        });
      } else {
        const empty = document.createElement('span');
        empty.className = 'tag-nav-empty';
        empty.textContent = demoMode ? '暂无真实 tag' : '视频尚未设置 tag';
        tagNav.appendChild(empty);
      }
    }
  }

  function rebuildTagSections() {
    sectionsEl.innerHTML = '';
    const remoteItems = (Array.isArray(items) ? items : []).filter(item => item && item.remote && item.src);
    actualTags.forEach((tag, tagIndex) => {
      const idSet = new Set(manifestRows.filter(row => Array.isArray(row.tags) && row.tags.map(safeText).includes(tag)).map(row => safeText(row.id)));
      const tagged = remoteItems.filter(item => idSet.has(safeText(item.id)));
      if (!tagged.length) return;

      const section = document.createElement('section');
      section.className = 'tag-section';
      section.dataset.tag = tag;
      const headingId = `tagSectionTitle${tagIndex}`;
      section.setAttribute('aria-labelledby', headingId);

      const head = document.createElement('div');
      head.className = 'tag-section-head';
      const titleWrap = document.createElement('div');
      const title = document.createElement('h2');
      title.id = headingId;
      title.textContent = `#${tag}`;
      const meta = document.createElement('p');
      meta.textContent = `${tagged.length} 个视频 · 来自 videos.json 的实际 tag`;
      titleWrap.append(title, meta);
      const filterButton = document.createElement('button');
      filterButton.type = 'button';
      filterButton.textContent = '只看此 tag';
      filterButton.addEventListener('click', () => {
        useFilter(tag);
        recommendEl.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
      head.append(titleWrap, filterButton);

      const sectionGrid = document.createElement('div');
      sectionGrid.className = 'grid tag-grid';
      sectionGrid.innerHTML = tagged.map(video => html(video)).join('');
      sectionGrid.querySelectorAll('.card').forEach(bindCard);
      section.append(head, sectionGrid);
      sectionsEl.appendChild(section);
    });
  }

  function syncBrowseMode() {
    const query = searchInputEl ? searchInputEl.value.trim() : '';
    const grouped = !demoMode && filter === '全部' && !query && sectionsEl.childElementCount > 0;
    sectionsEl.hidden = !grouped;
    gridEl.hidden = grouped;
    if (emptyEl && grouped) emptyEl.style.display = 'none';
    if (grouped && resultEl) resultEl.textContent = `${actualTags.length} 个 tag 分区 · ${(Array.isArray(items) ? items : []).filter(item => item && item.remote).length} 个真实视频`;
  }

  async function refreshTagCatalog({ silent = false } = {}) {
    try {
      const response = await fetch(`${MANIFEST}?catalog=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      manifestRows = Array.isArray(manifest.videos) ? manifest.videos.filter(Boolean) : [];
      actualTags = [...new Set(manifestRows.flatMap(video => Array.isArray(video.tags) ? video.tags.map(safeText).filter(Boolean) : []))];
      rebuildTagControls();
      rebuildTagSections();
      syncBrowseMode();
      const detail = document.getElementById('sourceDetail');
      if (detail && sourcePanelEl.dataset.state === 'online') detail.textContent = `${manifest.repository || 'ZhongYeMay/novavideos'} · ${actualTags.length} 个实际 tag · 每小时自动扫描`;
      if (!silent && typeof toastMsg === 'function') toastMsg(`tag 分区已同步：${actualTags.length} 个标签`);
      refreshFavorites();
      tryOpenDeepLink();
    } catch (error) {
      if (!silent && typeof toastMsg === 'function') toastMsg(`tag 扫描失败：${error.message}`);
    }
  }

  searchInputEl?.addEventListener('input', () => queueMicrotask(syncBrowseMode));
  document.getElementById('searchForm')?.addEventListener('submit', () => queueMicrotask(syncBrowseMode));
  new MutationObserver(() => {
    if (manifestRows.length) {
      rebuildTagSections();
      syncBrowseMode();
      refreshFavorites();
      tryOpenDeepLink();
    }
  }).observe(gridEl, { childList: true });
  new MutationObserver(() => {
    if (sourcePanelEl.dataset.state === 'online') refreshTagCatalog({ silent: true });
  }).observe(sourcePanelEl, { attributes: true, attributeFilter: ['data-state'] });
  refreshSourceEl?.addEventListener('click', () => setTimeout(() => refreshTagCatalog({ silent: true }), 250));

  setInterval(async () => {
    try { await loadSource(); } catch {}
    await refreshTagCatalog({ silent: true });
  }, TAG_REFRESH_MS);

  const favoritesPanel = document.createElement('section');
  favoritesPanel.id = 'favoritesPanel';
  favoritesPanel.className = 'favorites-panel';
  favoritesPanel.hidden = true;
  favoritesPanel.innerHTML = '<div class="head"><div><h2>我的收藏</h2><p>收藏只保存在当前浏览器。</p></div></div><div class="favorites-grid grid" id="favoritesGrid"></div>';
  document.getElementById('continueWatching')?.insertAdjacentElement('beforebegin', favoritesPanel);
  const favoritesGrid = favoritesPanel.querySelector('#favoritesGrid');

  function refreshFavorites() {
    if (!favoritesGrid) return;
    const state = readEngagement();
    const favorites = (Array.isArray(items) ? items : []).filter(item => item && item.src && state.favorites[item.id]);
    favoritesPanel.hidden = favorites.length === 0;
    favoritesGrid.innerHTML = favorites.map(video => html(video)).join('');
    favoritesGrid.querySelectorAll('.card').forEach(bindCard);
  }

  const engagement = document.createElement('section');
  engagement.className = 'engagement-panel';
  engagement.setAttribute('aria-label', '视频互动');
  engagement.innerHTML = `
    <div class="engagement-actions" role="group" aria-label="视频操作">
      <button type="button" data-action="like" aria-pressed="false"><span aria-hidden="true">♡</span><span>点赞</span></button>
      <button type="button" data-action="favorite" aria-pressed="false"><span aria-hidden="true">☆</span><span>收藏</span></button>
      <button type="button" data-action="download"><span aria-hidden="true">↓</span><span>下载</span></button>
      <button type="button" data-action="share"><span aria-hidden="true">↗</span><span>转发</span></button>
      <button type="button" data-action="comment" aria-expanded="false"><span aria-hidden="true">💬</span><span>评论</span><span class="comment-count">0</span></button>
    </div>
    <div class="comment-panel" hidden>
      <div class="comment-heading"><strong>本地评论</strong><span>仅保存在此浏览器，不会公开上传。</span></div>
      <form class="comment-form">
        <textarea maxlength="300" rows="3" placeholder="写下评论（最多 300 字）" aria-label="评论内容" required></textarea>
        <div><span class="comment-limit">0 / 300</span><button type="submit">发表评论</button></div>
      </form>
      <div class="comment-list" aria-live="polite"></div>
    </div>`;
  playerMetaEl.appendChild(engagement);

  const likeButton = engagement.querySelector('[data-action="like"]');
  const favoriteButton = engagement.querySelector('[data-action="favorite"]');
  const downloadButton = engagement.querySelector('[data-action="download"]');
  const shareButton = engagement.querySelector('[data-action="share"]');
  const commentButton = engagement.querySelector('[data-action="comment"]');
  const commentCount = engagement.querySelector('.comment-count');
  const commentPanel = engagement.querySelector('.comment-panel');
  const commentForm = engagement.querySelector('.comment-form');
  const commentInput = engagement.querySelector('textarea');
  const commentLimit = engagement.querySelector('.comment-limit');
  const commentList = engagement.querySelector('.comment-list');

  function renderComments(id) {
    const state = readEngagement();
    const comments = Array.isArray(state.comments[id]) ? state.comments[id] : [];
    commentCount.textContent = String(comments.length);
    commentList.innerHTML = '';
    if (!comments.length) {
      const empty = document.createElement('p');
      empty.className = 'comment-empty';
      empty.textContent = '还没有本地评论。';
      commentList.appendChild(empty);
      return;
    }
    [...comments].reverse().forEach(entry => {
      const article = document.createElement('article');
      article.className = 'comment-item';
      const avatar = document.createElement('span');
      avatar.className = 'comment-avatar';
      avatar.textContent = 'N';
      avatar.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      const top = document.createElement('div');
      top.className = 'comment-top';
      const author = document.createElement('strong');
      author.textContent = '本地用户';
      const time = document.createElement('time');
      const date = new Date(entry.createdAt);
      time.dateTime = Number.isFinite(date.getTime()) ? date.toISOString() : '';
      time.textContent = Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN') : '';
      top.append(author, time);
      const text = document.createElement('p');
      text.textContent = safeText(entry.text);
      body.append(top, text);
      article.append(avatar, body);
      commentList.appendChild(article);
    });
  }

  function updateEngagement(id) {
    currentVideoId = id;
    const state = readEngagement();
    const liked = Boolean(state.likes[id]);
    const favorited = Boolean(state.favorites[id]);
    likeButton.setAttribute('aria-pressed', liked ? 'true' : 'false');
    favoriteButton.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    likeButton.classList.toggle('active', liked);
    favoriteButton.classList.toggle('active', favorited);
    renderComments(id);
  }

  function toggleState(kind, button) {
    if (!currentVideoId) return;
    const state = readEngagement();
    state[kind][currentVideoId] = !state[kind][currentVideoId];
    if (!state[kind][currentVideoId]) delete state[kind][currentVideoId];
    writeEngagement(state);
    updateEngagement(currentVideoId);
    refreshFavorites();
    if (typeof toastMsg === 'function') toastMsg(kind === 'likes' ? (state[kind][currentVideoId] ? '已点赞' : '已取消点赞') : (state[kind][currentVideoId] ? '已收藏' : '已取消收藏'));
    button.focus();
  }

  likeButton.addEventListener('click', () => toggleState('likes', likeButton));
  favoriteButton.addEventListener('click', () => toggleState('favorites', favoriteButton));

  downloadButton.addEventListener('click', () => {
    const video = itemById(currentVideoId);
    if (!video?.src) return;
    const anchor = document.createElement('a');
    anchor.href = video.src;
    anchor.download = `${safeText(video.title || 'nova-video').replace(/[\\/:*?"<>|]/g, '_')}.mp4`;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (typeof toastMsg === 'function') toastMsg('已请求下载；是否直接保存由浏览器和视频源决定');
  });

  function shareUrl(id) {
    const url = new URL(location.href);
    url.searchParams.set('v', id);
    url.hash = 'recommend';
    return url.href;
  }

  shareButton.addEventListener('click', async () => {
    const video = itemById(currentVideoId);
    if (!video) return;
    const url = shareUrl(video.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, text: `${video.title} · ${video.channel || 'NOVA VIDEO'}`, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        if (typeof toastMsg === 'function') toastMsg('播放链接已复制');
      } else {
        window.prompt('复制这个播放链接：', url);
      }
    } catch (error) {
      if (error?.name !== 'AbortError' && typeof toastMsg === 'function') toastMsg('转发没有完成');
    }
  });

  commentButton.addEventListener('click', () => {
    commentPanel.hidden = !commentPanel.hidden;
    commentButton.setAttribute('aria-expanded', commentPanel.hidden ? 'false' : 'true');
    if (!commentPanel.hidden) commentInput.focus();
  });
  commentInput.addEventListener('input', () => { commentLimit.textContent = `${commentInput.value.length} / 300`; });
  commentForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = commentInput.value.trim();
    if (!currentVideoId || !text) return;
    const state = readEngagement();
    const list = Array.isArray(state.comments[currentVideoId]) ? state.comments[currentVideoId] : [];
    list.push({ text: text.slice(0, 300), createdAt: Date.now() });
    state.comments[currentVideoId] = list.slice(-50);
    writeEngagement(state);
    commentInput.value = '';
    commentLimit.textContent = '0 / 300';
    renderComments(currentVideoId);
    if (typeof toastMsg === 'function') toastMsg('评论已保存在此浏览器');
  });

  const priorOpenVideo = openVideo;
  openVideo = function(id) {
    const video = itemById(id);
    priorOpenVideo(id);
    if (video?.src) updateEngagement(id);
  };

  function tryOpenDeepLink() {
    if (deepLinkOpened) return;
    const id = new URLSearchParams(location.search).get('v');
    if (!id || !itemById(id)?.src) return;
    deepLinkOpened = true;
    setTimeout(() => openVideo(id), 0);
  }

  refreshFavorites();
  refreshTagCatalog({ silent: true });
})();