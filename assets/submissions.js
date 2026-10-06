(() => {
  const API = 'https://uaxnhmaczwjldvjhcysk.supabase.co/rest/v1/nova_video_submissions';
  const KEY = 'sb_publishable_iDbZIez-vw84GJ30GY2GpA_s6R6Qm4K';
  const form = document.getElementById('submissionForm');
  const draftKey = 'nova-submission-draft-v1';
  const fields = ['title', 'channel', 'category', 'src', 'thumbnail', 'description'];
  const status = document.getElementById('formStatus');
  const button = document.getElementById('submitButton');
  let pendingId = null;
  let busy = false;
  function https(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } }
  function preview() {
    document.getElementById('previewTitle').textContent = form.elements["title"].value.trim() || '你的下一支好作品';
    document.getElementById('previewChannel').textContent = form.elements["channel"].value.trim() || 'NOVA Creator';
    document.getElementById('previewCategory').textContent = form.elements["category"].value;
    const image = document.getElementById('previewImage');
    const value = form.elements["thumbnail"].value.trim();
    image.hidden = true;
    if (https(value)) { image.referrerPolicy = 'no-referrer'; if (image.getAttribute('src') !== value) image.src = value; else image.hidden = !image.complete || !image.naturalWidth; }
    else image.removeAttribute('src');
  }
  document.getElementById('previewImage').onload = e => { e.target.hidden = false; };
  document.getElementById('previewImage').onerror = e => { e.target.hidden = true; };
  try { const d = JSON.parse(localStorage.getItem(draftKey) || '{}'); fields.forEach(f => { if (typeof d[f] === 'string') form.elements[f].value = d[f]; }); if (typeof d.id === 'string') pendingId = d.id; } catch {}
  function save() { try { localStorage.setItem(draftKey, JSON.stringify({...Object.fromEntries(fields.map(f => [f, form.elements[f].value])), id: pendingId})); } catch {} }
  form.addEventListener('input', () => { pendingId = null; save(); preview(); });
  preview();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    if (form.elements["website"].value) return;
    status.textContent = '';
    const values = Object.fromEntries(fields.map(f => [f, form.elements[f].value.trim()]));
    if (!values.title || !values.channel) { status.textContent = '请填写标题和创作者昵称。'; return; }
    if (!https(values.src) || !/\.(mp4|webm|mov)$/i.test(new URL(values.src).pathname)) { status.textContent = '请填写 HTTPS 视频文件直链，文件类型为 MP4、WebM 或 MOV。'; form.elements["src"].focus(); return; }
    if (values.thumbnail && !https(values.thumbnail)) { status.textContent = '封面链接必须使用 HTTPS。'; form.elements["thumbnail"].focus(); return; }
    pendingId ||= crypto.randomUUID();
    save();
    busy = true; button.disabled = true; button.textContent = '正在提交…';
    try {
      const response = await fetch(API, {method:'POST', headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=minimal'}, body:JSON.stringify({id:pendingId,...values}), signal:AbortSignal.timeout(20000)});
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body.code === '23505') throw new Error('这个视频链接或投稿编号已提交，请勿重复投稿。如果刚才网络中断，你的作品可能已收到。');
        throw new Error('投稿暂未成功，请稍后重试。你的草稿已保留。');
      }
      try { localStorage.removeItem(draftKey); } catch {}
      document.getElementById('receipt').textContent = pendingId;
      form.hidden = true;
      document.querySelector('.card-heading').hidden = true;
      const success = document.getElementById('success'); success.hidden = false; success.focus();
    } catch (err) { status.textContent = err.name === 'TimeoutError' || err.name === 'TypeError' ? '连接超时或网络异常，请重试。草稿已保留；重试不会重复创建同一投稿。' : err.message; }
    finally { busy = false; button.disabled = false; button.innerHTML = '提交作品 <span>↗</span>'; }
  });
  document.getElementById('another').onclick = () => { form.reset(); pendingId = null; status.textContent = ''; document.getElementById('success').hidden = true; form.hidden = false; document.querySelector('.card-heading').hidden = false; preview(); form.elements["title"].focus(); };
})();
