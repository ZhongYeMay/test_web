(() => {
  const byId = id => document.getElementById(id);
  const notice = byId('notice');
  let noticeTimer;
  function notify(text) { notice.textContent = text; notice.classList.add('show'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.classList.remove('show'), 2800); }
  for (const [button, panel] of [['searchToggle','searchPanel'],['menuToggle','menuPanel']]) {
    byId(button).addEventListener('click', () => { const el = byId(panel); el.hidden = !el.hidden; byId(button).setAttribute('aria-expanded', String(!el.hidden)); if (panel === 'searchPanel' && !el.hidden) byId('searchInput').focus(); });
  }
  byId('menuPanel').addEventListener('click', e => { if(e.target.closest('a')) {byId('menuPanel').hidden = true; byId('menuToggle').setAttribute('aria-expanded','false');} });
  document.addEventListener('keydown', e => {if(e.key==='Escape') { for(const [b,p] of [['searchToggle','searchPanel'],['menuToggle','menuPanel']]) {byId(p).hidden=true;byId(b).setAttribute('aria-expanded','false');} }});
  byId('articleSearch').addEventListener('submit', e => { e.preventDefault(); const q=byId('searchInput').value.trim().toLowerCase(); const paragraphs=[...byId('articleBody').querySelectorAll('p,h2,blockquote')]; paragraphs.forEach(p=>p.classList.remove('search-hit')); if(!q){byId('searchResult').textContent='请输入要查找的关键词。';return;} const hits=paragraphs.filter(p=>p.textContent.toLowerCase().includes(q)); hits.forEach(p=>p.classList.add('search-hit')); byId('searchResult').textContent=hits.length?`找到 ${hits.length} 段相关内容。`:'本文没有匹配的内容。';hits[0]?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); });
  let fontSize=20; const media=matchMedia('(max-width:600px)');fontSize=media.matches?17:20;
  function updateFont(){ document.documentElement.style.setProperty('--body-size',`${fontSize}px`);byId('fontSmaller').disabled=fontSize<=14;byId('fontLarger').disabled=fontSize>=28; }
  byId('fontSmaller').addEventListener('click',()=>{fontSize=Math.max(14,fontSize-1);updateFont();});byId('fontLarger').addEventListener('click',()=>{fontSize=Math.min(28,fontSize+1);updateFont();});updateFont();
  const bookmark=byId('bookmark'), key='nova-news-stellar-orange-bookmark';try{bookmark.setAttribute('aria-pressed',String(localStorage.getItem(key)==='true'));}catch{}
  bookmark.addEventListener('click',()=>{const saved=bookmark.getAttribute('aria-pressed')!=='true';try{localStorage.setItem(key,String(saved));bookmark.setAttribute('aria-pressed',String(saved));notify(saved?'文章已收藏到当前浏览器。':'已取消收藏。');}catch{notify('当前浏览器无法保存收藏。');}});
  async function copyLink(){try{await navigator.clipboard.writeText(location.href);notify('文章链接已复制。');}catch{notify('暂时无法复制，请使用浏览器的分享按钮。');}}
  byId('copyLink').addEventListener('click',copyLink);
  byId('shareArticle').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:document.title,text:'虚构新闻 · 创意演示：Stellar Orange 的物理学奖时刻',url:location.href});}catch(e){if(e.name!=='AbortError')notify('分享暂不可用，请复制链接。');}}else await copyLink();});
  byId('printArticle').addEventListener('click',()=>window.print());
})();
