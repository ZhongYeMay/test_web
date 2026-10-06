(() => {
  const BASE = 'https://uaxnhmaczwjldvjhcysk.supabase.co';
  const API = `${BASE}/rest/v1/nova_video_submissions`;
  const BUCKET = 'nova-submission-videos';
  const KEY = 'sb_publishable_iDbZIez-vw84GJ30GY2GpA_s6R6Qm4K';
  const LIMIT = 50 * 1024 * 1024;
  const form = document.getElementById('submissionForm');
  const draftKey = 'nova-submission-draft-v1';
  const fields = ['title', 'channel', 'category', 'src', 'thumbnail', 'description'];
  const status = document.getElementById('formStatus');
  const button = document.getElementById('submitButton');
  const fileInput = document.getElementById('videoFile');
  const fileInfo = document.getElementById('fileInfo');
  const progress = document.getElementById('uploadProgress');
  const bar = document.getElementById('uploadBar');
  const uploadText = document.getElementById('uploadText');
  const cancel = document.getElementById('cancelUpload');
  let pendingId = null, busy = false, uploaded = null, uploadPath = '', activeUpload = null;
  const el = name => form.elements[name];
  const mode = () => el('sourceMode').value;
  const publicUrl = path => `${BASE}/storage/v1/object/public/${BUCKET}/${path}`;
  const sizeText = size => `${(size / 1024 / 1024).toFixed(1)} MB`;
  function https(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; } }
  function preview() {
    document.getElementById('previewTitle').textContent = el('title').value.trim() || '你的下一支好作品';
    document.getElementById('previewChannel').textContent = el('channel').value.trim() || 'NOVA Creator';
    document.getElementById('previewCategory').textContent = el('category').value;
    const image = document.getElementById('previewImage');
    const value = el('thumbnail').value.trim();
    image.hidden = true;
    if (https(value)) { image.referrerPolicy = 'no-referrer'; if (image.getAttribute('src') !== value) image.src = value; else image.hidden = !image.complete || !image.naturalWidth; }
    else image.removeAttribute('src');
  }
  function syncMode() {
    const isFile = mode() === 'file';
    document.getElementById('filePanel').hidden = !isFile;
    document.getElementById('linkPanel').hidden = isFile;
    el('src').disabled = isFile || busy;
    el('src').required = !isFile;
    fileInput.disabled = !isFile || busy;
  }
  function save() {
    try { localStorage.setItem(draftKey, JSON.stringify({...Object.fromEntries(fields.map(f => [f, el(f).value])), id: pendingId, sourceMode: mode(), uploaded})); } catch {}
  }
  function freeze(value) {
    busy = value;
    form.querySelectorAll('input,select,textarea').forEach(input => { input.disabled = value; });
    button.disabled = value;
    syncMode();
  }
  document.getElementById('previewImage').onload = e => { e.target.hidden = false; };
  document.getElementById('previewImage').onerror = e => { e.target.hidden = true; };
  try {
    const d = JSON.parse(localStorage.getItem(draftKey) || '{}');
    fields.forEach(f => { if (typeof d[f] === 'string') el(f).value = d[f]; });
    if (typeof d.id === 'string') pendingId = d.id;
    const savedMode = d.sourceMode || (d.src ? 'link' : 'file');
    form.querySelector(`input[name="sourceMode"][value="${savedMode === 'link' ? 'link' : 'file'}"]`).checked = true;
    if (d.uploaded && typeof d.uploaded.url === 'string' && d.uploaded.url.startsWith(`${BASE}/storage/v1/object/public/${BUCKET}/`)) {
      uploaded = d.uploaded;
      fileInfo.textContent = `已上传：${uploaded.name} · ${sizeText(uploaded.size)}，可直接提交审核。`;
    }
  } catch {}
  form.addEventListener('input', e => {
    if (busy || e.target === fileInput) return;
    pendingId = null; syncMode(); save(); preview();
  });
  fileInput.addEventListener('change', () => {
    uploaded = null; uploadPath = ''; pendingId = null; progress.hidden = true; status.textContent = '';
    const file = fileInput.files[0];
    fileInfo.textContent = file ? `${file.name} · ${sizeText(file.size)}，提交时上传。` : '支持 MP4、WebM、MOV；建议使用 H.264 编码的 MP4。';
    if (file && !el('title').value.trim()) el('title').value = file.name.replace(/\.[^.]+$/, '').slice(0, 100);
    save(); preview();
  });
  cancel.onclick = () => activeUpload?.abort();
  function uploadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const type = {mp4:'video/mp4', webm:'video/webm', mov:'video/quicktime'}[ext];
    uploadPath ||= `${crypto.randomUUID()}.${ext}`;
    const url = publicUrl(uploadPath);
    progress.hidden = false; cancel.hidden = false; bar.value = 0; uploadText.textContent = '正在上传 · 0%';
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); activeUpload = xhr;
      xhr.open('POST', `${BASE}/storage/v1/object/${BUCKET}/${uploadPath}`);
      xhr.setRequestHeader('apikey', KEY);
      xhr.setRequestHeader('Content-Type', type);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', '3600');
      xhr.timeout = 10 * 60 * 1000;
      xhr.upload.onprogress = e => {
        if (!e.lengthComputable) return;
        const percent = Math.min(100, Math.round(e.loaded / e.total * 100));
        bar.value = percent;
        uploadText.textContent = percent === 100 ? '文件已发送，正在确认…' : `正在上传 · ${percent}%`;
      };
      const complete = () => { activeUpload = null; cancel.hidden = true; bar.value = 100; uploadText.textContent = '上传完成，正在提交审核…'; resolve({url, name:file.name, size:file.size}); };
      const recover = async () => {
        // A retry may find a completed upload whose success response was lost.
        try {
          const r = await fetch(url, {method:'HEAD', signal:AbortSignal.timeout(10000), cache:'no-store'});
          if (r.ok && Number(r.headers.get('content-length')) === file.size) { complete(); return; }
        } catch {}
        activeUpload = null; cancel.hidden = true;
        reject(new Error('视频上传未完成，请重试。已选择的文件仍保留在本页。'));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { complete(); return; }
        let body = {}; try { body = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status === 413 || body.statusCode === '413' || body.error === 'Payload too large') {
          activeUpload = null; cancel.hidden = true; reject(new Error('文件超过存储限制，请压缩到 50 MB 以内后重试。')); return;
        }
        recover();
      };
      xhr.onerror = recover; xhr.ontimeout = recover;
      xhr.onabort = () => { activeUpload = null; cancel.hidden = true; uploadText.textContent = '上传已取消'; reject(new Error('上传已取消。可以重新选择文件或再次提交。')); };
      xhr.send(file);
    });
  }
  syncMode(); preview();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    if (el('website').value) return;
    status.textContent = '';
    const values = Object.fromEntries(fields.map(f => [f, el(f).value.trim()]));
    if (!values.title || !values.channel) { status.textContent = '请填写标题和创作者昵称。'; return; }
    const isFile = mode() === 'file';
    const file = fileInput.files[0];
    if (isFile && !uploaded) {
      if (!file) { status.textContent = '请选择一个视频文件。'; fileInput.focus(); return; }
      if (!/\.(mp4|webm|mov)$/i.test(file.name)) { status.textContent = '请选择 MP4、WebM 或 MOV 视频文件。'; return; }
      if (!file.size || file.size > LIMIT) { status.textContent = '视频文件不能为空，且不能超过 50 MB。'; return; }
    }
    if (!isFile && (!https(values.src) || !/\.(mp4|webm|mov)$/i.test(new URL(values.src).pathname))) { status.textContent = '请填写 HTTPS 视频文件直链，文件类型为 MP4、WebM 或 MOV。'; el('src').focus(); return; }
    if (values.thumbnail && !https(values.thumbnail)) { status.textContent = '封面链接必须使用 HTTPS。'; el('thumbnail').focus(); return; }
    pendingId ||= crypto.randomUUID(); save(); freeze(true);
    try {
      if (isFile) {
        if (!uploaded) { button.textContent = '正在上传视频…'; uploaded = await uploadFile(file); save(); fileInfo.textContent = `已上传：${uploaded.name} · ${sizeText(uploaded.size)}`; }
        values.src = uploaded.url;
      }
      button.textContent = '正在提交审核…';
      const response = await fetch(API, {method:'POST', headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=minimal'}, body:JSON.stringify({id:pendingId,...values}), signal:AbortSignal.timeout(20000)});
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body.code === '23505') throw new Error('这个视频链接或投稿编号已提交，请勿重复投稿。如果刚才网络中断，你的作品可能已收到。');
        throw new Error('投稿暂未成功，请稍后重试。草稿和已上传的视频已保留。');
      }
      try { localStorage.removeItem(draftKey); } catch {}
      document.getElementById('receipt').textContent = pendingId;
      form.hidden = true; document.querySelector('.card-heading').hidden = true;
      const success = document.getElementById('success'); success.hidden = false; success.focus();
    } catch (err) {
      status.textContent = err.name === 'TimeoutError' || err.name === 'TypeError' ? '网络异常，请重试。草稿和已上传的视频已保留。' : err.message;
      if (uploaded) uploadText.textContent = '视频已上传，重新提交无需重复上传';
    } finally { freeze(false); button.innerHTML = '提交作品 <span>↗</span>'; }
  });
  document.getElementById('another').onclick = () => {
    form.reset(); pendingId = null; uploaded = null; uploadPath = ''; progress.hidden = true;
    status.textContent = ''; fileInfo.textContent = '支持 MP4、WebM、MOV；建议使用 H.264 编码的 MP4。';
    document.getElementById('success').hidden = true; form.hidden = false; document.querySelector('.card-heading').hidden = false;
    syncMode(); preview(); el('title').focus();
  };
})();
