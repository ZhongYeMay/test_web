(() => {
  'use strict';
  if (document.getElementById('keyboardTester')) return;

  const anchor = document.getElementById('motionPreview') || document.getElementById('accessibility');
  if (!anchor) return;

  const style = document.createElement('style');
  style.dataset.keyboardTesterStyle = 'true';
  style.textContent = `
    .keyboard-tester{margin:22px 0;border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:22px;background:rgba(255,255,255,.045)}
    .keyboard-tester__head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}.keyboard-tester__kicker{display:block;color:#7c9cff;font-size:12px;letter-spacing:.13em}.keyboard-tester h2{margin:7px 0 0;font:700 clamp(1.35rem,3vw,2rem)/1.1 Inter,system-ui,sans-serif}.keyboard-tester__hint{max-width:620px;margin:0;color:#8d96a8;line-height:1.65}
    .keyboard-tester__pad{margin-top:18px;min-height:110px;border:1px dashed rgba(124,156,255,.48);border-radius:13px;padding:22px;display:grid;place-items:center;text-align:center;background:rgba(124,156,255,.055);cursor:text;outline:none}.keyboard-tester__pad:focus-visible{border-style:solid;outline:3px solid #7c9cff;outline-offset:3px}.keyboard-tester__pad strong{font:800 clamp(1rem,3vw,1.45rem)/1.2 ui-monospace,SFMono-Regular,Menlo,monospace}.keyboard-tester__pad span{display:block;margin-top:8px;color:#8d96a8;font-size:12px;line-height:1.55}
    .keyboard-tester__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.keyboard-tester__metric{border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:13px;background:rgba(0,0,0,.12)}.keyboard-tester__metric span{display:block;color:#8d96a8;font-size:10px;letter-spacing:.08em}.keyboard-tester__metric strong{display:block;margin-top:7px;overflow-wrap:anywhere;font-size:14px}
    .keyboard-tester__footer{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-top:14px}.keyboard-tester__status{color:#8d96a8;font-size:12px;line-height:1.5}.keyboard-tester__clear{min-height:40px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(255,255,255,.04);color:inherit;padding:0 13px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.07em;cursor:pointer}
    @media(max-width:760px){.keyboard-tester__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'keyboard-tester';
  panel.id = 'keyboardTester';
  panel.setAttribute('aria-labelledby', 'keyboardTesterTitle');
  panel.innerHTML = `
    <div class="keyboard-tester__head">
      <div><span class="keyboard-tester__kicker">// KEYBOARD EVENT INSPECTOR</span><h2 id="keyboardTesterTitle">KEYBOARD INPUT TEST</h2></div>
      <p class="keyboard-tester__hint">聚焦下方测试区后按任意键，实时查看浏览器报告的 key、code、修饰键和长按 repeat 状态。不会记录或上传按键历史；离开测试区后也不会监听普通页面输入。</p>
    </div>
    <div class="keyboard-tester__pad" id="keyboardTestPad" tabindex="0" role="application" aria-label="键盘事件测试区域，聚焦后按任意键开始测试">
      <div><strong id="keyboardLast">PRESS ANY KEY</strong><span>Click or Tab here, then press a key. Browser shortcuts may still be handled by the browser.</span></div>
    </div>
    <div class="keyboard-tester__grid" aria-live="polite">
      <div class="keyboard-tester__metric"><span>KEY</span><strong id="keyboardKey">—</strong></div>
      <div class="keyboard-tester__metric"><span>CODE</span><strong id="keyboardCode">—</strong></div>
      <div class="keyboard-tester__metric"><span>MODIFIERS</span><strong id="keyboardMods">NONE</strong></div>
      <div class="keyboard-tester__metric"><span>REPEAT</span><strong id="keyboardRepeat">NO</strong></div>
    </div>
    <div class="keyboard-tester__footer"><span class="keyboard-tester__status" id="keyboardStatus" role="status" aria-live="polite">READY · focus the test area to begin.</span><button type="button" class="keyboard-tester__clear" id="keyboardClear">CLEAR</button></div>`;
  anchor.insertAdjacentElement('afterend', panel);

  const nav = document.querySelector('.quick-nav');
  if (nav && !nav.querySelector('a[href="#keyboardTester"]')) {
    const link = document.createElement('a');
    link.href = '#keyboardTester';
    link.textContent = 'KEYBOARD';
    const performanceLink = nav.querySelector('a[href="#performance"]');
    nav.insertBefore(link, performanceLink || nav.querySelector('a[href="updates.html"]'));
  }

  const pad = document.getElementById('keyboardTestPad');
  const last = document.getElementById('keyboardLast');
  const keyOut = document.getElementById('keyboardKey');
  const codeOut = document.getElementById('keyboardCode');
  const modsOut = document.getElementById('keyboardMods');
  const repeatOut = document.getElementById('keyboardRepeat');
  const status = document.getElementById('keyboardStatus');
  const clear = document.getElementById('keyboardClear');

  const displayKey = (value) => value === ' ' ? 'Space' : value || 'Unidentified';
  const modifiers = (event) => [event.ctrlKey && 'CTRL', event.altKey && 'ALT', event.shiftKey && 'SHIFT', event.metaKey && 'META'].filter(Boolean).join(' + ') || 'NONE';

  pad.addEventListener('keydown', (event) => {
    last.textContent = displayKey(event.key).toUpperCase();
    keyOut.textContent = displayKey(event.key);
    codeOut.textContent = event.code || 'UNAVAILABLE';
    modsOut.textContent = modifiers(event);
    repeatOut.textContent = event.repeat ? 'YES' : 'NO';
    status.textContent = `KEYDOWN · location ${event.location} · composing ${event.isComposing ? 'YES' : 'NO'}`;
  });

  clear.addEventListener('click', () => {
    last.textContent = 'PRESS ANY KEY';
    keyOut.textContent = '—';
    codeOut.textContent = '—';
    modsOut.textContent = 'NONE';
    repeatOut.textContent = 'NO';
    status.textContent = 'CLEARED · focus the test area to begin again.';
    pad.focus();
  });

  const latestLabel = document.querySelector('.latest-update__label');
  const latestTitle = document.getElementById('latestUpdateTitle');
  const latestCopy = latestTitle ? latestTitle.nextElementSibling : null;
  const latestMeta = document.querySelector('.latest-update__meta');
  if (latestLabel) latestLabel.textContent = 'LATEST CHANGE · UPDATE #061';
  if (latestTitle) latestTitle.textContent = '新增 Keyboard Input Test 键盘事件测试器';
  if (latestCopy) latestCopy.textContent = '聚焦测试区后即可实时查看 key、code、修饰键与 repeat 状态；测试只在该区域内工作，不保存或上传按键历史。';
  if (latestMeta) {
    const time = latestMeta.querySelector('time');
    const archive = latestMeta.querySelector('span');
    if (time) { time.dateTime = '2026-08-13T01:58:08+08:00'; time.textContent = '2026-08-13 01:58 UTC+8'; }
    if (archive) archive.textContent = 'Archive · test+20260813-015808.html';
  }
})();
